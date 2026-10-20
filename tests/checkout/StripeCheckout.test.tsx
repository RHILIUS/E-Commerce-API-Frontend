import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { StrictMode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import ProtectedRoute from "@/app/routes/ProtectedRoute";
import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import { checkoutProtectedRoutes } from "@/checkout/routes";
import type { PlacementRequest, StripePayment } from "@/checkout/types";

import { server } from "../server";
import { confirmation, member, preview, recipient } from "./fixtures";

const root = "http://localhost/api/shop";
const reference = confirmation.reference;
const paymentUrl = `${root}/checkouts/${reference}/payment/`;
const openPayment: StripePayment = {
  reference,
  status: "pending",
  checkout_url: "https://checkout.stripe.com/c/pay/test",
  expires_at: new Date(Date.now() + 3600000).toISOString(),
  cancel_requested: false,
};

/** Exercise hosted payment navigation using actual routes and HTTP contracts. */
function renderCheckout(
  path = "/checkout?source=product&product_id=2&quantity=2",
) {
  const router = createMemoryRouter(
    [
      { path: "/cart", element: <h1>Cart</h1> },
      { element: <ProtectedRoute />, children: checkoutProtectedRoutes },
    ],
    { initialEntries: [path] },
  );
  render(
    <StrictMode>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </StrictMode>,
  );
  return router;
}

const redirect = vi.fn();
afterEach(() => vi.unstubAllGlobals());

beforeEach(() => {
  redirect.mockReset();
  vi.stubGlobal("location", { assign: redirect });
  sessionStorage.clear();
  server.use(
    http.post("http://localhost/api/auth/refresh/", () =>
      HttpResponse.json({ access: "test-token", user: member }),
    ),
    http.get(`${root}/checkouts/${reference}/`, () =>
      HttpResponse.json({
        ...confirmation,
        payment_method: "stripe",
        orders: confirmation.orders.map((order) => ({
          ...order,
          payment_status: "paid",
        })),
      }),
    ),
    http.get("http://localhost/api/account/recipients/", () =>
      HttpResponse.json({ recipients: [recipient] }),
    ),
    http.post(`${root}/checkout/preview/`, async ({ request }) => {
      const body = (await request.json()) as { payment_method: string };
      const data = preview();
      if (body.payment_method === "stripe") {
        data.currency = "USD";
        data.preview_token = "stripe-usd-preview";
        data.total = { amount: "10.00", currency: "USD" };
      }
      return HttpResponse.json(data);
    }),
    http.get(paymentUrl, () => HttpResponse.json(openPayment)),
    http.post(paymentUrl, () => HttpResponse.json(openPayment)),
  );
});

test("Stripe selection gets a USD review and saves one recoverable payment request", async () => {
  redirect.mockImplementation(() => {
    expect(
      sessionStorage.getItem(`checkout:attempt:${member.id}:product:2`),
    ).toContain(reference);
  });
  let body: PlacementRequest | undefined;
  server.use(
    http.post(`${root}/checkouts/stripe/`, async ({ request }) => {
      body = (await request.json()) as PlacementRequest;
      return HttpResponse.json(openPayment);
    }),
  );
  const router = renderCheckout();
  const user = userEvent.setup();
  await screen.findByRole("button", { name: "Place Order" }, { timeout: 3000 });
  await user.click(screen.getByRole("radio", { name: "Card (Stripe test)" }));
  await user.click(
    await screen.findByRole("button", { name: "Continue to payment" }),
  );
  await waitFor(() =>
    expect(redirect).toHaveBeenCalledWith(openPayment.checkout_url),
  );
  expect(body).toMatchObject({
    payment_method: "stripe",
    preview_token: "stripe-usd-preview",
    recipient_id: recipient.id,
  });
  expect(body?.idempotency_key).toBeTruthy();
  expect(router.state.location.pathname).toBe("/checkout");
  expect(
    sessionStorage.getItem(`checkout:attempt:${member.id}:product:2`),
  ).toContain(reference);
  expect(
    screen.queryByText("Order placed successfully"),
  ).not.toBeInTheDocument();
});

test.each([
  { ...openPayment, checkout_url: null },
  { ...openPayment, status: "cancelled" as const, checkout_url: null },
  { ...openPayment, status: "expired" as const, checkout_url: null },
  { ...openPayment, cancel_requested: true },
])(
  "non-payable placement opens local recovery: $status / $cancel_requested",
  async (payment) => {
    server.use(
      http.post(`${root}/checkouts/stripe/`, () => HttpResponse.json(payment)),
      http.get(paymentUrl, () => HttpResponse.json(payment)),
      http.post(paymentUrl, () => HttpResponse.json(payment)),
    );
    const router = renderCheckout();
    const user = userEvent.setup();
    await screen.findByRole(
      "button",
      { name: "Place Order" },
      { timeout: 3000 },
    );
    await user.click(screen.getByRole("radio", { name: "Card (Stripe test)" }));
    await user.click(
      await screen.findByRole("button", { name: "Continue to payment" }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(
        `/checkout/payment/${reference}`,
      ),
    );
    expect(redirect).not.toHaveBeenCalled();
  },
);

test("reopening a saved reference offers resume without automatic redirection or another placement", async () => {
  sessionStorage.setItem(
    `checkout:attempt:${member.id}:product:2`,
    JSON.stringify({
      reference,
      request: {
        preview_token: "saved",
        payment_method: "stripe",
        recipient_id: recipient.id,
        idempotency_key: crypto.randomUUID(),
      },
    }),
  );
  renderCheckout();
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "View payment" }));
  await screen.findByText("Resume payment");
  expect(redirect).not.toHaveBeenCalled();
});

test("an uncertain Stripe request retries the exact saved body", async () => {
  const sent: PlacementRequest[] = [];
  server.use(
    http.post(`${root}/checkouts/stripe/`, async ({ request }) => {
      sent.push((await request.json()) as PlacementRequest);
      return sent.length === 1
        ? HttpResponse.json({ detail: "Payment processing" }, { status: 503 })
        : HttpResponse.json(openPayment);
    }),
  );
  renderCheckout();
  const user = userEvent.setup();
  await screen.findByRole("button", { name: "Place Order" }, { timeout: 3000 });
  await user.click(screen.getByRole("radio", { name: "Card (Stripe test)" }));
  await user.click(
    await screen.findByRole("button", { name: "Continue to payment" }),
  );
  await screen.findByText("Payment processing");
  await user.click(screen.getByRole("button", { name: "Retry saved order" }));
  await waitFor(() =>
    expect(redirect).toHaveBeenCalledWith(openPayment.checkout_url),
  );
  expect(sent).toHaveLength(2);
  expect(sent[1]).toEqual(sent[0]);
});

test("confirmed creation rejection clears recovery and requires a fresh review and key", async () => {
  const sent: PlacementRequest[] = [];
  server.use(
    http.post(`${root}/checkouts/stripe/`, async ({ request }) => {
      sent.push((await request.json()) as PlacementRequest);
      return sent.length === 1
        ? HttpResponse.json(
            {
              detail:
                "Stripe rejected this checkout before payment started. Review your order and try again.",
            },
            { status: 400 },
          )
        : HttpResponse.json(openPayment);
    }),
  );
  renderCheckout();
  const user = userEvent.setup();
  await screen.findByRole("button", { name: "Place Order" }, { timeout: 3000 });
  await user.click(screen.getByRole("radio", { name: "Card (Stripe test)" }));
  await user.click(
    await screen.findByRole("button", { name: "Continue to payment" }),
  );
  await screen.findByText(/Stripe rejected this checkout/);
  await waitFor(() =>
    expect(
      sessionStorage.getItem(`checkout:attempt:${member.id}:product:2`),
    ).toBeNull(),
  );
  expect(
    screen.getByRole("button", { name: "Continue to payment" }),
  ).toBeDisabled();
  expect(
    screen.queryByRole("button", { name: "Retry saved order" }),
  ).not.toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Update order details" }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Continue to payment" }),
    ).toBeEnabled(),
  );
  await user.click(screen.getByRole("button", { name: "Continue to payment" }));
  await waitFor(() =>
    expect(redirect).toHaveBeenCalledWith(openPayment.checkout_url),
  );
  expect(sent).toHaveLength(2);
  expect(sent[1].idempotency_key).not.toBe(sent[0].idempotency_key);
});

test("returning from Stripe automatically verifies payment before showing confirmation", async () => {
  let finish!: () => void;
  const waiting = new Promise<void>((resolve) => {
    finish = resolve;
  });
  let checks = 0;
  server.use(
    http.post(paymentUrl, async () => {
      checks++;
      await waiting;
      return HttpResponse.json({
        ...openPayment,
        status: "completed",
        checkout_url: null,
      });
    }),
  );
  renderCheckout(`/checkout/payment/${reference}`);
  await screen.findByText("Checking your payment…");
  expect(screen.queryByText("Resume payment")).not.toBeInTheDocument();
  expect(
    screen.queryByText("Order placed successfully"),
  ).not.toBeInTheDocument();
  finish();
  await screen.findByRole("heading", { name: "Order placed successfully" });
  expect(checks).toBe(1);
  expect(redirect).not.toHaveBeenCalled();
  expect(screen.getByText(/Stripe test payment received/)).toBeVisible();
});

test("an unavailable automatic check preserves recovery and offers retry", async () => {
  const saved = JSON.stringify({
    reference,
    request: {
      preview_token: "saved",
      recipient_id: recipient.id,
      payment_method: "stripe",
      idempotency_key: crypto.randomUUID(),
    },
  });
  const key = `checkout:attempt:${member.id}:product:2`;
  sessionStorage.setItem(key, saved);
  let checks = 0;
  server.use(
    http.post(paymentUrl, () => {
      checks++;
      return checks === 1
        ? HttpResponse.json(
            { detail: "Payment provider unavailable" },
            { status: 503 },
          )
        : HttpResponse.json({
            ...openPayment,
            status: "completed",
            checkout_url: null,
          });
    }),
  );
  renderCheckout(`/checkout/payment/${reference}`);
  await screen.findByText("Payment provider unavailable");
  expect(sessionStorage.getItem(key)).toBe(saved);
  expect(
    screen.queryByText("Order placed successfully"),
  ).not.toBeInTheDocument();
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", { name: "Retry payment status" }),
  );
  await screen.findByRole("heading", { name: "Order placed successfully" });
  expect(checks).toBe(2);
  await waitFor(() => expect(sessionStorage.getItem(key)).toBeNull());
});

test("confirmed cancellation clears recovery and preserves a path back to the cart", async () => {
  sessionStorage.setItem(
    `checkout:attempt:${member.id}:product:2`,
    JSON.stringify({
      reference,
      request: {
        preview_token: "saved",
        payment_method: "stripe",
        recipient_id: 7,
        idempotency_key: crypto.randomUUID(),
      },
    }),
  );
  server.use(
    http.post(`${paymentUrl}cancel/`, () =>
      HttpResponse.json({
        ...openPayment,
        status: "cancelled",
        checkout_url: null,
        cancel_requested: true,
      }),
    ),
  );
  renderCheckout(`/checkout/payment/${reference}`);
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole("button", { name: "Cancel payment" }),
  );
  await screen.findByRole("heading", { name: "Payment closed" });
  expect(screen.queryByText("Resume payment")).not.toBeInTheDocument();
  await waitFor(() =>
    expect(
      sessionStorage.getItem(`checkout:attempt:${member.id}:product:2`),
    ).toBeNull(),
  );
  expect(
    screen.getByText("Return to product catalog").closest("a"),
  ).toHaveAttribute("href", "/");
});

test("pending cancellation is shown without implying that stock has been released", async () => {
  server.use(
    http.post(paymentUrl, () =>
      HttpResponse.json({
        ...openPayment,
        cancel_requested: true,
        checkout_url: null,
      }),
    ),
  );
  renderCheckout(`/checkout/payment/${reference}`);
  await screen.findByText(/Cancellation is being checked/);
  expect(screen.queryByText("Resume payment")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Cancel payment" }),
  ).not.toBeInTheDocument();
});

test("a pending product payment does not replace another product review and remains recoverable", async () => {
  server.use(
    http.post(`${root}/checkouts/stripe/`, () =>
      HttpResponse.json(openPayment),
    ),
  );
  const router = renderCheckout();
  const user = userEvent.setup();
  await screen.findByRole("button", { name: "Place Order" }, { timeout: 3000 });
  expect(sessionStorage.length).toBe(0);
  await user.click(screen.getByRole("radio", { name: "Card (Stripe test)" }));
  await user.click(
    await screen.findByRole("button", { name: "Continue to payment" }),
  );
  await waitFor(() => expect(redirect).toHaveBeenCalledOnce());
  const original = sessionStorage.getItem(
    `checkout:attempt:${member.id}:product:2`,
  );
  await act(() =>
    router.navigate("/checkout?source=product&product_id=3&quantity=1"),
  );
  await screen.findByRole("button", { name: "Place Order" });
  expect(screen.queryByText("Your checkout is saved")).not.toBeInTheDocument();
  expect(
    sessionStorage.getItem(`checkout:attempt:${member.id}:product:3`),
  ).toBeNull();
  expect(
    sessionStorage.getItem(`checkout:attempt:${member.id}:product:2`),
  ).toBe(original);
  await act(() =>
    router.navigate("/checkout?source=product&product_id=2&quantity=1"),
  );
  await screen.findByRole("button", { name: "View payment" });
  expect(redirect).toHaveBeenCalledOnce();
});

test("an older saved payment remains accessible without replacing a new review", async () => {
  const saved = {
    reference,
    request: {
      preview_token: "old",
      recipient_id: recipient.id,
      payment_method: "stripe",
      idempotency_key: crypto.randomUUID(),
    },
  };
  sessionStorage.setItem(`checkout:cod:${member.id}`, JSON.stringify(saved));
  renderCheckout();
  await screen.findByRole("button", { name: "Place Order" }, { timeout: 3000 });
  expect(
    screen.getByRole("link", { name: "View previous payment" }),
  ).toHaveAttribute("href", `/checkout/payment/${reference}`);
  expect(sessionStorage.getItem(`checkout:cod:${member.id}`)).toBe(
    JSON.stringify(saved),
  );
  expect(screen.queryByText("Your checkout is saved")).not.toBeInTheDocument();
});

test("an uncertain product request stays scoped and retries its original body after navigation", async () => {
  const request: PlacementRequest = {
    preview_token: "original",
    recipient_id: recipient.id,
    payment_method: "stripe",
    idempotency_key: crypto.randomUUID(),
  };
  sessionStorage.setItem(
    `checkout:attempt:${member.id}:product:2`,
    JSON.stringify({ request }),
  );
  let sent: PlacementRequest | undefined;
  server.use(
    http.post(`${root}/checkouts/stripe/`, async ({ request: incoming }) => {
      sent = (await incoming.json()) as PlacementRequest;
      return HttpResponse.json(openPayment);
    }),
  );
  const router = renderCheckout(
    "/checkout?source=product&product_id=3&quantity=1",
  );
  await screen.findByRole("button", { name: "Place Order" }, { timeout: 3000 });
  await act(() =>
    router.navigate("/checkout?source=product&product_id=2&quantity=2"),
  );
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole("button", { name: "Retry saved order" }),
  );
  await waitFor(() => expect(redirect).toHaveBeenCalledOnce());
  expect(sent).toEqual(request);
});

test("cart recovery matches reordered item IDs without blocking a different selection", async () => {
  sessionStorage.setItem(
    `checkout:attempt:${member.id}:cart:3,8`,
    JSON.stringify({
      reference,
      request: {
        preview_token: "cart",
        recipient_id: recipient.id,
        payment_method: "stripe",
        idempotency_key: crypto.randomUUID(),
      },
    }),
  );
  const router = renderCheckout("/checkout?source=cart&item_ids=8,3");
  await screen.findByRole(
    "button",
    { name: "View payment" },
    { timeout: 3000 },
  );
  await act(() => router.navigate("/checkout?source=cart&item_ids=9"));
  await screen.findByRole("button", { name: "Place Order" });
  expect(screen.queryByText("Your checkout is saved")).not.toBeInTheDocument();
});

test("browser Back restoring a cached payment page checks Stripe again", async () => {
  let checks = 0;
  server.use(
    http.post(paymentUrl, () => {
      checks++;
      return HttpResponse.json(
        checks === 1
          ? openPayment
          : { ...openPayment, status: "completed", checkout_url: null },
      );
    }),
  );
  renderCheckout(`/checkout/payment/${reference}`);
  await screen.findByText("Resume payment");
  await act(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    ),
  );
  await screen.findByRole("heading", { name: "Order placed successfully" });
  expect(checks).toBe(2);
});

test.each([
  "/checkout?source=product&product_id=2&quantity=2",
  `/checkout/payment/${reference}`,
])("saved purchase details identify the checkout on %s", async (path) => {
  const key = `checkout:attempt:${member.id}:product:2`;
  const saved = JSON.stringify({
    reference,
    request: {
      preview_token: "saved",
      recipient_id: recipient.id,
      payment_method: "stripe",
      idempotency_key: crypto.randomUUID(),
    },
  });
  sessionStorage.setItem(key, saved);
  const usd = { amount: "37.50", currency: "USD" };
  server.use(
    http.get(`${root}/checkouts/${reference}/`, () =>
      HttpResponse.json({
        ...confirmation,
        status: "pending",
        payment_method: "stripe",
        total: usd,
        orders: confirmation.orders.map((order) => ({
          ...order,
          payment_status: "pending",
          subtotal: usd,
          store: { ...order.store, name: "Saved store" },
          items: order.items.map((item) => ({
            ...item,
            name: "Saved Camera",
            quantity: 3,
            unit_price: { amount: "12.50", currency: "USD" },
            subtotal: usd,
            image: {
              image: "https://cdn.example.com/camera.jpg",
              alt_text: "Saved camera photo",
              crop: {},
            },
          })),
        })),
      }),
    ),
  );
  renderCheckout(path);
  await screen.findByText("Saved Camera");
  expect(screen.getByText("Saved store")).toBeVisible();
  expect(
    screen.getByRole("img", { name: "Saved camera photo" }),
  ).toHaveAttribute("src", "https://cdn.example.com/camera.jpg");
  expect(screen.getByText("3")).toBeVisible();
  expect(screen.getByText("$12.50")).toBeVisible();
  expect(screen.getByText("Juan Dela Cruz")).toBeVisible();
  expect(screen.getByText("Total payment")).toBeVisible();
  expect(screen.getAllByText("$37.50")).toHaveLength(3);
  expect(sessionStorage.getItem(key)).toBe(saved);
});

test("order detail failures can be retried without disabling pending payment actions", async () => {
  let reads = 0;
  server.use(
    http.get(`${root}/checkouts/${reference}/`, () => {
      reads++;
      return reads === 1
        ? HttpResponse.json(
            { detail: "Order details unavailable" },
            { status: 503 },
          )
        : HttpResponse.json(confirmation);
    }),
  );
  renderCheckout(`/checkout/payment/${reference}`);
  await screen.findByText("Order details unavailable");
  expect(screen.getByRole("link", { name: "Resume payment" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Cancel payment" })).toBeEnabled();
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Retry order details" }));
  await screen.findByText("Camera");
  expect(reads).toBe(2);
});

test("payment cards stay mounted while the selected method gets a fresh review", async () => {
  let release: (() => void) | undefined;
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http.post(`${root}/checkout/preview/`, async ({ request }) => {
      const body = (await request.json()) as { payment_method: string };
      const data = preview();
      if (body.payment_method === "stripe") {
        await waiting;
        data.total = { amount: "10.00", currency: "USD" };
        data.currency = "USD";
      }
      return HttpResponse.json(data);
    }),
  );
  renderCheckout();
  const user = userEvent.setup();
  await screen.findByRole("button", { name: "Place Order" });
  const card = screen.getByRole("radio", { name: "Card (Stripe test)" });
  await user.click(
    screen.getByText("Stripe test payment in USD. No real charge."),
  );
  expect(card).toBeChecked();
  expect(screen.getByRole("radio", { name: "Card (Stripe test)" })).toBe(card);
  expect(
    screen.queryByRole("button", { name: "Place Order" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Continue to payment" }),
  ).toBeDisabled();
  expect(screen.getByText("Camera", { exact: true })).toBeVisible();
  expect(screen.getByText(recipient.name, { exact: true })).toBeVisible();
  expect(screen.getByText("Updating payment details…")).toBeVisible();
  release?.();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Continue to payment" }),
    ).toBeEnabled(),
  );
  expect(
    screen.getByRole("heading", { name: "Payment and total" }),
  ).toBeVisible();
  expect(
    screen.queryByRole("heading", { name: "Payment method" }),
  ).not.toBeInTheDocument();
});

test("switching back cannot reuse the earlier preview and ignores a late response", async () => {
  let releaseStripe!: () => void;
  let releaseCod!: () => void;
  const stripeWait = new Promise<void>((resolve) => {
    releaseStripe = resolve;
  });
  const codWait = new Promise<void>((resolve) => {
    releaseCod = resolve;
  });
  let codReads = 0;
  server.use(
    http.post(`${root}/checkout/preview/`, async ({ request }) => {
      const { payment_method } = (await request.json()) as {
        payment_method: string;
      };
      const data = preview();
      if (payment_method === "stripe") {
        await stripeWait;
        data.total = { amount: "10.00", currency: "USD" };
      } else if (++codReads > 1) {
        await codWait;
        data.total = { amount: "260.00", currency: "PHP" };
      }
      return HttpResponse.json(data);
    }),
  );
  renderCheckout();
  const user = userEvent.setup();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Place Order" })).toBeEnabled(),
  );
  await user.click(screen.getByRole("radio", { name: "Card (Stripe test)" }));
  await user.click(screen.getByRole("radio", { name: "Cash on Delivery" }));
  expect(screen.getByRole("button", { name: "Place Order" })).toBeDisabled();
  expect(screen.getByText("Camera", { exact: true })).toBeVisible();
  releaseCod();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Place Order" })).toBeEnabled(),
  );
  releaseStripe();
  await act(async () => {
    await stripeWait;
  });
  expect(screen.getByRole("radio", { name: "Cash on Delivery" })).toBeChecked();
  expect(screen.getByText("₱260.00")).toBeVisible();
  expect(screen.queryByText("$10.00")).not.toBeInTheDocument();
});

test("a failed payment refresh keeps the order visible and blocks checkout until retry", async () => {
  let stripeReads = 0;
  server.use(
    http.post(`${root}/checkout/preview/`, async ({ request }) => {
      const { payment_method } = (await request.json()) as {
        payment_method: string;
      };
      const data = preview();
      if (payment_method === "stripe") {
        if (++stripeReads === 1)
          return HttpResponse.json(
            { detail: "Payment preview unavailable" },
            { status: 503 },
          );
        data.total = { amount: "10.00", currency: "USD" };
      }
      return HttpResponse.json(data);
    }),
  );
  renderCheckout();
  const user = userEvent.setup();
  await screen.findByRole("button", { name: "Place Order" });
  const item = screen.getByText("Camera", { exact: true });
  await user.click(screen.getByRole("radio", { name: "Card (Stripe test)" }));
  await screen.findByText("Payment preview unavailable");
  expect(screen.getByText("Camera", { exact: true })).toBe(item);
  expect(screen.getByText(recipient.name, { exact: true })).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Continue to payment" }),
  ).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Continue to payment" }),
    ).toBeEnabled(),
  );
  expect(screen.getByText("Camera", { exact: true })).toBe(item);
});

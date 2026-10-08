import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, test } from "vitest";

import ProtectedRoute from "@/app/routes/ProtectedRoute";
import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import LoginPage from "@/authentication/pages/LoginPage";
import { checkoutProtectedRoutes } from "@/checkout/routes";
import type { PlacementRequest } from "@/checkout/types";

import { server } from "../server";
import { confirmation, member, preview, recipient } from "./fixtures";

const previewUrl = "http://localhost/api/shop/checkout/preview/";
const placementUrl = "http://localhost/api/shop/checkouts/";
const recipientsUrl = "http://localhost/api/account/recipients/";
const path = "/checkout?source=product&product_id=2&quantity=2";
const request: PlacementRequest = {
  preview_token: "old-signed-preview",
  recipient_id: 7,
  payment_method: "cod",
  idempotency_key: "ce0b36d9-3b6b-48d7-a1da-dbe9b5bfb150",
};
// Test public navigation and actual HTTP requests through the authenticated route guard.
function renderCheckout(initialPath = path) {
  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginPage /> },
      { path: "/cart", element: <h1>Cart</h1> },
      { element: <ProtectedRoute />, children: checkoutProtectedRoutes },
    ],
    { initialEntries: [initialPath] },
  );
  const view = render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
  return { router, ...view };
}
beforeEach(() => {
  sessionStorage.clear();
  server.use(
    http.post("http://localhost/api/auth/refresh/", () =>
      HttpResponse.json({ access: "token", user: member }),
    ),
    http.get(recipientsUrl, () =>
      HttpResponse.json({ recipients: [recipient] }),
    ),
    http.post(previewUrl, () => HttpResponse.json(preview())),
    http.post(placementUrl, () =>
      HttpResponse.json(confirmation, { status: 201 }),
    ),
    http.get(`${placementUrl}:reference/`, () =>
      HttpResponse.json(confirmation),
    ),
  );
});
describe("COD checkout", () => {
  test("reviews the selected source and creates an unpaid order with only accepted placement fields", async () => {
    let source: unknown, body: unknown;
    server.use(
      http.post(previewUrl, async ({ request }) => {
        source = await request.json();
        return HttpResponse.json(preview());
      }),
      http.post(placementUrl, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(confirmation, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    const { router } = renderCheckout();
    expect(await screen.findByText(recipient.name)).toBeVisible();
    expect(source).toEqual({ source: "product", product_id: 2, quantity: 2 });
    const button = screen.getByRole("button", { name: "Place Order" });
    await waitFor(() => expect(button).toBeEnabled());
    await user.dblClick(button);
    expect(
      await screen.findByRole("heading", { name: "Order placed" }),
    ).toBeVisible();
    expect(body).toEqual({
      preview_token: "signed-preview",
      recipient_id: 7,
      payment_method: "cod",
      idempotency_key: expect.any(String),
    });
    expect(router.state.location.pathname).toBe(
      `/checkout/confirmation/${confirmation.reference}`,
    );
    expect(
      screen.getByText(
        "Payment is due on delivery. No online payment was collected.",
      ),
    ).toBeVisible();
    expect(sessionStorage.getItem("checkout:cod:1")).toBeNull();
  });
  test("preserves product quantity through sign in", async () => {
    server.use(
      http.post("http://localhost/api/auth/refresh/", () =>
        HttpResponse.json({}, { status: 401 }),
      ),
      http.post("http://localhost/api/auth/login/", () =>
        HttpResponse.json({ access: "token", user: member }),
      ),
    );
    const { router } = renderCheckout();
    const user = userEvent.setup();
    await user.type(
      await screen.findByRole("textbox", { name: "Email" }),
      member.email,
    );
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Login" }));
    await screen.findByText(recipient.name);
    expect(router.state.location.search).toBe(
      "?source=product&product_id=2&quantity=2",
    );
  });
  test("requires a recipient and allows exactly one saved recipient", async () => {
    server.use(
      http.get(recipientsUrl, () =>
        HttpResponse.json({
          recipients: [
            { ...recipient, is_default: false },
            { ...recipient, id: 8, name: "Joan", is_default: false },
          ],
        }),
      ),
    );
    const user = userEvent.setup();
    renderCheckout();
    expect(
      await screen.findByRole("button", { name: "Place Order" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Select recipient" }));
    await user.click(await screen.findByRole("radio", { name: /Juan/ }));
    await user.click(screen.getByRole("radio", { name: /Joan/ }));
    expect(screen.getByRole("radio", { name: /Juan/ })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /Joan/ })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Place Order" })).toBeEnabled(),
    );
    expect(screen.getByText("Joan")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Update order details" }),
    ).not.toBeInTheDocument();
  });
  test("blocks unavailable items and never exposes a partial total as payable", async () => {
    const invalid = preview();
    invalid.can_place_order = false;
    invalid.total = null;
    invalid.preview_token = null;
    invalid.expires_at = null;
    invalid.issues = [
      {
        code: "product_unavailable",
        product_id: 2,
        cart_item_id: null,
        message: "This product is no longer available.",
      },
    ];
    server.use(http.post(previewUrl, () => HttpResponse.json(invalid)));
    renderCheckout();
    expect(
      await screen.findByText("This product is no longer available."),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Place Order" })).toBeDisabled();
    expect(
      within(screen.getByRole("region", { name: "Payment" })).getByText(
        "Unavailable",
      ),
    ).toBeVisible();
  });
  test("requires explicit refresh when the preview expires", async () => {
    const expired = preview();
    expired.expires_at = new Date(Date.now() - 1000).toISOString();
    server.use(
      http.post(previewUrl, () => HttpResponse.json(expired), { once: true }),
    );
    const user = userEvent.setup();
    renderCheckout();
    await screen.findByText(
      /Please update your order details before continuing/,
    );
    expect(screen.getByRole("button", { name: "Place Order" })).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "Update order details" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Place Order" })).toBeEnabled(),
    );
  });
  test("recovers the exact placement request after a lost response and reload", async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(placementUrl, async ({ request }) => {
        bodies.push(await request.json());
        return bodies.length === 1
          ? HttpResponse.error()
          : HttpResponse.json(confirmation);
      }),
    );
    const user = userEvent.setup();
    const first = renderCheckout();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Place Order" })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: "Place Order" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Retry saved order" }),
      ).toBeEnabled(),
    );
    first.unmount();
    // Recovery must work without the old source URL or a fresh purchasable preview.
    renderCheckout("/checkout");
    await user.click(
      await screen.findByRole("button", { name: "Retry saved order" }),
    );
    await screen.findByRole("heading", { name: "Order placed" });
    expect(bodies).toHaveLength(2);
    expect(bodies[1]).toEqual(bodies[0]);
  });
  test("requires review after a stock conflict and uses a fresh key only after review", async () => {
    const bodies: PlacementRequest[] = [];
    server.use(
      http.post(placementUrl, async ({ request }) => {
        bodies.push((await request.json()) as PlacementRequest);
        return bodies.length === 1
          ? HttpResponse.json(
              {
                detail:
                  "Available stock changed. Adjust quantities and request a fresh preview.",
              },
              { status: 409 },
            )
          : HttpResponse.json(confirmation);
      }),
    );
    const user = userEvent.setup();
    renderCheckout();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Place Order" })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: "Place Order" }));
    await screen.findByText(
      /Please update your order details before continuing/,
    );
    expect(screen.getByRole("button", { name: "Place Order" })).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "Update order details" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Place Order" })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: "Place Order" }));
    await screen.findByRole("heading", { name: "Order placed" });
    expect(bodies[1].idempotency_key).not.toBe(bodies[0].idempotency_key);
  });
  test("keeps idempotency conflicts locked to the original request", async () => {
    sessionStorage.setItem("checkout:cod:1", JSON.stringify({ request }));
    server.use(
      http.post(placementUrl, () =>
        HttpResponse.json(
          {
            detail:
              "This idempotency key has already been used for a different or incomplete purchase.",
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderCheckout();
    await user.click(
      await screen.findByRole("button", { name: "Retry saved order" }),
    );
    await screen.findByText(/This idempotency key/);
    expect(
      screen.queryByRole("button", { name: "Place Order" }),
    ).not.toBeInTheDocument();
    expect(
      JSON.parse(sessionStorage.getItem("checkout:cod:1")!).request,
    ).toEqual(request);
  });
  test("isolates another account’s saved request", async () => {
    sessionStorage.setItem("checkout:cod:2", JSON.stringify({ request }));
    renderCheckout();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Place Order" })).toBeEnabled(),
    );
    expect(
      screen.queryByRole("button", { name: "Retry saved order" }),
    ).not.toBeInTheDocument();
  });
  test("rejects corrupt recovery data without sending a new order", async () => {
    sessionStorage.setItem("checkout:cod:1", "broken-json");
    renderCheckout();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Checkout recovery storage is unavailable",
    );
    expect(
      screen.queryByRole("button", { name: "Place Order" }),
    ).not.toBeInTheDocument();
  });
  test("confirmation retry is read-only and renders server snapshots", async () => {
    server.use(
      http.get(
        `${placementUrl}:reference/`,
        () => HttpResponse.json({ detail: "Not found." }, { status: 404 }),
        { once: true },
      ),
    );
    const user = userEvent.setup();
    renderCheckout(`/checkout/confirmation/${confirmation.reference}`);
    await user.click(
      await screen.findByRole("button", { name: "Retry confirmation" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Order placed" }),
    ).toBeVisible();
    expect(screen.getByText(recipient.name)).toBeVisible();
  });
});

test("creates and selects a recipient using the normalized phone and address country", async () => {
  let body: unknown;
  server.use(
    http.get(recipientsUrl, () => HttpResponse.json({ recipients: [] })),
    http.post(recipientsUrl, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(
        { ...(body as object), id: 9, is_default: true },
        { status: 201 },
      );
    }),
  );
  const user = userEvent.setup();
  renderCheckout();
  await user.click(
    await screen.findByRole("button", { name: "Select recipient" }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Add recipient" }),
  );
  await user.type(screen.getByLabelText("Full name"), "Joan Dela Cruz");
  await user.type(screen.getByLabelText("Address line 1"), "20 Test Street");
  await user.type(screen.getByLabelText("City"), "Manila");
  await user.type(
    screen.getByRole("combobox", { name: "Country" }),
    "Philippines",
  );
  await user.click(await screen.findByRole("option", { name: /Philippines/ }));
  await user.type(screen.getByLabelText("Phone number"), "9123456789");
  await user.click(screen.getByRole("button", { name: "Save recipient" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(body).toEqual({
    name: "Joan Dela Cruz",
    address_line1: "20 Test Street",
    address_line2: "",
    city: "Manila",
    region: "",
    postal_code: "",
    country_code: "PH",
    phone_number: "+639123456789",
    is_default: false,
  });
  expect(screen.getByText("Joan Dela Cruz")).toBeVisible();
  expect(screen.getByRole("button", { name: "Place Order" })).toBeEnabled();
});

test("shows recipient validation errors and keeps the form open", async () => {
  server.use(
    http.post(recipientsUrl, () =>
      HttpResponse.json(
        { address_line1: ["This address cannot be used."] },
        { status: 400 },
      ),
    ),
  );
  const user = userEvent.setup();
  renderCheckout();
  await user.click(await screen.findByRole("button", { name: "Change" }));
  await user.click(
    await screen.findByRole("button", { name: "Add recipient" }),
  );
  await user.type(screen.getByLabelText("Full name"), "Joan");
  await user.type(screen.getByLabelText("Address line 1"), "20 Test Street");
  await user.type(screen.getByLabelText("City"), "Manila");
  await user.type(
    screen.getByRole("combobox", { name: "Country" }),
    "Philippines",
  );
  await user.click(await screen.findByRole("option", { name: /Philippines/ }));
  await user.type(screen.getByLabelText("Phone number"), "9123456789");
  await user.click(screen.getByRole("button", { name: "Save recipient" }));
  await waitFor(() =>
    expect(screen.getByLabelText("Address line 1")).toHaveAttribute(
      "aria-invalid",
      "true",
    ),
  );
  expect(screen.getByRole("dialog")).toBeVisible();
});

test("blocks an incomplete saved recipient", async () => {
  server.use(
    http.get(recipientsUrl, () =>
      HttpResponse.json({ recipients: [{ ...recipient, address_line1: "" }] }),
    ),
  );
  renderCheckout();
  expect(
    await screen.findByText(/This recipient has incomplete details/),
  ).toBeVisible();
  expect(screen.getByRole("button", { name: "Place Order" })).toBeDisabled();
});

test.each([
  [
    "/checkout?source=product&product_id=2&quantity=2",
    "Back to product",
    "/products/2",
  ],
  ["/checkout?source=cart&item_ids=1,4", "Back to cart", "/cart"],
])(
  "uses source-aware back navigation for %s",
  async (path, label, destination) => {
    renderCheckout(path);
    expect(await screen.findByRole("link", { name: label })).toHaveAttribute(
      "href",
      destination,
    );
    expect(
      screen.queryByRole("link", {
        name: label === "Back to product" ? "Back to cart" : "Back to product",
      }),
    ).not.toBeInTheDocument();
    await screen.findByRole("button", { name: "Place Order" });
  },
);

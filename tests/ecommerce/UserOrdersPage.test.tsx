import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, expect, test } from "vitest";

import ProtectedRoute from "@/app/routes/ProtectedRoute";
import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import { statusLabels, type UserOrder } from "@/ecommerce/orders/types";
import { ecommerceProtectedRoutes } from "@/ecommerce/routes";

import { confirmation, member } from "../checkout/fixtures";
import { server } from "../server";

let orders: UserOrder[];
let calls: number;
/** Exercise the actual routes and HTTP client, with server-owned tab filtering. */
function show(path = "/orders") {
  const router = createMemoryRouter(
    [
      { element: <ProtectedRoute />, children: ecommerceProtectedRoutes },
      { path: "/login", element: <h1>Sign in</h1> },
    ],
    { initialEntries: [path] },
  );
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
  return router;
}
beforeEach(() => {
  calls = 0;
  orders = Object.keys(statusLabels).map((status, i) => ({
    ...confirmation.orders[0],
    id: i + 1,
    status: status as UserOrder["status"],
    created_at: confirmation.created_at,
    concluded_at: ["cancelled", "delivered", "completed"].includes(status)
      ? confirmation.created_at
      : null,
    checkout_reference: confirmation.reference,
    payment_pending: false,
    can_cancel: ["pending", "accepted", "packed"].includes(status),
    refund: null,
  }));
  server.use(
    http.post("http://localhost/api/auth/refresh/", () =>
      HttpResponse.json({ access: "token", user: member }),
    ),
    http.get("http://localhost/api/shop/orders/", ({ request }) => {
      const tab = new URL(request.url).searchParams.get("tab");
      const statuses: Record<string, string[]> = {
        to_ship: ["pending", "accepted", "packed", "shipment_arranged"],
        to_receive: ["shipped"],
        cancelled: ["cancelled"],
        delivered: ["delivered"],
        completed: ["completed"],
      };
      const results =
        tab === "all"
          ? orders
          : orders.filter((o) => statuses[tab!].includes(o.status));
      return HttpResponse.json({
        count: results.length,
        next: null,
        previous: null,
        results,
      });
    }),
    http.post("http://localhost/api/shop/orders/:id/cancel/", ({ params }) => {
      calls++;
      const order = orders.find((o) => o.id === Number(params.id))!;
      order.status = "cancelled";
      order.can_cancel = false;
      return HttpResponse.json(order);
    }),
  );
});

test("six tabs preserve server statuses, quantities and totals", async () => {
  const user = userEvent.setup();
  show();
  await screen.findAllByRole("article");
  expect(screen.getAllByRole("tab")).toHaveLength(6);
  expect(screen.getAllByRole("article")).toHaveLength(8);
  const first = screen.getAllByRole("article")[0];
  expect(within(first).getByText("Quantity: 2")).toBeInTheDocument();
  expect(within(first).getAllByText("₱240.00")).toHaveLength(2);
  await user.click(screen.getByRole("tab", { name: "To Ship" }));
  await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(4));
  expect(screen.getAllByRole("button", { name: "Cancel order" })).toHaveLength(
    3,
  );
  await user.click(screen.getByRole("tab", { name: "Delivered" }));
  expect(
    await screen.findByRole("button", { name: "Return — coming soon" }),
  ).toBeDisabled();
  await user.click(screen.getByRole("tab", { name: "Completed" }));
  await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(1));
  expect(
    screen.queryByRole("button", { name: "Cancel order" }),
  ).not.toBeInTheDocument();
});

test("cancellation requires confirmation, updates history and preserves order on dismiss", async () => {
  const user = userEvent.setup();
  show("/orders?tab=to_ship");
  await user.click(
    (await screen.findAllByRole("button", { name: "Cancel order" }))[0],
  );
  await user.click(screen.getByRole("button", { name: "Keep order" }));
  expect(calls).toBe(0);
  await user.click(screen.getAllByRole("button", { name: "Cancel order" })[0]);
  await user.click(
    screen.getByRole("button", { name: "Confirm cancellation" }),
  );
  await waitFor(() => expect(screen.getAllByRole("article")).toHaveLength(3));
  expect(calls).toBe(1);
});

test("paid confirmation states original card and pending refund can be checked", async () => {
  orders = [
    {
      ...orders[0],
      payment_status: "paid",
      subtotal: { amount: "24.68", currency: "USD" },
    },
  ];
  server.use(
    http.post("http://localhost/api/shop/orders/:id/cancel/", () => {
      calls++;
      orders[0] = {
        ...orders[0],
        status: "cancelled",
        can_cancel: false,
        refund: {
          status: calls === 1 ? "pending" : "succeeded",
          amount: { amount: "24.68", currency: "USD" },
          needs_review: false,
        },
      };
      return HttpResponse.json(orders[0]);
    }),
  );
  const user = userEvent.setup();
  show();
  await user.click(await screen.findByRole("button", { name: "Cancel order" }));
  expect(
    screen.getByText(/We'll request a.*original Stripe test card/),
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Confirm cancellation" }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Check refund status" }),
  );
  expect(
    await screen.findByText(/Refunded.*original Stripe test card/),
  ).toBeInTheDocument();
});

test("read failures offer retry and an empty tab has a clear state", async () => {
  let failed = false;
  orders = [];
  server.use(
    http.get("http://localhost/api/shop/orders/", () => {
      if (!failed) {
        failed = true;
        return new HttpResponse(null, { status: 500 });
      }
      return HttpResponse.json({
        count: 0,
        next: null,
        previous: null,
        results: [],
      });
    }),
  );
  const user = userEvent.setup();
  show();
  await user.click(await screen.findByRole("button", { name: "Try again" }));
  expect(await screen.findByText("No orders here yet")).toBeInTheDocument();
});

test("status conflict stays visible in confirmation", async () => {
  server.use(
    http.post("http://localhost/api/shop/orders/:id/cancel/", () =>
      HttpResponse.json(
        { detail: "This order can no longer be cancelled." },
        { status: 409 },
      ),
    ),
  );
  const user = userEvent.setup();
  show();
  await user.click(
    (await screen.findAllByRole("button", { name: "Cancel order" }))[0],
  );
  await user.click(
    screen.getByRole("button", { name: "Confirm cancellation" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This order can no longer be cancelled.",
  );
});

test("account dropdown exposes Orders above Log out without a wallet option", async () => {
  const user = userEvent.setup();
  show();
  await user.click(await screen.findByRole("button", { name: "Account" }));
  const items = await screen.findAllByRole("menuitem");
  expect(items.map((i) => i.textContent)).toEqual(["Orders", "Log out"]);
});

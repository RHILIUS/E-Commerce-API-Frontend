import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, expect, test } from "vitest";

import ProtectedRoute from "@/app/routes/ProtectedRoute";
import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import { statusLabels, type UserOrder } from "@/ecommerce/orders/types";
import { ecommerceProtectedRoutes } from "@/ecommerce/routes";

import { confirmation, member } from "../checkout/fixtures";
import { render } from "../render";
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
    await screen.findByText("Product returns are not available in this demo."),
  ).toBeVisible();
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
  expect(items).toEqual([
    screen.getByRole("menuitem", { name: "Account" }),
    screen.getByRole("menuitem", { name: "Orders" }),
    screen.getByRole("menuitem", { name: /Notifications/ }),
    screen.getByRole("menuitem", { name: "Log out" }),
  ]);
});

test("history loads only when opened and shows recorded milestones and actor roles", async () => {
  let historyReads = 0;
  server.use(
    http.get("http://localhost/api/shop/orders/:id/history/", ({ params }) => {
      historyReads++;
      return HttpResponse.json({
        order_id: Number(params.id),
        current_status: "completed",
        is_partial: false,
        events: [
          {
            id: 1,
            event_type: "placed",
            label: "Order placed",
            occurred_at: "2026-10-01T10:00:00Z",
            actor_role: "customer",
            is_backfilled: false,
          },
          {
            id: 2,
            event_type: "accepted",
            label: "Accepted by seller",
            occurred_at: "2026-10-01T11:00:00Z",
            actor_role: "seller",
            is_backfilled: false,
          },
          {
            id: 3,
            event_type: "delivered",
            label: "Order delivered",
            occurred_at: "2026-10-02T10:00:00Z",
            actor_role: "seller",
            is_backfilled: false,
          },
          {
            id: 4,
            event_type: "completed",
            label: "Order completed",
            occurred_at: "2026-10-09T10:00:00Z",
            actor_role: "system",
            is_backfilled: false,
          },
        ],
      });
    }),
  );
  const user = userEvent.setup();
  show();
  const trigger = (
    await screen.findAllByRole("button", { name: "View order history" })
  )[0];
  expect(historyReads).toBe(0);
  await user.click(trigger);
  const dialog = await screen.findByRole("dialog", { name: "Order history" });
  const items = await within(dialog).findAllByRole("listitem");
  expect(items).toHaveLength(4);
  expect(items.map((item) => item.querySelector("p")?.textContent)).toEqual([
    "Order placed",
    "Accepted by seller",
    "Order delivered",
    "Order completed",
  ]);
  expect(within(items[0]).getByText("Customer")).toBeInTheDocument();
  expect(within(items[3]).getByText("System")).toBeInTheDocument();
  expect(items[2].querySelector("time")).toHaveAttribute(
    "dateTime",
    "2026-10-02T10:00:00Z",
  );
  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(trigger).toHaveFocus();
  await user.click(trigger);
  await within(await screen.findByRole("dialog")).findAllByRole("listitem");
  expect(historyReads).toBe(2);
});

test("historical gaps are explicit and failures have an independent retry", async () => {
  let tries = 0;
  server.use(
    http.get("http://localhost/api/shop/orders/:id/history/", () => {
      if (++tries === 1) return new HttpResponse(null, { status: 500 });
      return HttpResponse.json({
        order_id: 1,
        current_status: "delivered",
        is_partial: true,
        events: [
          {
            id: 1,
            event_type: "placed",
            label: "Order placed",
            occurred_at: "2026-10-01T10:00:00Z",
            actor_role: "unknown",
            is_backfilled: true,
          },
        ],
      });
    }),
  );
  const user = userEvent.setup();
  show();
  await user.click(
    (await screen.findAllByRole("button", { name: "View order history" }))[0],
  );
  await user.click(
    await screen.findByRole("button", { name: "Retry history" }),
  );
  expect(
    await screen.findByText(
      "Earlier activity may be missing. Only recorded dates are shown.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Actor not recorded · From existing records"),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("dialog")).queryByText("Order delivered"),
  ).not.toBeInTheDocument();
});

test("history for different cards stays separate and empty history is clear", async () => {
  server.use(
    http.get("http://localhost/api/shop/orders/:id/history/", ({ params }) =>
      HttpResponse.json({
        order_id: Number(params.id),
        current_status: "pending",
        is_partial: false,
        events: [],
      }),
    ),
  );
  const user = userEvent.setup();
  show();
  const buttons = await screen.findAllByRole("button", {
    name: "View order history",
  });
  await user.click(buttons[1]);
  expect(
    await screen.findByText("No order history has been recorded yet."),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("dialog")).getByText(/Order #2 · Camera Store/),
  ).toBeInTheDocument();
  await user.click(
    within(screen.getByRole("dialog")).getByRole("button", { name: "Close" }),
  );
  await user.click(buttons[0]);
  expect(
    await screen.findByText(/Order #1 · Camera Store/),
  ).toBeInTheDocument();
});

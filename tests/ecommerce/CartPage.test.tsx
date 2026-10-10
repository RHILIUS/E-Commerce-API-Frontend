import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, test } from "vitest";

import { Toaster } from "@/app/components/ui/toast";
import ProtectedRoute from "@/app/routes/ProtectedRoute";
import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import { checkoutProtectedRoutes } from "@/checkout/routes";
import type { CartResponse } from "@/ecommerce/cart/types";
import { formatMoney, selectedTotals } from "@/ecommerce/cart/utils";
import {
  ecommerceProtectedRoutes,
  ecommercePublicRoutes,
} from "@/ecommerce/routes";

import { preview, recipient } from "../checkout/fixtures";
import { server } from "../server";

const member = {
  id: 1,
  fullName: "Buyer",
  email: "buyer@example.com",
  country_code: "PH",
};
let data: CartResponse;
let rejectUpdate = false;

// Exercise real auth, routing, and API requests rather than mocking the cart hook.
const renderCart = (path = "/cart") => {
  const router = createMemoryRouter(
    [
      ...ecommercePublicRoutes,
      { path: "/login", element: <h1>Sign in</h1> },
      {
        element: <ProtectedRoute />,
        children: [...ecommerceProtectedRoutes, ...checkoutProtectedRoutes],
      },
    ],
    { initialEntries: [path] },
  );
  render(
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>,
  );
  return router;
};

beforeEach(() => {
  rejectUpdate = false;
  data = {
    carts: [
      {
        id: 1,
        store: { id: 1, name: "Camera Store", profile_image: null },
        items: [
          {
            id: 1,
            quantity: 2,
            product: {
              id: 1,
              name: "Camera",
              status: "active",
              stock: 4,
              can_purchase: true,
              image: null,
              display_price: { amount: "12.34", currency: "PHP" },
            },
            subtotal: { amount: "24.68", currency: "PHP" },
          },
          {
            id: 2,
            quantity: 1,
            product: {
              id: 2,
              name: "Lens",
              status: "active",
              stock: 0,
              can_purchase: false,
              image: null,
              display_price: { amount: "10.00", currency: "PHP" },
            },
            subtotal: { amount: "10.00", currency: "PHP" },
          },
        ],
      },
      {
        id: 2,
        store: { id: 2, name: "Other Store", profile_image: null },
        items: [
          {
            id: 3,
            quantity: 1,
            product: {
              id: 3,
              name: "Bag",
              status: "active",
              stock: 3,
              can_purchase: true,
              image: null,
              display_price: { amount: "5.00", currency: "USD" },
            },
            subtotal: { amount: "5.00", currency: "USD" },
          },
        ],
      },
    ],
  };
  server.use(
    http.post("http://localhost/api/auth/refresh/", () =>
      HttpResponse.json({ access: "token", user: member }),
    ),
    http.get("http://localhost/api/shop/carts/", () => HttpResponse.json(data)),
    http.patch(
      "http://localhost/api/shop/carts/items/:id/",
      async ({ params, request }) => {
        if (rejectUpdate)
          return HttpResponse.json(
            { detail: "Only 1 available. Choose a smaller quantity." },
            { status: 409 },
          );
        const { quantity } = (await request.json()) as { quantity: number };
        const item = data.carts
          .flatMap((cart) => cart.items)
          .find((item) => item.id === Number(params.id))!;
        item.quantity = quantity;
        item.subtotal!.amount = (
          Number(item.product.display_price!.amount) * quantity
        ).toFixed(2);
        return HttpResponse.json(data);
      },
    ),
    http.delete(
      "http://localhost/api/shop/carts/items/",
      async ({ request }) => {
        const { item_ids } = (await request.json()) as { item_ids: number[] };
        data.carts = data.carts
          .map((cart) => ({
            ...cart,
            items: cart.items.filter((item) => !item_ids.includes(item.id)),
          }))
          .filter((cart) => cart.items.length);
        return HttpResponse.json(data);
      },
    ),
  );
});

describe("Shopping cart", () => {
  test("requires sign-in and preserves the return destination", async () => {
    server.use(
      http.post("http://localhost/api/auth/refresh/", () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    );
    const router = renderCart();
    await screen.findByRole("heading", { name: "Sign in" });
    expect(router.state.location.state.from.pathname).toBe("/cart");
  });

  test("selects products, store carts, and all carts with mixed states and separate currency totals", async () => {
    const user = userEvent.setup();
    renderCart();
    const camera = await screen.findByRole("checkbox", {
      name: "Select Camera",
    });
    await user.click(camera);
    expect(
      screen.getByRole("checkbox", { name: "Select all from Camera Store" }),
    ).toHaveAttribute("aria-checked", "mixed");
    expect(
      screen.getByRole("checkbox", { name: "Select all (3)" }),
    ).toHaveAttribute("aria-checked", "mixed");
    expect(screen.getByText("2 selected items · 1 product")).toBeVisible();
    await user.click(screen.getByRole("checkbox", { name: "Select all (3)" }));
    expect(screen.getByText("4 selected items · 3 products")).toBeVisible();
    const actions = screen.getByRole("region", { name: "Cart actions" });
    expect(within(actions).getByText("₱34.68")).toBeVisible();
    expect(within(actions).getByText("$5.00")).toBeVisible();
    expect(screen.getByRole("button", { name: "Checkout" })).toBeEnabled();
    await user.click(
      screen.getByRole("checkbox", { name: "Select all from Camera Store" }),
    );
    expect(screen.getByText("1 selected item · 1 product")).toBeVisible();
  });

  test("updates quantities and refreshes stale stock after a rejected mutation", async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(
      await screen.findByRole("button", { name: "Increase Camera quantity" }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Camera quantity")).toHaveTextContent("3"),
    );
    rejectUpdate = true;
    data.carts[0].items[0].product.stock = 1;
    await user.click(
      screen.getByRole("button", { name: "Increase Camera quantity" }),
    );
    expect(
      await screen.findByText("Only 1 available. Choose a smaller quantity."),
    ).toBeVisible();
    expect(
      await screen.findByText("Only 1 available. Reduce your quantity."),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Increase Camera quantity" }),
    ).toBeDisabled();
    rejectUpdate = false;
    await user.click(
      screen.getByRole("button", { name: "Decrease Camera quantity" }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Camera quantity")).toHaveTextContent("1"),
    );
  });

  test("keeps sold-out products removable and confirms selected removal", async () => {
    const user = userEvent.setup();
    renderCart();
    await user.click(
      await screen.findByRole("checkbox", { name: "Select Lens" }),
    );
    expect(
      screen.queryByRole("button", { name: "Increase Lens quantity" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(await screen.findByRole("alertdialog")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("link", { name: "Lens" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(
      await screen.findByRole("button", { name: "Remove products" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("link", { name: "Lens" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("link", { name: "Camera" })).toBeVisible();
  });

  test("refreshes stock on focus and handles an empty saved cart", async () => {
    renderCart();
    await screen.findByRole("button", { name: "Increase Camera quantity" });
    data.carts[0].items[0].product.stock = 0;
    data.carts[0].items[0].product.can_purchase = false;
    fireEvent(window, new Event("focus"));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Increase Camera quantity" }),
      ).not.toBeInTheDocument(),
    );
    data.carts = [];
    fireEvent(window, new Event("focus"));
    expect(
      await screen.findByRole("heading", { name: "Your cart is empty" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("region", { name: "Cart actions" }),
    ).not.toBeInTheDocument();
  });

  test("offers retry when cart loading fails", async () => {
    server.use(
      http.get("http://localhost/api/shop/carts/", () =>
        HttpResponse.json({}, { status: 503 }),
      ),
    );
    const user = userEvent.setup();
    renderCart();
    await screen.findByRole("alert");
    server.use(
      http.get("http://localhost/api/shop/carts/", () =>
        HttpResponse.json(data),
      ),
    );
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("link", { name: "Camera" })).toBeVisible();
  });

  test("keeps failed removals visible and lets the customer retry", async () => {
    let rejectRemoval = true;
    server.use(
      http.delete("http://localhost/api/shop/carts/items/", () => {
        if (rejectRemoval)
          return HttpResponse.json(
            { detail: "Couldn't remove these products. Try again." },
            { status: 503 },
          );
        data.carts = [];
        return HttpResponse.json(data);
      }),
    );
    const user = userEvent.setup();
    renderCart();
    await user.click(
      await screen.findByRole("checkbox", { name: "Select all (3)" }),
    );
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Remove products" }));
    const dialog = screen.getByRole("alertdialog");
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Couldn't remove these products. Try again.",
    );
    expect(data.carts).toHaveLength(2);
    rejectRemoval = false;
    await user.click(
      within(dialog).getByRole("button", { name: "Remove products" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Your cart is empty" }),
    ).toBeVisible();
  });

  test("blocks removal above the API limit without losing selection", async () => {
    const item = data.carts[0].items[0];
    data.carts = [
      {
        ...data.carts[0],
        items: Array.from({ length: 501 }, (_, index) => ({
          ...item,
          id: index + 1,
          product: {
            ...item.product,
            id: index + 1,
            name: `Product ${index + 1}`,
          },
        })),
      },
    ];
    const user = userEvent.setup();
    renderCart();
    await user.click(
      await screen.findByRole("checkbox", { name: "Select all (501)" }),
    );
    expect(screen.getByRole("button", { name: "Remove" })).toBeDisabled();
    expect(
      screen.getByText("Select up to 500 products at a time."),
    ).toBeVisible();
    await user.click(
      screen.getByRole("checkbox", { name: "Select Product 501" }),
    );
    expect(screen.getByRole("button", { name: "Remove" })).toBeEnabled();
  }, 15000);

  test("adds the chosen product quantity and exposes the saved cart", async () => {
    let added: unknown;
    server.use(
      http.get("http://localhost/api/shop/products/1/", () =>
        HttpResponse.json({
          id: 1,
          name: "Camera",
          short_description: "A camera",
          description: "Camera details",
          stock: 4,
          sold_count: 0,
          status: "active",
          can_purchase: true,
          display_price: { amount: "12.34", currency: "PHP" },
          images: [],
          store: {
            ...data.carts[0].store,
            listed_product_count: 1,
            created_at: "2022-01-01T00:00:00Z",
          },
        }),
      ),
      http.post(
        "http://localhost/api/shop/carts/items/",
        async ({ request }) => {
          added = await request.json();
          return HttpResponse.json(data);
        },
      ),
    );
    const user = userEvent.setup();
    renderCart("/products/1");
    await user.click(
      await screen.findByRole("button", { name: "Increase quantity" }),
    );
    await user.click(screen.getByRole("button", { name: "Add to Cart" }));
    expect(await screen.findByText("Added to your cart.")).toBeVisible();
    expect(added).toEqual({ product_id: 1, quantity: 2 });
    await user.click(screen.getByRole("button", { name: "View cart" }));
    expect(
      await screen.findByRole("heading", { name: "Shopping Cart" }),
    ).toBeVisible();
    expect(await screen.findByLabelText("Camera quantity")).toHaveTextContent(
      "2",
    );
  });

  test("sums large decimal amounts without rounding away cents", () => {
    const item = data.carts[0].items[0];
    const totals = selectedTotals([
      { ...item, subtotal: { amount: "9999999999999999.99", currency: "PHP" } },
      { ...item, subtotal: { amount: "0.02", currency: "PHP" } },
    ]);
    expect(totals).toEqual([
      { amount: "10000000000000000.01", currency: "PHP" },
    ]);
    expect(formatMoney(totals[0])).toBe("₱10,000,000,000,000,000.01");
  });
});

test("sends only selected cart IDs to the checkout preview", async () => {
  let body: unknown;
  server.use(
    http.post(
      "http://localhost/api/shop/checkout/preview/",
      async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(preview());
      },
    ),
    http.get("http://localhost/api/account/recipients/", () =>
      HttpResponse.json({ recipients: [recipient] }),
    ),
  );
  const user = userEvent.setup();
  renderCart();
  await screen.findByRole("checkbox", { name: "Select Camera" });
  expect(screen.getByRole("button", { name: "Checkout" })).toBeDisabled();
  await user.click(screen.getByRole("checkbox", { name: "Select Camera" }));
  await user.click(screen.getByRole("button", { name: "Checkout" }));
  await screen.findByRole("button", { name: "Place Order" });
  expect(body).toEqual({
    source: "cart",
    item_ids: [1],
    payment_method: "cod",
  });
});

test("resets selected overstock quantities to one before checkout and asks for review", async () => {
  data.carts[0].items[0].quantity = 5;
  const user = userEvent.setup();
  const router = renderCart();
  await user.click(
    await screen.findByRole("checkbox", { name: "Select Camera" }),
  );
  await user.click(screen.getByRole("button", { name: "Checkout" }));
  expect(
    await screen.findByText(
      /quantities exceeded available stock and were reset to 1/,
    ),
  ).toBeVisible();
  expect(data.carts[0].items[0].quantity).toBe(1);
  expect(router.state.location.pathname).toBe("/cart");
});

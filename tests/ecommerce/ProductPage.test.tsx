import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { Toaster } from "@/app/components/ui/toast";
import ProtectedRoute from "@/app/routes/ProtectedRoute";
import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import { checkoutProtectedRoutes } from "@/checkout/routes";
import { ecommercePublicRoutes } from "@/ecommerce/routes";
import type { ProductDetail } from "@/ecommerce/types";

import { render } from "../render";
import { server } from "../server";

const endpoint = "http://localhost/api/shop/products/:id/";
const product: ProductDetail = {
  id: 1,
  name: "iPhone 17 Pro",
  short_description: "Pro camera performance.",
  description: "Full description\n\nSecond paragraph.",
  price: "79990.00",
  currency: "PHP",
  display_price: { amount: "1428.39", currency: "USD" },
  ordered_count: 2400,
  stock: 3,
  status: "active",
  archived_at: null,
  can_purchase: true,
  default_image: null,
  images: [
    {
      id: 1,
      image: "https://example.com/one.jpg",
      alt_text: "Front view",
      crop: {},
      is_default: false,
      order: 0,
    },
    {
      id: 2,
      image: "https://example.com/two.jpg",
      alt_text: "Camera view",
      crop: {},
      is_default: true,
      order: 1,
    },
  ],
  store: {
    id: 1,
    name: "Northline Tech",
    profile_image: null,
    profile_image_crop: {},
    listed_product_count: 128,
    created_at: "2022-01-01T00:00:00Z",
  },
};

// Exercise real routing, auth restoration, and the HTTP client against mocked responses.
const renderPage = (path = "/products/1") => {
  const router = createMemoryRouter(
    [
      ...ecommercePublicRoutes,
      { element: <ProtectedRoute />, children: checkoutProtectedRoutes },
      { path: "/login", element: <h1>Sign in</h1> },
    ],
    {
      initialEntries: [path],
    },
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
  server.use(
    http.post("http://localhost/api/auth/refresh/", () =>
      HttpResponse.json({}, { status: 401 }),
    ),
    http.get(endpoint, () => HttpResponse.json(product)),
  );
});

describe("Product Page", () => {
  test("sends guests to sign in before adding and preserves the product destination", async () => {
    const user = userEvent.setup();
    const router = renderPage("/products/1?ref=catalog");
    await user.click(
      await screen.findByRole("button", { name: "Add to Cart" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeVisible();
    expect(router.state.location.state.from).toMatchObject({
      pathname: "/products/1",
      search: "?ref=catalog",
    });
  });

  test("shows add conflicts without success and prevents duplicate pending adds", async () => {
    server.use(
      http.post("http://localhost/api/auth/refresh/", () =>
        HttpResponse.json({
          access: "token",
          user: {
            id: 1,
            fullName: "Buyer",
            email: "buyer@example.com",
            address_country_code: "PH",
          },
        }),
      ),
      http.post("http://localhost/api/shop/carts/items/", () =>
        HttpResponse.json(
          { detail: "Only 1 available. Choose a smaller quantity." },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Add to Cart" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Only 1 available.",
    );
    expect(
      screen.queryByRole("button", { name: "View cart" }),
    ).not.toBeInTheDocument();
    let additions = 0;
    server.use(
      http.post("http://localhost/api/shop/carts/items/", async () => {
        additions += 1;
        await delay(250);
        return HttpResponse.json({ carts: [] });
      }),
    );
    await user.dblClick(screen.getByRole("button", { name: "Add to Cart" }));
    expect(await screen.findByText("Added to your cart.")).toBeVisible();
    expect(additions).toBe(1);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      within(
        screen.getByRole("region", { name: "Product information" }),
      ).queryByText("Added to your cart."),
    ).not.toBeInTheDocument();
    await user.hover(screen.getByText("Added to your cart."));
    await user.click(
      screen.getByRole("button", { name: "Close notification" }),
    );
    await waitFor(() =>
      expect(screen.queryByText("Added to your cart.")).not.toBeInTheDocument(),
    );
  });

  test("opens the selected full image and restores focus after keyboard or button dismissal", async () => {
    const user = userEvent.setup();
    renderPage();
    const trigger = await screen.findByRole("button", {
      name: "Expand product image",
    });
    await user.click(screen.getByRole("button", { name: "View image 1" }));
    trigger.focus();
    await user.keyboard("{Enter}");
    const viewer = await screen.findByRole("dialog", {
      name: `${product.name} — full image`,
    });
    expect(
      within(viewer).getByRole("img", { name: "Front view" }),
    ).toHaveAttribute("src", product.images[0].image);
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Close",
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });

  test("dismisses on the blurred backdrop without changing the page", async () => {
    const user = userEvent.setup();
    // jsdom ignores focus options; model preventScroll support used by dialog dismissal.
    const nativeFocus = HTMLElement.prototype.focus;
    vi.spyOn(HTMLElement.prototype, "focus").mockImplementation(function (
      this: HTMLElement,
      options,
    ) {
      void options?.preventScroll;
      nativeFocus.call(this, options);
    });
    const router = renderPage();
    const trigger = await screen.findByRole("button", {
      name: "Expand product image",
    });
    await user.click(trigger);
    const viewer = await screen.findByRole("dialog");
    await user.click(within(viewer).getByRole("img"));
    expect(viewer).toBeVisible();
    await user.click(
      document.querySelector<HTMLElement>('[data-slot="dialog-backdrop"]')!,
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
    expect(router.state.location.pathname).toBe("/products/1");
  });

  test("keeps failed viewer media readable and dismissible", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: "Expand product image" }),
    );
    const viewer = await screen.findByRole("dialog");
    fireEvent.error(within(viewer).getByRole("img"));
    expect(within(viewer).getByText("Image unavailable")).toBeVisible();
    await user.click(within(viewer).getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  test("loads a public product, chooses its default image and bounds quantity", async () => {
    const user = userEvent.setup();
    const router = renderPage();
    expect(
      screen.getByRole("status", { name: "Loading product" }),
    ).toBeVisible();
    await screen.findByRole("heading", { name: product.name, level: 1 });
    expect(screen.getByText("$1,428.39")).toBeVisible();
    expect(screen.getByText("Store created")).toBeVisible();
    expect(screen.getByRole("link", { name: "Visit store" })).toHaveAttribute(
      "href",
      "/stores/1",
    );
    expect(
      screen.getByRole("link", { name: "Northline Tech" }),
    ).toHaveAttribute("href", "/stores/1");
    expect(screen.getByText("Product image · 2 of 2")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "View image 1" }));
    expect(screen.getByText("Product image · 1 of 2")).toBeVisible();
    const minus = screen.getByRole("button", { name: "Decrease quantity" });
    const plus = screen.getByRole("button", { name: "Increase quantity" });
    expect(minus).toBeDisabled();
    await user.click(plus);
    await user.click(plus);
    expect(plus).toBeDisabled();
    expect(screen.getByLabelText("Selected quantity")).toHaveTextContent("3");
    await user.click(minus);
    expect(screen.getByLabelText("Selected quantity")).toHaveTextContent("2");
    await user.click(screen.getByRole("button", { name: "Checkout" }));
    await screen.findByRole("heading", { name: "Sign in" });
    expect(router.state.location.state.from.search).toBe(
      "?source=product&product_id=1&quantity=2",
    );
  });

  test.each(["archived", "draft", "out-of-stock"])(
    "disables purchases for %s",
    async (state) => {
      server.use(
        http.get(endpoint, () =>
          HttpResponse.json({
            ...product,
            status: state === "out-of-stock" ? "active" : state,
            stock: state === "out-of-stock" ? 0 : 3,
            can_purchase: false,
          }),
        ),
      );
      renderPage();
      await screen.findByRole("heading", { name: product.name, level: 1 });
      for (const name of [
        "Add to Cart",
        "Checkout",
        "Increase quantity",
        "Decrease quantity",
      ])
        expect(screen.getByRole("button", { name })).toBeDisabled();
      if (state === "archived")
        expect(screen.getByText("ARCHIVED")).toBeVisible();
      if (state === "draft")
        expect(screen.getByText("Draft · Preview")).toBeVisible();
    },
  );

  test("handles missing media and descriptions without sample replacements", async () => {
    server.use(
      http.get(endpoint, () =>
        HttpResponse.json({ ...product, images: [], description: null }),
      ),
    );
    renderPage();
    expect(await screen.findByText("No image available")).toBeVisible();
    expect(screen.getByText("No description provided.")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "View image 1" }),
    ).not.toBeInTheDocument();
  });

  test("a failed image has a readable fallback", async () => {
    renderPage();
    const gallery = await screen.findByRole("region", {
      name: "Product images",
    });
    await screen.findByRole("heading", { name: product.name, level: 1 });
    fireEvent.error(within(gallery).getAllByAltText("Camera view")[0]);
    expect(screen.getByText("Image unavailable")).toBeVisible();
  });

  test("distinguishes not found from retryable errors", async () => {
    server.use(
      http.get(endpoint, () => HttpResponse.json({}, { status: 503 })),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("heading", { name: "Unable to load product" });
    server.use(
      http.get(endpoint, () => HttpResponse.json({}, { status: 404 })),
    );
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("heading", { name: "Product unavailable" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();
  });

  test("discards an obsolete product response after route navigation", async () => {
    server.use(
      http.get(endpoint, async ({ params }) => {
        if (params.id === "1") await delay(150);
        return HttpResponse.json({
          ...product,
          id: Number(params.id),
          name: `Product ${params.id}`,
        });
      }),
    );
    const router = renderPage();
    await act(() => router.navigate("/products/2"));
    await screen.findByRole("heading", { name: "Product 2", level: 1 });
    await act(() => new Promise((resolve) => setTimeout(resolve, 200)));
    expect(
      screen.queryByRole("heading", { name: "Product 1", level: 1 }),
    ).not.toBeInTheDocument();
  });

  test("hides a draft after logout and reloads as a guest", async () => {
    server.use(
      http.post("http://localhost/api/auth/refresh/", () =>
        HttpResponse.json({
          access: "token",
          user: {
            id: 1,
            fullName: "Member",
            email: "member@example.com",
            address_country_code: "PH",
          },
        }),
      ),
      http.post(
        "http://localhost/api/auth/logout/",
        () => new HttpResponse(null, { status: 204 }),
      ),
      http.get(endpoint, ({ request }) =>
        request.headers.get("Authorization")
          ? HttpResponse.json({
              ...product,
              status: "draft",
              can_purchase: false,
            })
          : HttpResponse.json({}, { status: 404 }),
      ),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Draft · Preview");
    await user.click(screen.getByRole("button", { name: "Account" }));
    await user.click(await screen.findByRole("menuitem", { name: "Log out" }));
    await screen.findByRole("heading", { name: "Product unavailable" });
    expect(screen.queryByText("Draft · Preview")).not.toBeInTheDocument();
  });

  test("catalog card navigation loads the corresponding detail", async () => {
    server.use(
      http.get("http://localhost/api/shop/products/", () =>
        HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [product],
        }),
      ),
    );
    const user = userEvent.setup();
    const router = renderPage("/");
    await user.click(
      await screen.findByRole("link", { name: `View ${product.name}` }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/products/1"),
    );
    expect(
      await screen.findByRole("heading", { name: product.name, level: 1 }),
    ).toBeVisible();
  });
});

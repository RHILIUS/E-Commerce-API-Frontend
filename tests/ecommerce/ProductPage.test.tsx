import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, test } from "vitest";

import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import { ecommercePublicRoutes } from "@/ecommerce/routes";
import type { ProductDetail } from "@/ecommerce/types";

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
  sold_count: 2400,
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
  const router = createMemoryRouter(ecommercePublicRoutes, {
    initialEntries: [path],
  });
  render(
    <AuthProvider>
      <RouterProvider router={router} />
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
  test("loads a public product, chooses its default image and bounds quantity", async () => {
    const user = userEvent.setup();
    renderPage();
    expect(
      screen.getByRole("status", { name: "Loading product" }),
    ).toBeVisible();
    await screen.findByRole("heading", { name: product.name, level: 1 });
    expect(screen.getByText("$1,428.39")).toBeVisible();
    expect(screen.getByText("Store created")).toBeVisible();
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
    expect(
      screen.getByText(
        "Checkout is not available yet. No order has been placed.",
      ),
    ).toBeVisible();
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
            country_code: "PH",
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
    await user.click(screen.getByRole("menuitem", { name: "Log out" }));
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

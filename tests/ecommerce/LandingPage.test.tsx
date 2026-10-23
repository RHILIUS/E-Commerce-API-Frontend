import { screen, waitFor } from "@testing-library/react";
import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import {
  createMemoryRouter,
  MemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";

import RootLayout from "@/app/layout/RootLayout";
import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import LandingPage from "@/ecommerce/pages/LandingPage";

import { render } from "../render";
import { server } from "../server";

const endpoint = "http://localhost/api/shop/products/";
const products = Array.from({ length: 16 }, (_, index) => ({
  id: index + 1,
  name: `Laptop ${index + 1}`,
  short_description: "A portable computer",
  price: "1234.56",
  currency: "USD",
  display_price: { amount: "1234.56", currency: "USD" },
  ordered_count: 25,
  default_image:
    index === 0
      ? null
      : {
          image: "https://example.com/laptop.jpg",
          alt_text: "Laptop photo",
          crop: {},
        },
}));

// Use real URL navigation and the shared auth client against mocked HTTP responses.
const renderLandingPage = (entry = "/") =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[entry]}>
        <LandingPage />
      </MemoryRouter>
    </AuthProvider>,
  );

beforeEach(() => {
  server.use(
    http.post("http://localhost/api/auth/refresh/", () =>
      HttpResponse.json({}, { status: 401 }),
    ),
    http.get(endpoint, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page"));
      const q = url.searchParams.get("q") ?? "";
      if (page > 2)
        return HttpResponse.json({ detail: "Invalid page." }, { status: 404 });
      const matching = products.filter((product) =>
        product.name.toLowerCase().includes(q.toLowerCase()),
      );
      return HttpResponse.json({
        count: matching.length,
        next: page === 1 ? `${endpoint}?page=2` : null,
        previous: page === 2 ? endpoint : null,
        results: matching.slice((page - 1) * 12, page * 12),
      });
    }),
  );
});

describe("LandingPage API integration", () => {
  test("appends pages, preserves cards and search, and replaces the button at the end", async () => {
    renderLandingPage("/?q=laptop");
    expect(
      screen.getByLabelText("Products", { selector: "div" }),
    ).toHaveAttribute("aria-busy", "true");
    expect(await screen.findAllByRole("article")).toHaveLength(12);
    const first = screen.getByRole("article", { name: "Laptop 1" });
    expect(screen.getByText("No image available")).toBeVisible();
    expect(screen.getAllByText("$1,234.56")).toHaveLength(12);
    await userEvent.click(screen.getByRole("button", { name: "Load more" }));
    await screen.findByRole("article", { name: "Laptop 13" });
    expect(screen.getAllByRole("article")).toHaveLength(16);
    expect(screen.getByRole("article", { name: "Laptop 1" })).toBe(first);
    expect(screen.getByText("You’re all caught up")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Load more" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Product pages" }),
    ).not.toBeInTheDocument();
  });

  test("keyboard loading continues focus into the appended cards", async () => {
    renderLandingPage();
    await screen.findByRole("article", { name: "Laptop 1" });
    screen.getByRole("button", { name: "Load more" }).focus();
    await userEvent.keyboard("{Enter}");
    await screen.findByText("You’re all caught up");
    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: "View Laptop 13" }),
      ).toHaveFocus(),
    );
  });

  test("search resets appended results and empty results can be cleared", async () => {
    renderLandingPage();
    await screen.findByRole("article", { name: "Laptop 1" });
    await userEvent.click(screen.getByRole("button", { name: "Load more" }));
    await screen.findByRole("article", { name: "Laptop 13" });
    const user = userEvent.setup();
    await user.type(screen.getByRole("searchbox"), "  missing  {Enter}");
    expect(
      await screen.findByRole("heading", { name: "No products found" }),
    ).toBeVisible();
    expect(screen.queryByText("You’re all caught up")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(await screen.findAllByRole("article")).toHaveLength(12);
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  test("old page URLs begin at the start of the catalog", async () => {
    renderLandingPage("/?q=laptop&page=999");
    await screen.findByRole("article", { name: "Laptop 1" });
    expect(screen.getAllByRole("article")).toHaveLength(12);
  });

  test("keeps cards during loading, blocks repeated requests, and retries the same page", async () => {
    let requests = 0;
    server.use(
      http.get(endpoint, async ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get("page"));
        if (page === 1)
          return HttpResponse.json({
            count: 16,
            next: endpoint,
            previous: null,
            results: products.slice(0, 12),
          });
        requests++;
        await delay(100);
        if (requests === 1) return HttpResponse.json({}, { status: 500 });
        return HttpResponse.json({
          count: 16,
          next: null,
          previous: endpoint,
          results: products.slice(12),
        });
      }),
    );
    renderLandingPage();
    await screen.findByRole("article", { name: "Laptop 1" });
    const button = screen.getByRole("button", { name: "Load more" });
    await userEvent.dblClick(button);
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Loading products…")).toBeVisible();
    expect(screen.getAllByRole("article")).toHaveLength(12);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load more",
    );
    expect(requests).toBe(1);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByText("You’re all caught up");
    expect(screen.getAllByRole("article")).toHaveLength(16);
    expect(requests).toBe(2);
  });

  test("discards an in-flight appended page when search changes", async () => {
    server.use(
      http.get(endpoint, async ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get("q");
        const page = Number(url.searchParams.get("page"));
        if (q)
          return HttpResponse.json({
            count: 1,
            next: null,
            previous: null,
            results: [products[1]],
          });
        if (page === 2) await delay(150);
        return HttpResponse.json({
          count: 16,
          next: page === 1 ? endpoint : null,
          previous: null,
          results: page === 1 ? products.slice(0, 12) : products.slice(12),
        });
      }),
    );
    renderLandingPage();
    await screen.findByRole("article", { name: "Laptop 1" });
    await userEvent.click(screen.getByRole("button", { name: "Load more" }));
    await userEvent.type(screen.getByRole("searchbox"), "new{Enter}");
    await screen.findByText("You’re all caught up");
    await delay(180);
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("article", { name: "Laptop 2" })).toBeVisible();
  });

  test("does not repeat cards if live rankings shift between pages", async () => {
    server.use(
      http.get(endpoint, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get("page"));
        return HttpResponse.json({
          count: 16,
          next: page === 1 ? endpoint : null,
          previous: null,
          results: page === 1 ? products.slice(0, 12) : products.slice(11),
        });
      }),
    );
    renderLandingPage();
    await screen.findByRole("article", { name: "Laptop 1" });
    await userEvent.click(screen.getByRole("button", { name: "Load more" }));
    await screen.findByText("You’re all caught up");
    expect(screen.getAllByRole("article")).toHaveLength(16);
  });

  test("retries server errors without displaying an empty result", async () => {
    server.use(
      http.get(endpoint, () => HttpResponse.json({}, { status: 500 }), {
        once: true,
      }),
    );
    renderLandingPage();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load products",
    );
    expect(screen.queryByText("No products found")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findAllByRole("article")).toHaveLength(12);
  });

  test("waits for restored authentication and sends its bearer token", async () => {
    let authorization: string | null = null;
    server.use(
      http.post("http://localhost/api/auth/refresh/", async () => {
        await delay(30);
        return HttpResponse.json({
          access: "test-access",
          user: {
            id: 1,
            fullName: "Test",
            email: "test@example.com",
            address_country_code: "PH",
          },
        });
      }),
      http.get(endpoint, ({ request }) => {
        authorization = request.headers.get("Authorization");
        return HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [products[1]],
        });
      }),
    );
    renderLandingPage();
    await screen.findByRole("article");
    expect(authorization).toBe("Bearer test-access");
  });

  test("ignores an obsolete search response", async () => {
    server.use(
      http.get(endpoint, async ({ request }) => {
        const q = new URL(request.url).searchParams.get("q");
        if (!q) await delay(100);
        return HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [q ? products[1] : products[0]],
        });
      }),
    );
    renderLandingPage();
    await userEvent.type(screen.getByRole("searchbox"), "new{Enter}");
    await screen.findByRole("article", { name: "Laptop 2" });
    await waitFor(() =>
      expect(
        screen.queryByRole("article", { name: "Laptop 1" }),
      ).not.toBeInTheDocument(),
    );
  });
});

test("Back restores catalog cards loaded beyond the first page", async () => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  const router = createMemoryRouter([
    {
      element: <RootLayout />,
      children: [
        { path: "/", element: <LandingPage /> },
        { path: "/products/:id", element: <h1>Product details</h1> },
      ],
    },
  ]);
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
  await screen.findByRole("article", { name: "Laptop 1" });
  await userEvent.click(screen.getByRole("button", { name: "Load more" }));
  await screen.findByRole("article", { name: "Laptop 13" });
  await act(() => router.navigate("/products/13"));
  await screen.findByRole("heading", { name: "Product details" });
  await act(() => router.navigate(-1));
  await screen.findByRole("article", { name: "Laptop 13" });
  expect(screen.getAllByRole("article")).toHaveLength(16);
});

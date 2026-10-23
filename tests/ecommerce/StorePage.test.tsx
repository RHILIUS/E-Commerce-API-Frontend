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
import { beforeEach, describe, expect, test } from "vitest";

import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import StorePage from "@/ecommerce/pages/StorePage";

import { render } from "../render";
import { server, waitForMockRequests } from "../server";

const endpoint = "http://localhost/api/shop/stores/1/";
const store = {
  id: 1,
  name: "Example Store",
  description: "Our public shop description.",
  profile_image: null,
  banner_image: null,
  created_at: "2026-01-01T00:00:00Z",
  public_email: "shop@example.com",
  public_phone: "+63 917 123 4567",
  address: null,
  listed_product_count: 12,
  items_ordered: 4,
  categories: [{ id: 8, name: "Shoes", product_count: 12 }],
};
const products = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: `Running Shoes ${index + 1}`,
  short_description: "Comfortable everyday shoes",
  price: "560.00",
  currency: "PHP",
  display_price: { amount: "10.00", currency: "USD" },
  ordered_count: 2,
  default_image: null,
  stock: index === 0 ? 0 : 5,
}));

// Exercise real tab and browser navigation against the shared API client.
const renderStore = (entry = "/stores/1") => {
  const router = createMemoryRouter(
    [
      { path: "/stores/:storeId", element: <StorePage /> },
      { path: "/", element: <p>Global catalog</p> },
    ],
    { initialEntries: [entry] },
  );
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
    http.get(endpoint, () => HttpResponse.json(store)),
    http.get(`${endpoint}home/`, () =>
      HttpResponse.json({
        new_products: products.slice(0, 10),
        trending_products: [],
        most_ordered: [],
      }),
    ),
    http.get(`${endpoint}products/`, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get("page"));
      const query = url.searchParams.get("q") ?? "";
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase()),
      );
      if (page > 2) return HttpResponse.json({}, { status: 404 });
      return HttpResponse.json({
        count: filtered.length,
        next: null,
        previous: null,
        results: filtered.slice((page - 1) * 10, page * 10),
      });
    }),
  );
});

describe("Store Page", () => {
  test("opens the full banner and logo, then restores focus when closed", async () => {
    const banner = "https://example.com/store-banner.jpg";
    const logo = "https://example.com/store-logo.jpg";
    server.use(
      http.get(endpoint, () =>
        HttpResponse.json({
          ...store,
          banner_image: banner,
          profile_image: logo,
        }),
      ),
    );
    renderStore();
    const bannerTrigger = await screen.findByRole("button", {
      name: "View full store banner",
    });
    const logoTrigger = screen.getByRole("button", {
      name: "View full store logo",
    });
    const user = userEvent.setup();
    await user.click(bannerTrigger);
    const bannerViewer = await screen.findByRole("dialog", {
      name: "Example Store cover — full image",
    });
    expect(
      within(bannerViewer).getByRole("img", { name: "Example Store cover" }),
    ).toHaveAttribute("src", banner);
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(bannerTrigger).toHaveFocus();
    await user.click(logoTrigger);
    const logoViewer = await screen.findByRole("dialog", {
      name: "Example Store logo — full image",
    });
    expect(
      within(logoViewer).getByRole("img", { name: "Example Store logo" }),
    ).toHaveAttribute("src", logo);
    await user.click(within(logoViewer).getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(logoTrigger).toHaveFocus();
  });

  test("missing and failed store images keep their placeholders", async () => {
    const banner = "https://example.com/broken-banner.jpg";
    server.use(
      http.get(endpoint, () =>
        HttpResponse.json({ ...store, banner_image: banner }),
      ),
    );
    renderStore();
    const bannerTrigger = await screen.findByRole("button", {
      name: "View full store banner",
    });
    expect(
      screen.queryByRole("button", { name: "View full store logo" }),
    ).not.toBeInTheDocument();
    fireEvent.error(
      within(bannerTrigger).getByRole("img", { name: "Example Store cover" }),
    );
    expect(
      screen.queryByRole("button", { name: "View full store banner" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("No store cover provided")).toBeVisible();
    expect(screen.getByLabelText("Store logo placeholder")).toBeVisible();
  });
  test("loads public profile and bounded home sections with empty rankings and stock labels", async () => {
    renderStore();
    expect(screen.getByRole("status", { name: "Loading store" })).toBeVisible();
    expect(
      await screen.findByRole("heading", { name: "Example Store" }),
    ).toBeVisible();
    expect(await screen.findAllByRole("article")).toHaveLength(10);
    expect(screen.getByText("Out of stock")).toBeVisible();
    expect(screen.getByText("No trending products yet.")).toBeVisible();
    expect(screen.getByText("Units ordered")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "View all most ordered" }),
    ).toHaveAttribute("href", "/stores/1?tab=products&sort=most_ordered");
    expect(
      screen.getByRole("link", { name: "View all trending products" }),
    ).toHaveAttribute("href", "/stores/1?tab=products&sort=popular");
    expect(
      screen.getByRole("link", { name: "View Running Shoes 1" }),
    ).toHaveAttribute("href", "/products/1");
    expect(
      screen.queryByRole("navigation", { name: "Product pages" }),
    ).not.toBeInTheDocument();
  });

  test("search submits within store, resets pagination and clears category; Back restores prior state", async () => {
    const router = renderStore("/stores/1?tab=products&page=2&category=8");
    await screen.findByRole("article", { name: "Running Shoes 11" });
    const user = userEvent.setup();
    await user.type(
      screen.getByRole("searchbox", { name: "Search this store" }),
      " MISSING {Enter}",
    );
    expect(await screen.findByText("No results found.")).toBeVisible();
    expect(router.state.location.search).toBe("?tab=products&q=MISSING");
    await act(() => router.navigate(-1));
    await screen.findByRole("article", { name: "Running Shoes 11" });
    expect(
      screen.getByRole("searchbox", { name: "Search this store" }),
    ).toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(await screen.findAllByRole("article")).toHaveLength(10);
  });

  test("pagination retains query, sorting resets page immediately, category cards filter products", async () => {
    const router = renderStore("/stores/1?tab=products&q=shoes");
    const user = userEvent.setup();
    await screen.findByRole("article", { name: "Running Shoes 1" });
    await user.click(screen.getByRole("link", { name: "Go to next page" }));
    await screen.findByRole("article", { name: "Running Shoes 11" });
    expect(router.state.location.search).toContain("q=shoes");
    await user.click(
      screen.getByRole("button", { name: "Sort products: Latest" }),
    );
    await user.click(
      await screen.findByRole("menuitemradio", { name: "Popular" }),
    );
    await screen.findByRole("article", { name: "Running Shoes 1" });
    expect(router.state.location.search).toBe(
      "?tab=products&q=shoes&sort=popular",
    );
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole("tab", { name: "Categories" }));
    await user.click(screen.getByRole("link", { name: "Shoes 12 products" }));
    expect(router.state.location.search).toBe("?tab=products&category=8");
    expect(await screen.findByRole("heading", { name: "Shoes" })).toBeVisible();
  });

  test("About shows only public details and missing values", async () => {
    renderStore("/stores/1?tab=about");
    await screen.findByRole("heading", { name: "About this store" });
    expect(
      screen.getByRole("link", { name: "shop@example.com" }),
    ).toHaveAttribute("href", "mailto:shop@example.com");
    expect(screen.getByText("+63 917 123 4567")).toBeVisible();
    expect(screen.getByText("Our public shop description.")).toBeVisible();
    expect(screen.getAllByText("Not provided")).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: /edit/i }),
    ).not.toBeInTheDocument();
  });

  test("store search and global search have independent destinations", async () => {
    const router = renderStore();
    await screen.findByRole("heading", { name: "Example Store" });
    await userEvent.type(
      screen.getByRole("searchbox", { name: "Search products" }),
      "laptop{Enter}",
    );
    expect(await screen.findByText("Global catalog")).toBeVisible();
    expect(router.state.location.search).toBe("?q=laptop");
  });

  test("product error preserves the profile and offers recovery", async () => {
    renderStore("/stores/1?tab=products&page=99");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This product page or category is unavailable.",
    );
    expect(
      screen.getByRole("heading", { name: "Example Store" }),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Browse all products" }),
    );
    expect(await screen.findAllByRole("article")).toHaveLength(10);
  });

  test("missing store and retryable errors are distinct", async () => {
    server.use(
      http.get(endpoint, () => HttpResponse.json({}, { status: 503 })),
    );
    renderStore();
    expect(
      await screen.findByRole("heading", { name: "Unable to load store" }),
    ).toBeVisible();
    server.use(
      http.get(endpoint, () => HttpResponse.json({}, { status: 404 })),
    );
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("heading", { name: "Store not found" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();
  });

  test("old searches cannot overwrite newer results", async () => {
    let markStarted!: () => void;
    const slowStarted = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    server.use(
      http.get(`${endpoint}products/`, async ({ request }) => {
        if (new URL(request.url).searchParams.get("q") === "slow") {
          markStarted();
          await delay(120);
          return HttpResponse.json({
            count: 1,
            results: [{ ...products[0], name: "Stale shoes" }],
            next: null,
            previous: null,
          });
        }
        return HttpResponse.json({
          count: 1,
          results: [products[1]],
          next: null,
          previous: null,
        });
      }),
    );
    const router = renderStore("/stores/1?tab=products&q=slow");
    await screen.findByRole("heading", { name: "Example Store" });
    await slowStarted;
    await act(() => router.navigate("/stores/1?tab=products&q=fast"));
    expect(
      await screen.findByRole("article", { name: "Running Shoes 2" }),
    ).toBeVisible();
    await act(() => waitForMockRequests());
    expect(
      screen.getByRole("article", { name: "Running Shoes 2" }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        within(screen.getByRole("tabpanel")).queryByText("Stale shoes"),
      ).not.toBeInTheDocument(),
    );
  });
});

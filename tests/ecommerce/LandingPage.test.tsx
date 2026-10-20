import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test } from "vitest";

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
  sold_count: 25,
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
  test("loads server pages, keeps search, and displays decimal prices and missing images", async () => {
    renderLandingPage("/?q=laptop");
    expect(
      screen.getByLabelText("Products", { selector: "div" }),
    ).toHaveAttribute("aria-busy", "true");
    expect(await screen.findAllByRole("article")).toHaveLength(12);
    expect(screen.getByText("No image available")).toBeVisible();
    expect(screen.getAllByText("$1,234.56")).toHaveLength(12);
    await userEvent.click(
      screen.getByRole("link", { name: "Go to next page" }),
    );
    await screen.findByRole("article", { name: "Laptop 13" });
    expect(screen.getAllByRole("article")).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Page 1" })).toHaveAttribute(
      "href",
      "/?q=laptop&page=1",
    );
    expect(
      screen.getByRole("link", { name: "Go to next page" }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  test("search resets to page one and empty results can be cleared", async () => {
    renderLandingPage("/?page=2");
    await screen.findByRole("article", { name: "Laptop 13" });
    const user = userEvent.setup();
    await user.type(screen.getByRole("searchbox"), "  missing  {Enter}");
    expect(
      await screen.findByRole("heading", { name: "No products found" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(await screen.findAllByRole("article")).toHaveLength(12);
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  test.each(["-1", "NaN", "1.5"])(
    "normalizes invalid page %s",
    async (page) => {
      renderLandingPage(`/?page=${page}`);
      expect(await screen.findAllByRole("article")).toHaveLength(12);
      expect(screen.getByRole("link", { name: "Page 1" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    },
  );

  test("offers recovery from an out-of-range page", async () => {
    renderLandingPage("/?q=laptop&page=999");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "page is unavailable",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Go to first page" }),
    );
    expect(await screen.findAllByRole("article")).toHaveLength(12);
    expect(screen.getByRole("searchbox")).toHaveValue("laptop");
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

  test("keeps pagination bounded for a million products", async () => {
    server.use(
      http.get(endpoint, () =>
        HttpResponse.json({
          count: 1000000,
          next: endpoint,
          previous: endpoint,
          results: [products[0]],
        }),
      ),
    );
    renderLandingPage("/?page=500");
    await screen.findByRole("article");
    expect(screen.getAllByRole("link", { name: /^Page / })).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Page 83334" })).toBeVisible();
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

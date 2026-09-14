import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";

import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import { ProductGrid } from "@/ecommerce/components/ProductGrid";
import { dummyProducts } from "@/ecommerce/data/products";
import LandingPage from "@/ecommerce/pages/LandingPage";

import { server } from "../server";

// Mount the catalog with a real router so query parameters behave like navigation.
const renderLandingPage = (entry = "/") => {
  server.use(
    http.post("http://localhost/api/auth/refresh/", () =>
      HttpResponse.json({}, { status: 401 }),
    ),
  );
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[entry]}>
        <LandingPage />
      </MemoryRouter>
    </AuthProvider>,
  );
};

describe("LandingPage", () => {
  test("paginates eight products and preserves the search filter", async () => {
    renderLandingPage("/?q=iphone+17+pro");
    const interaction = userEvent.setup();
    expect(screen.getAllByRole("article")).toHaveLength(8);
    expect(
      screen.getByRole("link", { name: "Go to previous page" }),
    ).toHaveAttribute("aria-disabled", "true");
    await interaction.click(
      screen.getByRole("link", { name: "Go to next page" }),
    );
    expect(screen.getByRole("link", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Page 1" })).toHaveAttribute(
      "href",
      "/?q=iphone+17+pro&page=1",
    );
    expect(screen.getAllByRole("article")).toHaveLength(4);
    expect(
      screen.getByRole("link", { name: "Go to next page" }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  test("search starts at page one and an empty result can be cleared", async () => {
    renderLandingPage("/?page=3");
    const interaction = userEvent.setup();
    const search = screen.getByRole("searchbox", { name: "Search products" });
    await interaction.type(search, "  MINI  {Enter}");
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByRole("searchbox")).toHaveValue("MINI");
    expect(
      screen.queryByRole("navigation", { name: "Product pages" }),
    ).not.toBeInTheDocument();
    await interaction.clear(screen.getByRole("searchbox"));
    await interaction.type(screen.getByRole("searchbox"), "no-such-product");
    await interaction.click(screen.getByRole("button", { name: "Search" }));
    expect(
      screen.getByRole("heading", { name: "No products found" }),
    ).toBeVisible();
    await interaction.click(
      screen.getByRole("button", { name: "Clear search" }),
    );
    expect(
      screen.getByRole("heading", { name: "Featured products" }),
    ).toBeVisible();
    expect(screen.getAllByRole("article")).toHaveLength(8);
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  test.each(["-1", "NaN", "1.5", "999"])(
    "handles the external page parameter %s without an empty or broken grid",
    (page) => {
      renderLandingPage(`/?page=${page}`);
      expect(screen.getAllByRole("article")).toHaveLength(8);
      expect(
        screen.getByRole("link", {
          name: page === "999" ? "Page 3" : "Page 1",
        }),
      ).toHaveAttribute("aria-current", "page");
    },
  );

  test("announces loading and replaces skeletons with products when ready", () => {
    const { rerender } = render(<ProductGrid products={[]} isLoading />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading products");
    expect(screen.getByLabelText("Products")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    rerender(<ProductGrid products={dummyProducts.slice(0, 8)} />);
    expect(screen.getByLabelText("Products")).toHaveAttribute(
      "aria-busy",
      "false",
    );
    expect(screen.getAllByRole("article")).toHaveLength(8);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});

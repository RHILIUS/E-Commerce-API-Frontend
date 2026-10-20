import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";

import { ProductCard } from "@/ecommerce/components/ProductCard";

import { render } from "../render";

describe("ProductCard currency formatting", () => {
  test.each([
    ["PHP", 5600, "₱5,600.00"],
    ["USD", 100, "$100.00"],
    ["JPY", 151, "¥151"],
    ["KWD", 0.308, "KWD 0.308"],
  ])("formats %s with its currency precision", (currency, price, expected) => {
    render(
      <MemoryRouter>
        <ProductCard
          product={{
            id: "1",
            name: "Product",
            description: "Summary",
            price,
            currency,
            soldCount: 1,
            imageUrl: null,
            imageAlt: "",
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(expected)).toBeVisible();
    expect(screen.getByRole("link", { name: "View Product" })).toHaveAttribute(
      "href",
      "/products/1",
    );
  });
});

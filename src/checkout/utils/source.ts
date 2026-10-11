import type { CheckoutSource } from "../types";

// URLs are untrusted: reject fractional, duplicate, oversized, or missing selections.
const positiveInteger = (value: string | null) =>
  value !== null &&
  /^[1-9]\d*$/.test(value) &&
  Number.isSafeInteger(Number(value));
/** Carry identifiers and quantities through login without putting prices or tokens in URLs. */
export function checkoutPath(source: CheckoutSource) {
  const params: Record<string, string> =
    source.source === "product"
      ? {
          source: source.source,
          product_id: String(source.product_id),
          quantity: String(source.quantity),
        }
      : { source: source.source, item_ids: source.item_ids.join(",") };
  return `/checkout?${new URLSearchParams(params)}`;
}
/** Parse exactly one supported checkout source from the navigation URL. */
export function parseSource(search: string): CheckoutSource | null {
  const params = new URLSearchParams(search);
  if ([...params.keys()].some((key) => params.getAll(key).length !== 1))
    return null;
  if (params.get("source") === "product") {
    const id = params.get("product_id"),
      quantity = params.get("quantity");
    if (
      params.size !== 3 ||
      !positiveInteger(id) ||
      !positiveInteger(quantity) ||
      Number(quantity) > 2147483647
    )
      return null;
    return {
      source: "product",
      product_id: Number(id),
      quantity: Number(quantity),
    };
  }
  if (params.get("source") === "cart") {
    const ids = (params.get("item_ids") ?? "").split(",");
    if (
      params.size !== 2 ||
      ids.length > 500 ||
      !ids.every(positiveInteger) ||
      new Set(ids).size !== ids.length
    )
      return null;
    return { source: "cart", item_ids: ids.map(Number) };
  }
  return null;
}

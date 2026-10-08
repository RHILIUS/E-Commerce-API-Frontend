import { expect, test } from "vitest";

import { checkoutPath, parseSource } from "@/checkout/utils/source";

test.each([
  "",
  "?source=cart&item_ids=1,1",
  "?source=cart&item_ids=",
  "?source=product&product_id=1&quantity=0",
  "?source=product&product_id=1&quantity=1.5",
  "?source=product&product_id=1&quantity=2147483648",
  "?source=product&product_id=1&quantity=2&quantity=3",
  "?source=cart&item_ids=1&price=1",
])("rejects invalid selection %s", (query) =>
  expect(parseSource(query)).toBeNull(),
);
test("round trips only selected cart IDs", () => {
  const source = { source: "cart" as const, item_ids: [1, 7, 9] };
  expect(parseSource(checkoutPath(source).split("?")[1])).toEqual(source);
});

import { beforeEach, expect, test } from "vitest";

import {
  clearConfirmedAttempt,
  readAttempt,
  recoveryKey,
} from "@/checkout/utils/recovery";

beforeEach(() => sessionStorage.clear());

test("product recovery survives quantity changes while disjoint products and carts stay separate", () => {
  expect(
    recoveryKey(1, { source: "product", product_id: 2, quantity: 1 }),
  ).toBe(recoveryKey(1, { source: "product", product_id: 2, quantity: 4 }));
  expect(recoveryKey(1, { source: "cart", item_ids: [8, 3] })).toBe(
    recoveryKey(1, { source: "cart", item_ids: [3, 8] }),
  );
  const selections = [
    recoveryKey(1, { source: "product", product_id: 2, quantity: 1 }),
    recoveryKey(1, { source: "product", product_id: 3, quantity: 1 }),
    recoveryKey(1, { source: "cart", item_ids: [2] }),
    recoveryKey(1, { source: "cart", item_ids: [3] }),
    recoveryKey(2, { source: "product", product_id: 2, quantity: 1 }),
  ];
  expect(new Set(selections).size).toBe(selections.length);
});

test("completion removes only matching references for the current account", () => {
  const request = {
    preview_token: "saved",
    recipient_id: 7,
    payment_method: "stripe",
    idempotency_key: "request",
  };
  const matched = JSON.stringify({ request, reference: "paid" });
  const other = JSON.stringify({ request, reference: "pending" });
  sessionStorage.setItem("checkout:attempt:1:product:2", matched);
  sessionStorage.setItem("checkout:cod:1", matched);
  sessionStorage.setItem("checkout:attempt:1:product:3", other);
  sessionStorage.setItem("checkout:attempt:2:product:2", matched);
  sessionStorage.setItem("checkout:attempt:1:cart:4", "broken-json");
  clearConfirmedAttempt(1, "paid");
  expect(sessionStorage.getItem("checkout:attempt:1:product:2")).toBeNull();
  expect(sessionStorage.getItem("checkout:cod:1")).toBeNull();
  expect(sessionStorage.getItem("checkout:attempt:1:product:3")).toBe(other);
  expect(sessionStorage.getItem("checkout:attempt:2:product:2")).toBe(matched);
  expect(readAttempt("checkout:attempt:1:cart:4").error).toBeTruthy();
});

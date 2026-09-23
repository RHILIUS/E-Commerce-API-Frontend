import axios from "axios";

import type { CartItem, Money } from "./types";

/** Surface the API's explicit detail message without speculating about response shapes. */
export function cartErrorMessage(error: unknown): string {
  if (
    axios.isAxiosError<{ detail?: string }>(error) &&
    typeof error.response?.data.detail === "string"
  ) {
    return error.response.data.detail;
  }
  return "We couldn't update your cart. Please try again.";
}

/** Format decimal strings without losing cents on large quantity subtotals. */
export function formatMoney({ amount, currency }: Money): string {
  const [whole, fraction = ""] = amount.split(".");
  const formatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
  });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter
    .formatToParts(BigInt(whole))
    .map((part) =>
      part.type === "fraction"
        ? fraction.padEnd(digits, "0").slice(0, digits)
        : part.value,
    )
    .join("");
}

/** Sum API subtotals exactly, keeping any currency-conversion fallbacks separate. */
export function selectedTotals(items: CartItem[]): Money[] {
  const totals = new Map<string, { units: bigint; scale: number }>();
  for (const { subtotal } of items) {
    if (!subtotal) continue;
    const [whole, fraction = ""] = subtotal.amount.split(".");
    const previous = totals.get(subtotal.currency) ?? { units: 0n, scale: 0 };
    const scale = Math.max(previous.scale, fraction.length);
    const units = BigInt(whole + fraction.padEnd(scale, "0"));
    totals.set(subtotal.currency, {
      units: previous.units * 10n ** BigInt(scale - previous.scale) + units,
      scale,
    });
  }
  return [...totals].map(([currency, { units, scale }]) => {
    const digits = units.toString().padStart(scale + 1, "0");
    return {
      currency,
      amount: scale
        ? `${digits.slice(0, -scale)}.${digits.slice(-scale)}`
        : digits,
    };
  });
}

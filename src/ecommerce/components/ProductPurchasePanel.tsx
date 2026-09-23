import { useState } from "react";

import { Button } from "@/app/components/ui/button";
import type { ProductDetail } from "@/ecommerce/types";

/** Present availability independently of theme; never simulate successful purchases. */
export const ProductPurchasePanel = ({
  product,
}: {
  product: ProductDetail;
}) => {
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const archived = product.status === "archived";
  const draft = product.status === "draft";
  const unavailable = !product.can_purchase;
  const notice = archived
    ? [
        "No longer available",
        "This product has been archived. You can still review its details.",
      ]
    : draft
      ? [
          "Draft · Preview",
          "Only store owners and members can view this unpublished product.",
        ]
      : unavailable
        ? [
            "Out of stock",
            "This product is currently unavailable for purchase.",
          ]
        : null;
  const headingClass =
    "text-[32px] leading-[38px] font-bold tracking-[-0.6px] wrap-anywhere";
  return (
    <section
      aria-label="Product information"
      className="flex min-w-0 flex-col gap-6"
    >
      {notice && (
        <div className="bg-muted flex flex-col gap-2 rounded-lg border p-4">
          <p className="text-sm font-semibold">{notice[0]}</p>
          <p className="text-muted-foreground text-sm leading-5">{notice[1]}</p>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm font-medium wrap-anywhere uppercase">
          {product.store.name}
        </p>
        <h1 className={headingClass}>{product.name}</h1>
        {product.short_description && (
          <p className="text-muted-foreground text-base leading-6 wrap-anywhere">
            {product.short_description}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <p className={headingClass}>
          {new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: product.display_price.currency,
          }).format(Number(product.display_price.amount))}
        </p>
        <p className="text-muted-foreground text-sm font-medium">
          {draft
            ? "Not published"
            : `${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(product.sold_count).toLowerCase()} sold`}
        </p>
      </div>
      <p className="text-sm font-medium">
        {archived
          ? "Archived · Not available for purchase"
          : draft
            ? "Unpublished · Not available for purchase"
            : unavailable
              ? "0 available"
              : `In stock · ${product.stock.toLocaleString()} available`}
      </p>
      <div
        role="group"
        aria-labelledby="quantity-label"
        className="flex flex-col gap-3"
      >
        <p id="quantity-label" className="text-sm font-medium">
          Quantity
        </p>
        <div className="flex items-center">
          <Button
            variant="outline"
            className="size-12 disabled:opacity-40"
            aria-label="Decrease quantity"
            disabled={unavailable || quantity <= 1}
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
          >
            −
          </Button>
          <output
            aria-live="polite"
            aria-label="Selected quantity"
            className="w-13 text-center text-sm font-medium"
          >
            {quantity}
          </output>
          <Button
            variant="outline"
            className="size-12 disabled:opacity-40"
            aria-label="Increase quantity"
            disabled={unavailable || quantity >= product.stock}
            onClick={() =>
              setQuantity((value) => Math.min(product.stock, value + 1))
            }
          >
            +
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          disabled={unavailable}
          className="disabled:bg-muted disabled:text-muted-foreground h-12 min-w-0 whitespace-normal disabled:opacity-70"
          onClick={() =>
            setMessage("Adding items to the cart is not available yet.")
          }
        >
          Add to Cart
        </Button>
        <Button
          disabled={unavailable}
          className="disabled:border-border disabled:bg-muted disabled:text-muted-foreground h-12 min-w-0 whitespace-normal disabled:opacity-70"
          onClick={() =>
            setMessage(
              "Checkout is not available yet. No order has been placed.",
            )
          }
        >
          Checkout
        </Button>
      </div>
      {message && (
        <p role="status" className="text-muted-foreground text-sm">
          {message}
        </p>
      )}
    </section>
  );
};

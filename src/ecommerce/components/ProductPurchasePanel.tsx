import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import { toast } from "@/app/lib/toast";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import { checkoutPath } from "@/checkout/utils/source";
import { addToCart } from "@/ecommerce/cart/api";
import { cartErrorMessage } from "@/ecommerce/cart/utils";
import type { ProductDetail } from "@/ecommerce/types";

/** Present availability independently of theme; never simulate successful purchases. */
export const ProductPurchasePanel = ({
  product,
}: {
  product: ProductDetail;
}) => {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const inFlight = useRef(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handleAdd = async () => {
    if (!auth.isAuthenticated) {
      navigate("/login", { state: { from: location } });
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    setAdding(true);
    setAddError("");
    try {
      await addToCart(product.id, quantity);
      toast.add({
        id: "cart-added",
        type: "success",
        title: "Added to your cart.",
        actionProps: {
          children: "View cart",
          onClick: () => {
            toast.close("cart-added");
            navigate("/cart");
          },
        },
      });
    } catch (error) {
      setAddError(cartErrorMessage(error));
    } finally {
      setAdding(false);
      inFlight.current = false;
    }
  };
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
          disabled={unavailable || adding || auth.isLoading}
          className="disabled:bg-muted disabled:text-muted-foreground h-12 min-w-0 whitespace-normal disabled:opacity-70"
          onClick={() => void handleAdd()}
        >
          {adding ? "Adding…" : "Add to Cart"}
        </Button>
        <Button
          disabled={
            unavailable || quantity < 1 || quantity > product.stock || adding
          }
          className="disabled:border-border disabled:bg-muted disabled:text-muted-foreground h-12 min-w-0 whitespace-normal disabled:opacity-70"
          onClick={() =>
            navigate(
              checkoutPath({
                source: "product",
                product_id: product.id,
                quantity,
              }),
            )
          }
        >
          Checkout
        </Button>
      </div>
      {addError && (
        <p role="alert" className="text-destructive text-sm">
          {addError}
        </p>
      )}
    </section>
  );
};

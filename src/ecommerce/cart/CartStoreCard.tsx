import { ImageOff, Minus, Plus, Store } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { cn } from "@/app/lib/utils";

import type { StoreCart } from "./types";
import { formatMoney } from "./utils";

/** Keep missing and failed cart images useful without substituting sample photos. */
function CartImage({
  src,
  alt,
  store = false,
}: {
  src: string | null;
  alt: string;
  store?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const Icon = store ? Store : ImageOff;
  return src && !failed ? (
    <img
      src={src}
      alt={alt}
      className="size-full object-contain"
      onError={() => setFailed(true)}
    />
  ) : (
    <Icon
      className="text-muted-foreground size-6"
      aria-label={alt}
      role="img"
    />
  );
}

type Props = {
  cart: StoreCart;
  selected: Set<number>;
  pending: boolean;
  toggle: (ids: number[], checked: boolean) => void;
  updateQuantity: (id: number, quantity: number) => Promise<boolean>;
};

/** Compose one real store cart with independent item and partial-store selection. */
export function CartStoreCard({
  cart,
  selected,
  pending,
  toggle,
  updateQuantity,
}: Props) {
  const ids = cart.items.map((item) => item.id);
  const count = ids.filter((id) => selected.has(id)).length;
  return (
    <section
      aria-labelledby={`store-${cart.id}`}
      className="bg-card overflow-hidden rounded-xl border"
    >
      <div className="flex items-center gap-3 border-b px-3 py-3 sm:px-6">
        <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center">
          <Checkbox
            aria-label={`Select all from ${cart.store.name}`}
            checked={count === ids.length}
            indeterminate={count > 0 && count < ids.length}
            disabled={pending}
            onCheckedChange={(checked) => toggle(ids, checked)}
          />
        </label>
        <Link
          to={`/stores/${cart.store.id}`}
          aria-labelledby={`store-${cart.id}`}
          className="focus-visible:outline-ring flex min-w-0 items-center gap-3 rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <div className="bg-muted flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border">
            <CartImage
              key={cart.store.profile_image}
              src={cart.store.profile_image}
              alt={`${cart.store.name} logo`}
              store
            />
          </div>
          <h2
            id={`store-${cart.id}`}
            className="min-w-0 text-base font-semibold tracking-normal wrap-anywhere"
          >
            {cart.store.name}
          </h2>
        </Link>
      </div>
      <ul className="divide-y">
        {cart.items.map((item) => {
          const { product } = item;
          const unavailable = !product.can_purchase;
          const overStock = item.quantity > product.stock && !unavailable;
          return (
            <li
              key={item.id}
              className={cn(
                "grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-2 px-3 py-5 sm:gap-x-4 sm:px-6",
                unavailable && "bg-muted/40 text-muted-foreground",
              )}
            >
              <label className="flex size-11 cursor-pointer items-center justify-center">
                <Checkbox
                  aria-label={`Select ${product.name}`}
                  checked={selected.has(item.id)}
                  disabled={pending}
                  onCheckedChange={(checked) => toggle([item.id], checked)}
                />
              </label>
              <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="flex min-w-0 gap-3 sm:gap-5">
                  <div
                    className={cn(
                      "bg-muted flex size-18 shrink-0 items-center justify-center overflow-hidden rounded-lg border sm:size-24",
                      unavailable && "grayscale",
                    )}
                  >
                    <CartImage
                      key={product.image?.image}
                      src={product.image?.image ?? null}
                      alt={product.image?.alt_text || product.name}
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    {product.status === "unavailable" ? (
                      <p className="font-medium">{product.name}</p>
                    ) : (
                      <Link
                        to={`/products/${product.id}`}
                        className="focus-visible:outline-ring block rounded-sm font-medium wrap-anywhere hover:underline focus-visible:outline-2"
                      >
                        {product.name}
                      </Link>
                    )}
                    <p className="font-semibold wrap-anywhere">
                      {product.display_price
                        ? formatMoney(product.display_price)
                        : "Price unavailable"}
                    </p>
                    <p className="text-muted-foreground text-xs leading-5">
                      {product.status === "archived"
                        ? "No longer available"
                        : product.status === "unavailable"
                          ? "This product is unavailable"
                          : product.stock === 0
                            ? "Out of stock"
                            : `${product.stock.toLocaleString()} in stock`}
                    </p>
                  </div>
                </div>
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 md:max-w-64 md:justify-end">
                  {unavailable ? (
                    <span className="bg-muted rounded-md border px-3 py-2 text-sm font-medium">
                      {product.status === "active"
                        ? "Out of stock"
                        : "Unavailable"}
                    </span>
                  ) : (
                    <div
                      className="flex items-center rounded-md border"
                      role="group"
                      aria-label={`Quantity for ${product.name}`}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-11 rounded-r-none"
                        aria-label={`Decrease ${product.name} quantity`}
                        disabled={pending || item.quantity <= 1}
                        onClick={() =>
                          void updateQuantity(
                            item.id,
                            Math.min(item.quantity - 1, product.stock),
                          )
                        }
                      >
                        <Minus aria-hidden="true" />
                      </Button>
                      <output
                        className="min-w-8 px-1 text-center text-sm tabular-nums"
                        aria-label={`${product.name} quantity`}
                      >
                        {item.quantity}
                      </output>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-11 rounded-l-none"
                        aria-label={`Increase ${product.name} quantity`}
                        disabled={pending || item.quantity >= product.stock}
                        onClick={() =>
                          void updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                  <div className="min-w-0 text-right">
                    <p className="text-muted-foreground text-xs">Subtotal</p>
                    <p className="font-semibold wrap-anywhere">
                      {item.subtotal ? formatMoney(item.subtotal) : "—"}
                    </p>
                  </div>
                  {overStock && (
                    <p className="text-destructive w-full text-sm">
                      Only {product.stock} available. Reduce your quantity.
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

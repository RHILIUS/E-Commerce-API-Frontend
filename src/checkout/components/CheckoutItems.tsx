import { ImageOff } from "lucide-react";
import { useState } from "react";

import { formatMoney } from "@/ecommerce/cart/utils";

import type { Preview } from "../types";

// Missing or broken product images must not obscure the item identity.
function ItemImage({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="bg-muted flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg sm:size-20">
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <ImageOff className="text-muted-foreground size-6" aria-hidden="true" />
      )}
    </div>
  );
}
export function CheckoutItems({ preview }: { preview: Preview }) {
  return (
    <section aria-labelledby="items-heading" className="space-y-4">
      <h2 id="items-heading" className="text-xl">
        Product items
      </h2>
      {preview.stores.map((group) => (
        <section
          key={group.store.id}
          className="bg-card space-y-4 rounded-xl border p-4 sm:p-6"
          aria-label={group.store.name}
        >
          <h3 className="border-b pb-4 text-lg wrap-anywhere">
            {group.store.name}
          </h3>
          <ul className="space-y-4">
            {group.items.map((item) => (
              <li
                key={item.cart_item_id ?? item.product.id}
                className="bg-muted/50 flex min-w-0 flex-wrap gap-3 rounded-lg p-3"
              >
                <ItemImage
                  src={item.product.image?.image}
                  alt={item.product.image?.alt_text || item.product.name}
                />
                <div className="min-w-0 flex-1 space-y-3">
                  <p className="font-medium wrap-anywhere">
                    {item.product.name}
                  </p>
                  <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-muted-foreground">Unit price</dt>
                      <dd className="wrap-anywhere">
                        {item.unit_price
                          ? formatMoney(item.unit_price)
                          : "Unavailable"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Quantity</dt>
                      <dd>{item.quantity}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Item subtotal</dt>
                      <dd className="font-semibold wrap-anywhere">
                        {item.subtotal
                          ? formatMoney(item.subtotal)
                          : "Unavailable"}
                      </dd>
                    </div>
                  </dl>
                  {preview.issues
                    .filter((issue) => issue.product_id === item.product.id)
                    .map((issue, index) => (
                      <p
                        role="alert"
                        key={index}
                        className="text-destructive text-sm wrap-anywhere"
                      >
                        {issue.message}
                      </p>
                    ))}
                </div>
              </li>
            ))}
          </ul>
          <p className="border-t pt-4 text-sm wrap-anywhere">
            Store subtotal{" "}
            <strong className="ml-2">
              {group.subtotal ? formatMoney(group.subtotal) : "Unavailable"}
            </strong>
          </p>
        </section>
      ))}
    </section>
  );
}

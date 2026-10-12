import { useEffect, useId, useState } from "react";

import { RecipientAddress } from "@/account/components/RecipientAddress";
import { Button } from "@/app/components/ui/button";
import { formatMoney } from "@/ecommerce/cart/utils";

import { fetchConfirmation } from "../api";
import type { Confirmation } from "../types";
import { checkoutError } from "../utils/errors";
import { CheckoutImage } from "./CheckoutImage";

/** Identify a saved purchase using owner-only snapshots without clearing payment recovery. */
export function SavedCheckoutSummary({
  reference,
  headingLevel = 2,
}: {
  reference: string;
  headingLevel?: 2 | 3;
}) {
  const [data, setData] = useState<Confirmation | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const headingId = useId();
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const StoreHeading = headingLevel === 2 ? "h3" : "h4";

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setData(null);
      setError("");
      try {
        const result = await fetchConfirmation(reference, controller.signal);
        if (!controller.signal.aborted) setData(result);
      } catch (failure) {
        if (!controller.signal.aborted)
          setError(checkoutError(failure).message);
      }
    });
    return () => controller.abort();
  }, [reference, version]);

  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 space-y-4 border-t pt-5"
    >
      <Heading id={headingId} className="text-lg">
        Order details
      </Heading>
      {!data && !error && (
        <p role="status" className="text-muted-foreground text-sm">
          Loading order details…
        </p>
      )}
      {error && (
        <div className="space-y-3">
          <p role="alert" className="text-destructive text-sm wrap-anywhere">
            {error}
          </p>
          <Button
            variant="outline"
            onClick={() => setVersion((value) => value + 1)}
          >
            Retry order details
          </Button>
        </div>
      )}
      {data && (
        <>
          {data.orders.map((order) => (
            <section
              key={order.id}
              aria-label={order.store.name}
              className="min-w-0 space-y-4"
            >
              <StoreHeading className="font-semibold wrap-anywhere">
                {order.store.name}
              </StoreHeading>
              <ul className="space-y-3">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="bg-muted/50 flex min-w-0 gap-3 rounded-lg p-3"
                  >
                    <CheckoutImage
                      src={item.image?.image}
                      alt={item.image?.alt_text || item.name}
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="font-medium wrap-anywhere">{item.name}</p>
                      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                        <div>
                          <dt className="text-muted-foreground">Unit price</dt>
                          <dd className="wrap-anywhere">
                            {formatMoney(item.unit_price)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Quantity</dt>
                          <dd>{item.quantity}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">
                            Item subtotal
                          </dt>
                          <dd className="font-semibold wrap-anywhere">
                            {formatMoney(item.subtotal)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-sm wrap-anywhere">
                Store subtotal <strong>{formatMoney(order.subtotal)}</strong>
              </p>
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">Deliver to</p>
                <RecipientAddress recipient={order.recipient} />
              </div>
            </section>
          ))}
          <p className="flex flex-wrap items-baseline justify-between gap-2 border-t pt-4 wrap-anywhere">
            <span>Total payment</span>
            <strong className="text-xl">{formatMoney(data.total)}</strong>
          </p>
        </>
      )}
    </section>
  );
}

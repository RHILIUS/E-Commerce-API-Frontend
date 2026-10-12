import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { RecipientAddress } from "@/account/components/RecipientAddress";
import { Button } from "@/app/components/ui/button";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import { fetchConfirmation } from "@/checkout/api";
import { CheckoutImage } from "@/checkout/components/CheckoutImage";
import { CheckoutLayout } from "@/checkout/components/CheckoutLayout";
import type { Confirmation } from "@/checkout/types";
import { checkoutError } from "@/checkout/utils/errors";
import { clearConfirmedAttempt } from "@/checkout/utils/recovery";
import { formatMoney } from "@/ecommerce/cart/utils";

export default function CheckoutConfirmationPage() {
  const { user } = useAuth();
  const { reference = "" } = useParams();
  return user ? (
    <ConfirmationContent
      key={`${user.id}:${reference}`}
      userId={user.id}
      reference={reference}
    />
  ) : null;
}
function ConfirmationContent({
  userId,
  reference,
}: {
  userId: number;
  reference: string;
}) {
  const [data, setData] = useState<Confirmation | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const paymentDue =
    data?.status === "completed" &&
    data.payment_method === "cod" &&
    data.orders.length > 0 &&
    data.orders.every((order) => order.payment_status === "unpaid");
  useEffect(() => {
    const controller = new AbortController();
    void fetchConfirmation(reference, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result);
          clearConfirmedAttempt(userId, reference);
        }
      })
      .catch((failure) => {
        if (!controller.signal.aborted)
          setError(checkoutError(failure).message);
      });
    return () => controller.abort();
  }, [reference, userId, version]);
  return (
    <CheckoutLayout backLink={null}>
      <article
        aria-labelledby="confirmation-heading"
        className="bg-card text-card-foreground space-y-8 rounded-xl border p-4 sm:p-8"
      >
        <header className="space-y-3 text-center">
          <h1 id="confirmation-heading" className="text-2xl sm:text-3xl">
            {data?.status === "completed"
              ? "Order placed successfully"
              : "Order confirmation"}
          </h1>
          {data && (
            <>
              {data.payment_method === "stripe" &&
                data.status === "completed" && (
                  <p className="text-muted-foreground">
                    Stripe test payment received. No real money moved.
                  </p>
                )}
              {paymentDue && (
                <p className="text-muted-foreground">Payment due on delivery</p>
              )}
              <p className="text-muted-foreground text-sm wrap-anywhere">
                Reference: {data.reference}
              </p>
            </>
          )}
        </header>
        {error && (
          <div role="alert" className="space-y-3">
            <p>{error}</p>
            <Button
              onClick={() => {
                setError("");
                setVersion((value) => value + 1);
              }}
            >
              Retry confirmation
            </Button>
          </div>
        )}
        {!data && !error && <p role="status">Loading confirmation…</p>}
        {data && (
          <>
            <section
              aria-labelledby="receipt-items-heading"
              className="space-y-6"
            >
              <h2 id="receipt-items-heading" className="text-xl">
                Product items
              </h2>
              {data.orders.map((order) => (
                <section
                  key={order.id}
                  aria-labelledby={`receipt-store-${order.id}`}
                  className="space-y-4 border-b pb-6"
                >
                  <div className="flex items-center gap-3">
                    <CheckoutImage
                      src={order.store.profile_image}
                      alt={order.store.name}
                      store
                    />
                    <h3
                      id={`receipt-store-${order.id}`}
                      className="min-w-0 text-lg wrap-anywhere"
                    >
                      {order.store.name}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm capitalize">
                    Order #{order.id} · {order.status} · Payment:{" "}
                    {order.payment_status}
                  </p>
                  <ul className="space-y-3">
                    {order.items.map((item) => (
                      <li
                        key={item.id}
                        className="bg-muted/50 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg p-3 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center"
                      >
                        <div className="contents sm:flex sm:min-w-0 sm:items-center sm:gap-3">
                          <CheckoutImage
                            src={item.image?.image}
                            alt={item.image?.alt_text || item.name}
                          />
                          <p className="font-medium wrap-anywhere">
                            {item.name}
                          </p>
                        </div>
                        <dl className="col-span-2 grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,1fr)] gap-2 sm:col-span-1">
                          <div>
                            <dt className="text-muted-foreground">
                              Unit price
                            </dt>
                            <dd className="mt-1 wrap-anywhere">
                              {formatMoney(item.unit_price)}
                            </dd>
                          </div>
                          <div className="text-center">
                            <dt className="text-muted-foreground">Quantity</dt>
                            <dd className="mt-1 wrap-anywhere">
                              {item.quantity}
                            </dd>
                          </div>
                          <div className="text-right">
                            <dt className="text-muted-foreground">
                              Item subtotal
                            </dt>
                            <dd className="mt-1 font-semibold wrap-anywhere">
                              {formatMoney(item.subtotal)}
                            </dd>
                          </div>
                        </dl>
                      </li>
                    ))}
                  </ul>
                  <p className="wrap-anywhere">
                    Store subtotal:{" "}
                    <strong>{formatMoney(order.subtotal)}</strong>
                  </p>
                  <div className="space-y-2 border-t pt-4">
                    <h4 className="text-sm font-medium">Deliver to</h4>
                    <RecipientAddress recipient={order.recipient} />
                  </div>
                </section>
              ))}
            </section>
            <section
              aria-labelledby="receipt-summary-heading"
              className="space-y-4"
            >
              <h2 id="receipt-summary-heading" className="text-xl">
                Order summary
              </h2>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_minmax(0,1fr)]">
                <dt className="text-muted-foreground">Date of placement</dt>
                <dd className="mb-2 sm:mb-0">
                  <time dateTime={data.created_at}>
                    {new Date(data.created_at).toLocaleString()}
                  </time>
                </dd>
                <dt className="text-muted-foreground">Payment method</dt>
                <dd className="mb-2 sm:mb-0">
                  {data.payment_method === "cod"
                    ? "Cash on Delivery"
                    : "Card (Stripe test)"}
                </dd>
                <dt className="text-muted-foreground">Checkout status</dt>
                <dd className="mb-2 capitalize sm:mb-0">{data.status}</dd>
                <dt className="font-semibold">Order total</dt>
                <dd
                  className={`${paymentDue ? "font-medium" : "text-xl font-bold"} wrap-anywhere`}
                >
                  {formatMoney(data.total)}
                </dd>
              </dl>
              {paymentDue && (
                <p className="border-t pt-4">
                  <span className="text-muted-foreground block text-sm">
                    Amount due on delivery
                  </span>
                  <strong className="mt-1 block text-2xl font-bold wrap-anywhere sm:text-3xl">
                    {formatMoney(data.total)}
                  </strong>
                </p>
              )}
            </section>
            <div className="flex justify-center">
              <Button
                className="min-h-11 max-w-full whitespace-normal"
                render={<Link to="/" />}
                role="link"
                nativeButton={false}
              >
                Continue shopping
              </Button>
            </div>
          </>
        )}
      </article>
    </CheckoutLayout>
  );
}

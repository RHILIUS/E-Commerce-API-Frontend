import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import { fetchConfirmation } from "@/checkout/api";
import { CheckoutLayout } from "@/checkout/components/CheckoutLayout";
import { RecipientAddress } from "@/checkout/components/RecipientSection";
import { clearConfirmedAttempt } from "@/checkout/hooks/useCODPlacement";
import type { Confirmation } from "@/checkout/types";
import { checkoutError } from "@/checkout/utils/errors";
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
    <CheckoutLayout>
      <h1 className="text-2xl sm:text-3xl">
        {data?.status === "completed" ? "Order placed" : "Order confirmation"}
      </h1>
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
          <section className="bg-card space-y-3 rounded-xl border p-4 sm:p-6">
            <p className="text-sm wrap-anywhere">Reference: {data.reference}</p>
            <p className="text-sm">
              Placed {new Date(data.created_at).toLocaleString()}
            </p>
            <p className="text-sm capitalize">Checkout: {data.status}</p>
            <p>
              {data.payment_method === "cod"
                ? "Cash on Delivery"
                : data.payment_method}
            </p>
            <p className="text-2xl font-bold wrap-anywhere">
              Total: {formatMoney(data.total)}
            </p>
            {data.payment_method === "cod" &&
              data.orders.every(
                (order) => order.payment_status === "unpaid",
              ) && (
                <p className="text-muted-foreground text-sm">
                  Payment is due on delivery. No online payment was collected.
                </p>
              )}
          </section>
          {data.orders.map((order) => (
            <section
              key={order.id}
              className="bg-card space-y-4 rounded-xl border p-4 sm:p-6"
            >
              <h2 className="text-xl wrap-anywhere">{order.store.name}</h2>
              <p className="text-muted-foreground text-sm capitalize">
                Order #{order.id} · {order.status} · Payment:{" "}
                {order.payment_status}
              </p>
              <RecipientAddress recipient={order.recipient} />
              <ul className="divide-y">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap justify-between gap-3 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium wrap-anywhere">{item.name}</p>
                      <p className="text-muted-foreground wrap-anywhere">
                        {formatMoney(item.unit_price)} × {item.quantity}
                      </p>
                    </div>
                    <strong className="wrap-anywhere">
                      {formatMoney(item.subtotal)}
                    </strong>
                  </li>
                ))}
              </ul>
              <p className="border-t pt-4 wrap-anywhere">
                Store subtotal: <strong>{formatMoney(order.subtotal)}</strong>
              </p>
            </section>
          ))}
          <Button render={<Link to="/" />} nativeButton={false}>
            Continue shopping
          </Button>
        </>
      )}
    </CheckoutLayout>
  );
}

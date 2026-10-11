import { Link } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import { CheckoutImage } from "@/checkout/components/CheckoutImage";
import { formatMoney } from "@/ecommerce/cart/utils";

import { OrderHistoryDialog } from "./OrderHistoryDialog";
import { statusLabels, type UserOrder } from "./types";

/** One purchase from one store, preserving historical names, quantities and totals. */
export function OrderRecordCard({
  order,
  onCancel,
  onRefreshRefund,
  busy,
}: {
  order: UserOrder;
  onCancel: () => void;
  onRefreshRefund: () => void;
  busy: boolean;
}) {
  const refund = order.refund;
  const terminalDate =
    ["cancelled", "delivered", "completed"].includes(order.status) &&
    order.concluded_at;
  return (
    <article
      aria-label={`Order ${order.id} from ${order.store.name}`}
      className="bg-card text-card-foreground overflow-hidden rounded-xl border p-4 sm:p-6"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <CheckoutImage src={order.store.profile_image} alt="" store />
          <div className="min-w-0">
            <h2 className="text-base font-semibold wrap-anywhere sm:text-lg">
              {order.store.name}
            </h2>
            <p className="text-muted-foreground text-xs">Order #{order.id}</p>
          </div>
        </div>
        <span className="bg-secondary text-secondary-foreground rounded-md px-3 py-1.5 text-sm font-medium">
          {statusLabels[order.status]}
        </span>
      </header>
      <ul className="divide-y">
        {order.items.map((item) => (
          <li key={item.id} className="flex min-w-0 gap-3 py-4 sm:gap-4">
            <CheckoutImage
              src={item.image?.image}
              alt={item.image?.alt_text || item.name}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="font-medium wrap-anywhere">{item.name}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Quantity: {item.quantity}
                </p>
              </div>
              <p className="shrink-0 font-semibold wrap-anywhere sm:max-w-1/2">
                {formatMoney(item.subtotal)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <footer className="space-y-4 border-t pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-xs">
            {terminalDate ? (
              <>
                {statusLabels[order.status]} on{" "}
                <time dateTime={terminalDate}>
                  {new Date(terminalDate).toLocaleString()}
                </time>
              </>
            ) : (
              <>
                Placed{" "}
                <time dateTime={order.created_at}>
                  {new Date(order.created_at).toLocaleString()}
                </time>
              </>
            )}
          </p>
          <p className="ml-auto text-sm wrap-anywhere">
            Order total:{" "}
            <strong className="text-base">{formatMoney(order.subtotal)}</strong>
          </p>
        </div>
        {refund && (
          <div className="bg-muted rounded-lg p-3 text-sm" role="status">
            {refund.status === "succeeded"
              ? `Refunded ${formatMoney(refund.amount)} to your original Stripe test card.`
              : refund.status === "failed" || refund.status === "canceled"
                ? "Your order is cancelled, but the card refund failed. Please contact support for assistance."
                : refund.status === "requires_action"
                  ? "Your order is cancelled. The card refund needs additional review."
                  : refund.needs_review
                    ? "Your order is cancelled. We couldn't confirm the card refund yet. Check its status again."
                    : `Your order is cancelled. Your ${formatMoney(refund.amount)} refund to the original Stripe test card is pending.`}
            {["pending", "requires_action"].includes(refund.status) && (
              <Button
                className="mt-2 min-h-11"
                variant="outline"
                disabled={busy}
                onClick={onRefreshRefund}
              >
                {busy ? "Checking…" : "Check refund status"}
              </Button>
            )}
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <OrderHistoryDialog orderId={order.id} storeName={order.store.name} />
          {order.payment_pending && (
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link to={`/checkout/payment/${order.checkout_reference}`} />
              }
              className="min-h-11"
            >
              View payment
            </Button>
          )}
          {order.can_cancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={busy}
              className="min-h-11"
            >
              Cancel order
            </Button>
          )}
          {order.status === "delivered" && (
            <Button variant="outline" disabled className="min-h-11">
              Return — coming soon
            </Button>
          )}
        </div>
      </footer>
    </article>
  );
}

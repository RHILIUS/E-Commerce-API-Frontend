import {
  CircleCheck,
  CircleX,
  Clock,
  Package,
  PackageCheck,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import { CheckoutImage } from "@/checkout/components/CheckoutImage";
import { formatMoney } from "@/ecommerce/cart/utils";

import { OrderHistoryDialog } from "./OrderHistoryDialog";
import { type OrderStatus, statusLabels, type UserOrder } from "./types";

// Group related fulfillment stages while preserving each status label and icon.
const statusTagClasses = {
  pending: "bg-order-pending text-order-pending-foreground",
  accepted: "bg-order-processing text-order-processing-foreground",
  packed: "bg-order-processing text-order-processing-foreground",
  shipment_arranged: "bg-order-processing text-order-processing-foreground",
  shipped: "bg-order-shipping text-order-shipping-foreground",
  delivered: "bg-order-success text-order-success-foreground",
  completed: "bg-order-success text-order-success-foreground",
  cancelled: "bg-secondary text-secondary-foreground",
} satisfies Record<OrderStatus, string>;

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
  const StatusIcon = {
    pending: Clock,
    accepted: CircleCheck,
    packed: Package,
    shipment_arranged: Truck,
    shipped: Truck,
    cancelled: CircleX,
    delivered: PackageCheck,
    completed: CircleCheck,
  }[order.status];
  const terminalDate =
    ["cancelled", "delivered", "completed"].includes(order.status) &&
    order.concluded_at;
  return (
    <article
      aria-label={`Order ${order.id} from ${order.store.name}`}
      className="bg-card text-card-foreground overflow-hidden rounded-2xl border p-4 sm:p-6"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 pb-5">
        <Link
          to={`/stores/${order.store.id}`}
          aria-label={order.store.name}
          className="focus-visible:outline-ring flex min-w-0 flex-1 basis-44 items-center gap-3 rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <CheckoutImage src={order.store.profile_image} alt="" store />
          <div className="min-w-0">
            <h2 className="text-base font-semibold wrap-anywhere sm:text-lg">
              {order.store.name}
            </h2>
            <p className="text-muted-foreground text-xs">Order #{order.id}</p>
          </div>
        </Link>
        <span
          className={`${statusTagClasses[order.status]} inline-flex max-w-full shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium`}
        >
          <StatusIcon className="size-4 shrink-0" aria-hidden="true" />
          {statusLabels[order.status]}
        </span>
      </header>
      <ul className="divide-y border-t">
        {order.items.map((item) => {
          const product = (
            <>
              <CheckoutImage
                src={item.image?.image}
                alt={item.image?.alt_text || item.name}
              />
              <div className="min-w-0">
                <p className="font-medium wrap-anywhere">{item.name}</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Quantity: {item.quantity}
                </p>
              </div>
            </>
          );
          return (
            <li
              key={item.id}
              className="flex min-w-0 flex-col gap-2 py-4 sm:flex-row sm:justify-between sm:gap-4"
            >
              {item.product_id !== null ? (
                <Link
                  to={`/products/${item.product_id}`}
                  aria-label={item.name}
                  className="focus-visible:outline-ring flex min-w-0 flex-1 items-start gap-3 rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 sm:gap-4"
                >
                  {product}
                </Link>
              ) : (
                <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                  {product}
                </div>
              )}
              <p className="shrink-0 pl-19 font-semibold wrap-anywhere sm:max-w-1/2 sm:pl-0">
                {formatMoney(item.subtotal)}
              </p>
            </li>
          );
        })}
      </ul>
      <footer className="space-y-5 border-t pt-5">
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
          <p className="text-muted-foreground ml-auto text-sm wrap-anywhere">
            Order total:{" "}
            <strong className="text-foreground ml-1 text-lg">
              {formatMoney(order.subtotal)}
            </strong>
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
            <p className="text-muted-foreground w-full text-right text-xs">
              Product returns are not available in this demo.
            </p>
          )}
        </div>
      </footer>
    </article>
  );
}

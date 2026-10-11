import { useId, useState } from "react";

import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Skeleton } from "@/app/components/ui/skeleton";

import type { OrderHistoryEvent } from "./types";
import { useOrderHistory } from "./useOrderHistory";

const actorLabels: Record<OrderHistoryEvent["actor_role"], string> = {
  customer: "Customer",
  seller: "Seller",
  system: "System",
  unknown: "Actor not recorded",
};

/** Mount the request only while the dialog is open so reopening reads current history. */
function OrderHistoryContent({ orderId }: { orderId: number }) {
  const { data, loading, error, retry } = useOrderHistory(orderId);
  if (loading)
    return (
      <div
        role="status"
        aria-label="Loading order history"
        className="space-y-4"
      >
        {[1, 2, 3].map((id) => (
          <Skeleton key={id} className="h-16 w-full" />
        ))}
      </div>
    );
  if (error)
    return (
      <div role="alert" className="space-y-3">
        <p>We couldn't load the order history. Please try again.</p>
        <Button variant="outline" className="min-h-11" onClick={retry}>
          Retry history
        </Button>
      </div>
    );
  if (!data) return null;
  return (
    <div className="space-y-5">
      {data.is_partial && (
        <p className="bg-muted text-muted-foreground rounded-lg p-3 text-sm">
          Earlier activity may be missing. Only recorded dates are shown.
        </p>
      )}
      {data.events.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No order history has been recorded yet.
        </p>
      ) : (
        <ol aria-label="Order timeline" className="space-y-0">
          {data.events.map((event) => (
            <li
              key={event.id}
              className="relative ml-1 border-l pb-6 pl-5 last:border-transparent last:pb-0"
            >
              <span
                aria-hidden="true"
                className="bg-primary absolute top-1 -left-1.5 size-3 rounded-full"
              />
              <p className="font-medium wrap-anywhere">{event.label}</p>
              <time
                dateTime={event.occurred_at}
                className="text-muted-foreground mt-1 block text-sm wrap-anywhere"
              >
                {new Date(event.occurred_at).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  second: "2-digit",
                  timeZoneName: "short",
                })}
              </time>
              <p className="text-muted-foreground mt-1 text-xs">
                {actorLabels[event.actor_role]}
                {event.is_backfilled ? " · From existing records" : ""}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Accessible, scrollable customer timeline; provider details and actor identities stay private. */
export function OrderHistoryDialog({
  orderId,
  storeName,
}: {
  orderId: number;
  storeName: string;
}) {
  const [open, setOpen] = useState(false);
  const descriptionId = useId();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="min-h-11" />}>
        View order history
      </DialogTrigger>
      <DialogContent
        aria-describedby={descriptionId}
        className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-5 p-4 sm:p-6"
      >
        <div className="min-w-0 pr-10">
          <DialogTitle>Order history</DialogTitle>
          <p
            id={descriptionId}
            className="text-muted-foreground mt-1 text-sm wrap-anywhere"
          >
            Order #{orderId} · {storeName}. Oldest activity first.
          </p>
        </div>
        <div className="min-h-0 overflow-y-auto pr-2">
          {open && <OrderHistoryContent key={orderId} orderId={orderId} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

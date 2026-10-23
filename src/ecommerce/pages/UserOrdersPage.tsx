import axios from "axios";
import {
  CircleCheck,
  ClipboardList,
  PackageCheck,
  PackageOpen,
  PackageX,
  Truck,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { toast } from "@/app/lib/toast";
import { formatMoney } from "@/ecommerce/cart/utils";
import { Header } from "@/ecommerce/components/Header";
import { cancelOrder } from "@/ecommerce/orders/api";
import { OrderRecordCard } from "@/ecommerce/orders/OrderRecordCard";
import {
  type OrderTab,
  orderTabs,
  type UserOrder,
} from "@/ecommerce/orders/types";
import { useOrders } from "@/ecommerce/orders/useOrders";

const orderTabIcons = {
  all: ClipboardList,
  to_ship: PackageOpen,
  to_receive: Truck,
  cancelled: PackageX,
  delivered: PackageCheck,
  completed: CircleCheck,
} satisfies Record<OrderTab, typeof ClipboardList>;

/** Customer purchase history, with URL-backed tabs and server-authorized cancellation. */
export default function UserOrdersPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab =
    orderTabs.find((item) => item.value === params.get("tab"))?.value ?? "all";
  const rawPage = Number(params.get("page") ?? 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const { data, loading, error, reload } = useOrders(tab, page);
  const [selected, setSelected] = useState<UserOrder | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);

  const submitCancellation = async (order: UserOrder) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(order.id);
    setActionError(null);
    setNotice("");
    try {
      const updated = await cancelOrder(order.id);
      setSelected(null);
      toast.add({
        id: "order-cancelled",
        type: "success",
        title: "Order cancelled.",
      });
      setNotice(
        updated.refund?.status === "succeeded"
          ? "The refund to your original Stripe test card is confirmed."
          : updated.refund
            ? "See the Cancelled tab for your card refund status."
            : "",
      );
      reload();
      heading.current?.focus();
    } catch (error) {
      setActionError(
        axios.isAxiosError<{ detail?: string }>(error) &&
          typeof error.response?.data.detail === "string"
          ? error.response.data.detail
          : "We couldn't confirm the result. Please try again; repeated requests won't cancel or refund twice.",
      );
      reload();
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  };

  return (
    <div className="bg-background text-foreground flex min-w-0 flex-col">
      <Header
        searchQuery=""
        onSearch={(q) => navigate(q ? `/?${new URLSearchParams({ q })}` : "/")}
      />
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-3 py-6 sm:px-6 sm:py-10">
        <div className="space-y-2">
          <h1
            ref={heading}
            tabIndex={-1}
            className="text-2xl outline-none sm:text-3xl"
          >
            My orders
          </h1>
          <p className="text-muted-foreground text-sm">
            Review your purchases, check their progress, and manage eligible
            orders.
          </p>
        </div>
        {notice && (
          <p role="status" className="bg-secondary rounded-lg p-3 text-sm">
            {notice}
          </p>
        )}
        {actionError && !selected && (
          <p role="alert" className="text-destructive text-sm">
            {actionError}
          </p>
        )}
        <Tabs
          value={tab}
          onValueChange={(value) => {
            setParams({ tab: String(value) });
            setNotice("");
            setActionError(null);
          }}
          className="gap-6"
        >
          <TabsList
            aria-label="Order status"
            className="grid w-full grid-cols-3 gap-1 rounded-xl p-1 group-data-horizontal/tabs:h-auto sm:grid-cols-6"
          >
            {orderTabs.map((item) => {
              const Icon = orderTabIcons[item.value];
              return (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="data-active:text-primary dark:data-active:text-primary min-h-16 flex-col rounded-lg px-1 py-2 text-sm lg:min-h-11 lg:flex-row"
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {item.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          {orderTabs.map((item) => (
            <TabsContent
              key={item.value}
              value={item.value}
              className="space-y-4"
            >
              {loading ? (
                <div
                  role="status"
                  aria-label="Loading orders"
                  className="space-y-4"
                >
                  {[1, 2].map((id) => (
                    <Skeleton key={id} className="h-64 w-full rounded-xl" />
                  ))}
                </div>
              ) : error ? (
                <div
                  role="alert"
                  className="bg-card space-y-3 rounded-xl border p-6 text-center"
                >
                  <p>{error}</p>
                  <Button onClick={reload}>Try again</Button>
                  {page > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setParams({ tab })}
                    >
                      Back to first page
                    </Button>
                  )}
                </div>
              ) : data?.results.length === 0 ? (
                <div className="bg-card flex flex-col items-center gap-3 rounded-xl border px-4 py-14 text-center">
                  <PackageOpen
                    className="text-muted-foreground size-10"
                    aria-hidden="true"
                  />
                  <h2 className="text-lg">No orders here yet</h2>
                  <p className="text-muted-foreground text-sm">
                    {tab === "all"
                      ? "Your orders will appear here after checkout."
                      : `Orders in ${item.label.toLowerCase()} will appear here.`}
                  </p>
                  {page > 1 ? (
                    <Button
                      variant="outline"
                      className="min-h-11"
                      onClick={() => setParams({ tab })}
                    >
                      Back to first page
                    </Button>
                  ) : tab === "all" ? (
                    <Button
                      nativeButton={false}
                      render={<Link to="/" />}
                      className="mt-2 min-h-11"
                    >
                      Browse products
                    </Button>
                  ) : null}
                </div>
              ) : (
                data?.results.map((order) => (
                  <OrderRecordCard
                    key={order.id}
                    order={order}
                    busy={busy === order.id}
                    onCancel={() => {
                      setSelected(order);
                      setActionError(null);
                    }}
                    onRefreshRefund={() => void submitCancellation(order)}
                  />
                ))
              )}
              {data && (data.next || data.previous) && (
                <nav
                  aria-label="Order pages"
                  className="flex flex-wrap items-center justify-center gap-3"
                >
                  <Button
                    variant="outline"
                    disabled={!data.previous}
                    onClick={() => setParams({ tab, page: String(page - 1) })}
                  >
                    Previous
                  </Button>
                  <span className="text-muted-foreground text-sm">
                    Page {page}
                  </span>
                  <Button
                    variant="outline"
                    disabled={!data.next}
                    onClick={() => setParams({ tab, page: String(page + 1) })}
                  >
                    Next
                  </Button>
                </nav>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
      <AlertDialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open && !inFlight.current) setSelected(null);
        }}
      >
        <AlertDialogContent className="max-h-[calc(100dvh-2rem)] max-w-[calc(100%-2rem)] overflow-y-auto sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              {selected?.payment_status === "paid"
                ? `Cancel the entire order from ${selected.store.name}. We'll request a ${formatMoney(selected.subtotal)} refund to your original Stripe test card. Refund confirmation may take time.`
                : `Cancel the entire order from ${selected?.store.name ?? "this store"}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {actionError && (
            <p role="alert" className="text-destructive text-sm">
              {actionError}
            </p>
          )}
          <AlertDialogFooter>
            <Button
              variant="outline"
              disabled={busy !== null}
              onClick={() => setSelected(null)}
            >
              Keep order
            </Button>
            <Button
              variant="destructive"
              disabled={busy !== null}
              onClick={() => selected && void submitCancellation(selected)}
            >
              {busy !== null ? "Cancelling…" : "Confirm cancellation"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

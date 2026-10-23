import { ArrowLeft, ShoppingBag, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Skeleton } from "@/app/components/ui/skeleton";
import { toast } from "@/app/lib/toast";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import { checkoutPath } from "@/checkout/utils/source";
import { CartStoreCard } from "@/ecommerce/cart/CartStoreCard";
import { useCart } from "@/ecommerce/cart/useCart";
import { formatMoney, selectedTotals } from "@/ecommerce/cart/utils";
import { Header } from "@/ecommerce/components/Header";
import { useDisplayCurrency } from "@/ecommerce/currency/context";

/** Keep account-specific cart and selection state isolated across account changes. */
const CartPage = () => {
  const { user } = useAuth();
  return <CartContent key={`${user?.id}:${user?.address_country_code}`} />;
};

function CartContent() {
  const navigate = useNavigate();
  const { currency } = useDisplayCurrency();
  const cart = useCart(currency);
  const [selection, setSelection] = useState<Set<number>>(new Set());
  const [removing, setRemoving] = useState<number[]>([]);
  const [notice, setNotice] = useState("");
  const removeButton = useRef<HTMLButtonElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const items = cart.data?.carts.flatMap((group) => group.items) ?? [];
  const selectedItems = items.filter((item) => selection.has(item.id));
  const selected = new Set(selectedItems.map((item) => item.id));
  const totals = selectedTotals(selectedItems);
  const units = selectedItems.reduce((total, item) => total + item.quantity, 0);
  const toggle = (ids: number[], checked: boolean) =>
    setSelection((previous) => {
      const next = new Set(previous);
      ids.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  const checkout = async () => {
    const overstock = selectedItems.filter(
      (item) => item.product.stock > 0 && item.quantity > item.product.stock,
    );
    if (overstock.length) {
      for (const item of overstock) {
        if (!(await cart.updateQuantity(item.id, 1))) return;
      }
      setNotice(
        "Some quantities exceeded available stock and were reset to 1. Review your selection before checkout.",
      );
      return;
    }
    navigate(checkoutPath({ source: "cart", item_ids: [...selected] }));
  };
  const confirmRemove = async () => {
    if (await cart.removeItems(removing)) {
      toggle(removing, false);
      setNotice("");
      toast.add({
        id: "cart-removed",
        type: "success",
        title: "Selected products removed from your cart.",
      });
      setRemoving([]);
    }
  };

  return (
    <div className="bg-background text-foreground flex min-w-0 flex-col">
      <Header
        searchQuery=""
        onSearch={(query) =>
          navigate(query ? `/?${new URLSearchParams({ q: query })}` : "/")
        }
      />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-3 py-6 sm:px-6 sm:py-10">
        <Link
          to="/"
          className="text-muted-foreground focus-visible:outline-ring inline-flex min-h-11 items-center gap-2 rounded-sm text-sm hover:underline focus-visible:outline-2"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Continue shopping
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 ref={heading} tabIndex={-1} className="text-2xl sm:text-3xl">
              Shopping Cart
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Your favourites, saved by store.
            </p>
          </div>
          {items.length > 0 && (
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 text-sm font-medium">
              <Checkbox
                checked={selected.size === items.length}
                indeterminate={
                  selected.size > 0 && selected.size < items.length
                }
                disabled={cart.pending}
                onCheckedChange={(checked) =>
                  toggle(
                    items.map((item) => item.id),
                    checked,
                  )
                }
              />
              Select all ({items.length})
            </label>
          )}
        </div>
        {cart.refreshError && (
          <div
            role="alert"
            className="bg-muted flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm"
          >
            <p>{cart.refreshError}</p>
            <Button variant="outline" onClick={() => void cart.refresh()}>
              Retry
            </Button>
          </div>
        )}
        {cart.error && removing.length === 0 && (
          <p role="alert" className="text-destructive text-sm">
            {cart.error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-muted-foreground text-sm">
            {notice}
          </p>
        )}
        {!cart.data && !cart.refreshError && (
          <div role="status" aria-label="Loading cart" className="space-y-4">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <span className="sr-only">Loading your cart…</span>
          </div>
        )}
        {cart.data && items.length === 0 && (
          <div className="bg-card flex flex-col items-center gap-4 rounded-xl border px-6 py-16 text-center">
            <ShoppingBag
              className="text-muted-foreground size-12"
              aria-hidden="true"
            />
            <h2 className="text-xl">Your cart is empty</h2>
            <p className="text-muted-foreground text-sm">
              Find something you love and add it to your cart.
            </p>
            <Button
              render={<Link to="/" />}
              role="link"
              nativeButton={false}
              className="min-h-11"
            >
              Browse products
            </Button>
          </div>
        )}
        {cart.data?.carts.map((group) => (
          <CartStoreCard
            key={group.id}
            cart={group}
            selected={selected}
            pending={cart.pending}
            toggle={toggle}
            updateQuantity={cart.updateQuantity}
          />
        ))}
        {items.length > 0 && (
          <p className="text-muted-foreground text-xs">
            Stock and prices refresh every 15 seconds while this page is
            visible. Adding to cart does not reserve stock.
          </p>
        )}
      </main>
      {items.length > 0 && (
        <section
          aria-label="Cart actions"
          className="bg-card bottom-0 z-20 border-t px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg sm:px-6 [@media(min-height:40rem)]:sticky"
        >
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4">
            <div className="min-w-0" aria-live="polite">
              <p className="text-muted-foreground text-sm">
                {units} selected {units === 1 ? "item" : "items"} ·{" "}
                {selected.size} {selected.size === 1 ? "product" : "products"}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-2xl font-bold tabular-nums">
                {totals.length ? (
                  totals.map((total) => (
                    <span key={total.currency} className="wrap-anywhere">
                      {formatMoney(total)}
                    </span>
                  ))
                ) : (
                  <span>—</span>
                )}
              </div>
            </div>
            <div className="flex w-full flex-wrap gap-3 sm:w-auto">
              <Button
                ref={removeButton}
                variant="outline"
                className="h-11 flex-1 sm:flex-none"
                disabled={!selected.size || selected.size > 500 || cart.pending}
                aria-describedby={
                  selected.size > 500 ? "removal-limit" : undefined
                }
                onClick={() => setRemoving([...selected])}
              >
                <Trash2 aria-hidden="true" />
                Remove
              </Button>
              <Button
                className="h-11 flex-1 sm:flex-none"
                disabled={!selected.size || selected.size > 500 || cart.pending}
                aria-describedby="checkout-note"
                onClick={() => void checkout()}
              >
                Checkout
              </Button>
            </div>
            {selected.size > 500 && (
              <p
                id="removal-limit"
                role="status"
                className="text-destructive w-full text-sm"
              >
                Select up to 500 products at a time.
              </p>
            )}
            <p
              id="checkout-note"
              className="text-muted-foreground w-full text-xs"
            >
              Only selected items will proceed to checkout. Final prices and
              stock are checked before placing your order.
            </p>
          </div>
        </section>
      )}
      <AlertDialog
        open={removing.length > 0}
        onOpenChange={(open) => {
          if (!open && !cart.pending) setRemoving([]);
        }}
      >
        <AlertDialogContent
          initialFocus={cancelButton}
          finalFocus={() =>
            removeButton.current?.disabled === false
              ? removeButton.current
              : heading.current
          }
          className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Remove selected products?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {removing.length}{" "}
              {removing.length === 1 ? "product" : "products"} from your saved
              carts? You can add them again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {cart.error && (
            <p role="alert" className="text-destructive text-sm">
              {cart.error}
            </p>
          )}
          <AlertDialogFooter>
            <Button
              ref={cancelButton}
              variant="outline"
              disabled={cart.pending}
              onClick={() => setRemoving([])}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={cart.pending}
              onClick={() => void confirmRemove()}
            >
              {cart.pending ? "Removing…" : "Remove products"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default CartPage;

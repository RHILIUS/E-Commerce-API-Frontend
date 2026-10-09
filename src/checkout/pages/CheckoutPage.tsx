import { useState } from "react";
import { useLocation } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import { useCountdown } from "@/authentication/hooks/useCountdown";
import { CheckoutItems } from "@/checkout/components/CheckoutItems";
import { CheckoutLayout } from "@/checkout/components/CheckoutLayout";
import { RecipientSection } from "@/checkout/components/RecipientSection";
import { useCheckoutReview } from "@/checkout/hooks/useCheckoutReview";
import { useCODPlacement } from "@/checkout/hooks/useCODPlacement";
import type { Preview, Recipient } from "@/checkout/types";
import { parseSource } from "@/checkout/utils/source";
import { formatMoney } from "@/ecommerce/cart/utils";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { search } = useLocation();
  return user ? (
    <CheckoutContent
      key={`${user.id}:${user.country_code}:${search}`}
      userId={user.id}
      search={search}
    />
  ) : null;
}
function CheckoutContent({
  userId,
  search,
}: {
  userId: number;
  search: string;
}) {
  const placement = useCODPlacement(userId);
  const [recipientId, setRecipientId] = useState<number | undefined>();
  const review = useCheckoutReview(
    search,
    Boolean(placement.attempt) || placement.storageBlocked,
  );
  const source = parseSource(search);
  const refresh = () => {
    review.refresh();
    placement.reviewed();
  };
  return (
    <CheckoutLayout
      backLink={
        source?.source === "product"
          ? { to: `/products/${source.product_id}`, label: "Back to product" }
          : { to: "/cart", label: "Back to cart" }
      }
    >
      <h1 className="text-2xl sm:text-3xl">Checkout</h1>
      {placement.error && (
        <p role="alert" className="text-destructive text-sm wrap-anywhere">
          {placement.error}
        </p>
      )}
      {placement.attempt ? (
        <section className="bg-card space-y-4 rounded-xl border p-4 sm:p-6">
          <h2 className="text-xl">
            {placement.attempt.reference
              ? "Your order was placed"
              : "Confirm your previous order request"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {placement.attempt.reference
              ? "Open the saved confirmation to review your purchase."
              : "An order request is saved in this tab. Retry that same request to check its result before starting another purchase. This will not create a duplicate order."}
          </p>
          <Button
            disabled={placement.busy}
            onClick={() => void placement.submit()}
          >
            {placement.busy
              ? "Checking order…"
              : placement.attempt.reference
                ? "View confirmation"
                : "Retry saved order"}
          </Button>
        </section>
      ) : !source ? (
        <p role="alert">
          No valid checkout selection. Choose products from your cart or a
          product page.
        </p>
      ) : (
        !placement.storageBlocked && (
          <>
            {review.error && (
              <div role="alert" className="space-y-3">
                <p>{review.error}</p>
                <Button variant="outline" onClick={refresh}>
                  Try again
                </Button>
              </div>
            )}
            {(review.loading || (!review.data && !review.error)) && (
              <p role="status">Loading checkout…</p>
            )}
            {review.data && (
              <CheckoutReview
                preview={review.data.preview}
                savedRecipients={review.data.recipients}
                placement={placement}
                recipientId={recipientId}
                onSelectRecipient={setRecipientId}
                refresh={refresh}
              />
            )}
          </>
        )
      )}
    </CheckoutLayout>
  );
}
function CheckoutReview({
  preview,
  savedRecipients,
  recipientId,
  onSelectRecipient,
  placement,
  refresh,
}: {
  preview: Preview;
  savedRecipients: Recipient[];
  recipientId: number | undefined;
  onSelectRecipient: (id: number) => void;
  placement: ReturnType<typeof useCODPlacement>;
  refresh: () => void;
}) {
  const [recipients, setRecipients] = useState(savedRecipients);
  const selected =
    recipientId === undefined
      ? recipients.find((item) => item.is_default)
      : recipients.find((item) => item.id === recipientId);
  const completeRecipient = Boolean(
    selected?.name.trim() &&
    selected.phone_number.trim() &&
    selected.country_code.trim() &&
    selected.address_line1.trim() &&
    selected.city.trim(),
  );
  const deadline = preview.expires_at ? Date.parse(preview.expires_at) : null;
  const seconds = useCountdown(deadline);
  const expired = deadline !== null && seconds === 0;
  const ready =
    preview.can_place_order &&
    Boolean(preview.preview_token) &&
    completeRecipient &&
    !expired &&
    !placement.needsReview;
  const place = () => {
    if (
      !ready ||
      !selected ||
      !preview.preview_token ||
      !deadline ||
      Date.now() >= deadline
    )
      return;
    void placement.submit({
      preview_token: preview.preview_token,
      recipient_id: selected.id,
      payment_method: "cod",
    });
  };
  return (
    <>
      <RecipientSection
        recipients={recipients}
        selected={selected}
        onSelect={onSelectRecipient}
        onRecipients={setRecipients}
        disabled={placement.busy}
      />
      {selected && !completeRecipient && (
        <p role="alert" className="text-destructive text-sm">
          This recipient has incomplete details. Edit it, or choose or add a
          recipient with a name, phone number, country, street address, and
          city.
        </p>
      )}
      <CheckoutItems preview={preview} />
      {preview.issues
        .filter((issue) => issue.product_id === null)
        .map((issue, index) => (
          <p key={index} role="alert" className="text-destructive">
            {issue.message}
          </p>
        ))}
      <section
        aria-labelledby="payment-heading"
        className="bg-card space-y-4 rounded-xl border p-4 sm:p-6"
      >
        <h2 id="payment-heading" className="text-xl">
          Payment
        </h2>
        <p className="font-medium">Cash on Delivery (COD)</p>
        <p className="text-muted-foreground text-sm">
          Pay when your order arrives. Online payment is not available yet.
        </p>
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-t pt-4">
          <span>Total payment</span>
          <strong className="text-2xl wrap-anywhere">
            {preview.total ? formatMoney(preview.total) : "Unavailable"}
          </strong>
        </div>
        {!preview.can_place_order && (
          <p role="alert" className="text-destructive text-sm">
            Resolve the item issues before placing your order.
          </p>
        )}
        {(expired || placement.needsReview) && (
          <p role="status" className="text-destructive text-sm">
            Please update your order details before continuing.
          </p>
        )}
        {!selected && (
          <p className="text-muted-foreground text-sm">
            A recipient is required.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button
            className="min-h-11"
            disabled={!ready || placement.busy}
            onClick={place}
          >
            {placement.busy ? "Placing order…" : "Place Order"}
          </Button>
          {(expired || placement.needsReview) && (
            <Button
              variant="outline"
              disabled={placement.busy}
              onClick={refresh}
            >
              Update order details
            </Button>
          )}
        </div>
      </section>
    </>
  );
}

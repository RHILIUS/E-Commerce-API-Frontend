import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import type { Recipient } from "@/account/types";
import { Button } from "@/app/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import { useCountdown } from "@/authentication/hooks/useCountdown";
import { CheckoutItems } from "@/checkout/components/CheckoutItems";
import { CheckoutLayout } from "@/checkout/components/CheckoutLayout";
import { RecipientSection } from "@/checkout/components/RecipientSection";
import { SavedCheckoutSummary } from "@/checkout/components/SavedCheckoutSummary";
import { useCheckoutPlacement } from "@/checkout/hooks/useCheckoutPlacement";
import { useCheckoutReview } from "@/checkout/hooks/useCheckoutReview";
import type { PaymentMethod, Preview } from "@/checkout/types";
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
  const source = parseSource(search);
  const placement = useCheckoutPlacement(userId, source);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  // Undefined allows initial default selection; null requires a new choice after removal.
  const [recipientId, setRecipientId] = useState<number | null | undefined>();
  const review = useCheckoutReview(
    search,
    Boolean(placement.attempt) || placement.storageBlocked,
    paymentMethod,
  );
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
      {placement.previousAttempt && (
        <p className="text-muted-foreground text-sm">
          An earlier checkout is still saved.{" "}
          <Link
            className="text-foreground underline underline-offset-4"
            to={`/checkout/${placement.previousAttempt.request.payment_method === "stripe" ? "payment" : "confirmation"}/${placement.previousAttempt.reference}`}
          >
            {placement.previousAttempt.request.payment_method === "stripe"
              ? "View previous payment"
              : "View previous order"}
          </Link>
        </p>
      )}
      {placement.attempt ? (
        <section className="bg-card space-y-4 rounded-xl border p-4 sm:p-6">
          <h2 className="text-xl">
            {placement.attempt.reference
              ? "Your checkout is saved"
              : "Confirm your previous order request"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {placement.attempt.reference
              ? "Open your saved checkout to review its status."
              : "An order request is saved in this tab. Retry that same request to check its result before starting another purchase. This will not create a duplicate order."}
          </p>
          <Button
            disabled={placement.busy}
            onClick={() => void placement.submit()}
          >
            {placement.busy
              ? placement.attempt.request.payment_method === "stripe"
                ? "Redirecting to payment…"
                : "Checking order…"
              : placement.attempt.reference
                ? placement.attempt.request.payment_method === "stripe"
                  ? "View payment"
                  : "View confirmation"
                : "Retry saved order"}
          </Button>
          {placement.attempt.reference && (
            <SavedCheckoutSummary
              key={placement.attempt.reference}
              reference={placement.attempt.reference}
              headingLevel={3}
            />
          )}
        </section>
      ) : !source ? (
        <p role="alert">
          No valid checkout selection. Choose products from your cart or a
          product page.
        </p>
      ) : (
        !placement.storageBlocked && (
          <>
            <section
              className="bg-card space-y-3 rounded-xl border p-4 sm:p-6"
              aria-labelledby="payment-method-heading"
            >
              <h2 id="payment-method-heading" className="text-xl">
                Payment method
              </h2>
              <RadioGroup
                aria-labelledby="payment-method-heading"
                value={paymentMethod}
                onValueChange={(value) => {
                  if (value === "cod" || value === "stripe") {
                    setPaymentMethod(value);
                    placement.reviewed();
                  }
                }}
                disabled={placement.busy}
              >
                <label className="flex min-h-11 items-center gap-3">
                  <RadioGroupItem value="cod" />
                  Cash on Delivery
                </label>
                <label className="flex min-h-11 items-center gap-3">
                  <RadioGroupItem value="stripe" />
                  Card (Stripe test)
                </label>
              </RadioGroup>
              {paymentMethod === "stripe" && (
                <p className="text-muted-foreground text-sm">
                  Demo payment only. Your combined order will be charged in USD
                  using a Stripe test card.
                </p>
              )}
            </section>
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
                paymentMethod={paymentMethod}
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
  paymentMethod,
  preview,
  savedRecipients,
  recipientId,
  onSelectRecipient,
  placement,
  refresh,
}: {
  paymentMethod: PaymentMethod;
  preview: Preview;
  savedRecipients: Recipient[];
  recipientId: number | null | undefined;
  onSelectRecipient: (id: number | null) => void;
  placement: ReturnType<typeof useCheckoutPlacement>;
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
      payment_method: paymentMethod,
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
        <p className="font-medium">
          {paymentMethod === "cod"
            ? "Cash on Delivery (COD)"
            : "Card (Stripe test)"}
        </p>
        <p className="text-muted-foreground text-sm">
          {paymentMethod === "cod"
            ? "Pay when your order arrives."
            : "One USD test payment covers all stores. No real money moves."}
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
            {placement.busy
              ? paymentMethod === "stripe"
                ? "Redirecting to payment…"
                : "Preparing checkout…"
              : paymentMethod === "cod"
                ? "Place Order"
                : "Continue to payment"}
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

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import type { Recipient } from "@/account/types";
import { Button } from "@/app/components/ui/button";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import { useCountdown } from "@/authentication/hooks/useCountdown";
import { CheckoutItems } from "@/checkout/components/CheckoutItems";
import { CheckoutLayout } from "@/checkout/components/CheckoutLayout";
import { PaymentMethodSelector } from "@/checkout/components/PaymentMethodSelector";
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
      key={`${user.id}:${user.address_country_code}:${search}`}
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
            {review.error && (
              <div role="alert" className="space-y-3">
                <p>{review.error}</p>
                <Button variant="outline" onClick={refresh}>
                  Try again
                </Button>
              </div>
            )}
            {!review.data && review.loading && (
              <p role="status">Loading checkout…</p>
            )}
            <CheckoutReview
              paymentMethod={paymentMethod}
              onPaymentMethodChange={(value) => {
                setPaymentMethod(value);
                review.refresh();
                placement.reviewed();
              }}
              current={review.current}
              updating={review.loading}
              preview={review.data?.preview ?? null}
              savedRecipients={review.data?.recipients ?? null}
              placement={placement}
              recipientId={recipientId}
              onSelectRecipient={setRecipientId}
              refresh={refresh}
            />
          </>
        )
      )}
    </CheckoutLayout>
  );
}
function CheckoutReview({
  current,
  updating,
  paymentMethod,
  onPaymentMethodChange,
  preview,
  savedRecipients,
  recipientId,
  onSelectRecipient,
  placement,
  refresh,
}: {
  current: boolean;
  updating: boolean;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  preview: Preview | null;
  savedRecipients: Recipient[] | null;
  recipientId: number | null | undefined;
  onSelectRecipient: (id: number | null) => void;
  placement: ReturnType<typeof useCheckoutPlacement>;
  refresh: () => void;
}) {
  const [editedRecipients, setEditedRecipients] = useState<{
    source: Recipient[] | null;
    items: Recipient[];
  } | null>(null);
  // Recipient edits belong to their loaded review; a refreshed review uses its own saved list.
  const recipients =
    editedRecipients?.source === savedRecipients
      ? editedRecipients.items
      : (savedRecipients ?? []);
  const setRecipients = (items: Recipient[]) =>
    setEditedRecipients({ source: savedRecipients, items });
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
  const deadline = preview?.expires_at ? Date.parse(preview.expires_at) : null;
  const seconds = useCountdown(deadline);
  const expired = deadline !== null && seconds === 0;
  const ready =
    current &&
    preview?.can_place_order &&
    Boolean(preview.preview_token) &&
    completeRecipient &&
    !expired &&
    !placement.needsReview;
  const place = () => {
    if (
      !ready ||
      !selected ||
      !preview?.preview_token ||
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
      {preview && (
        <>
          <RecipientSection
            recipients={recipients}
            selected={selected}
            onSelect={onSelectRecipient}
            onRecipients={setRecipients}
            disabled={placement.busy || !current}
          />
          {selected && !completeRecipient && (
            <p role="alert" className="text-destructive text-sm">
              This recipient has incomplete details. Edit it, or choose or add a
              recipient with a name, phone number, country, street address, and
              city.
            </p>
          )}
          {!current && (
            <p className="sr-only">
              Item prices shown are from your previous review. Checkout will use
              the updated prices once ready.
            </p>
          )}
          <CheckoutItems preview={preview} />
          {current &&
            preview.issues
              .filter((issue) => issue.product_id === null)
              .map((issue, index) => (
                <p key={index} role="alert" className="text-destructive">
                  {issue.message}
                </p>
              ))}
        </>
      )}
      <section
        aria-labelledby="payment-heading"
        className="bg-card space-y-4 rounded-xl border p-4 sm:p-6"
      >
        <h2 id="payment-heading" className="text-xl">
          Payment and total
        </h2>
        <PaymentMethodSelector
          value={paymentMethod}
          onChange={onPaymentMethodChange}
          disabled={placement.busy}
        />
        {preview ? (
          <>
            <div className="flex min-h-12 flex-wrap items-baseline justify-between gap-3 border-t pt-4">
              <span>Total payment</span>
              {current ? (
                <strong className="text-2xl wrap-anywhere">
                  {preview.total ? formatMoney(preview.total) : "Unavailable"}
                </strong>
              ) : (
                <span role="status" className="text-muted-foreground text-sm">
                  {updating
                    ? "Updating payment details…"
                    : "Payment details unavailable. Try again."}
                </span>
              )}
            </div>
            {current && !preview.can_place_order && (
              <p role="alert" className="text-destructive text-sm">
                Resolve the item issues before placing your order.
              </p>
            )}
            {current && (expired || placement.needsReview) && (
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
              {current && (expired || placement.needsReview) && (
                <Button
                  variant="outline"
                  disabled={placement.busy}
                  onClick={refresh}
                >
                  Update order details
                </Button>
              )}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            A completed checkout review is required to show your total and
            continue.
          </p>
        )}
      </section>
    </>
  );
}

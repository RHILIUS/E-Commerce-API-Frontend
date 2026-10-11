import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/app/components/ui/button";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import { CheckoutLayout } from "@/checkout/components/CheckoutLayout";
import { SavedCheckoutSummary } from "@/checkout/components/SavedCheckoutSummary";
import { useStripePayment } from "@/checkout/hooks/useStripePayment";
import { clearConfirmedAttempt } from "@/checkout/utils/recovery";

/** Treat redirects as navigation only; saved backend payment state determines the outcome. */
export default function StripePaymentPage() {
  const { reference = "" } = useParams();
  const { user } = useAuth();
  return user ? (
    <PaymentContent
      key={`${user.id}:${reference}`}
      reference={reference}
      userId={user.id}
    />
  ) : null;
}

function PaymentContent({
  reference,
  userId,
}: {
  reference: string;
  userId: number;
}) {
  const { data, error, busy, pollingEnded, reconcile } =
    useStripePayment(reference);
  const navigate = useNavigate();
  const terminal = data && data.status !== "pending";
  useEffect(() => {
    if (!terminal) return;
    clearConfirmedAttempt(userId, reference);
    if (data.status === "completed")
      navigate(`/checkout/confirmation/${reference}`, { replace: true });
  }, [data, terminal, reference, userId, navigate]);

  return (
    <CheckoutLayout backLink={null}>
      <section
        className="bg-card space-y-5 rounded-xl border p-4 sm:p-8"
        aria-labelledby="stripe-payment-heading"
      >
        <h1 id="stripe-payment-heading" className="text-2xl sm:text-3xl">
          {terminal
            ? data.status === "completed"
              ? "Payment confirmed"
              : "Payment closed"
            : "Stripe test payment"}
        </h1>
        <p className="text-muted-foreground text-sm">
          Demo checkout in USD. No real money moves.
        </p>
        <p className="text-muted-foreground text-sm wrap-anywhere">
          Reference: {reference}
        </p>
        {error && (
          <p role="alert" className="text-destructive wrap-anywhere">
            {error}
          </p>
        )}
        {!data && !error && <p role="status">Checking your payment…</p>}
        {data?.status === "pending" && (
          <>
            <p role="status">
              {busy
                ? "Checking your payment…"
                : data.cancel_requested
                  ? "Cancellation is being checked. Funds and stock remain pending until the payment provider confirms the outcome."
                  : "Your payment has not been confirmed yet. Continue to Stripe, or check its status if you have already paid."}
            </p>
            {pollingEnded && (
              <p className="text-muted-foreground text-sm">
                Automatic status checks have paused. You can check again below.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {data.checkout_url && !data.cancel_requested && !busy && (
                <Button
                  className="min-h-11 max-w-full whitespace-normal"
                  render={<a href={data.checkout_url} />}
                  nativeButton={false}
                  role="link"
                >
                  Resume payment
                </Button>
              )}
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void reconcile()}
              >
                {busy ? "Checking…" : "Check payment status"}
              </Button>
              {!data.cancel_requested && (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => void reconcile(true)}
                >
                  Cancel payment
                </Button>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              Returning from Stripe does not cancel your payment. Use Cancel
              payment to close it safely.
            </p>
          </>
        )}
        {!data && error && (
          <Button disabled={busy} onClick={() => void reconcile()}>
            Retry payment status
          </Button>
        )}
        {terminal && data.status !== "completed" && (
          <>
            <p>
              This payment was {data.status}. Review current prices before
              starting another checkout.
            </p>
            <Button
              className="min-h-11 max-w-full whitespace-normal"
              render={<Link to="/" />}
              nativeButton={false}
              role="link"
            >
              Return to product catalog
            </Button>
          </>
        )}
        {data && data.status !== "completed" && (
          <SavedCheckoutSummary key={reference} reference={reference} />
        )}
      </section>
    </CheckoutLayout>
  );
}

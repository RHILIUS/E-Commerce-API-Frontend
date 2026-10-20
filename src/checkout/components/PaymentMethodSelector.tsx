import { Banknote, CreditCard } from "lucide-react";

import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import type { PaymentMethod } from "@/checkout/types";

/** Keep the full payment choice clickable with separate accessible labels and help. */
export function PaymentMethodSelector({
  value,
  onChange,
  disabled,
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled: boolean;
}) {
  return (
    <RadioGroup
      aria-label="Payment method"
      value={value}
      onValueChange={(value) => {
        if (value === "cod" || value === "stripe") onChange(value);
      }}
      disabled={disabled}
      className="grid gap-3 sm:grid-cols-2"
    >
      {(
        [
          {
            value: "cod",
            label: "Cash on Delivery",
            description: "Simulated order. No delivery or payment collection.",
            icon: Banknote,
          },
          {
            value: "stripe",
            label: "Card (Stripe test)",
            description: "Stripe test payment in USD. No real charge.",
            icon: CreditCard,
          },
        ] as const
      ).map(({ value, label, description, icon: Icon }) => (
        <label
          key={value}
          className="border-border has-data-checked:border-primary has-data-checked:bg-primary/5 has-focus-visible:ring-ring/50 flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-4 has-focus-visible:ring-3 has-disabled:cursor-not-allowed has-disabled:opacity-60 motion-safe:transition-colors motion-safe:duration-200"
        >
          <Icon
            aria-hidden="true"
            className="text-muted-foreground mt-0.5 size-5 shrink-0"
          />
          <span className="min-w-0 flex-1 space-y-1">
            <span
              id={`payment-${value}-label`}
              className="block text-sm font-medium"
            >
              {label}
            </span>
            <span
              id={`payment-${value}-help`}
              className="text-muted-foreground block text-sm leading-6"
            >
              {description}
            </span>
          </span>
          <RadioGroupItem
            value={value}
            aria-labelledby={`payment-${value}-label`}
            aria-describedby={`payment-${value}-help`}
            className="mt-1"
          />
        </label>
      ))}
    </RadioGroup>
  );
}

import { type SyntheticEvent, useRef, useState } from "react";

import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import AddressCountryField from "@/authentication/components/AddressCountryField";
import PhoneNumberField from "@/authentication/components/PhoneNumberField";

import { createRecipient, fetchRecipients } from "../api";
import type { Recipient, RecipientDetails } from "../types";
import { checkoutError } from "../utils/errors";

/** Show the saved address or immutable confirmation snapshot without inferring phone-country location. */
export function RecipientAddress({
  recipient,
}: {
  recipient: RecipientDetails;
}) {
  return (
    <div className="space-y-1 text-sm wrap-anywhere">
      <p className="font-semibold">{recipient.name}</p>
      <p>{recipient.phone_number}</p>
      <p className="text-muted-foreground">
        {[
          recipient.address_line1,
          recipient.address_line2,
          recipient.city,
          recipient.region,
          recipient.postal_code,
          recipient.country_code,
        ]
          .filter(Boolean)
          .join(", ")}
      </p>
    </div>
  );
}

export function RecipientSection({
  recipients,
  selected,
  onSelect,
  onRecipients,
  disabled,
}: {
  recipients: Recipient[];
  selected: Recipient | undefined;
  onSelect: (id: number) => void;
  onRecipients: (recipients: Recipient[]) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const inFlight = useRef(false);
  const save = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current) return;
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();
    inFlight.current = true;
    setBusy(true);
    setError("");
    setFields({});
    try {
      const recipient = await createRecipient({
        name: value("name"),
        phone_number: value("phoneNumber"),
        country_code: value("addressCountry"),
        address_line1: value("address_line1"),
        address_line2: value("address_line2"),
        city: value("city"),
        region: value("region"),
        postal_code: value("postal_code"),
        is_default: form.has("is_default"),
      });
      onRecipients([
        ...recipients.map((item) =>
          recipient.is_default ? { ...item, is_default: false } : item,
        ),
        recipient,
      ]);
      onSelect(recipient.id);
      setAdding(false);
      setOpen(false);
    } catch (failure) {
      const parsed = checkoutError(failure);
      setFields(parsed.fields);
      setError(parsed.message);
      if (parsed.uncertain) {
        // Recipient creation has no idempotency key: reload saved addresses before another submission.
        setAdding(false);
        try {
          onRecipients(await fetchRecipients());
        } catch {
          /* Keep the original actionable failure. */
        }
        setError(
          "The save result is unknown. Check your saved recipients before adding this address again.",
        );
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const inputs = [
    ["name", "Full name", 100, true, "name"],
    ["address_line1", "Address line 1", 150, true, "address-line1"],
    ["address_line2", "Address line 2 (optional)", 150, false, "address-line2"],
    ["city", "City", 100, true, "address-level2"],
    ["region", "Province / region (optional)", 100, false, "address-level1"],
    ["postal_code", "Postal code (optional)", 20, false, "postal-code"],
  ] as const;
  return (
    <section
      className="bg-card space-y-4 rounded-xl border p-4 sm:p-6"
      aria-labelledby="recipient-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="recipient-heading" className="text-lg">
          Recipient info
        </h2>
        <Button
          variant="outline"
          disabled={disabled}
          onClick={() => {
            setOpen(true);
            setError("");
          }}
        >
          {selected ? "Change" : "Select recipient"}
        </Button>
      </div>
      {selected ? (
        <RecipientAddress recipient={selected} />
      ) : (
        <p className="text-muted-foreground text-sm">
          Select or add a recipient before placing your order.
        </p>
      )}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) {
            setOpen(value);
            if (!value) setAdding(false);
          }
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogTitle className="pr-10">
            {adding ? "Add recipient" : "Choose recipient"}
          </DialogTitle>
          {error && (
            <p role="alert" className="text-destructive text-sm wrap-anywhere">
              {error}
            </p>
          )}
          {adding ? (
            <form onSubmit={(event) => void save(event)} className="space-y-4">
              <fieldset disabled={busy} className="min-w-0 space-y-4">
                {inputs.map(
                  ([name, label, maxLength, required, autoComplete]) => (
                    <div key={name} className="space-y-2">
                      <label
                        htmlFor={`recipient-${name}`}
                        className="text-sm font-medium"
                      >
                        {label}
                      </label>
                      <Input
                        id={`recipient-${name}`}
                        name={name}
                        required={required}
                        maxLength={maxLength}
                        autoComplete={autoComplete}
                        aria-invalid={Boolean(fields[name]) || undefined}
                        aria-describedby={
                          fields[name] ? `${name}-error` : undefined
                        }
                      />
                      {fields[name] && (
                        <p
                          id={`${name}-error`}
                          className="text-destructive text-sm"
                        >
                          {fields[name]}
                        </p>
                      )}
                    </div>
                  ),
                )}
                <AddressCountryField serverError={fields.country_code} />
                <PhoneNumberField serverError={fields.phone_number} />
                <label className="flex min-h-11 items-center gap-3 text-sm">
                  <Checkbox name="is_default" />
                  Make this my default recipient
                </label>
                <div className="flex flex-wrap gap-3">
                  <Button type="submit">
                    {busy ? "Saving…" : "Save recipient"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAdding(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </fieldset>
            </form>
          ) : (
            <>
              {recipients.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  You have no saved recipients yet.
                </p>
              )}
              <RadioGroup
                aria-label="Saved recipients"
                value={selected?.id ?? null}
                onValueChange={(id) => onSelect(Number(id))}
              >
                {recipients.map((recipient) => (
                  <label
                    key={recipient.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border p-3"
                  >
                    <RadioGroupItem className="mt-1" value={recipient.id} />
                    <div className="min-w-0">
                      <RecipientAddress recipient={recipient} />
                      {recipient.is_default && (
                        <span className="text-muted-foreground text-xs">
                          Default
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </RadioGroup>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAdding(true);
                    setError("");
                    setFields({});
                  }}
                >
                  Add recipient
                </Button>
                <Button disabled={!selected} onClick={() => setOpen(false)}>
                  Done
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

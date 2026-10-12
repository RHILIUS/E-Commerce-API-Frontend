import type { SyntheticEvent } from "react";

import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import AddressCountryField from "@/authentication/components/AddressCountryField";
import PhoneNumberField from "@/authentication/components/PhoneNumberField";

import type { Recipient } from "../types";

/** Share validated address fields between creation and editing of saved recipients. */
export function RecipientForm({
  recipient,
  busy,
  fields,
  onSubmit,
  onCancel,
}: {
  recipient?: Recipient;
  busy: boolean;
  fields: Record<string, string>;
  onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const inputs = [
    ["name", "Full name", 100, true, "name"],
    ["address_line1", "Address line 1", 150, true, "address-line1"],
    ["address_line2", "Address line 2 (optional)", 150, false, "address-line2"],
    ["city", "City", 100, true, "address-level2"],
    ["region", "Province / region (optional)", 100, false, "address-level1"],
    ["postal_code", "Postal code (optional)", 20, false, "postal-code"],
  ] as const;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <fieldset disabled={busy} className="min-w-0 space-y-4">
        {inputs.map(([name, label, maxLength, required, autoComplete]) => (
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
              autoFocus={name === "name"}
              defaultValue={recipient?.[name] ?? ""}
              required={required}
              maxLength={maxLength}
              autoComplete={autoComplete}
              aria-invalid={Boolean(fields[name]) || undefined}
              aria-describedby={fields[name] ? `${name}-error` : undefined}
            />
            {fields[name] && (
              <p id={`${name}-error`} className="text-destructive text-sm">
                {fields[name]}
              </p>
            )}
          </div>
        ))}
        <AddressCountryField
          defaultValue={recipient?.country_code}
          serverError={fields.country_code}
        />
        <PhoneNumberField
          defaultValue={recipient?.phone_number}
          serverError={fields.phone_number}
        />
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <Checkbox
            name="is_default"
            defaultChecked={recipient?.is_default}
            disabled={busy || recipient?.is_default}
            aria-invalid={Boolean(fields.is_default) || undefined}
            aria-describedby={
              fields.is_default ? "recipient-default-error" : undefined
            }
          />
          {recipient?.is_default
            ? "Default recipient"
            : "Make this my default recipient"}
        </label>
        {fields.is_default && (
          <p id="recipient-default-error" className="text-destructive text-sm">
            {fields.is_default}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" className="min-h-11">
            {busy ? "Saving…" : recipient ? "Save changes" : "Save recipient"}
          </Button>
          <Button
            type="button"
            className="min-h-11"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </fieldset>
    </form>
  );
}

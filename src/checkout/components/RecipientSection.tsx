import { type SyntheticEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";

import { createRecipient, fetchRecipients, updateRecipient } from "../api";
import type { Recipient, RecipientDetails } from "../types";
import { checkoutError } from "../utils/errors";
import { RecipientForm } from "./RecipientForm";

type RecipientView =
  { mode: "choose" } | { mode: "add" } | { mode: "edit"; recipient: Recipient };

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
  const [view, setView] = useState<RecipientView>({ mode: "choose" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const inFlight = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const returnToRecipient = useRef<number | null>(null);
  // Restore keyboard focus when the edit form returns to the saved-recipient list.
  useEffect(() => {
    if (open && view.mode === "choose" && returnToRecipient.current !== null) {
      document
        .getElementById(`edit-recipient-${returnToRecipient.current}`)
        ?.focus();
      returnToRecipient.current = null;
    }
  }, [open, view.mode]);
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
      const payload = {
        name: value("name"),
        phone_number: value("phoneNumber"),
        country_code: value("addressCountry"),
        address_line1: value("address_line1"),
        address_line2: value("address_line2"),
        city: value("city"),
        region: value("region"),
        postal_code: value("postal_code"),
        is_default:
          (view.mode === "edit" && view.recipient.is_default) ||
          form.has("is_default"),
      };
      const recipient =
        view.mode === "edit"
          ? await updateRecipient(view.recipient.id, payload)
          : await createRecipient(payload);
      onRecipients(
        view.mode === "edit"
          ? recipients.map((item) =>
              item.id === recipient.id
                ? recipient
                : recipient.is_default
                  ? { ...item, is_default: false }
                  : item,
            )
          : [
              ...recipients.map((item) =>
                recipient.is_default ? { ...item, is_default: false } : item,
              ),
              recipient,
            ],
      );
      if (view.mode === "add") {
        onSelect(recipient.id);
        setOpen(false);
      } else if (selected) {
        // Keep checkout selection stable if editing changes the saved default.
        onSelect(selected.id);
      }
      setView({ mode: "choose" });
    } catch (failure) {
      const parsed = checkoutError(failure);
      setFields(parsed.fields);
      setError(parsed.message);
      if (parsed.uncertain) {
        // Reload saved recipients to reconcile an unknown save outcome before retrying.
        setView({ mode: "choose" });
        try {
          const saved = await fetchRecipients();
          onRecipients(saved);
          if (view.mode === "edit" && selected) onSelect(selected.id);
        } catch {
          /* Keep the original actionable failure. */
        }
        setError(
          "The save result is unknown. Check your saved recipients before trying again.",
        );
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
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
          ref={triggerRef}
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
            if (!value) setView({ mode: "choose" });
          }
        }}
      >
        <DialogContent
          finalFocus={triggerRef}
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        >
          <DialogTitle className="pr-10">
            {view.mode === "edit"
              ? "Edit recipient"
              : view.mode === "add"
                ? "Add recipient"
                : "Choose recipient"}
          </DialogTitle>
          {error && (
            <p role="alert" className="text-destructive text-sm wrap-anywhere">
              {error}
            </p>
          )}
          {view.mode !== "choose" ? (
            <RecipientForm
              key={view.mode === "edit" ? view.recipient.id : "add"}
              recipient={view.mode === "edit" ? view.recipient : undefined}
              busy={busy}
              fields={fields}
              onSubmit={(event) => void save(event)}
              onCancel={() => {
                setView({ mode: "choose" });
                setError("");
                setFields({});
              }}
            />
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
                  <div
                    key={recipient.id}
                    className="flex flex-wrap items-start gap-3 rounded-lg border p-3"
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
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
                    <Button
                      id={`edit-recipient-${recipient.id}`}
                      variant="outline"
                      size="sm"
                      aria-label={`Edit ${recipient.name}`}
                      onClick={() => {
                        returnToRecipient.current = recipient.id;
                        setView({ mode: "edit", recipient });
                        setError("");
                        setFields({});
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                ))}
              </RadioGroup>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setView({ mode: "add" });
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

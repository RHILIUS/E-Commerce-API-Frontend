import { Button } from "@/app/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";

import type { Recipient } from "../types";
import { RecipientAddress } from "./RecipientAddress";

export type RecipientSelection = {
  id: number | null;
  onSelect: (id: number) => void;
};

/** Render the same address cards with optional checkout selection and account management actions. */
export function RecipientList({
  recipients,
  selection,
  disabled,
  onEdit,
  onDelete,
  onDefault,
}: {
  recipients: Recipient[];
  selection?: RecipientSelection;
  disabled: boolean;
  onEdit: (recipient: Recipient, trigger: HTMLButtonElement) => void;
  onDelete: (recipient: Recipient, trigger: HTMLButtonElement) => void;
  onDefault: (recipient: Recipient) => void;
}) {
  const cards = recipients.map((recipient) => {
    const details = (
      <div className="min-w-0 flex-1 space-y-2">
        <RecipientAddress recipient={recipient} />
        {recipient.is_default && (
          <span className="bg-secondary text-secondary-foreground inline-flex rounded-md px-2 py-1 text-xs font-medium">
            Default
          </span>
        )}
      </div>
    );
    return (
      <div
        key={recipient.id}
        className="bg-card flex min-w-0 flex-col gap-3 rounded-xl border p-4 sm:p-5"
      >
        {selection ? (
          <label className="flex min-w-0 cursor-pointer items-start gap-3">
            <RadioGroupItem
              className="mt-1"
              value={recipient.id}
              disabled={disabled}
            />
            {details}
          </label>
        ) : (
          details
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            className="min-h-11"
            variant="outline"
            disabled={disabled}
            aria-label={`Edit ${recipient.name}`}
            onClick={(event) => onEdit(recipient, event.currentTarget)}
          >
            Edit
          </Button>
          {!recipient.is_default && (
            <Button
              className="min-h-11"
              variant="ghost"
              disabled={disabled}
              aria-label={`Make ${recipient.name} default`}
              onClick={() => onDefault(recipient)}
            >
              Make default
            </Button>
          )}
          <Button
            className="min-h-11"
            variant="destructive"
            disabled={disabled}
            aria-label={`Delete ${recipient.name}`}
            onClick={(event) => onDelete(recipient, event.currentTarget)}
          >
            Delete
          </Button>
        </div>
      </div>
    );
  });
  return selection ? (
    <RadioGroup
      aria-label="Saved recipients"
      value={selection.id}
      onValueChange={(id) => selection.onSelect(Number(id))}
      className="gap-3"
    >
      {cards}
    </RadioGroup>
  ) : (
    <div className="space-y-3">{cards}</div>
  );
}

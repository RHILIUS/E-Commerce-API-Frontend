import { type RefObject, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";

import type { Recipient } from "../types";
import { RecipientAddress } from "./RecipientAddress";

/** Confirm removal and require an explicit replacement when deleting the account default. */
export function RecipientDeleteDialog({
  recipient,
  recipients,
  busy,
  error,
  onCancel,
  onConfirm,
  finalFocus,
}: {
  recipient: Recipient;
  recipients: Recipient[];
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: (replacement?: number) => void;
  finalFocus: RefObject<HTMLButtonElement | null>;
}) {
  const [replacement, setReplacement] = useState<number | null>(null);
  const others = recipients.filter((item) => item.id !== recipient.id);
  const needsReplacement = recipient.is_default && others.length > 0;
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onCancel();
      }}
    >
      <AlertDialogContent
        finalFocus={finalFocus}
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto"
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Delete recipient?</AlertDialogTitle>
          <AlertDialogDescription>
            Remove this recipient from your saved recipients. Existing orders
            and pending payments keep their delivery details.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <RecipientAddress recipient={recipient} />
        {needsReplacement && (
          <fieldset disabled={busy} className="min-w-0 space-y-3">
            <legend className="mb-3 text-sm font-medium">
              Choose a new default recipient
            </legend>
            <RadioGroup
              aria-label="New default recipient"
              value={replacement}
              onValueChange={(value) => setReplacement(Number(value))}
            >
              {others.map((item) => (
                <label
                  key={item.id}
                  className="flex min-w-0 cursor-pointer items-start gap-3 rounded-lg border p-3"
                >
                  <RadioGroupItem
                    className="mt-1"
                    value={item.id}
                    disabled={busy}
                  />
                  <RecipientAddress recipient={item} />
                </label>
              ))}
            </RadioGroup>
          </fieldset>
        )}
        {error && (
          <p role="alert" className="text-destructive text-sm wrap-anywhere">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <Button
            autoFocus
            variant="outline"
            className="min-h-11"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <AlertDialogAction
            variant="destructive"
            className="min-h-11"
            disabled={busy || (needsReplacement && replacement === null)}
            onClick={() =>
              onConfirm(needsReplacement ? replacement! : undefined)
            }
          >
            {busy ? "Deleting…" : "Delete recipient"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

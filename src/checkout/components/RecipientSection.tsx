import { useRef, useState } from "react";

import { RecipientAddress } from "@/account/components/RecipientAddress";
import { RecipientManager } from "@/account/components/RecipientManager";
import type { Recipient } from "@/account/types";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog";

/** Keep checkout selection independent from address-book defaults and deletions. */
export function RecipientSection({
  recipients,
  selected,
  onSelect,
  onRecipients,
  disabled,
}: {
  recipients: Recipient[];
  selected: Recipient | undefined;
  onSelect: (id: number | null) => void;
  onRecipients: (items: Recipient[]) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);
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
          ref={trigger}
          variant="outline"
          className="min-h-11"
          disabled={disabled}
          onClick={() => setOpen(true)}
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          finalFocus={trigger}
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        >
          <DialogTitle className="pr-10">Choose recipient</DialogTitle>
          {open && (
            <RecipientManager
              recipients={recipients}
              selection={{ id: selected?.id ?? null, onSelect }}
              onChange={(items, createdId) => {
                onRecipients(items);
                onSelect(
                  createdId ??
                    (items.some((item) => item.id === selected?.id)
                      ? selected!.id
                      : null),
                );
                if (createdId !== undefined) setOpen(false);
              }}
            />
          )}
          <Button
            className="min-h-11"
            disabled={!selected}
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}

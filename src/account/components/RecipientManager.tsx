import { MapPin, Plus } from "lucide-react";
import { type SyntheticEvent, useRef, useState } from "react";

import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog";

import { useRecipientActions } from "../hooks/useRecipientActions";
import type { Recipient } from "../types";
import { RecipientDeleteDialog } from "./RecipientDeleteDialog";
import { RecipientForm } from "./RecipientForm";
import { RecipientList, type RecipientSelection } from "./RecipientList";

type Editor = { mode: "add" } | { mode: "edit"; recipient: Recipient };

/** Shared address book: the parent owns saved data and any checkout selection. */
export function RecipientManager({
  recipients,
  onChange,
  selection,
}: {
  recipients: Recipient[];
  onChange: (items: Recipient[], createdId?: number) => void;
  selection?: RecipientSelection;
}) {
  const actions = useRecipientActions(recipients, onChange);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<Recipient | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const addButton = useRef<HTMLButtonElement | null>(null);
  const close = () => {
    setEditor(null);
    setDeleting(null);
    actions.clearError();
  };
  const save = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();
    const result = await actions.run({
      type: "save",
      id: editor?.mode === "edit" ? editor.recipient.id : undefined,
      input: {
        name: value("name"),
        phone_number: value("phoneNumber"),
        country_code: value("addressCountry"),
        address_line1: value("address_line1"),
        address_line2: value("address_line2"),
        city: value("city"),
        region: value("region"),
        postal_code: value("postal_code"),
        is_default:
          (editor?.mode === "edit" && editor.recipient.is_default) ||
          form.has("is_default"),
      },
    });
    if (result !== "failed") setEditor(null);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {recipients.length} saved{" "}
          {recipients.length === 1 ? "recipient" : "recipients"}
        </p>
        <Button
          ref={addButton}
          className="min-h-11"
          disabled={actions.busy || actions.needsReload}
          onClick={() => {
            trigger.current = addButton.current;
            actions.clearError();
            setEditor({ mode: "add" });
          }}
        >
          <Plus aria-hidden="true" />
          Add recipient
        </Button>
      </div>
      {!editor && !deleting && actions.error && (
        <p role="alert" className="text-destructive text-sm wrap-anywhere">
          {actions.error}
        </p>
      )}
      {actions.needsReload && (
        <Button
          className="min-h-11"
          variant="outline"
          disabled={actions.busy}
          onClick={() => void actions.reload()}
        >
          Reload recipients
        </Button>
      )}
      <p role="status" className="text-muted-foreground text-sm empty:hidden">
        {actions.notice}
      </p>
      {recipients.length === 0 ? (
        <div className="bg-muted/30 space-y-2 rounded-xl border border-dashed px-4 py-8 text-center">
          <MapPin
            className="text-muted-foreground mx-auto mb-3 size-7"
            aria-hidden="true"
          />
          <p className="font-medium">You have no saved recipients yet.</p>
          <p className="text-muted-foreground text-sm">
            Add a recipient to make your next checkout easier.
          </p>
        </div>
      ) : (
        <RecipientList
          recipients={recipients}
          selection={selection}
          disabled={actions.busy || actions.needsReload}
          onEdit={(recipient, button) => {
            trigger.current = button;
            actions.clearError();
            setEditor({ mode: "edit", recipient });
          }}
          onDelete={(recipient, button) => {
            trigger.current = button;
            actions.clearError();
            setDeleting(recipient);
          }}
          onDefault={(recipient) =>
            void actions.run({ type: "default", id: recipient.id })
          }
        />
      )}
      <Dialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open && !actions.busy) close();
        }}
      >
        <DialogContent
          finalFocus={trigger}
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        >
          <DialogTitle className="pr-10">
            {editor?.mode === "edit" ? "Edit recipient" : "Add recipient"}
          </DialogTitle>
          {actions.error && (
            <p role="alert" className="text-destructive text-sm wrap-anywhere">
              {actions.error}
            </p>
          )}
          {editor && (
            <RecipientForm
              key={editor.mode === "edit" ? editor.recipient.id : "new"}
              recipient={editor.mode === "edit" ? editor.recipient : undefined}
              busy={actions.busy}
              fields={actions.fields}
              onSubmit={(event) => void save(event)}
              onCancel={close}
            />
          )}
        </DialogContent>
      </Dialog>
      {deleting && (
        <RecipientDeleteDialog
          recipient={deleting}
          recipients={recipients}
          busy={actions.busy}
          error={actions.error}
          finalFocus={trigger}
          onCancel={close}
          onConfirm={(replacement) => {
            void actions
              .run({ type: "delete", id: deleting.id, replacement })
              .then((result) => {
                if (result !== "failed") {
                  trigger.current = addButton.current;
                  setDeleting(null);
                }
              });
          }}
        />
      )}
    </div>
  );
}

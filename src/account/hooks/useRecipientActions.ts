import { useRef, useState } from "react";

import { toast } from "@/app/lib/toast";

import {
  createRecipient,
  deleteRecipient,
  fetchRecipients,
  updateRecipient,
} from "../api/recipientApi";
import type { Recipient, RecipientInput } from "../types";
import { recipientError } from "../utils/recipientError";

type Action =
  | { type: "save"; id?: number; input: RecipientInput }
  | { type: "default"; id: number }
  | { type: "delete"; id: number; replacement?: number };

/** Share mutation locking, validation and uncertain-result reconciliation across both recipient views. */
export function useRecipientActions(
  recipients: Recipient[],
  onChange: (items: Recipient[], createdId?: number) => void,
) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [needsReload, setNeedsReload] = useState(false);
  const inFlight = useRef(false);
  const clearError = () => {
    setError("");
    setFields({});
  };
  const reload = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      onChange(await fetchRecipients());
      setNeedsReload(false);
      setError(
        "The previous result was unconfirmed. Review your saved recipients before trying again.",
      );
    } catch {
      setError(
        "We couldn't reload your recipients. Reload before making more changes.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const run = async (
    action: Action,
  ): Promise<"saved" | "reconciled" | "failed"> => {
    if (inFlight.current || needsReload) return "failed";
    inFlight.current = true;
    setBusy(true);
    clearError();
    try {
      if (action.type === "delete") {
        onChange(await deleteRecipient(action.id, action.replacement));
        toast.add({
          id: "recipient-deleted",
          type: "success",
          title: "Recipient deleted.",
        });
      } else {
        const saved =
          action.type === "default"
            ? await updateRecipient(action.id, { is_default: true })
            : action.id === undefined
              ? await createRecipient(action.input)
              : await updateRecipient(action.id, action.input);
        const items = recipients
          .filter((item) => item.id !== saved.id)
          .map((item) =>
            saved.is_default ? { ...item, is_default: false } : item,
          );
        items.push(saved);
        items.sort(
          (a, b) => Number(b.is_default) - Number(a.is_default) || a.id - b.id,
        );
        onChange(
          items,
          action.type === "save" && action.id === undefined
            ? saved.id
            : undefined,
        );
        toast.add({
          id: "recipient-saved",
          type: "success",
          title:
            action.type === "default"
              ? "Default recipient updated."
              : action.id === undefined
                ? "Recipient added."
                : "Recipient updated.",
        });
      }
      return "saved";
    } catch (failure) {
      const parsed = recipientError(failure);
      setFields(parsed.fields);
      setError(parsed.message);
      if (parsed.uncertain) {
        try {
          onChange(await fetchRecipients());
        } catch {
          setNeedsReload(true);
        }
        setError(
          "The save result is unknown. Check your saved recipients before trying again.",
        );
        return "reconciled";
      }
      return "failed";
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return { busy, error, fields, needsReload, run, reload, clearError };
}

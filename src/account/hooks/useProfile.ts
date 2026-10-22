import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/authentication/contexts/Auth/useAuth";

import { fetchProfile, saveProfile } from "../api/profileApi";
import type { Profile, ProfileInput } from "../types";
import { profileError } from "../utils/profileError";

/** Own profile loading, saves, and authentication updates for one mounted account. */
export function useProfile() {
  const { setUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const inFlight = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) {
          setProfile(value);
          setLoadError("");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setLoadError("We couldn't load your profile. Please try again.");
      });
    return () => controller.abort();
  }, [attempt]);

  const accept = (value: Profile) => {
    setProfile(value);
    setRevision((current) => current + 1);
    setUser((current) =>
      current?.id === value.id
        ? {
            ...current,
            fullName: value.full_name,
            address_country_code: value.address?.country_code ?? null,
          }
        : current,
    );
  };
  const clearFeedback = () => {
    setFields({});
    setMessage("");
    setNotice("");
  };
  const save = async (input: ProfileInput) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    clearFeedback();
    try {
      accept(await saveProfile(input));
      setNotice("Profile saved.");
    } catch (error) {
      const parsed = profileError(error);
      setFields(parsed.fields);
      setMessage(parsed.message);
      if (parsed.uncertain) {
        try {
          accept(await fetchProfile());
          setMessage(
            "We couldn't confirm the save. Your current profile has been reloaded; review it before saving again.",
          );
        } catch {
          setMessage(
            "We couldn't confirm the save or reload your profile. Your draft is preserved; try again when connected.",
          );
        }
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return {
    profile,
    loadError,
    busy,
    fields,
    message,
    notice,
    revision,
    save,
    retry: () => {
      setLoadError("");
      setAttempt((current) => current + 1);
    },
    cancel: () => {
      if (!inFlight.current) {
        clearFeedback();
        setRevision((current) => current + 1);
      }
    },
  };
}

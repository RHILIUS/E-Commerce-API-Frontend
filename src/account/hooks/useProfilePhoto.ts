import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";

import { toast } from "@/app/lib/toast";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";

import {
  fetchProfilePhoto,
  removeProfilePhoto,
  saveProfilePhoto,
} from "../api/profilePhotoApi";
import type { PhotoCrop, ProfilePhoto } from "../types";

/** Own independent photo requests, preserving the personal-details form's draft. */
export function useProfilePhoto() {
  const { user, setUser } = useAuth();
  const userId = user?.id;
  const [photo, setPhoto] = useState<ProfilePhoto | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const inFlight = useRef(false);
  const mounted = useRef(false);

  // Accept confirmed server photo data without changing another account's session.
  const accept = useCallback(
    (value: ProfilePhoto) => {
      setPhoto(value);
      setUser((current) =>
        current && current.id === userId
          ? { ...current, profile_image: value.profile_image }
          : current,
      );
    },
    [setUser, userId],
  );

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    fetchProfilePhoto(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) accept(value);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("We couldn't load your photo. Please try again.");
      });
    return () => {
      mounted.current = false;
      controller.abort();
    };
  }, [attempt, accept]);

  const update = async (
    operation: () => Promise<ProfilePhoto>,
    message: string,
  ) => {
    if (inFlight.current) return "failed";
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const value = await operation();
      if (mounted.current) {
        accept(value);
        toast.add({
          id: "profile-photo-updated",
          type: "success",
          title: message,
        });
      }
      return "saved";
    } catch (cause) {
      if (!mounted.current) return "failed";
      const response = axios.isAxiosError(cause) ? cause.response : undefined;
      if (!response || response.status >= 500) {
        try {
          const value = await fetchProfilePhoto();
          if (mounted.current) {
            accept(value);
            setError(
              "We couldn't confirm the change. Your current photo has been reloaded; review it before trying again.",
            );
          }
        } catch {
          if (mounted.current) {
            setPhoto(null);
            setError(
              "We couldn't confirm the change or reload your photo. Try again when connected.",
            );
          }
        }
        return "review";
      } else {
        const data: unknown = response.data;
        const messages =
          data && typeof data === "object"
            ? Object.values(data).flatMap((value) =>
                Array.isArray(value)
                  ? value.filter(
                      (item): item is string => typeof item === "string",
                    )
                  : [],
              )
            : [];
        setError(
          messages.join(" ") ||
            "We couldn't save your photo. Please try again.",
        );
        if (
          response.status === 400 &&
          data &&
          typeof data === "object" &&
          "source_id" in data
        ) {
          try {
            const value = await fetchProfilePhoto();
            if (mounted.current) accept(value);
          } catch {
            if (mounted.current) setPhoto(null);
          }
          return "review";
        }
      }
      return "failed";
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  return {
    photo,
    error,
    busy,
    clearFeedback: () => {
      setError("");
    },
    retry: () => {
      setError("");
      setAttempt((value) => value + 1);
    },
    save: (crop: PhotoCrop, image?: File, sourceId?: string) =>
      update(() => saveProfilePhoto(crop, image, sourceId), "Photo saved."),
    remove: () => update(removeProfilePhoto, "Photo removed."),
  };
}

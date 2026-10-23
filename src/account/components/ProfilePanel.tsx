import { type SyntheticEvent, useEffect, useId, useRef, useState } from "react";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Skeleton } from "@/app/components/ui/skeleton";
import AddressCountryField from "@/authentication/components/AddressCountryField";
import PhoneNumberField from "@/authentication/components/PhoneNumberField";

import { useProfile } from "../hooks/useProfile";
import type { Profile, ProfileInput } from "../types";
import { ProfilePhotoManager } from "./ProfilePhotoManager";

/** Compose the editable personal profile, leaving delivery recipients independent. */
export function ProfilePanel() {
  const state = useProfile();
  return (
    <section
      className="bg-card space-y-6 rounded-xl border p-4 sm:p-6"
      aria-labelledby="profile-heading"
    >
      <div className="space-y-1">
        <h2 id="profile-heading" className="text-xl">
          Profile
        </h2>
        <p className="text-muted-foreground text-sm">
          Manage your personal details and address.
        </p>
      </div>
      <ProfilePhotoManager />
      {state.loadError ? (
        <div role="alert" className="space-y-3">
          <p className="text-destructive">{state.loadError}</p>
          <Button variant="outline" onClick={state.retry} className="min-h-11">
            Try again
          </Button>
        </div>
      ) : !state.profile ? (
        <div role="status" className="space-y-4">
          <span className="sr-only">Loading profile…</span>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : (
        <ProfileForm
          key={state.revision}
          profile={state.profile}
          busy={state.busy}
          fields={state.fields}
          onSubmit={state.save}
          onCancel={state.cancel}
        />
      )}
      {state.message && (
        <p role="alert" className="text-destructive text-sm">
          {state.message}
        </p>
      )}
    </section>
  );
}

// Remount after save/cancel so all fields, including country pickers, use the saved values.
function ProfileForm({
  profile,
  busy,
  fields,
  onSubmit,
  onCancel,
}: {
  profile: Profile;
  busy: boolean;
  fields: Record<string, string>;
  onSubmit: (input: ProfileInput) => Promise<void>;
  onCancel: () => void;
}) {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const baseline = useRef("");
  const [dirty, setDirty] = useState(false);

  // Compare submitted values so reverting an edit also clears the unsaved state.
  const checkChanges = () => {
    queueMicrotask(() => {
      if (formRef.current)
        setDirty(
          JSON.stringify([...new FormData(formRef.current)]) !==
            baseline.current,
        );
    });
  };
  useEffect(() => {
    if (formRef.current)
      baseline.current = JSON.stringify([...new FormData(formRef.current)]);
  }, []);
  useEffect(() => {
    if (!busy && Object.keys(fields).length)
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
  }, [fields, busy]);
  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? "").trim();
    void onSubmit({
      full_name: value("full_name"),
      phone_number: value("phoneNumber"),
      address: {
        country_code: value("addressCountry"),
        address_line1: value("address_line1"),
        address_line2: value("address_line2"),
        city: value("city"),
        region: value("region"),
        postal_code: value("postal_code"),
      },
    });
  };
  const input = (
    name: string,
    label: string,
    defaultValue: string,
    maxLength: number,
    required: boolean,
    autoComplete: string,
  ) => (
    <div className="min-w-0 space-y-2" key={name}>
      <label htmlFor={`${id}-${name}`} className="block text-sm font-medium">
        {label}
      </label>
      <Input
        id={`${id}-${name}`}
        name={name}
        defaultValue={defaultValue}
        className="h-11"
        required={required}
        maxLength={maxLength}
        autoComplete={autoComplete}
        aria-invalid={Boolean(fields[name]) || undefined}
        aria-describedby={fields[name] ? `${id}-${name}-error` : undefined}
      />
      {fields[name] && (
        <p id={`${id}-${name}-error`} className="text-destructive text-sm">
          {fields[name]}
        </p>
      )}
    </div>
  );
  return (
    <form
      ref={formRef}
      onChange={checkChanges}
      onSubmit={submit}
      aria-busy={busy}
      className="space-y-6"
    >
      <div className="flex min-w-0 items-center gap-4">
        <dl className="min-w-0 space-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Username</dt>
            <dd className="font-medium wrap-anywhere">{profile.username}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="wrap-anywhere">{profile.email}</dd>
          </div>
        </dl>
      </div>
      <p className="text-muted-foreground text-xs">
        Username and email are read-only.
      </p>
      <fieldset disabled={busy} className="min-w-0 space-y-6">
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Personal information</h3>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {input(
              "full_name",
              "Full name",
              profile.full_name,
              100,
              true,
              "name",
            )}
            <PhoneNumberField
              defaultValue={profile.phone_number}
              serverError={fields.phone_number}
              onValueChange={checkChanges}
            />
          </div>
        </div>
        <div className="space-y-4 border-t pt-6">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Personal address</h3>
            <p className="text-muted-foreground text-sm">
              Updating this address won't change your saved recipients.
            </p>
          </div>
          <AddressCountryField
            defaultValue={profile.address?.country_code}
            serverError={fields.country_code}
            onValueChange={checkChanges}
          />
          {input(
            "address_line1",
            "Address line 1",
            profile.address?.address_line1 ?? "",
            150,
            true,
            "address-line1",
          )}
          {input(
            "address_line2",
            "Address line 2 (optional)",
            profile.address?.address_line2 ?? "",
            150,
            false,
            "address-line2",
          )}
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            {input(
              "city",
              "City",
              profile.address?.city ?? "",
              100,
              true,
              "address-level2",
            )}
            {input(
              "region",
              "Province / region (optional)",
              profile.address?.region ?? "",
              100,
              false,
              "address-level1",
            )}
            {input(
              "postal_code",
              "Postal code (optional)",
              profile.address?.postal_code ?? "",
              20,
              false,
              "postal-code",
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 border-t pt-5">
          <Button type="submit" disabled={!dirty} className="min-h-11">
            {busy ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={!dirty}
            className="min-h-11"
          >
            Discard changes
          </Button>
        </div>
      </fieldset>
    </form>
  );
}

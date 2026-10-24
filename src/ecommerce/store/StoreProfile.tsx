import { Expand, MapPin, Store as StoreIcon } from "lucide-react";
import { type ReactNode, useState } from "react";

import { ImageViewer } from "@/app/components/ImageViewer";

import type { PublicStore } from "./types";

// Format only the store's business address; account addresses are never used.
const storeAddress = (address: PublicStore["address"]) =>
  address
    ? [
        address.address_line1,
        address.address_line2,
        address.city,
        address.region,
        address.postal_code,
        new Intl.DisplayNames(["en"], { type: "region" }).of(
          address.country_code,
        ),
      ]
        .filter(Boolean)
        .join(", ")
    : "Not provided";

/** Open one available store image in the same fit-to-screen viewer as ProductPage. */
const StoreImageViewer = ({
  src,
  alt,
  label,
  fallback,
  showExpandIcon = true,
}: {
  src: string | null;
  alt: string;
  label: string;
  fallback: ReactNode;
  showExpandIcon?: boolean;
}) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return fallback;
  return (
    <ImageViewer
      src={src}
      alt={alt}
      title={`${alt} — full image`}
      trigger={
        <button
          type="button"
          aria-label={`View full ${label}`}
          className="focus-visible:ring-ring relative block size-full cursor-zoom-in outline-none focus-visible:ring-3 focus-visible:ring-inset"
        >
          <img
            src={src}
            alt={alt}
            className="size-full object-cover"
            onError={() => setFailed(true)}
          />
          {showExpandIcon && (
            <span className="bg-background/90 text-foreground absolute right-3 bottom-3 rounded-md border p-2">
              <Expand className="size-5" aria-hidden="true" />
            </span>
          )}
        </button>
      }
    />
  );
};

/** Render store branding with placeholders for absent or failed image loads. */
export const StoreProfile = ({ store }: { store: PublicStore }) => {
  return (
    <section
      aria-label="Store details"
      className="bg-card overflow-hidden rounded-xl border"
    >
      <div className="bg-muted flex h-32 items-center justify-center sm:h-48 lg:h-60">
        <StoreImageViewer
          key={store.banner_image}
          src={store.banner_image}
          alt={`${store.name} cover`}
          label="store banner"
          fallback={
            <StoreIcon
              className="text-muted-foreground size-12"
              aria-label="No store cover provided"
            />
          }
        />
      </div>
      <div className="flex min-w-0 flex-col gap-5 p-4 sm:flex-row sm:items-start sm:p-6 lg:p-8">
        <div className="bg-muted flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border sm:size-28">
          <StoreImageViewer
            key={store.profile_image}
            src={store.profile_image}
            alt={`${store.name} logo`}
            label="store logo"
            showExpandIcon={false}
            fallback={
              <span
                className="text-muted-foreground text-2xl font-semibold"
                aria-label="Store logo placeholder"
              >
                {store.name
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((word) => word[0])
                  .join("")
                  .toUpperCase() || "—"}
              </span>
            }
          />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight wrap-anywhere sm:text-3xl">
            {store.name || "Not provided"}
          </h1>
          <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Products listed</dt>
              <dd className="mt-1 font-semibold">
                {store.listed_product_count.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Units ordered</dt>
              <dd className="mt-1 font-semibold">
                {store.items_ordered.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Store created</dt>
              <dd className="mt-1 font-semibold">
                <time dateTime={store.created_at}>
                  {new Intl.DateTimeFormat("en", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(new Date(store.created_at))}
                </time>
              </dd>
            </div>
          </dl>
          <p className="text-muted-foreground flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 wrap-anywhere">
              {storeAddress(store.address)}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

/** Show only explicitly public business details, without identifying store members. */
export const StoreAbout = ({ store }: { store: PublicStore }) => (
  <section className="max-w-3xl space-y-6">
    <h2 className="text-xl font-semibold">About this store</h2>
    <p className="text-muted-foreground wrap-anywhere whitespace-pre-wrap">
      {store.description || "Not provided"}
    </p>
    <dl className="grid gap-6 sm:grid-cols-2">
      <div className="min-w-0">
        <dt className="font-medium">Public email</dt>
        <dd className="text-muted-foreground mt-2 wrap-anywhere">
          {store.public_email ? (
            <a
              className="text-primary underline underline-offset-4"
              href={`mailto:${store.public_email}`}
            >
              {store.public_email}
            </a>
          ) : (
            "Not provided"
          )}
        </dd>
      </div>
      <div className="min-w-0">
        <dt className="font-medium">Public phone</dt>
        <dd className="text-muted-foreground mt-2 wrap-anywhere">
          {store.public_phone || "Not provided"}
        </dd>
      </div>
      <div className="min-w-0 sm:col-span-2">
        <dt className="font-medium">Store address</dt>
        <dd className="text-muted-foreground mt-2 wrap-anywhere">
          {storeAddress(store.address)}
        </dd>
      </div>
    </dl>
  </section>
);

import { ImageOff, Store } from "lucide-react";
import { useState } from "react";

/** Keep receipt and preview images usable when media is missing or fails to load. */
export function CheckoutImage({
  src,
  alt,
  store = false,
}: {
  src?: string | null;
  alt: string;
  store?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return (
    <div
      className={`bg-muted text-muted-foreground flex shrink-0 items-center justify-center overflow-hidden ${store ? "size-11 rounded-full" : "size-16 rounded-lg sm:size-20"}`}
    >
      {src && src !== failedSrc ? (
        <img
          src={src}
          alt={alt}
          onError={() => setFailedSrc(src)}
          className="size-full object-cover"
        />
      ) : store ? (
        <Store className="size-5" aria-hidden="true" />
      ) : (
        <ImageOff className="size-6" aria-hidden="true" />
      )}
    </div>
  );
}

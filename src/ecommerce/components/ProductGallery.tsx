import { Expand } from "lucide-react";
import { useState } from "react";

import { ImageViewer } from "@/app/components/ImageViewer";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";
import type { ProductDetailImage } from "@/ecommerce/types";

/** Keep failed media readable without replacing it with another product's image. */
const GalleryImage = ({
  image,
  name,
  archived,
  contain = false,
}: {
  image: ProductDetailImage;
  name: string;
  archived: boolean;
  contain?: boolean;
}) => {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <span className="text-muted-foreground flex size-full items-center justify-center p-2 text-center text-xs">
      Image unavailable
    </span>
  ) : (
    <img
      src={image.image}
      alt={image.alt_text || name}
      onError={() => setFailed(true)}
      className={cn(
        "size-full",
        contain ? "object-contain" : "object-cover",
        archived && "grayscale",
      )}
    />
  );
};

/** Select the marked default, retain API ordering, and scroll long thumbnail lists. */
export const ProductGallery = ({
  images,
  name,
  archived,
}: {
  images: ProductDetailImage[];
  name: string;
  archived: boolean;
}) => {
  const [selectedId, setSelectedId] = useState(
    () => (images.find((image) => image.is_default) ?? images[0])?.id,
  );
  const selected = images.find((image) => image.id === selectedId) ?? images[0];
  return (
    <section
      aria-label="Product images"
      className="flex min-w-0 flex-col gap-4"
    >
      <div className="bg-muted relative aspect-154/116 overflow-hidden rounded-lg border">
        {selected ? (
          <ImageViewer
            src={selected.image}
            alt={selected.alt_text || name}
            title={`${name} — full image`}
            imageClassName={archived ? "grayscale" : undefined}
            trigger={
              <button
                type="button"
                aria-label="Expand product image"
                className="focus-visible:ring-ring absolute inset-0 block size-full cursor-zoom-in outline-none focus-visible:ring-3 focus-visible:ring-inset"
              >
                <GalleryImage
                  key={selected.image}
                  image={selected}
                  name={name}
                  archived={archived}
                  contain
                />
                <span className="bg-background/90 text-foreground absolute right-3 bottom-3 rounded-md border p-2">
                  <Expand className="size-5" aria-hidden="true" />
                </span>
              </button>
            }
          >
            {archived && (
              <span className="bg-background pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg border p-4 font-semibold">
                ARCHIVED
              </span>
            )}
          </ImageViewer>
        ) : (
          <p className="text-muted-foreground flex h-full items-center justify-center text-sm">
            No image available
          </p>
        )}
        {archived && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="bg-background w-44 rounded-lg border p-4 text-center font-semibold">
              ARCHIVED
            </span>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div
          aria-label="Choose a product image"
          className="-m-1 flex gap-3 overflow-x-auto p-1"
        >
          {images.map((image, index) => (
            <Button
              key={image.id}
              variant="outline"
              aria-label={`View image ${index + 1}`}
              aria-pressed={selected?.id === image.id}
              onClick={() => setSelectedId(image.id)}
              className={cn(
                "size-18 shrink-0 overflow-hidden rounded-md p-1",
                selected?.id === image.id && "border-primary border-2",
              )}
            >
              <span className="size-full overflow-hidden rounded-md">
                <GalleryImage
                  image={image}
                  name={image.alt_text || `${name}, image ${index + 1}`}
                  archived={archived}
                />
              </span>
            </Button>
          ))}
        </div>
      )}
      {selected && (
        <p
          aria-live="polite"
          className="text-muted-foreground min-h-6 text-xs leading-4"
        >
          Product image · {images.indexOf(selected) + 1} of {images.length}
        </p>
      )}
    </section>
  );
};

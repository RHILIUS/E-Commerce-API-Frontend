import { type ReactElement, type ReactNode, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { cn } from "@/app/lib/utils";

type ImageViewerProps = {
  src: string;
  alt: string;
  title: string;
  trigger: ReactElement;
  imageClassName?: string;
  children?: ReactNode;
};

/** Preview media in place with an exposed dismissible backdrop and accessible dialog controls. */
export function ImageViewer({
  src,
  alt,
  title,
  trigger,
  imageClassName,
  children,
}: ImageViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent
        ref={viewerRef}
        initialFocus={viewerRef}
        className="w-[calc(100%-2rem)] max-w-5xl gap-0 rounded-none border-0 bg-transparent p-0 shadow-none"
        backdropClassName="bg-foreground/30 backdrop-blur-md dark:bg-background/75"
        closeButtonClassName="sr-only size-px p-0 focus:not-sr-only focus:absolute focus:top-2 focus:right-2 focus:size-11 focus:rounded-full focus:bg-background/90"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="relative min-h-0 min-w-0 overflow-hidden rounded-md">
          {failedSource === src ? (
            <p className="bg-background/90 text-muted-foreground flex min-h-40 items-center justify-center px-8 text-sm">
              Image unavailable
            </p>
          ) : (
            <img
              src={src}
              alt={alt}
              onError={() => setFailedSource(src)}
              className={cn(
                "block h-auto max-h-[calc(100dvh-3rem)] w-full object-contain",
                imageClassName,
              )}
            />
          )}
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

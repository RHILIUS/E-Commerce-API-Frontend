import { UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

import { ImageViewer } from "@/app/components/ImageViewer";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Slider } from "@/app/components/ui/slider";

import { useProfilePhoto } from "../hooks/useProfilePhoto";
import type { PhotoCrop } from "../types";

type PhotoEditorSource = {
  url: string;
  file?: File;
  crop: PhotoCrop | null;
  sourceId?: string;
};

/** Manage photo changes independently so personal-detail drafts stay mounted. */
export function ProfilePhotoManager() {
  const state = useProfilePhoto();
  const picker = useRef<HTMLInputElement>(null);
  const [editor, setEditor] = useState<PhotoEditorSource | null>(null);
  const [removing, setRemoving] = useState(false);
  const [fileError, setFileError] = useState("");
  const [failedImage, setFailedImage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (editor?.file) URL.revokeObjectURL(editor.url);
    };
  }, [editor]);

  const choose = (file?: File) => {
    setFileError("");
    state.clearFeedback();
    if (!file) return;
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
      setFileError("Choose a static JPEG, PNG, or WebP image.");
    } else if (file.size > 5 * 1024 * 1024) {
      setFileError("Choose an image no larger than 5 MB.");
    } else {
      setEditor({ url: URL.createObjectURL(file), file, crop: null });
    }
  };

  return (
    <section aria-label="Profile photo" className="space-y-3 border-b pb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="bg-muted flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full">
          {!state.photo && !state.error ? (
            <Skeleton className="size-full" />
          ) : state.photo?.profile_image &&
            failedImage !== state.photo.profile_image ? (
            <ImageViewer
              src={state.photo.profile_image}
              alt="Your profile"
              title="Your profile photo"
              trigger={
                <button
                  type="button"
                  aria-label="View profile photo"
                  className="focus-visible:ring-ring size-full cursor-zoom-in rounded-full outline-none focus-visible:ring-3 focus-visible:ring-inset"
                >
                  <img
                    src={state.photo.profile_image}
                    alt="Your profile"
                    className="size-full object-cover"
                    onError={() =>
                      setFailedImage(state.photo?.profile_image ?? null)
                    }
                  />
                </button>
              }
            />
          ) : (
            <UserRound
              className="text-muted-foreground size-9"
              aria-hidden="true"
            />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="text-base font-semibold">Profile photo</h3>
          <p className="text-muted-foreground text-sm">
            JPEG, PNG, or WebP. Maximum 5 MB. Static images only. Photo changes
            save separately from your personal details.
          </p>
          {state.photo && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={state.busy}
                onClick={() => picker.current?.click()}
              >
                {state.photo.profile_image ? "Change photo" : "Upload photo"}
              </Button>
              {state.photo.original_image && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={state.busy}
                    onClick={() => {
                      state.clearFeedback();
                      setEditor({
                        url: state.photo!.original_image!,
                        crop: state.photo!.crop,
                        sourceId: state.photo!.source_id,
                      });
                    }}
                  >
                    Adjust crop
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={state.busy}
                    onClick={() => {
                      state.clearFeedback();
                      setRemoving(true);
                    }}
                  >
                    Remove photo
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <Input
        ref={picker}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Choose profile photo"
        className="hidden"
        tabIndex={-1}
        onChange={(event) => {
          choose(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {fileError && (
        <p role="alert" className="text-destructive text-sm">
          {fileError}
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      {!state.photo && state.error && (
        <Button type="button" variant="outline" onClick={state.retry}>
          Reload photo
        </Button>
      )}
      <Dialog
        open={Boolean(editor)}
        onOpenChange={(open) => {
          if (!open && !state.busy) setEditor(null);
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:p-6">
          <DialogTitle>Edit profile photo</DialogTitle>
          {editor && (
            <PhotoEditor
              key={editor.url}
              source={editor}
              busy={state.busy}
              error={state.error}
              onCancel={() => setEditor(null)}
              onSave={async (crop) => {
                if (
                  (await state.save(crop, editor.file, editor.sourceId)) !==
                  "failed"
                )
                  setEditor(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={removing}
        onOpenChange={(open) => {
          if (!state.busy) setRemoving(open);
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogTitle>Remove profile photo?</DialogTitle>
          <p className="text-sm">
            Your photo and its saved original will be removed. Your personal
            details will stay as they are.
          </p>
          {state.error && (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="destructive"
              disabled={state.busy}
              onClick={async () => {
                if ((await state.remove()) !== "failed") setRemoving(false);
              }}
            >
              {state.busy ? "Removing…" : "Remove photo"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={state.busy}
              onClick={() => setRemoving(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// Keep editor positioning local; the backend applies normalized coordinates to the source.
function PhotoEditor({
  source,
  busy,
  error,
  onSave,
  onCancel,
}: {
  source: PhotoEditorSource;
  busy: boolean;
  error: string;
  onSave: (crop: PhotoCrop) => Promise<void>;
  onCancel: () => void;
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [imageError, setImageError] = useState(false);
  const initial = source.crop
    ? {
        x: source.crop.x * 100,
        y: source.crop.y * 100,
        width: source.crop.width * 100,
        height: source.crop.height * 100,
      }
    : undefined;
  return (
    <div className="min-w-0 space-y-4">
      <p className="text-muted-foreground text-sm">
        Drag to position your photo, or focus the crop area and use the arrow
        keys. Use Zoom to adjust the square crop.
      </p>
      <div
        className="bg-muted relative aspect-square w-full overflow-hidden rounded-md"
        aria-label="Square photo crop"
      >
        <Cropper
          image={source.url}
          crop={position}
          zoom={zoom}
          aspect={1}
          cropShape="rect"
          maxZoom={3}
          initialCroppedAreaPercentages={initial}
          onCropChange={(value) => {
            if (!busy) setPosition(value);
          }}
          onZoomChange={(value) => {
            if (!busy) setZoom(value);
          }}
          onCropComplete={setArea}
          onCropAreaChange={setArea}
          onMediaLoaded={() => setImageError(false)}
          onTouchRequest={() => !busy}
          onWheelRequest={() => !busy}
          style={{
            containerStyle: { pointerEvents: busy ? "none" : undefined },
            cropAreaStyle: {
              borderColor: "var(--border)",
              boxShadow:
                "0 0 0 9999px color-mix(in oklab, var(--background) 75%, transparent)",
            },
          }}
          mediaProps={{ onError: () => setImageError(true) }}
          cropperProps={{
            "aria-label": "Position photo",
            "aria-disabled": busy,
            tabIndex: busy ? -1 : 0,
          }}
        />
      </div>
      <fieldset disabled={busy} className="space-y-3">
        <label htmlFor="profile-photo-zoom" className="text-sm font-medium">
          Zoom
        </label>
        <Slider
          id="profile-photo-zoom"
          aria-label="Zoom"
          min={1}
          max={3}
          step={0.01}
          value={[zoom]}
          onValueChange={(value) =>
            setZoom(Array.isArray(value) ? value[0] : value)
          }
          disabled={busy}
        />
        <div className="flex items-center gap-4">
          <div
            className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-full"
            role="img"
            aria-label="Circular photo preview"
          >
            {area && !imageError && (
              <img
                src={source.url}
                alt=""
                className="absolute max-w-none"
                style={{
                  width: `${10000 / area.width}%`,
                  height: `${10000 / area.height}%`,
                  left: `${(-100 * area.x) / area.width}%`,
                  top: `${(-100 * area.y) / area.height}%`,
                }}
              />
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Your photo appears in a circle.
          </p>
        </div>
        {imageError && (
          <p role="alert" className="text-destructive text-sm">
            This image couldn't be loaded. Choose another photo or try again.
          </p>
        )}
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            disabled={!area || imageError || busy}
            onClick={() => {
              if (area)
                void onSave({
                  x: area.x / 100,
                  y: area.y / 100,
                  width: area.width / 100,
                  height: area.height / 100,
                });
            }}
          >
            {busy ? "Saving photo…" : "Save photo"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </fieldset>
    </div>
  );
}

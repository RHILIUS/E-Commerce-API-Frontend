import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { CircleCheck, X } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { toast } from "@/app/lib/toast";

// Adapt shadcn's Base UI toast renderer to the local theme and touch targets.
function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();

  return toasts.map((item) => (
    <ToastPrimitive.Root
      key={item.id}
      toast={item}
      swipeDirection="right"
      data-slot="toast"
      className="bg-popover text-popover-foreground focus-visible:border-ring focus-visible:ring-ring/50 pointer-events-auto absolute right-0 bottom-0 z-[calc(1000-var(--toast-index))] h-(--height) w-full origin-bottom [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-index)*var(--peek)*-1-var(--shrink)*var(--height)))_scale(var(--scale))] rounded-2xl border shadow-lg outline-none select-none [--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+var(--toast-index)*var(--gap)*-1)] [--peek:0.75rem] [--scale:calc(max(0,1-var(--toast-index)*0.1))] [--shrink:calc(1-var(--scale))] [transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms] after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full focus-visible:ring-3 data-ending-style:translate-x-[150%] data-ending-style:opacity-0 data-expanded:h-(--toast-height) data-expanded:[transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))] data-limited:pointer-events-none data-limited:opacity-0 data-starting-style:translate-y-[150%] motion-reduce:transition-none"
    >
      <ToastPrimitive.Content className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 overflow-hidden p-3 transition-opacity data-behind:opacity-0 data-expanded:opacity-100 motion-reduce:transition-none">
        {item.type === "success" && (
          <CircleCheck className="size-5" aria-hidden="true" />
        )}
        <div className="col-start-2 min-w-0">
          <ToastPrimitive.Title className="text-sm font-medium tracking-normal wrap-anywhere" />
          <ToastPrimitive.Description className="text-muted-foreground text-sm wrap-anywhere" />
        </div>
        <ToastPrimitive.Close
          aria-label="Close notification"
          render={<Button variant="ghost" size="icon" className="size-11" />}
        >
          <X aria-hidden="true" />
        </ToastPrimitive.Close>
        <ToastPrimitive.Action
          className="col-start-2 h-auto min-h-11 w-fit max-w-full whitespace-normal"
          render={<Button variant="outline" size="sm" />}
        />
      </ToastPrimitive.Content>
    </ToastPrimitive.Root>
  ));
}

/** Render accessible, dismissible notifications without interrupting page focus. */
export function Toaster() {
  return (
    <ToastPrimitive.Provider toastManager={toast} timeout={8000}>
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport
          data-slot="toast-viewport"
          className="pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto w-auto max-w-sm outline-none sm:right-4 sm:left-auto sm:mx-0 sm:w-full"
        >
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  );
}

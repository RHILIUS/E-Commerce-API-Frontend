import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";

export type ThemeOrigin = { x: number; y: number };

type PendingTransition = {
  transition?: ViewTransition;
  timer?: ReturnType<typeof setTimeout>;
};

// Remove all per-click styling so subsequent transitions start from a clean root.
function resetStyles() {
  const root = document.documentElement;
  root.classList.remove("theme-reveal", "theme-fade");
  for (const property of [
    "--theme-reveal-x",
    "--theme-reveal-y",
    "--theme-reveal-radius",
  ]) {
    root.style.removeProperty(property);
  }
}

/** Animate explicit theme choices without leaving snapshots or timers behind. */
export function useThemeTransition() {
  const pending = useRef<PendingTransition | null>(null);

  // Clear only the current run; an older transition may finish after another click.
  function clear(run: PendingTransition) {
    if (pending.current !== run) return;
    clearTimeout(run.timer);
    resetStyles();
    pending.current = null;
  }

  useEffect(
    () => () => {
      const run = pending.current;
      if (!run) return;
      pending.current = null;
      run.transition?.skipTransition();
      clearTimeout(run.timer);
      resetStyles();
    },
    [],
  );

  return (update: () => void, origin?: ThemeOrigin) => {
    const previous = pending.current;
    if (previous) {
      previous.transition?.skipTransition();
      clear(previous);
    }
    if (!origin || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      update();
      return;
    }

    const root = document.documentElement;
    const run: PendingTransition = {};
    pending.current = run;
    let committed = false;
    // A skipped or failed snapshot must never lose or replay a preference change.
    const commit = () => {
      if (pending.current !== run || committed) return;
      committed = true;
      flushSync(update);
    };
    const fade = () => {
      root.classList.add("theme-fade");
      // Establish the transition rule before changing the semantic color tokens.
      void root.offsetWidth;
      commit();
      run.timer = setTimeout(() => clear(run), 180);
    };

    if (typeof document.startViewTransition !== "function") {
      fade();
      return;
    }

    const radius = Math.hypot(
      Math.max(origin.x, innerWidth - origin.x),
      Math.max(origin.y, innerHeight - origin.y),
    );
    root.style.setProperty("--theme-reveal-x", `${origin.x}px`);
    root.style.setProperty("--theme-reveal-y", `${origin.y}px`);
    root.style.setProperty("--theme-reveal-radius", `${radius}px`);
    root.classList.add("theme-reveal");
    try {
      run.transition = document.startViewTransition(commit);
      void run.transition.ready.catch(() => {
        if (pending.current === run) commit();
      });
      void run.transition.finished.then(
        () => {
          commit();
          clear(run);
        },
        () => {
          commit();
          clear(run);
        },
      );
    } catch {
      root.classList.remove("theme-reveal");
      fade();
    }
  };
}

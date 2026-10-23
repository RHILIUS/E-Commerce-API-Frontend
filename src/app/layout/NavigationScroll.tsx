import { useLayoutEffect, useRef } from "react";
import {
  ScrollRestoration,
  useLocation,
  useNavigationType,
} from "react-router-dom";

/** Extend router restoration to content loaded after navigation, without fighting user input. */
export const NavigationScroll = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map<string, number>());
  const previousPath = useRef(location.pathname);

  useLayoutEffect(() => {
    const saved =
      navigationType === "POP"
        ? positions.current.get(location.key)
        : undefined;
    let id: string | undefined;
    try {
      id = location.hash
        ? decodeURIComponent(location.hash.slice(1))
        : undefined;
    } catch {
      // Malformed fragment links retain the router's normal top-of-page fallback.
    }
    const restore = () => {
      if (saved !== undefined) {
        window.scrollTo({ top: saved, left: 0, behavior: "instant" });
      } else if (id) {
        document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
      }
    };
    if (
      navigationType !== "POP" &&
      previousPath.current !== location.pathname &&
      !id
    ) {
      document
        .querySelector<HTMLElement>("[data-route-content]")
        ?.focus({ preventScroll: true });
    }
    previousPath.current = location.pathname;
    restore();

    // Observe layout growth, including API content and images, for a bounded period.
    const observer = new ResizeObserver(restore);
    if (saved !== undefined || id) observer.observe(document.body);
    const stop = () => observer.disconnect();
    const timeout = window.setTimeout(stop, 10_000);
    const events = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    events.forEach((event) =>
      window.addEventListener(event, stop, { passive: true }),
    );
    const entries = positions.current;
    // Capture before the outgoing DOM shrinks; reading during cleanup can see a clamped offset.
    let lastPosition = window.scrollY;
    const remember = () => {
      lastPosition = window.scrollY;
    };
    window.addEventListener("scroll", remember, { passive: true });
    return () => {
      entries.set(location.key, lastPosition);
      window.removeEventListener("scroll", remember);
      if (entries.size > 100) entries.delete(entries.keys().next().value!);
      stop();
      window.clearTimeout(timeout);
      events.forEach((event) => window.removeEventListener(event, stop));
    };
  }, [location.key, location.pathname, location.hash, navigationType]);

  return <ScrollRestoration />;
};

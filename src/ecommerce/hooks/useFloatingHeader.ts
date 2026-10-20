import { useEffect, useRef, useState } from "react";

/** Observe a marker below the original header row without subscribing to every scroll. */
export function useFloatingHeader() {
  const markerRef = useRef<HTMLSpanElement>(null);
  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    // Sticky positioning remains usable when IntersectionObserver is unavailable.
    if (!markerRef.current || typeof IntersectionObserver === "undefined")
      return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsFloating(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(markerRef.current);
    return () => observer.disconnect();
  }, []);

  return { markerRef, isFloating };
}

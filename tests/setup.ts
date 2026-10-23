import "@testing-library/jest-dom/vitest";

import { act, cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { toast } from "@/app/lib/toast";

import { server, waitForMockRequests } from "./server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(async () => {
  if (typeof window !== "undefined") {
    await act(async () => {
      toast.close();
      cleanup();
      await waitForMockRequests();
    });
  } else {
    await waitForMockRequests();
  }
  server.resetHandlers();
});
afterAll(() => server.close());

// jsdom has no native media-query implementation; theme-specific tests replace it.
if (typeof window !== "undefined")
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (media: string) => ({
      matches: false,
      media,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => true,
    }),
  });

// jsdom does not lay out pages; navigation tests provide explicit scroll assertions.
beforeAll(() => {
  if (typeof window === "undefined") return;
  window.scrollTo = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { useThemeTransition } from "@/app/theme/useThemeTransition";

beforeEach(() => {
  Object.defineProperty(document, "startViewTransition", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  Reflect.deleteProperty(document, "startViewTransition");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// Model the browser lifecycle separately from React so skipped callbacks can be replayed.
function mockTransitions() {
  const runs: {
    update: () => unknown;
    finish: () => void;
    skip: ReturnType<typeof vi.fn>;
  }[] = [];
  const start = vi.fn((update: () => unknown) => {
    let finish!: () => void;
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const skip = vi.fn();
    runs.push({ update, finish, skip });
    return { ready: Promise.resolve(), finished, skipTransition: skip };
  });
  vi.spyOn(document, "startViewTransition").mockImplementation(
    start as unknown as typeof document.startViewTransition,
  );
  return runs;
}

test("reveals from the button center and covers the farthest viewport corner", async () => {
  const runs = mockTransitions();
  const update = vi.fn();
  const { result, unmount } = renderHook(useThemeTransition);
  act(() => result.current(update, { x: 30, y: 40 }));
  expect(update).not.toHaveBeenCalled();
  expect(document.documentElement).toHaveClass("theme-reveal");
  expect(
    document.documentElement.style.getPropertyValue("--theme-reveal-radius"),
  ).toBe(`${Math.hypot(innerWidth - 30, innerHeight - 40)}px`);
  await act(async () => {
    runs[0].update();
    runs[0].finish();
  });
  expect(update).toHaveBeenCalledTimes(1);
  expect(document.documentElement).not.toHaveClass("theme-reveal");
  unmount();
});

test("a newer click wins over a delayed snapshot callback and unmount skips it", async () => {
  const runs = mockTransitions();
  const old = vi.fn();
  const latest = vi.fn();
  const { result, unmount } = renderHook(useThemeTransition);
  act(() => {
    result.current(old, { x: 10, y: 10 });
    result.current(latest, { x: 20, y: 20 });
  });
  expect(runs[0].skip).toHaveBeenCalledOnce();
  await act(async () => {
    runs[0].update();
    runs[0].finish();
  });
  expect(old).not.toHaveBeenCalled();
  expect(document.documentElement).toHaveClass("theme-reveal");
  unmount();
  expect(runs[1].skip).toHaveBeenCalledOnce();
  await act(async () => {
    runs[1].update();
    runs[1].finish();
  });
  expect(latest).not.toHaveBeenCalled();
  expect(document.documentElement).not.toHaveClass("theme-reveal");
});

test("reduced motion and changes without a button origin apply immediately", () => {
  const runs = mockTransitions();
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches: true,
  } as MediaQueryList);
  const update = vi.fn();
  const { result } = renderHook(useThemeTransition);
  act(() => {
    result.current(update, { x: 10, y: 10 });
    result.current(update);
  });
  expect(update).toHaveBeenCalledTimes(2);
  expect(runs).toHaveLength(0);
});

test("unsupported browsers fade immediately and clean up the temporary class", () => {
  vi.useFakeTimers();
  vi.spyOn(document, "startViewTransition").mockImplementation(() => {
    throw new Error("Unavailable");
  });
  const update = vi.fn();
  const { result, unmount } = renderHook(useThemeTransition);
  act(() => result.current(update, { x: 10, y: 10 }));
  expect(update).toHaveBeenCalledOnce();
  expect(document.documentElement).toHaveClass("theme-fade");
  act(() => vi.advanceTimersByTime(180));
  expect(document.documentElement).not.toHaveClass(
    "theme-fade",
    "theme-reveal",
  );
  act(() => result.current(update, { x: 10, y: 10 }));
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

test("a rejected snapshot still commits the selected preference without an unhandled rejection", async () => {
  vi.spyOn(document, "startViewTransition").mockReturnValue({
    ready: Promise.reject(new Error("Skipped")),
    finished: Promise.resolve(),
    skipTransition: vi.fn(),
  } as unknown as ViewTransition);
  const update = vi.fn();
  const { result } = renderHook(useThemeTransition);
  await act(async () => result.current(update, { x: 10, y: 10 }));
  expect(update).toHaveBeenCalledOnce();
  expect(document.documentElement).not.toHaveClass("theme-reveal");
});

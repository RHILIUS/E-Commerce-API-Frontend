import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { useCountdown } from "@/authentication/hooks/useCountdown";

afterEach(() => vi.useRealTimers());

test("counts down to zero from the supplied deadline", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  const endsAt = Date.now() + 2_500;

  const { result } = renderHook(() => useCountdown(endsAt));
  expect(result.current).toBe(3);

  act(() => vi.advanceTimersByTime(1_000));
  expect(result.current).toBe(2);

  act(() => vi.advanceTimersByTime(1_000));
  expect(result.current).toBe(1);

  act(() => vi.advanceTimersByTime(1_000));
  expect(result.current).toBe(0);
});

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { ThemeToggle } from "@/app/components/ThemeToggle";
import { THEME_STORAGE_KEY } from "@/app/theme/theme";
import { ThemeProvider } from "@/app/theme/ThemeProvider";

let media: EventTarget & { matches: boolean };
beforeEach(() => {
  localStorage.clear();
  media = Object.assign(new EventTarget(), { matches: false });
  vi.spyOn(window, "matchMedia").mockImplementation(
    () => media as unknown as MediaQueryList,
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "";
});

// Exercise preference changes through the same control used in both headers.
function show() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

test("one click saves the opposite theme and restores it on remount", async () => {
  const user = userEvent.setup();
  const view = show();
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));
  expect(document.documentElement).toHaveClass("dark");
  expect(document.documentElement.style.colorScheme).toBe("dark");
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  view.unmount();
  show();
  await user.click(
    screen.getByRole("button", { name: "Switch to light mode" }),
  );
  expect(document.documentElement).not.toHaveClass("dark");
  expect(document.documentElement.style.colorScheme).toBe("light");
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
});

test("System follows device changes until the first click chooses the opposite visible theme", async () => {
  const user = userEvent.setup();
  const remove = vi.spyOn(media, "removeEventListener");
  const view = show();
  act(() => {
    media.matches = true;
    media.dispatchEvent(new Event("change"));
  });
  expect(document.documentElement).toHaveClass("dark");
  await user.click(
    screen.getByRole("button", { name: "Switch to light mode" }),
  );
  expect(document.documentElement).not.toHaveClass("dark");
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  act(() => {
    media.matches = false;
    media.dispatchEvent(new Event("change"));
    media.matches = true;
    media.dispatchEvent(new Event("change"));
  });
  expect(document.documentElement).not.toHaveClass("dark");
  expect(
    screen.getByRole("button", { name: "Switch to dark mode" }),
  ).toBeVisible();
  view.unmount();
  expect(remove).toHaveBeenCalled();
});

test.each([null, "system", "invalid"])(
  "saved value %s follows a dark device initially",
  (saved) => {
    if (saved !== null) localStorage.setItem(THEME_STORAGE_KEY, saved);
    media.matches = true;
    show();
    expect(
      screen.getByRole("button", { name: "Switch to light mode" }),
    ).toBeVisible();
    expect(document.documentElement).toHaveClass("dark");
  },
);

test("blocked storage still permits switching the current session", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("Blocked", "SecurityError");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Blocked", "SecurityError");
  });
  const user = userEvent.setup();
  show();
  await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));
  expect(document.documentElement).toHaveClass("dark");
  expect(
    screen.getByRole("button", { name: "Switch to light mode" }),
  ).toBeVisible();
});

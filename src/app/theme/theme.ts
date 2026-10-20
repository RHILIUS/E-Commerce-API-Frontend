export type Theme = "light" | "dark" | "system";
export const THEME_STORAGE_KEY = "ecommerce-theme";
export const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";

/** Validate the stored preference, which may have been edited outside the app. */
export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

/** Storage restrictions must not prevent the app from rendering or changing theme. */
export function readTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : "system";
  } catch {
    return "system";
  }
}

/** Apply semantic CSS tokens and native-control appearance together. */
export function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && matchMedia(SYSTEM_THEME_QUERY).matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

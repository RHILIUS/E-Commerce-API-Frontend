import {
  type ReactNode,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import {
  applyTheme,
  readTheme,
  SYSTEM_THEME_QUERY,
  type Theme,
  THEME_STORAGE_KEY,
} from "./theme";
import { ThemeContext } from "./ThemeContext";
import { type ThemeOrigin, useThemeTransition } from "./useThemeTransition";

// Keep device appearance reactive so the toggle describes the visible theme.
function subscribeToSystemTheme(onChange: () => void) {
  const media = matchMedia(SYSTEM_THEME_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

// React compares this primitive snapshot when the device appearance changes.
function isSystemDark() {
  return matchMedia(SYSTEM_THEME_QUERY).matches;
}

/** Keep one appearance preference across routes, following the device only in System mode. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const transitionTheme = useThemeTransition();
  const [theme, updateTheme] = useState<Theme>(readTheme);
  const systemDark = useSyncExternalStore(subscribeToSystemTheme, isSystemDark);
  const resolvedTheme =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;
  useEffect(() => {
    applyTheme(theme);
  }, [theme, systemDark]);

  const setTheme = (value: Theme, origin?: ThemeOrigin) =>
    transitionTheme(() => {
      updateTheme(value);
      applyTheme(value);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, value);
      } catch {
        // The current session still uses the selected theme when persistence is blocked.
      }
    }, origin);

  return (
    <ThemeContext value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext>
  );
}

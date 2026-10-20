import { createContext } from "react";

import type { Theme } from "./theme";
import type { ThemeOrigin } from "./useThemeTransition";

export const ThemeContext = createContext<{
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme, origin?: ThemeOrigin) => void;
} | null>(null);

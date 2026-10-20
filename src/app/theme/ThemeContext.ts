import { createContext } from "react";

import type { Theme } from "./theme";

export const ThemeContext = createContext<{
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
} | null>(null);

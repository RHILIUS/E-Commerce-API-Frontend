import { useContext } from "react";

import { ThemeContext } from "./ThemeContext";

/** Access the app-wide appearance preference from any header variant. */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme requires ThemeProvider");
  return context;
}

import { Moon, Sun } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { useTheme } from "@/app/theme/useTheme";

/** Switch directly to the opposite appearance, saving an explicit preference. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
  const Icon = nextTheme === "dark" ? Moon : Sun;
  const label = `Switch to ${nextTheme} mode`;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11 rounded-xl motion-reduce:transition-none"
      aria-label={label}
      title={label}
      onClick={(event) => {
        const { left, top, width, height } =
          event.currentTarget.getBoundingClientRect();
        setTheme(nextTheme, { x: left + width / 2, y: top + height / 2 });
      }}
    >
      <Icon className="size-5" aria-hidden="true" />
    </Button>
  );
}

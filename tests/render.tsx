import {
  render as renderWithTestingLibrary,
  type RenderOptions,
} from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { ThemeProvider } from "@/app/theme/ThemeProvider";

/** Render page consumers with the same appearance context used by the application. */
export function render(ui: ReactElement, options?: RenderOptions) {
  const Wrapper = options?.wrapper;
  return renderWithTestingLibrary(ui, {
    ...options,
    wrapper: ({ children }: { children: ReactNode }) => (
      <ThemeProvider>
        {Wrapper ? <Wrapper>{children}</Wrapper> : children}
      </ThemeProvider>
    ),
  });
}

---
name: frontend-ui
description: Implement or revise frontend pages, controls, styling, accessibility, and responsive layouts using the project UI and theme conventions.
---

# Frontend UI

Apply this workflow when implementing or changing frontend pages, interactive controls, reusable UI, or their styling. Repository paths in backticks are relative to the frontend root. Read the current theme and affected consumers before choosing components or styles.

## UI Component Selection and shadcn/ui Usage

Before creating a new interactive or reusable UI element:

1. Check `src/app/components/ui` for an existing component that meets the requirement.
2. If no suitable local component exists, check whether shadcn/ui provides an appropriate component that can be added to the project.
3. Review the current official shadcn/ui documentation for the component's recommended composition, variants, and accessibility behavior.
4. Add and use the shadcn/ui component when it substantially matches the required behavior.
5. Customize it using the project's existing semantic theme tokens, component variants, and established conventions.
6. Create a custom component only when no suitable shadcn/ui component exists or adapting one would introduce unnecessary complexity.

Prefer shadcn/ui for common interface elements such as buttons, inputs, dialogs, dropdowns, selects, tabs, tooltips, alerts, and form controls. Do not recreate functionality already provided by an installed or suitable shadcn/ui component.

Follow shadcn/ui's recommended component composition and use its defaults when they match the required design. Use only the component primitives that represent the interface being built; do not force an optional primitive into the markup when its built-in structure or appearance conflicts with the intended result.

When a Figma design or wireframe is provided, treat it as the source of truth for the intended visual outcome, layout, spacing, sizing, hierarchy, and responsive behavior. Inspect the relevant Figma node before implementation. Use shadcn/ui as the implementation foundation, but do not allow its defaults to override explicit design requirements.

Start with the shadcn/ui defaults, then add the smallest set of semantic, page-specific overrides needed to reproduce the Figma design. Avoid both extremes: do not recreate all of a shadcn/ui component's internal styling in page markup, and do not accept visibly incorrect defaults merely to keep the JSX concise. Visual fidelity, accessibility, and maintainability take precedence over minimizing class names.

Prefer page-level overrides for one-off design differences. Modify a shared shadcn/ui component or add a reusable variant only when the change is intended to apply consistently across multiple usages, and review the effect on existing consumers first.

Do not add shadcn/ui components that are unused. Review newly added component files and dependencies before accepting them to ensure they preserve the project's existing conventions, accessibility behavior, and theme integration.

## UI Styling and Theme

This project uses the shadcn/ui theming architecture with Tailwind CSS. The global design tokens, theme variables, typography, border radii, and light/dark mode colors are defined in `src/app/index.css`.

Before creating or modifying any user interface, inspect `src/app/index.css` and treat its current contents as the source of truth for the project's visual theme. Do not rely on a copied or predefined list of tokens in this file, because the theme may change over time.

Use the semantic theme utilities generated from the variables in `src/app/index.css` whenever an appropriate token exists. Avoid hard-coded Tailwind palette colors, hexadecimal values, RGB values, or fixed light/dark colors for themed interface elements.

Prefer Tailwind's canonical utilities over arbitrary values when they express the intended design using the project's theme and spacing scale. For example, use `lg:max-w-180` instead of `lg:max-w-[720px]` and `max-w-400` instead of `max-w-[1600px]`. Check editor suggestions against the actual theme before applying them: numeric spacing utilities use `--spacing` (normally `0.25rem`), so their pixel size changes with the root font size or spacing token. Keep arbitrary values when an exact pixel value, custom calculation, or layout expression is intentional. Do not round a design value to a nearby utility merely to avoid brackets. Apply this convention to new and edited code without unrelated repository-wide rewrites.

All UI changes must remain visually correct in both light and dark modes. Do not assume that backgrounds are always light or that text is always dark.

Before introducing a new color or visual value:

1. Check `src/app/index.css` for an existing semantic token that represents the intended purpose.
2. Review nearby components for established styling patterns.
3. Reuse the existing token or pattern when appropriate.
4. If no suitable token exists, consider whether a new semantic theme token should be added instead of hard-coding the value locally.

When adding or modifying shadcn/ui components, preserve the project's existing theme integration, component variants, accessibility behavior, and styling conventions unless the task explicitly requires otherwise.

## Responsive UI Requirements

Build responsive behavior as part of every UI implementation rather than treating it as a later refinement. Use mobile-first base styles and add breakpoint-specific enhancements only where the layout needs them.

The application currently has a minimum supported width of 330px, defined at the document and React-root level in `src/app/index.css`. Do not duplicate this minimum width on individual pages. At widths of 330px and above, pages must not produce unintended horizontal scrolling, clipped content, uncovered root backgrounds, or whitespace caused by mismatched page and root dimensions.

`src/app/layout/RootLayout.tsx` owns the application's minimum viewport height and uses a single-cell grid so the routed page rendered by `Outlet` stretches to fill the available height. Page-level root elements should rely on this grid stretching and should not repeat `min-h-screen`, `min-h-svh`, `min-h-dvh`, or `min-h-full`. A percentage-based `min-h-full` does not inherit a parent's `min-height` and must not be used for that purpose. Add a page-level height constraint only when the page intentionally requires behavior different from the shared application shell.

When implementing or modifying a page:

1. Use fluid page and container widths such as `w-full` with an appropriate `max-w-*` rather than fixed page widths.
2. Account for the combined width of viewport padding, container padding, gaps, borders, and fixed-size children at the 330px minimum width.
3. Add `min-w-0` to grid and flex children when their text or controls must be allowed to shrink, and allow rows to wrap or stack when their combined content may not fit.
4. Keep text readable without truncating essential content. Allow headings, descriptions, actions, and validation messages to wrap gracefully.
5. Make grouped controls, forms, buttons, dialogs, cards, tables, and navigation usable on narrow screens. Fixed-size controls may retain their intended size only when the complete group still fits within the available content width.
6. Keep viewport-height ownership in the document root and `RootLayout`. Ensure `html`, `body`, `#root`, and the layout background cover the full rendered area, while routed pages stretch through the layout grid.
7. Preserve the Figma layout at the viewport size it represents while defining a deliberate adaptation for narrower and wider screens when those states are not provided.
8. Keep interactive targets accessible and usable with touch, keyboard navigation, zoom, and text wrapping.

Before considering a UI change complete, verify it at representative widths of 330px, 375px, 768px, 1024px, and a wide desktop viewport. Also check at least one short viewport height, light and dark modes when both are supported, and confirm there is no unexpected overflow in either axis. Run the relevant type-check, lint, and production-build commands after implementation.

## Completion

Run the code checks required by the root agent instructions and the viewport/theme checks above. Inspect the changed screen and any affected shared-component consumers. Report which checks actually ran and any material limitations in the handoff; do not record execution reports in maintained feature guides.

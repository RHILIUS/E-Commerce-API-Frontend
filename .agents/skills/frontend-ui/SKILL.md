---
name: frontend-ui
description: Implement or revise frontend pages, controls, styling, accessibility, and responsive layouts using the project UI and theme conventions.
---

# Frontend UI

Apply this workflow when implementing or changing frontend pages, interactive controls, reusable UI, or their styling. Repository paths in backticks are relative to the frontend root. Read the current theme and affected consumers before choosing components or styles.

## Brand and Experience Direction

E-Commerce by RhiLius Apps should feel rounded, welcoming, modern, and easy to use. Keep shopping clear and comfortable. Use familiar shapes, purposeful color, and subtle feedback to add personality without clutter: **calm by default, lively when users interact**.

Apply this direction to new features and to existing interfaces within the requested scope. It does not call for a redesign of unrelated screens.

### Identity, Shape, and Color

- Preserve the current tokens in `src/app/index.css` as the brand foundation: the existing primary red, neutral surfaces, Geist typography, and radius scale. A branding task does not itself require changing these values. Preview palettes and experimental tokens are proposals, not the application standard.
- Reuse the cart-and-"E" identity in `public/favicon.svg`. Where a brand lockup is appropriate, use “E-Commerce” with the secondary attribution “by RhiLius Apps”; avoid repeating the lockup throughout a screen.
- Carry the logo's soft, rounded character into controls and containers using the existing semantic radius utilities and component conventions. Keep related controls consistent; use pill shapes selectively for chips and badges rather than rounding every element into a capsule.
- Use primary red for important actions and selected states, with neutral surfaces providing visual breathing room. Additional colors may distinguish meaningful categories, collections, or statuses, but should use consistent semantic roles and readable light/dark variants. Do not assign arbitrary colors to ordinary tabs or every section.
- Pair color distinctions with text or another recognizable cue. Keep category accents distinct from success, warning, information, and error meanings; follow the theme-token workflow below when a needed role is missing.

### Calm Composition and Useful Icons

- Give each screen a clear purpose and make its primary action easy to find. Keep secondary actions visually quieter without making essential navigation or recovery hard to discover.
- Group content with spacing, alignment, and typography before adding cards, borders, panels, badges, or headings. Avoid unnecessary component density and repeated welcome or explanatory copy. A component showcase is not a template for page density.
- Long forms may use separate cards for distinct information groups, such as personal details, address, and account security. Keep groups within one form when they share a submission action, place the shared action after the groups, and avoid wrapping the cards in another decorative card. Use simpler sections when cards add unnecessary weight.
- Small icons beside section headings can help users scan a long form. Prefer muted neutral icons when steps, cards, or headings already distinguish the groups. Add color only when it conveys an additional useful distinction; do not add tinted backgrounds just to decorate each step. Keep visible headings and consistent icon sizing; field icons are optional and should improve recognition rather than repeat decoration across every input.
- Reveal secondary detail when useful, while keeping prices, required fields, validation, and information needed for a decision readily available. Keep narrow layouts focused without removing essential content.
- Prefer the installed Lucide icons for interface actions. Add an icon when it helps recognition, navigation, or feedback; do not decorate every label, field, button, or paragraph. Keep icon sizes and stroke styles consistent within each context. Preserve recognizable external brand marks where relevant.
- Label unfamiliar actions with text and give icon-only controls accessible names. Essential actions must work with keyboard and touch, including when hover is unavailable.
- Keep copy brief, friendly, and specific. Empty states should explain the situation and a useful next action; errors should explain how to recover. Mark unavailable integrations clearly before users try them.

### Purposeful Motion and Feedback

- Use short transitions for hover, press, selection, and opening or closing a surface. Prefer roughly 150–250 ms with smooth easing for routine feedback; keep longer brand entrances occasional and unobtrusive.
- Use small responses where they explain an action: a gentle product hover, a brief cart badge pop, or a clear favorite toggle. Avoid continuous bouncing, flashing, repeated entrances, and several competing animations.
- A single gentle shake may reinforce a user-triggered validation error. Always provide a readable error message and accessible field association; preserve focus and entered values. Do not shake on every keystroke or use movement as the only feedback.
- Show appropriate pressed, selected, loading, disabled, success, and error states for the interactions being built. Keep feedback close to the action and avoid duplicate notices. Never animate a success before the operation is confirmed.
- Respect `prefers-reduced-motion`: remove nonessential movement while keeping state changes and feedback understandable. Motion must not delay an action or disrupt keyboard focus, reading, or layout stability.

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

Review the affected interface against the brand direction: clear purpose and primary action, restrained component and icon use, current theme tokens, consistent rounding, and purposeful feedback. For changed interactions, check keyboard and touch access, focus visibility, relevant loading/error states, and reduced-motion behavior alongside the responsive and theme checks above.

Run the code checks required by the root agent instructions and the viewport/theme checks above. Inspect the changed screen and any affected shared-component consumers. Report which checks actually ran and any material limitations in the handoff; do not record execution reports in maintained feature guides.

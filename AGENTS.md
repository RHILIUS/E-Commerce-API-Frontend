## Project Context

This repository is one part of the larger E-Commerce project. The frontend, backend, and project documentation are maintained as separate Git repositories located under the same parent directory.

### Repository Structure

```text
E-Commerce/
├── frontend/    # Frontend application
├── backend/     # Backend API
└── docs/        # Project documentation
```

### Repositories

- **Frontend:** [RHILIUS/E-Commerce-API-Frontend](https://github.com/RHILIUS/E-Commerce-API-Frontend)
- **Backend:** [RHILIUS/E-Commerce-API](https://github.com/RHILIUS/E-Commerce-API)
- **Documentation:** [RHILIUS/E-Commerce-Docs](https://github.com/RHILIUS/E-Commerce-Docs)

The other repositories should be available as sibling directories:

- Frontend: `../frontend`
- Backend: `../backend`
- Documentation: `../docs`

Frontend-specific documentation is maintained in this repository's `docs/` folder:

Before making changes that affect system architecture, database design, API contracts, shared data models, or cross-application workflows, review the relevant files and diagrams in the documentation repository, review the relevant local documentation in `docs/`. The local `docs/` folder is distinct from the sibling documentation repository.

The documentation repository is the central source of project-wide context. It describes the complete E-Commerce system through entity-relationship diagrams, UML diagrams, business-process flows, architecture descriptions, and other technical documentation.

When implementing changes that depend on another part of the system, inspect the relevant sibling repository to confirm its current behavior. Do not assume that the documentation and implementation are always synchronized; report any inconsistencies you discover.

## Documentation Writing and Reading Flow

Write maintained documentation for a future implementer who has never seen this project. Assume no knowledge of its architecture, terminology, repository layout, or earlier development conversations. Explain the current application in simple, concrete language while keeping technical details accurate.

### Explain Before Naming the Implementation

- Start with what the feature does, who uses it, and why it exists. Explain the customer's experience before introducing components, hooks, routes, or API contracts.
- Use short sentences and familiar words. Explain unfamiliar terms and abbreviations on first use. For example, introduce an idempotency key as an identifier that lets the backend recognize a repeated order request without creating another purchase.
- Use small, realistic examples when they clarify a distinction, such as a personal address versus a delivery recipient. Keep the tone respectful; simple explanations should not sound childish.
- Explain why important behavior exists, especially ownership boundaries, separate save actions, persistence, and recovery after an uncertain request outcome. Plain language must not hide rules an implementer needs to preserve.
- Introduce technical details gradually. Use tables for fields, requests, and file responsibilities, and numbered steps for workflows. Scale the structure to the feature rather than adding empty or repetitive sections.

### Keep a Clear Starting Point

- Provide a repository introduction covering the application's purpose, the repositories' roles, local setup, everyday commands, and links to deeper guides.
- Provide a documentation index as the reading map. Add or update its entries when guides are added, moved, or removed.
- Provide an architecture introduction covering startup, routing, authentication, API communication, state, folders, shared UI, and theming. Link to it instead of repeating the full architecture in every feature guide.
- These are documentation responsibilities, not fixed filenames or assumptions that particular guides already exist. Inspect the current structure and update an appropriate existing guide or create one when needed. Keep these writing instructions self-contained rather than relying on another document as the required style example.
- Keep frontend explanations in the local `docs/` folder, exact server contracts in the backend documentation, and shared architecture and business-process diagrams in the sibling documentation repository. Explain the difference between local `docs/` and sibling `../docs/` when introducing the repositories.
- Use relative links to maintained guides and source files. Check that targets exist. Explain the sibling checkout layout and provide repository links for readers viewing the frontend alone on GitHub.

### Organize Feature Guides Around Understanding

Prefer this reading flow, adapting headings and combining sections where useful:

1. **Purpose and entry point:** Explain the feature, its key concepts, who can use it, and how customers reach it.
2. **Customer behavior:** Explain the available information and actions, then walk through the normal successful flow.
3. **Rules and saved state:** Explain what changes, what remains separate, what survives navigation or reload, and which responsibilities belong to the frontend or backend.
4. **Failures and recovery:** Explain validation errors, loading failures, blocked actions, duplicate submissions, and uncertain outcomes where applicable. State what the customer can do next.
5. **Requests and code locations:** Introduce the relevant request routes, payloads, response behavior, and focused source references after the behavior is clear. Link to backend contracts and shared process documents for deeper detail.

For setup and deployment guides, first explain what the services do and how they connect, then give prerequisites, ordered instructions, configuration values, and useful troubleshooting. Define placeholders and distinguish local settings from deployed settings.

### Describe the Current System

- Write guides as lasting explanations of how the implemented application works. Avoid chronological change logs, implementation dates, PR narratives, and reports of work completed during a particular session.
- Check the relevant code and contracts before describing behavior. Reconcile stale statements within the authorized scope and report inconsistencies that remain elsewhere. Do not invent missing behavior or link to nonexistent documents.
- Keep actual limitations visible, including test-only payments, unavailable actions, and deferred integrations. Do not describe a proposal as implemented or label a working feature as deferred. Keep proposed designs clearly separate from current behavior.
- Do not add **Verification** sections, completed test checklists, browser-check counts, screenshots of validation runs, or historical lint/build results to maintained overview and feature guides. Put execution evidence in the PR description or implementation handoff. Reusable instructions for running tests belong in setup or contributor documentation.
- Continue performing the checks required by the change. The diagram and ERD requirements below still require Mermaid version and validation records; keep that evidence with those specialized documents or their handoff as required. This writing guidance does not remove validation or PR reporting obligations.

## Required Feature Business-Process Diagrams

For every new feature that introduces or changes a business workflow, create or update its specific business-process diagram as part of the work. Update the diagram whenever behavior, decisions, API handoffs, ownership, persistence or recovery changes.

Simple frontend changes limited to presentation or straightforward client-side navigation, such as a branded 404 page, do not require feature documentation or diagram index updates unless explicitly requested. This exemption applies only when the change introduces no business rules, API contract changes, authorization changes, persistence or cross-application workflows.

Purely visual or internal refactoring changes do not require a diagram update when the documented workflow remains accurate.

Maintain these documents in the **sibling documentation repository** at `../docs/diagrams/specific-business-processes/<feature-area>/<process-name>.md`, using lowercase kebab-case paths. This is distinct from the frontend's local `docs/` folder. Update an existing process document when appropriate rather than creating duplicate descriptions of the same workflow.

Before creating or updating a diagram, read the [central diagramming specification](../docs/diagrams/diagramming-specification.md), check the [diagram index](../docs/diagrams/README.md), and inspect the relevant frontend, backend and documented contracts. Use the [Change Password process](../docs/diagrams/specific-business-processes/account/change-password.md) as a structural example, not as an implemented contract or a source of requirements for unrelated features.

Use fenced Mermaid blocks for **activity-style business-process diagrams with swimlanes**, following the specification's `swimlane-beta TB` conventions. Mermaid swimlane flowcharts are not strict UML activity diagrams; describe their notation accurately. Do not substitute draw.io, PlantUML, image exports or sequence diagrams for the required Mermaid process document unless the user requests a different format. Sequence diagrams may supplement the activity-style flow when useful.

Each process document must:

1. State its scope and distinguish proposed behavior from implemented behavior. Do not present planned endpoints, policies or integrations as existing contracts.
2. Assign actions to their actual owners. Place customer interactions in Frontend, authorization and business validation in Backend, and add Database or external service lanes such as Email Provider only when those responsibilities need to be shown explicitly.
3. Show clear entry and exit points, meaningful actions, decisions with labeled outcomes, and the successful path. Show validation failures, blocked progression, retry or restart behavior, and uncertain request outcomes when relevant; invalid branches must never fall through to success.
4. Label cross-lane requests and responses. Put exact routes, request fields and response contracts in an adjacent handoff table when they would make diagram nodes unreadable.
5. Identify transaction boundaries, commit/rollback, durable changes, ownership checks, concurrency and idempotency behavior where relevant. Keep common guards and detailed rules beside the diagrams rather than repeating them in every phase.
6. Split long workflows into named phases with explicit continuation points, keeping each diagram readable. Document important scope exclusions and unresolved contract decisions without inventing behavior to fill gaps.
7. Add or update its entry in `../docs/diagrams/README.md` and ensure relative links resolve. Keep the central document as the maintained source rather than copying it into frontend documentation.

Validate all Mermaid fences with a recorded Mermaid version and inspect rendered diagrams for readable labels, clipping, responsibility boundaries and recovery paths. Check the intended Markdown host when available because `swimlane-beta` support varies. If parsing, rendering or host verification cannot be completed, report the specific limitation and record what was actually checked; do not claim visual validation from syntax checks alone.

When implementation is complete, reconcile the process document with the actual code and API contract, updating its status and any affected flow. Include the diagram changes and validation results in the feature handoff.

## Required ERD Documentation

Whenever creating or updating a Markdown ERD document in the **sibling documentation repository** at `../docs/diagrams/erd/`, include explanations alongside the diagram. This is distinct from the frontend's local `docs/` folder. Use lowercase kebab-case filenames and update an existing document when it already covers the model. Use [Password-change model](../docs/diagrams/erd/password-change.md) as a structural example, not as a source of requirements for unrelated entities.

Before writing, review the central diagramming specification, diagram index, relevant backend models and migrations, and the services and documented contracts that govern the fields. Verify current behavior against implementation; report inconsistencies rather than inventing semantics.

Each ERD Markdown document must:

1. State its scope and implementation status, clearly distinguishing implemented models from proposed designs. Identify omitted entities or fields when the diagram represents only a subset.
2. Include a fenced Mermaid `erDiagram` showing the relevant entities, fields, keys, and relationship cardinalities.
3. Explain each entity's purpose, ownership, and role in the feature, with its actual model name when implemented. Explain relationships, optionality, foreign-key ownership, and deletion behavior.
4. Provide a field table for every entity with columns **Field / column**, **Meaning**, and **Constraints and behavior**. Cover every field shown in the diagram. Explain its business purpose and relevant type, primary/foreign/unique keys, nullability, defaults, validation, and lifecycle behavior. Distinguish model field names from database column names when they differ. Do not merely repeat the field name as its explanation.
5. Add persistence and lifecycle notes where relevant, covering creation, updates, expiry, resets, counters, sensitive-data handling, transaction boundaries, concurrency, and failure or recovery behavior. Document only verified behavior, and identify unresolved decisions for proposed models.
6. Include implementation references and links to related business-process documents. Add or update the diagram index entry and ensure relative links resolve.

Keep the diagram, field tables, and lifecycle notes synchronized when the schema or behavior changes. Check that every diagram entity and field has an explanation. For new or changed Mermaid fences, record the Mermaid version used, validate parsing, and inspect the rendered diagram for readable labels and relationships. Check the intended Markdown host when available; report any parsing, rendering, or host-verification limitations without claiming checks that were not performed. Include documentation changes and actual validation results in the handoff.

## Implementation Simplicity and Modularization

Prefer the smallest clear implementation that satisfies the verified current requirement and contract.

- Inspect the local producer, consumer, types, and documented contract before adding fallbacks, alternate parsing paths, compatibility branches, or abstractions.
- When this project and the backend own a stable, explicit contract together, model that contract accurately and consume it directly. Do not handle speculative response shapes or duplicate equivalent body/header fallbacks unless a real compatibility requirement exists.
- Add defensive behavior when the input crosses an untrusted or external boundary, the contract explicitly permits variation, backward compatibility requires it, or a demonstrated failure mode justifies it.
- Keep page components focused on composing the interface and coordinating user actions. Move cohesive stateful mechanics such as timers, subscriptions, and lifecycle cleanup into focused custom hooks when doing so makes the page easier to understand or allows multiple pages to reuse the behavior.
- Design hooks and modules around one clear responsibility and expose the smallest useful interface. For example, prefer a `useCountdown(deadline)` hook that owns timer effects and returns the current remaining seconds over duplicating interval management in each page.
- Modularize along real feature boundaries so behavior can be reused and changed independently as the application grows. Keep simple one-off logic colocated; do not split code into extra files or abstractions merely in anticipation of possible future scale.
- Introduce helpers and abstractions when they remove meaningful duplication, contain non-trivial implementation details, or isolate a real responsibility; avoid wrappers used only once when the inline behavior is clearer.
- Prefer descriptive named types over repeated nested TypeScript utility types in component logic. Keep success-response types separate from validation-error types.
- Add concise purpose comments above helpers so reviewers can understand why they exist without tracing the implementation. Use JSDoc for exported helpers and short comments for local helpers. Explain relevant input/output behavior, assumptions, or non-obvious decisions; avoid narrating each line or merely repeating the function name. Update comments when behavior changes.
- Move substantial API error parsing and response-to-field mapping into a focused helper in the feature's utils directory when it makes the page easier to read. Let the page handle the resulting UI state. Prefer straightforward control flow and meaningful names; keep trivial logic inline and support only verified response contracts.
- Any added complexity should correspond to a concrete case that can be explained and, where practical, tested. Simplicity must not weaken accessibility, security, data integrity, error handling, or required responsive behavior.

## Module Organization

When a feature has multiple files for one responsibility, group them in a clearly named directory such as `components/`, `hooks/`, `utils/`, or `tests/`, following the project's existing discovery conventions. Keep a single cohesive module colocated until splitting is useful; do not create speculative directories or empty abstractions. When adding a second related module, group the existing and new modules within that scoped change rather than reorganizing unrelated features.

Apply the same convention when working in the backend: multiple test, serializer, view, or service modules belong in `tests/`, `serializers/`, `views/`, or `services/` Python packages, respectively. Follow the backend's `AGENTS.md` for framework-specific requirements. Update affected imports, test patch targets, routing, and documentation references, and verify discovery and behavior after moving files. Keep package initializers or barrel exports small and avoid circular dependencies.

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

## Required Reading for Figma Tasks

Whenever a task asks you to create, generate, modify, or synchronize a Figma page, screen, component, wireframe, prototype interaction, variable, or style, read the following before inspecting or changing the Figma canvas:

1. [Figma agent workflow and design architecture](docs/figma-agent-guide.md) for the file structure, component reuse, local and remote variables, aliases, theme modes, typography, layout, validation, and handoff requirements.
2. [Figma node registry](docs/figma-nodes.md) for known file, page, screen, and component IDs before searching Figma.
3. The relevant feature documentation and design briefs in `docs/`. Design briefs follow `docs/<feature-area>/<subject>-design-brief.md`, using lowercase kebab-case for the feature area and screen, component, or flow name. Locate the briefs related to the requested task, read their requirements and unresolved decisions, and apply them only to their stated scope. If no matching brief exists, use the current user instructions and relevant project documentation; do not invent requirements.

Then inspect the current `src/app/index.css` and relevant source components, and load the applicable Figma skills before using their tools. Treat documented Figma structure as a starting point: verify the target nodes, variable bindings, and mode inheritance in the live file. Do not treat proposals in feature briefs as approved requirements or as authorization to change the canvas. Current user instructions determine the authorized scope.

For Figma themes, create one screen per layout and product state. Bind themed properties to variables and leave theme mode on the screen and its nested instances set to **Auto/inherit**, so changing the parent page or enclosing frame mode updates the same screen. Do not create separate light and dark screen copies or set explicit theme modes on screens to make previews. Follow the mode inspection and temporary preview procedure in the Figma agent guide.

## Figma Wireframe Structure

When creating or modifying Figma wireframes, structure parent containers according to the layout relationships they represent in the application:

1. Use vertical or horizontal Auto Layout for containers whose children form a stack or row comparable to CSS flexbox. Use nested Auto Layout containers when sections require different padding, gaps, alignment, or sizing behavior.
2. Represent grid-like repeated content with an appropriate grid or wrapping Auto Layout structure rather than manually positioning each item.
3. Reserve freeform positioning for elements that intentionally overlap or behave like absolute-positioned content, such as decorative layers, badges, map pins, and canvas-style interfaces. Do not use freeform positioning for ordinary page, card, form, navigation, or section flow.
4. Configure Hug, Fill, and Fixed sizing deliberately so containers respond predictably when text wraps, fields are added, or content changes. Scrollable pages should let their content containers grow while the viewport frame owns clipping and overflow behavior.

## Figma Workflow Efficiency

- Before searching a Figma file, check `docs/figma-nodes.md` for known file and node IDs.
- Update the registry whenever a stable frontend screen or reusable component is created, replaced, or removed in Figma.
- Make code the source of truth after a wireframe has been approved.
- Modify only the Figma node supplied by the user and its directly related components.
- Reuse existing Figma components, variables, text styles, and effects.
- Inspect only the target node and the specific reusable components needed.
- Batch related Figma reads and small mutations into as few calls as practical.
- Do not search every page or library unless the required component cannot be found locally.
- Skip Code Connect unless the project later gains access to it.
- For small UI changes, update the design and prototype interaction directly without rebuilding the entire page.
- Validate the changed component and its containing screen with screenshots.
- Avoid browser-to-Figma capture when the existing design can be updated directly.

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

## Pull Request Documentation

When asked to create a pull request description or PR documentation, return copy-ready Markdown that accurately reflects the implemented diff. Use the following section order consistently:

1. `## Summary`
2. `## Business Requirement`
3. `## Changes`
4. `## Design` when a Figma file, wireframe, specification, or other design reference is relevant
5. `## Current Scope`
6. `## Testing`
7. `## Screenshots`

Follow these requirements for each section:

- **Summary:** Briefly state the user-facing outcome and purpose of the PR.
- **Business Requirement:** Link the business requirement associated with the feature using a short descriptive Markdown label, and briefly state how the PR contributes to it. Preserve the exact user-provided URL, including its query parameters. If no business requirement link is available in the conversation or repository context, include an explicit `Add business requirement link` placeholder rather than inventing or guessing a URL.
- **Changes:** List the concrete implementation changes, including pages, components, routes, dependencies, navigation, accessibility, theming, and responsive behavior when applicable.
- **Design:** Link the relevant Figma node or design source and summarize how the implementation follows it. Omit this section when there is no design reference.
- **Current Scope:** State what is implemented and explicitly identify prototype behavior, deferred integration, known limitations, or work intentionally left for a later PR. Write `No known scope exclusions` when the implementation is complete and there are no meaningful exclusions.
- **Testing:** Use a Markdown task list. Mark an item complete only when it was actually verified, and include the relevant type-check, lint, formatting, tests, production build, routes, interactions, responsive widths, themes, and accessibility checks performed.
- **Screenshots:** Include a Markdown table with columns appropriate to the feature, such as light and dark mode or mobile and desktop. Use clear placeholders when screenshots have not been supplied; do not claim that screenshots were captured when they were not.

Keep PR documentation concise, reviewer-focused, and free of implementation claims that cannot be confirmed from the current diff or completed verification. Mention new dependencies and intentionally non-functional prototype controls explicitly. Treat business requirements as the source of feature intent and design references as the source of visual intent; report any meaningful conflict between them instead of silently choosing one.

## Maintaining This File

If a code or configuration change makes any instruction in this `AGENTS.md` inaccurate or outdated, update this file as part of the same change. Keep the instructions aligned with the repository’s actual structure, tooling, conventions, and sources of truth.

Do not update this file for changes that do not affect its guidance.

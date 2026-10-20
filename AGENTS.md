# Frontend agent instructions

## Project context

This frontend belongs to the E-Commerce project. Three separate Git repositories share a parent directory:

| Repository                                                          | Checkout        | Responsibility                                                     |
| ------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------ |
| [Frontend](https://github.com/RHILIUS/E-Commerce-API-Frontend)      | This repository | Customer website and browser behavior                              |
| [Backend](https://github.com/RHILIUS/E-Commerce-API)                | `../backend`    | API contracts, authorization, business rules, saved data, and ERDs |
| [Project documentation](https://github.com/RHILIUS/E-Commerce-Docs) | `../docs`       | Shared architecture and business-process diagrams                  |

The local `docs/` folder explains the frontend; the sibling `../docs/` repository explains the complete system. They are different locations. Before changes affecting architecture, database design, API contracts, shared models, or cross-application workflows, review the relevant local and shared documentation. Inspect the relevant sibling implementation and current frontend consumers; report inconsistencies rather than assuming documentation and code agree.

## Skills for task-specific workflows

Read and apply the linked skills when their task conditions match. Combine them when a task spans responsibilities; a diagram's required format and evidence still apply when documentation is part of a feature. Skills provide workflows, not permission to expand the task.

| Task                                                                    | Required skill                                                                                             |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Implement or change a page, control, reusable UI, or styling            | [frontend-ui](.agents/skills/frontend-ui/SKILL.md)                                                         |
| Write or revise maintained documentation, including alongside code      | [documentation-writing](.agents/skills/documentation-writing/SKILL.md)                                     |
| Introduce/change a business workflow                                    | [system-diagrams](.agents/skills/system-diagrams/SKILL.md)                                                 |
| Create/update backend ERD documentation or document changed data models | [erd-documentation](../backend/.agents/skills/erd-documentation/SKILL.md); also documentation-writing      |
| Create/update an editable Draw.io ERD illustration                      | [drawio-erd](../backend/.agents/skills/drawio-erd/SKILL.md)                                                |
| Write a PR description or PR documentation                              | [pull-request-writing](.agents/skills/pull-request-writing/SKILL.md)                                       |
| Inspect, create, modify, synchronize, or implement Figma designs        | [figma-workflow](.agents/skills/figma-workflow/SKILL.md); also frontend-ui when implementing frontend code |

Load only the diagram skills and references relevant to the task. A simple presentation or straightforward navigation change without business rules, API/authorization changes, persistence, or cross-application behavior does not require feature documentation or diagram-index updates unless requested. Purely visual/internal refactoring does not require a process-diagram update when its workflow stays accurate. New or changed business workflows require their specific process document. ERDs use editable Draw.io SVGs in `../backend/docs/erd/diagrams/` and per-app Markdown explanations in `../backend/docs/erd/guides/`, following erd-documentation and drawio-erd. Do not create or maintain Mermaid ERDs; Mermaid remains the business-process format. Updating these instructions does not itself authorize generating or migrating ERD artifacts.

## Essential requirements

- Preserve existing user changes and keep implementation within the requested scope. Do not reorganize unrelated features.
- Preserve accessibility, security, data integrity, error handling, and responsive behavior. Frontend controls and route guards do not replace backend authorization or business validation.
- UI changes must use the current semantic theme, preserve light/dark behavior, and support the project's responsive requirements. Read `src/app/index.css` before modifying UI; reuse suitable installed UI controls before creating alternatives. The frontend-ui skill owns the detailed composition, layout, and validation requirements.
- Apply the [brand and experience direction](.agents/skills/frontend-ui/SKILL.md#brand-and-experience-direction) to new features and UI revisions: calm by default, lively when users interact. Preserve the current theme tokens and keep each screen focused; the skill owns the detailed branding rules.
- Keep page-height and minimum-width ownership in the shared shell rather than duplicating constraints on individual pages. Use the frontend-ui skill for the exact rules and supported viewport checks.
- Keep maintained documentation accurate as behavior changes. Explain the current system and retain actual limitations; put execution reports in handoffs or PRs. Skills contain the writing and specialized validation procedures.
- Figma tasks must inspect the supplied design before implementation. Keep stable Figma references in `design/figma/` and application guides in `docs/`. Design briefs are not required or maintained. Current user instructions determine scope; registry entries and historical design records do not authorize canvas changes.

## Implementation simplicity and modularization

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

## Module organization

When a feature has multiple files for one responsibility, group them in a clearly named directory such as `components/`, `hooks/`, `utils/`, or `tests/`, following the project's existing discovery conventions. Keep a single cohesive module colocated until splitting is useful; do not create speculative directories or empty abstractions. When adding a second related module, group the existing and new modules within that scoped change rather than reorganizing unrelated features.

Apply the same convention when working in the backend: multiple test, serializer, view, or service modules belong in `tests/`, `serializers/`, `views/`, or `services/` Python packages, respectively. Follow the backend's `AGENTS.md` for framework-specific requirements. Update affected imports, test patch targets, routing, and documentation references, and verify discovery and behavior after moving files. Keep package initializers or barrel exports small and avoid circular dependencies.

## Checks and handoff

Run checks appropriate to the change. For UI implementation, run `npm run lint` and `npm run build` (which includes TypeScript checking), plus relevant tests and the frontend-ui skill's responsive/theme/interaction checks. Use `npm run test:run` for a single test run. Check current scripts in `package.json` before assuming command names or adding tooling.

For documentation or instruction-only changes, validate the affected files, skill metadata/references where applicable, and link targets/anchors; application tests and production builds do not validate prose or instructions. Report what actually ran and any checks that could not be completed. Do not claim visual validation from syntax checks or Figma inspection alone.

## Maintaining these instructions

Update the root instructions or the owning skill when a code/configuration change makes its guidance inaccurate. Keep each detailed workflow in one maintained home and update references when moving it. Do not edit instructions for changes that do not affect their guidance.

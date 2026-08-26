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

Before making changes that affect system architecture, database design, API contracts, shared data models, or cross-application workflows, review the relevant files and diagrams in the documentation repository.

The documentation repository is the central source of project-wide context. It describes the complete E-Commerce system through entity-relationship diagrams, UML diagrams, business-process flows, architecture descriptions, and other technical documentation.

When implementing changes that depend on another part of the system, inspect the relevant sibling repository to confirm its current behavior. Do not assume that the documentation and implementation are always synchronized; report any inconsistencies you discover.

## UI Styling and Theme

This project uses the shadcn/ui theming architecture with Tailwind CSS. The global design tokens, theme variables, typography, border radii, and light/dark mode colors are defined in `src/app/index.css`.

Before creating or modifying any user interface, inspect `src/app/index.css` and treat its current contents as the source of truth for the project's visual theme. Do not rely on a copied or predefined list of tokens in this file, because the theme may change over time.

Use the semantic theme utilities generated from the variables in `src/app/index.css` whenever an appropriate token exists. Avoid hard-coded Tailwind palette colors, hexadecimal values, RGB values, or fixed light/dark colors for themed interface elements.

All UI changes must remain visually correct in both light and dark modes. Do not assume that backgrounds are always light or that text is always dark.

Before introducing a new color or visual value:

1. Check `src/app/index.css` for an existing semantic token that represents the intended purpose.
2. Review nearby components for established styling patterns.
3. Reuse the existing token or pattern when appropriate.
4. If no suitable token exists, consider whether a new semantic theme token should be added instead of hard-coding the value locally.

When adding or modifying shadcn/ui components, preserve the project's existing theme integration, component variants, accessibility behavior, and styling conventions unless the task explicitly requires otherwise.

When styling elements, ensure they are responsive across both mobile and web views (e.g., reducing the window width should adjust the UI to support smaller screens).

## Maintaining This File

If a code or configuration change makes any instruction in this `AGENTS.md` inaccurate or outdated, update this file as part of the same change. Keep the instructions aligned with the repository’s actual structure, tooling, conventions, and sources of truth.

Do not update this file for changes that do not affect its guidance.

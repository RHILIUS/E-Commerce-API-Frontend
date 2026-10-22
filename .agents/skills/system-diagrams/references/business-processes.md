# Business-process documentation

Repository paths in backticks are relative to the frontend root. Markdown links resolve from this reference.

For every new feature that introduces or changes a business workflow, create or update its specific business-process diagram as part of the work. Update the diagram whenever behavior, decisions, API handoffs, ownership, persistence or recovery changes.

Simple frontend changes limited to presentation or straightforward client-side navigation, such as a branded 404 page, do not require feature documentation or diagram index updates unless explicitly requested. This exemption applies only when the change introduces no business rules, API contract changes, authorization changes, persistence or cross-application workflows.

Purely visual or internal refactoring changes do not require a diagram update when the documented workflow remains accurate.

Maintain SBPs in the **sibling documentation repository** at
`../docs/specific-business-processes/`, using lowercase kebab-case paths. Every
SBP has two matching files:

- `diagrams/<module>/<process-name>.drawio.svg`: editable flowchart.
- `guide/<module>/<process-name>.md`: beginner-friendly explanation.

The basename and module must match; for example, `diagrams/authentication/login.drawio.svg`
pairs with `guide/authentication/login.md`. Create or update both within the
requested workflow scope. Update existing coverage rather than duplicating it.

Before editing, read the [SBP index and maintenance conventions](../../../../../docs/specific-business-processes/README.md)
and relevant module README, and inspect frontend/backend code and contracts.

Apply [drawio-sbp](../../drawio-sbp/SKILL.md) for diagram creation, environment rows,
phase columns, editable SVG handling, and validation. Do not add Mermaid SBPs.
Keep proposals distinct from implemented behavior. Include actual ownership,
entry and completion paths, labeled decisions, blocked progression, retries,
uncertain outcomes, and relevant transaction/replay rules.

Each guide explains the purpose and entry point, walks through the diagram's
phases in plain language, identifies the frontend/backend/external responsibilities,
and explains important decisions, retries, saved state and completion. Define
unfamiliar terms before using them. State whether the flow is implemented or
proposed, and identify known differences between older diagrams and current code.
Link to the diagram and application contracts rather than copying their details.
Apply [documentation-writing](../../documentation-writing/SKILL.md).

Every module has a `guide/<module>/README.md` linking each guide and matching
diagram with a short explanation. Keep proposed flows separate from existing
coverage. Add new modules to the shared root index. Preserve existing
diagrams outside the requested scope. Keep exact API contracts in application
repositories and link to them from shared explanations.

After implementation, reconcile affected processes with actual behavior. Follow
drawio-sbp validation and report the changed files, checks, and limitations in the
handoff. Check matching guide/diagram pairs, index coverage and relative links
after moves. Documentation/index-only work does not require redrawing untouched
SVGs; moving a diagram should preserve its bytes unless changes are requested.

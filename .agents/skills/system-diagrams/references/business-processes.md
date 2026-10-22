# Business-process documentation

Repository paths in backticks are relative to the frontend root. Markdown links resolve from this reference.

For every new feature that introduces or changes a business workflow, create or update its specific business-process diagram as part of the work. Update the diagram whenever behavior, decisions, API handoffs, ownership, persistence or recovery changes.

Simple frontend changes limited to presentation or straightforward client-side navigation, such as a branded 404 page, do not require feature documentation or diagram index updates unless explicitly requested. This exemption applies only when the change introduces no business rules, API contract changes, authorization changes, persistence or cross-application workflows.

Purely visual or internal refactoring changes do not require a diagram update when the documented workflow remains accurate.

Maintain SBPs in the **sibling documentation repository** at
`../docs/specific-business-processes/<module>/<process-name>.drawio.svg`, using
lowercase kebab-case paths. Use an adjacent Markdown guide when explanatory rules
or API handoffs need more room. Update existing coverage rather than duplicating it.

Before editing, read the [SBP index and maintenance conventions](../../../../../docs/specific-business-processes/README.md)
and relevant module README, and inspect frontend/backend code and contracts.

Apply [drawio-sbp](../../drawio-sbp/SKILL.md) for diagram creation, environment rows,
phase columns, editable SVG handling, and validation. Do not add Mermaid SBPs.
Keep proposals distinct from implemented behavior. Include actual ownership,
entry and completion paths, labeled decisions, blocked progression, retries,
uncertain outcomes, and relevant transaction/replay rules.

Every module must have a README linking every SBP with a short explanation and
any companion guide. Add new modules to the shared root index. Preserve existing
diagrams outside the requested scope. Keep exact API contracts in application
repositories and link to them from shared explanations.

After implementation, reconcile affected processes with actual behavior. Follow
drawio-sbp validation and report the changed files, checks, and limitations in the
handoff. Documentation/index-only work does not require redrawing untouched SVGs.

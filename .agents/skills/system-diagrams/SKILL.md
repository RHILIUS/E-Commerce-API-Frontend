---
name: system-diagrams
description: Maintain shared business-process documentation and module indexes using editable Draw.io SBPs; route data-model documentation to the ERD skills.
---

# System diagrams

Use this workflow when implementation introduces or changes a business workflow.
Stay within the requested scope; do not invent endpoints, policies, integrations,
or permission rules.

Shared SBPs belong in the sibling documentation repository at
`../docs/specific-business-processes/`, distinct from frontend `docs/`. Pair each
`diagrams/<module>/<process-name>.drawio.svg` with a beginner-friendly
`guide/<module>/<process-name>.md`. The matching guide explains the flow;
`guide/<module>/README.md` indexes both files.

## Choose the applicable reference

- For business workflows, read [business-process requirements](references/business-processes.md), then apply [drawio-sbp](../drawio-sbp/SKILL.md) for drawing and validation.
- For data models, use [erd-documentation](../../../../backend/.agents/skills/erd-documentation/SKILL.md), which coordinates backend-owned guides and editable Draw.io ERDs. Do not create Mermaid ERDs.
- Apply both workflows when behavior and its data model change. Do not load ERD references for standalone SBP work.

## Validation and handoff

Follow drawio-sbp for structural inspection, branch review, SVG rendering, and
Draw.io reopening when available. Validate module indexes, companion-guide links,
and implementation status. Report actual checks and limitations in the handoff.
Do not claim visual validation from structural checks alone.

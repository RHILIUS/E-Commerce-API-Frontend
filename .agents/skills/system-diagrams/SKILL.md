---
name: system-diagrams
description: Maintain Mermaid business-process diagrams for new or changed workflows in the shared documentation repository; route data-model documentation to the ERD skills.
---

# System diagrams

Use this workflow when implementation introduces or changes a business workflow. Documentation work remains within the user's task scope; do not invent missing endpoints, policies, integrations, or permission rules.

Repository paths in backticks are relative to the frontend root. Shared diagrams belong in the sibling documentation repository, not the frontend's local documentation folder.

## Choose the applicable reference

- For a new or changed business workflow, read [business-process requirements](references/business-processes.md). They define triggers, presentation/refactoring exemptions, Mermaid swimlane notation, actual ownership, recovery, and handoff requirements.
- For data-model documentation, use [erd-documentation](../erd-documentation/SKILL.md), which coordinates per-app guides and editable Draw.io SVGs through [drawio-erd](../drawio-erd/SKILL.md). Do not use Mermaid ERDs.
- Apply both workflows when a task changes business behavior and its data model. Do not load business-process references for a standalone ERD task.

Read the central diagramming specification, diagram index, and relevant frontend/backend code and contracts as required by the selected reference. Keep proposed and implemented behavior distinct, reconcile documentation after implementation, and update the central index when required.

## Validation and handoff

Validate new or changed Mermaid business-process fences with a recorded Mermaid version, inspect rendered output, and check the intended Markdown host when available. ERD validation belongs to the ERD skills. Distinguish parsing, rendering, and host checks; report exactly what ran and any limitations. Include changed diagrams and actual validation results in the feature handoff.

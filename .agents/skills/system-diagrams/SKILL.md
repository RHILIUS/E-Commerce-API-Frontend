---
name: system-diagrams
description: Maintain business-process diagrams for changed workflows and ERD documentation for changed data models in the shared documentation repository.
---

# System diagrams

Use this workflow when implementation introduces or changes a business workflow, or when creating/updating shared ERD documentation. Documentation work remains within the user's task scope; do not invent missing endpoints, policies, integrations, or permission rules.

Repository paths in backticks are relative to the frontend root. Shared diagrams belong in the sibling documentation repository, not the frontend's local documentation folder.

## Choose the applicable reference

- For a new or changed business workflow, read [business-process requirements](references/business-processes.md). They define triggers, presentation/refactoring exemptions, Mermaid swimlane notation, actual ownership, recovery, and handoff requirements.
- For a new or changed Markdown ERD, read [entity-relationship requirements](references/entity-relationships.md). They define entity/field explanations, relationships, lifecycle notes, and validation.
- Read both when the task affects both responsibilities. Do not load the unrelated reference for a task that needs only one.

Read the central diagramming specification, diagram index, and relevant frontend/backend code and contracts as required by the selected reference. Keep proposed and implemented behavior distinct, reconcile documentation after implementation, and update the central index when required.

## Validation and handoff

Validate new or changed Mermaid fences with a recorded Mermaid version, inspect rendered output, and check the intended Markdown host when available. Distinguish parsing, rendering, and host checks; report exactly what ran and any limitations. Include changed diagrams and actual validation results in the feature handoff.

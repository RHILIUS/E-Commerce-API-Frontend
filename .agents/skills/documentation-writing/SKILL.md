---
name: documentation-writing
description: Write or revise maintained frontend guides with plain-language explanations, accurate current behavior, and a clear reading order.
---

# Documentation writing

Apply this workflow when writing or revising maintained frontend documentation, including documentation updated alongside implementation. The guidance is self-contained; do not require another guide as a style example. Task-specific design and PR workflows have their own instructions.

Write maintained documentation for a future implementer who has never seen this project. Assume no knowledge of its architecture, terminology, repository layout, or earlier development conversations. Explain the current application in simple, concrete language while keeping technical details accurate.

## Explain Before Naming the Implementation

- Start with what the feature does, who uses it, and why it exists. Explain the customer's experience before introducing components, hooks, routes, or API contracts.
- Use short sentences and familiar words. Explain unfamiliar terms and abbreviations on first use. For example, introduce an idempotency key as an identifier that lets the backend recognize a repeated order request without creating another purchase.
- Use small, realistic examples when they clarify a distinction, such as a personal address versus a delivery recipient. Keep the tone respectful; simple explanations should not sound childish.
- Explain why important behavior exists, especially ownership boundaries, separate save actions, persistence, and recovery after an uncertain request outcome. Plain language must not hide rules an implementer needs to preserve.
- Introduce technical details gradually. Use tables for fields, requests, and file responsibilities, and numbered steps for workflows. Scale the structure to the feature rather than adding empty or repetitive sections.

## Keep a Clear Starting Point

- Provide a repository introduction covering the application's purpose, the repositories' roles, local setup, everyday commands, and links to deeper guides.
- Provide a documentation index as the reading map. Add or update its entries when guides are added, moved, or removed.
- Provide an architecture introduction covering startup, routing, authentication, API communication, state, folders, shared UI, and theming. Link to it instead of repeating the full architecture in every feature guide.
- These are documentation responsibilities, not fixed filenames or assumptions that particular guides already exist. Inspect the current structure and update an appropriate existing guide or create one when needed. Keep these writing instructions self-contained rather than relying on another document as the required style example.
- Keep frontend explanations in the local `docs/` folder, exact server contracts in the backend documentation, and shared architecture and business-process diagrams in the sibling documentation repository. Explain the difference between local `docs/` and sibling `../docs/` when introducing the repositories.
- Use relative links to maintained guides and source files. Check that targets exist. Explain the sibling checkout layout and provide repository links for readers viewing the frontend alone on GitHub.

## Organize Feature Guides Around Understanding

Prefer this reading flow, adapting headings and combining sections where useful:

1. **Purpose and entry point:** Explain the feature, its key concepts, who can use it, and how customers reach it.
2. **Customer behavior:** Explain the available information and actions, then walk through the normal successful flow.
3. **Rules and saved state:** Explain what changes, what remains separate, what survives navigation or reload, and which responsibilities belong to the frontend or backend.
4. **Failures and recovery:** Explain validation errors, loading failures, blocked actions, duplicate submissions, and uncertain outcomes where applicable. State what the customer can do next.
5. **Requests and code locations:** Introduce the relevant request routes, payloads, response behavior, and focused source references after the behavior is clear. Link to backend contracts and shared process documents for deeper detail.

For setup and deployment guides, first explain what the services do and how they connect, then give prerequisites, ordered instructions, configuration values, and useful troubleshooting. Define placeholders and distinguish local settings from deployed settings.

## Describe the Current System

- Write guides as lasting explanations of how the implemented application works. Avoid chronological change logs, implementation dates, PR narratives, and reports of work completed during a particular session.
- Check the relevant code and contracts before describing behavior. Reconcile stale statements within the authorized scope and report inconsistencies that remain elsewhere. Do not invent missing behavior or link to nonexistent documents.
- Keep actual limitations visible, including test-only payments, unavailable actions, and deferred integrations. Do not describe a proposal as implemented or label a working feature as deferred. Keep proposed designs clearly separate from current behavior.
- Do not add **Verification** sections, completed test checklists, browser-check counts, screenshots of validation runs, or historical lint/build results to maintained overview and feature guides. Put execution evidence in the PR description or implementation handoff. Reusable instructions for running tests belong in setup or contributor documentation.
- Continue performing the checks required by the change. Mermaid business-process diagrams require version and validation records through system-diagrams. ERD guides and editable Draw.io SVGs follow [erd-documentation](../../../../backend/.agents/skills/erd-documentation/SKILL.md) and [drawio-erd](../../../../backend/.agents/skills/drawio-erd/SKILL.md), including their structure, rendering, and host checks. Put execution evidence in the handoff or PR. This writing guidance does not remove validation or PR reporting obligations.

## Check the result

Confirm the guide matches current implementation and contracts, that its reading order introduces concepts before details, and that file links and Markdown anchors resolve. Review formatting with the project's configured formatter. Report checks and unresolved inconsistencies in the handoff; do not add historical validation reports to the guide.

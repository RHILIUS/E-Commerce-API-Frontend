---
name: pull-request-writing
description: Prepare frontend pull request descriptions and PR documentation using the project section order and evidence requirements.
---

# Pull request writing

Apply this workflow when the user requests a frontend PR description or PR documentation. It defines the written deliverable; it does not authorize creating, publishing, or merging a PR. A standalone commit-message request does not need this full template.

Inspect the implemented diff, available requirement/design links, and actual validation evidence before writing. Do not infer completed checks from available test scripts or previous unrelated runs.

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

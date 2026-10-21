---
name: drawio-sbp
description: Create, inspect, or refine specific business process (SBP) flowcharts as editable Draw.io SVGs, using environment rows, named phase columns, aligned flow symbols, and grouped annotations. Use for SBP planning and visualization; not ERDs or general UI design.
---

# Draw.io SBP

Create an editable `.drawio.svg` whose visible drawing and embedded Draw.io model agree. Follow the user's SBP conventions below. Preserve their existing diagram and requested scope.

## Start with the actual flow

Inspect the supplied file before interpreting its latest changes. Decode the embedded model as well as viewing the SVG; do not rely on an earlier conversation snapshot. For inspection and structural checks, run:

```bash
python scripts/inspect_sbp.py path/to/feature.drawio.svg
```

Paths above are relative to this skill directory. Add `--cells` for labels, parents, geometry and styles; add `--complete` only when the user requests a finished flow. `--model-out /tmp/model.xml` writes decoded XML for editing or review. This helper does not render or modify the source diagram.

For an implemented workflow, inspect its producers, consumers and documented contracts. For planning, develop the requested future flow and explain material assumptions in the handoff. Do not present invented routes or policies as existing behavior. Do not add “proposal” to every diagram label; keep labels focused on the step.

The [forgot-password sample](assets/forgot-password-sample.drawio.svg) demonstrates the visual conventions. Its OTP, token, transaction and session rules are feature-specific planning decisions, not requirements for unrelated processes. Inspect it when a concrete visual or editable structure is useful; do not copy its feature logic into another flow.

## Compose the SBP

Use Draw.io's **Cross-Functional Flowchart** table as the parent:

- Top title: the feature's business-process name.
- Rows: architectural or technological environments, not generic actors. Usually **Frontend** (client) and **Backend** (owned API/Django, database/PostgreSQL, Redis and Celery infrastructure). Add external environments such as **Email Provider** when involved. Do not split every backend technology into a row by default.
- Columns: named business phases, aligned across all environment rows. Prefer short, parallel action names such as “Send OTP Email” and “Verify OTP.” The number and names follow the actual workflow.
- Start with a **Start terminator**. For a customer-facing feature, begin in Frontend from the user's perspective, showing how they reach and access the feature. Do not invent a client interaction for a genuinely server-triggered process.
- Begin at the left and proceed downward; expand into aligned columns to the right as the flow grows. These internal alignment columns are separate from phase columns. Return arrows may travel upward or leftward when responsibility or retry behavior requires it.
- Include internal application logic as process steps in its owning environment. Use a short **“(So …)”** explanation when the purpose would confuse a first-time reader; omit it for obvious steps.
- Use decisions with explicit outcome labels, recovery loops and meaningful handoffs. Errors do not automatically end the process. A complete flow reaches an **End terminator** through its intended completion path; do not close a still-in-progress training example prematurely.

Read [visual conventions](references/visual-conventions.md) when creating or changing symbols, layout, colors or headers. It contains the symbol mapping, palette, spacing, body typography and title ratios.

## Edit reliably

Read [editable SVG handling](references/editable-svg.md) before modifying embedded XML, grouping cells, changing headers or updating a generated SVG. Preserve named styles such as `swimlane;`; dropping them can hide phase labels in Draw.io even while SVG text remains visible.

Treat the symbol, its supporting annotation and their annotation connector as one editable group. Connect execution arrows to the actual flow symbol, never to its annotation. Keep the saved file editable; changing only the SVG label or only the embedded model is incomplete.

Use the requested file/location. In a repository, follow its documentation ownership rules; this skill does not migrate existing Mermaid documents, ERDs, or indexes without scope to do so. Existing filesystem approval boundaries still apply.

## Validate and deliver

Run the structural helper after edits, using `--complete` for a completed flow. Check the intended business path and every decision/recovery branch separately; structural checks cannot prove business correctness.

Render the saved SVG and inspect it at normal size and zoomed out. Verify title visibility, text fit, alignment, colors, grouped annotations, border clearance, arrowheads, and labels near crossings. Check the editable file in Draw.io when available, especially after header/style changes. Distinguish SVG rendering from actual Draw.io reopening; report any unavailable check.

Report the file, key changes, validation performed and material assumptions. Do not claim completion while required edits remain only in a temporary draft. Keep execution reports out of the diagram itself.

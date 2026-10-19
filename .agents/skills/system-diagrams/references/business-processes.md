# Business-process documentation

Repository paths in backticks are relative to the frontend root. Markdown links resolve from this reference.

For every new feature that introduces or changes a business workflow, create or update its specific business-process diagram as part of the work. Update the diagram whenever behavior, decisions, API handoffs, ownership, persistence or recovery changes.

Simple frontend changes limited to presentation or straightforward client-side navigation, such as a branded 404 page, do not require feature documentation or diagram index updates unless explicitly requested. This exemption applies only when the change introduces no business rules, API contract changes, authorization changes, persistence or cross-application workflows.

Purely visual or internal refactoring changes do not require a diagram update when the documented workflow remains accurate.

Maintain these documents in the **sibling documentation repository** at `../docs/diagrams/specific-business-processes/<feature-area>/<process-name>.md`, using lowercase kebab-case paths. This is distinct from the frontend's local `docs/` folder. Update an existing process document when appropriate rather than creating duplicate descriptions of the same workflow.

Before creating or updating a diagram, read the [central diagramming specification](../../../../../docs/diagrams/diagramming-specification.md), check the [diagram index](../../../../../docs/diagrams/README.md), and inspect the relevant frontend, backend and documented contracts.

Use fenced Mermaid blocks for **activity-style business-process diagrams with swimlanes**, following the specification's `swimlane-beta TB` conventions. Mermaid swimlane flowcharts are not strict UML activity diagrams; describe their notation accurately. Do not substitute draw.io, PlantUML, image exports or sequence diagrams for the required Mermaid process document unless the user requests a different format. Sequence diagrams may supplement the activity-style flow when useful.

Each process document must:

1. State its scope and distinguish proposed behavior from implemented behavior. Do not present planned endpoints, policies or integrations as existing contracts.
2. Assign actions to their actual owners. Place customer interactions in Frontend, authorization and business validation in Backend, and add Database or external service lanes such as Email Provider only when those responsibilities need to be shown explicitly.
3. Show clear entry and exit points, meaningful actions, decisions with labeled outcomes, and the successful path. Show validation failures, blocked progression, retry or restart behavior, and uncertain request outcomes when relevant; invalid branches must never fall through to success.
4. Label cross-lane requests and responses. Put exact routes, request fields and response contracts in an adjacent handoff table when they would make diagram nodes unreadable.
5. Identify transaction boundaries, commit/rollback, durable changes, ownership checks, concurrency and idempotency behavior where relevant. Keep common guards and detailed rules beside the diagrams rather than repeating them in every phase.
6. Split long workflows into named phases with explicit continuation points, keeping each diagram readable. Document important scope exclusions and unresolved contract decisions without inventing behavior to fill gaps.
7. Add or update its entry in `../docs/diagrams/README.md` and ensure relative links resolve. Keep the central document as the maintained source rather than copying it into frontend documentation.

Validate all Mermaid fences with a recorded Mermaid version and inspect rendered diagrams for readable labels, clipping, responsibility boundaries and recovery paths. Check the intended Markdown host when available because `swimlane-beta` support varies. If parsing, rendering or host verification cannot be completed, report the specific limitation and record what was actually checked; do not claim visual validation from syntax checks alone.

When implementation is complete, reconcile the process document with the actual code and API contract, updating its status and any affected flow. Include the diagram changes and validation results in the feature handoff.

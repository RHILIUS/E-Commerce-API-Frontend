# SBP visual conventions

These are the user's reusable visual rules. Adjust measurements when the user requests it or content genuinely needs more room; preserve their relationships and inspect the result.

## Symbols and connectors

| Meaning | Draw.io shape/style |
| --- | --- |
| Start / End terminator | `shape=mxgraph.flowchart.start_1` (oval used in the sample) |
| Action or internal logic | Rounded process rectangle |
| Rendered page or displayed UI | `shape=mxgraph.flowchart.display` |
| User entering/submitting data | `shape=manualInput` |
| Request, response or data transfer | `shape=parallelogram` |
| Conditional branch | `shape=mxgraph.flowchart.decision` |
| Supporting explanation or API details | `shape=mxgraph.flowchart.annotation_1` |

Use solid directional arrows for flow within an environment. Use dashed directional arrows for communication between environments. Use rounded orthogonal bends for column shifts and return routes. Use a short dashed connector **without an arrowhead** for an annotation. An annotation explains a step; it does not execute or receive a request.

For an HTTP transfer, put the short action in the symbol and supporting method, known endpoint, relevant body fields and response details in its annotation. Do not invent a provider-specific endpoint or response shape to fill space. An operation name is sufficient when exact routing is not decided.

## Alignment and spacing

- Align flow **symbols by centerline** within each internal layout column. An annotation does not move its symbol off that centerline.
- Size columns around the widest grouped symbol-plus-annotation footprint. Keep related steps on horizontal rows where the flow moves between columns.
- Keep comparable horizontal connectors equal in length where symbol widths permit. Respect the shared grid rather than positioning each pair independently.
- Use a **20 px horizontal gap**, measured from the symbol's right bounding edge to the annotation bracket. Center the annotation beside the symbol. Group both and their dashed annotation connector under a common editable parent.
- Default annotation width: **190 px**. Wrap text and grow its height when needed; do not create a wide invisible text box or hide overflow. Long endpoints may need deliberate line breaks or a modest width adjustment.
- Keep arrows running parallel to borders at least **30 px** inside them. This includes outer, phase, environment and header borders. A necessary crossing between phases/environments may cross a border perpendicularly; do not run along it or place a bend or arrowhead on it.
- Route returns through open gutters. Keep them away from unrelated symbols and annotations, even if this makes an arrow longer.
- Place each edge label on a clear part of **its own arrow**. Leave visible space from other lines, crossings, bends and borders. Prefer about **12 px** clearance from unrelated lines and **15 px** from borders for label bounds; move the label along the route or reroute the arrow when necessary. A white label background must not conceal another connector.
- Expand the parent, affected rows and phase widths together when space is needed. Preserve sibling phase boundaries and shared column alignment.

## Color hierarchy

Success/error meaning overrides the normal shape palette. Reserve the stronger red/green fills for outcome responses and confirmation/error displays. Do not color every preceding process green just because it lies on the successful path. Labels and decision outcomes must remain understandable without color.

| Component | Fill | Outline |
| --- | --- | --- |
| Error response/display | `#f8cecc` | `#b85450` |
| Success response/confirmation | `#d5e8d4` | `#82b366` |
| Ordinary process | `#f3f6fb` | `#8fa4bc` |
| Manual input | `#f6f2fa` | `#a99bb8` |
| Page/display | `#f0f7f8` | `#91adb0` |
| Decision | `#fff8e8` | `#b9aa82` |
| Neutral request/response | `#f4f5f6` | `#a4abb2` |
| Start/End | `#eef1f4` | `#586574` |

Use dark text, such as `#18212c`. Annotations have no fill and inherit their associated symbol's outline color. Keep connectors neutral. Use subtle neutral header fills rather than success/error colors. These values assume a light canvas; if the user requests dark rendering, check contrast and visibility in that rendering instead of assuming light colors remain suitable.

## Body typography and text fit

Use a shared **20 px body size**, independent of each symbol's width or the total diagram width. Keep supporting text at **0.9 × body size (18 px)**. Do not shrink individual labels to make them fit.

| Text | Size | Weight |
| --- | --- | --- |
| Shape/action labels | 20 px | Semibold (600) |
| Decision questions and Start/End | 20 px | Bold (700) |
| Connector labels | 18 px | Semibold (600) |
| Annotation text | 18 px | Regular (400); bold field headings such as Status, Method and Body |
| Secondary “(So …)” explanations | 18 px | Regular (400) |

Use an installed font with these weights when available; a browser may map semibold to bold when only regular/bold faces exist. Keep the semantic hierarchy consistent in both SVG text and editable Draw.io HTML labels.

Use line height **1.25–1.35 × font size** (the sample uses 1.3) and internal padding of at least **0.75 × font size**. Allow at least **2 × body size** between ordinary sequential components where routing permits, with extra room for labels and return paths. The dedicated symbol-to-annotation gap remains **20 px**.

Grow shapes and annotation heights to fit the text; preserve centerline alignment, grouped annotations and narrow annotation widths. Shorten wording or move supporting details into annotations before making a shape unnecessarily large. Wrap long endpoints at sensible separators. Decisions, parallelograms, displays and manual-input shapes need extra clearance from their sloping sides.

Use existing whitespace before expanding the entire diagram. Uniformly enlarging both text and the whole canvas offers no improvement in a fit-to-width view. Target readable body text when viewing one phase; in the whole-diagram overview, prioritize legible titles and navigable structure. If every detail must be readable in one overview, simplify or split the flow rather than promising that bold text alone will solve it.

Validate actual rendered text bounds, larger connector-label bounds, and collision/border clearance after reflow. Never rely only on the nominal font-size style.

## Proportional titles and header containers

Let `clamp(min, value, max)` bound the font size; round to whole pixels.

| Title | Font rule | Range |
| --- | --- | --- |
| Main SBP | `0.012 × total parent width` | 28–64 px |
| Phase | `0.028 × that phase's column width` | 22–40 px |
| Environment | Largest phase-title font size | 22–40 px |

Make titles bold and explicit dark text. Center the main title and phase labels. Environment labels are rotated in a shared left strip, as in the sample.

Use **at least 1.6 × font size** for header height or environment-strip width. All phase headers share a height based on the largest phase-title font. Round container dimensions up. Keep these minimums from the sample unless the user requests a more compact design: **64 px main-header height**, **52 px phase-header height**, **64 px environment-strip width**.

Fit real text, not just a nominal font: wrap a long title or enlarge its header before shrinking it. For a rotated environment title, check its length against the row height. Increasing header dimensions must shift content, connector waypoints and labels consistently; do not overlay a larger title on an unchanged flow.

For the current 6,314 px-wide sample, these rules produce a **64 px** main title in a **103 px** header, **37/35/40/40 px** phase titles in a shared **64 px** header, and **40 px** environment titles in a **64 px** strip. These are example results, not fixed sizes for every diagram.

Inspect the entire diagram zoomed out as well as detailed crops. Titles should remain useful for navigation when individual step labels are too small to read. Avoid large commentary blocks outside the main parent; use concise local annotations or a brief handoff explanation instead.

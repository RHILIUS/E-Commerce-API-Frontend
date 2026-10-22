# Editing and checking Draw.io SVGs

## Keep two representations synchronized

A `.drawio.svg` contains ordinary rendered SVG plus a `content` attribute containing an `<mxfile>`. Each `<diagram>` may hold an uncompressed `<mxGraphModel>` child or compressed text. For compressed text, decode **base64 → raw DEFLATE (`wbits=-15`) → URL-unquote → XML**. Reverse these steps when saving. XML-escape the `<mxfile>` once as the SVG attribute value; use an XML serializer rather than concatenating quoted attributes.

Inspect the intended page of a multi-page file; preserve the other pages. The bundled inspector supports both common model encodings. Do not overwrite user changes made after your initial read: compare the current source with the snapshot before installing a draft, and merge if it changed.

## Model structure and styles

- Preserve cell IDs, parent relationships and edge source/target references when refining an existing file.
- Table → environment `tableRow` → phase `swimlane` → symbols/groups describes the sample's hierarchy. Phase widths/boundaries match across rows; titles appear in the first row's phase headers.
- Preserve **bare named styles**, such as `swimlane;`, alongside `key=value;` entries. A parser that keeps only tokens containing `=` silently loses these names. On titled phase cells, preserve/restore `swimlane;` and set `shape=swimlane`, a positive `startSize`, `horizontal=1`, explicit font size/color, and centered labels when repairing hidden titles.
- Keep main table, environment-strip and phase-header `startSize` values consistent with their actual geometry. Retain the row's own orientation; do not accidentally rotate phase labels with environment labels.
- A symbol-plus-annotation group contains the two vertices and the arrowless dashed annotation edge. Execution edges still attach to the symbol inside the group.
- On regrouping, convert child geometry to the new parent's local coordinates so absolute positions do not change.
- Orthogonal edge waypoints are relative to the edge's parent. Edge-label offsets are separate geometry; do not apply a content shift to those relative offsets a second time.
- Header enlargement should shift all affected symbols, groups, waypoints and rendered labels uniformly, while updating row/table sizes and phase bounds.

## Rendering

Prefer native Draw.io export with the editable diagram embedded when available. If rendering separately, derive both the SVG and embedded model from the same geometry and styles. Keep SVG dimensions/viewBox large enough for the main box; remove obsolete exterior-comment space when those notes are removed.

When using a browser, load the SVG as an SVG document or an image rather than blindly pasting XML into HTML. XHTML labels inside `foreignObject` can behave differently under HTML parsing, especially after namespace prefixes are introduced. Use the correct XML context and inspect the actual saved artifact. A successful XML parse is not visual validation.

The [sample asset](../assets/forgot-password-sample.drawio.svg) uses native SVG text and shapes with embedded editable Draw.io data. It can be inspected without installing Draw.io; actual editor behavior still needs a separate reopening check when available.

## Checks

Run `scripts/inspect_sbp.py FILE` after structural edits. It checks embedded XML, IDs, parents, edges, titled phase styles, annotation groups and 20 px gaps. `--complete` additionally checks Start/End terminators and Start-to-End reachability. It deliberately allows an unfinished training sample without End when that flag is absent.

These checks do **not** prove the branch logic is correct, that every possible error is covered, that annotations fit, or that a file renders correctly. Review those separately:

- Decisions have labeled outcomes; invalid branches cannot fall through to success.
- Error responses reach an appropriate display/retry/restart path.
- All communication belongs to the correct environment; a provider accepting a request is not proof of inbox delivery.
- Title and body text fit; phase labels remain present in both SVG and model.
- Red/green outcomes override muted defaults consistently in both representations.
- Grouping, centerlines, annotation widths/gaps and comparable arrow lengths follow the visual reference.
- Parallel arrows clear borders; edge labels do not obscure crossing or nearby lines.
- A complete success path reaches End; retry loops remain intentional.

Run checks appropriate to the diagram, not unrelated application lint/build commands. State separately what was parsed, rendered, visually inspected, and reopened in Draw.io.

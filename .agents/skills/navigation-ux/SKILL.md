---
name: navigation-ux
description: Design, implement, or review navigation scroll and focus behavior when changing routes, browser history, section links, or content updates that affect reading position. Use across web frameworks and document or panel scroll containers.
---

# Navigation UX

Keep navigation predictable: a new destination starts at its intended entry point, returning restores context, and local interactions preserve the user's place unless revealing changed content is more useful. Apply this guidance to the requested work; it does not authorize a wider navigation rewrite.

## Inspect the Existing Navigation

Identify the navigation system, shared layout, actual scroll containers, existing restoration behavior, and asynchronous rendering before choosing an implementation. Check whether different resources reuse the same view and whether query parameters represent a new result set or a local interaction. Distinguish the browser window from independently scrolling panels.

Prefer suitable browser or framework restoration facilities. Coordinate custom behavior in a shared application layer with one owner per scroll container. Avoid competing page-level effects and duplicate restoration mechanisms. Keep framework APIs, filenames, and project exceptions in project documentation rather than making them prerequisites of this skill.

## Choose Behavior by Intent

| User intent                                            | Expected behavior                                                                                                                                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Open a different page or resource                      | Start at its intended entry point, usually the top, even when the same component renders both resources. Honor explicit section targets.                                                               |
| Return through Back or Forward                         | Restore that history entry's previous position and the view state needed to make it reachable. Separate visits to the same URL may have different positions.                                           |
| Follow a section or skip link                          | Reveal the intended target without hiding it beneath a fixed header; move focus when appropriate to the link's purpose.                                                                                |
| Change tabs, filters, sorting, or pagination           | Decide whether to preserve context or reveal the changed results. A query-string change alone does not determine scroll behavior. Keep the initiating control or results understandable and reachable. |
| Append more content                                    | Preserve the existing reading position. Continue keyboard focus into appended content only when appropriate to the user's action.                                                                      |
| Change a local option, expand content, or use a dialog | Preserve reading context unless the action needs another target revealed. Dialogs follow their focus-management conventions and return focus to an appropriate control when closed.                    |

Make deliberate exceptions for experiences such as readers or workspaces that resume at a saved location. Record the intended behavior and reason in that project's guidance.

## Restore Reachable Content Reliably

- Associate saved positions with history entries and the relevant scroll containers, rather than only with URLs. Capture outgoing positions before layout removal can shrink the container and clamp its offset.
- Restore the required view state as well as its offset. Depending on the interface, this can include filters, expanded sections, accumulated pages, or a virtualized item's identity. Use a stable content anchor when pixel offsets would be unreliable.
- Wait for the content needed by restoration. Use existing data-loading and rendering signals where possible; account for images and layout shifts. If retries are necessary, bound them, cancel them on navigation or unmount, and stop when the user takes control. Avoid arbitrary delays as the primary readiness signal.
- Treat navigation, initial load, and reload separately. Define what survives each; use the simplest storage and lifetime that satisfy the actual requirement. Bound retained state, scope it to the correct viewer and resource, and invalidate it when authentication or content changes make it inappropriate. Do not store credentials for scroll restoration.
- When saved content is unavailable or cannot be restored, settle at a useful reachable position. Do not keep pulling the user toward an unreachable offset or silently claim exact restoration.

## Preserve Focus and Reading Context

For new-page navigation, give keyboard and screen-reader users an appropriate destination, such as the main heading or content region, without causing an extra scroll jump. Choose the target according to the page's semantics rather than assuming one selector works everywhere.

Keep focus with ongoing same-page interactions. On history navigation, preserve or restore meaningful focus when supported instead of always sending it to the top. Coordinate explicit section targets, validation feedback, dialogs, and router behavior so they do not compete for focus or scroll.

Keep automatic repositioning immediate by default. Reserve smooth scrolling for intentional movement where it helps, respect reduced-motion preferences, and keep targets visible beneath fixed or sticky interface elements.

## Verify the User Journey

Adapt verification to the affected interface and supported environments:

- Open one resource, scroll down, return to the list, then open another resource. The new resource should start at its intended entry point.
- Use Back and Forward between independently scrolled entries, including repeated visits to the same URL and resources rendered by the same component.
- Return after loading additional content or changing view state; verify that the prior content and position remain reachable.
- Check delayed rendering, missing content, direct section links, and section targets beneath fixed headers. Confirm user input stops pending restoration.
- Check the intended position and focus after local controls, result changes, and dialogs. Include keyboard and touch interaction, reduced motion, narrow screens, and nested scroll containers when relevant.

Use behavior tests for history and restoration regressions, and a real browser for geometry, loading shifts, and focus visibility. Syntax checks or mocked scroll calls alone do not prove browser behavior. Report actual coverage and remaining limitations in the handoff; keep execution reports out of this skill.

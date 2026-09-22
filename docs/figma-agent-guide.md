# Figma agent workflow and design architecture

This is the starting guide for agents creating or updating this project's Figma UI. Read it alongside [AGENTS.md](../AGENTS.md), the [node registry](figma-nodes.md), and the task's feature brief. It documents project conventions and a read-only inspection on **2026-09-22**; recheck live nodes and source files before editing. It is not authorization to start a design task or change unrelated screens.

## Design brief naming and discovery

Store task-specific design instructions at `docs/<feature-area>/<subject>-design-brief.md`. Use lowercase kebab-case for both path segments. The subject may be a screen, reusable component, or multi-screen flow; choose the smallest cohesive scope rather than requiring a separate document for every Figma frame.

For example, `docs/ecommerce/store-profile-design-brief.md` describes a screen, while `docs/authentication/account-recovery-design-brief.md` describes a flow. These are naming examples, not existing files or approved features.

Before a design task, locate relevant briefs with `rg --files docs -g '*-design-brief.md'` and read those matching the requested feature and its dependencies. Briefs should state their scope clearly so unrelated instructions are not applied to another screen. If no matching brief exists, work from the current request and relevant documentation; create a brief when documenting the design is part of the task.

Each brief should include:

- Status: proposed, approved, or superseded, based on actual decisions.
- Feature intent, requirements, and explicit scope boundaries.
- Exact Figma source and destination links/IDs, with access or inspection limits identified.
- Relevant source components, reusable Figma dependencies, and theme considerations.
- Required content, states, interactions, and responsive adaptations.
- Accepted decisions, provisional suggestions, and unresolved questions kept distinct.
- Data/API dependencies and prototype limitations without invented guarantees.
- Validation expectations and design handoff requirements.

Keep shared architecture and workflow rules in this guide, stable node mappings in the registry, and feature-specific decisions in the brief. Update the existing brief as decisions change instead of creating competing copies. Link a replacement when a brief is superseded. New briefs do not require adding feature-specific references to AGENTS.md.

## 1. Sources of truth and scope

| Source                                                                                       | Responsibility                                                           |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Current user instructions                                                                    | Authorized task, target nodes, constraints, and accepted decisions       |
| [AGENTS.md](../AGENTS.md)                                                                    | Repository workflow and implementation rules                             |
| [src/app/index.css](../src/app/index.css)                                                    | Current semantic colors, both themes, typography, radii, document sizing |
| Existing frontend components and consumers                                                   | Implemented variants, sizes, interactions, and composition               |
| Approved Figma design                                                                        | Intended visual layout for initial implementation                        |
| Frontend code after design approval                                                          | Subsequent synchronization of implemented screens back to Figma          |
| [Local feature documentation](ecommerce/product-catalog.md) and sibling `../docs` repository | Frontend integration context and project-wide requirements/architecture  |
| Sibling `../backend` implementation                                                          | Verified API and permission behavior                                     |

Do not silently resolve a conflict between a business requirement, design, and implementation. Record the discrepancy and distinguish a proposed design from verified behavior. Inspect relevant sibling documentation and implementation before defining shared contracts, permissions, deletion behavior, or order workflows. A Figma prototype cannot establish those guarantees.

For design-only work, do not add frontend dependencies or implement the page. For documentation-only work, do not modify the canvas. Continue authorized routine work without introducing extra approval gates; ask only for a missing decision that blocks dependent work.

## 2. Actual file organization

The current destination is [Migration E-Commerce Wireframe](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5002-2706&m=dev), file key `8F5dYlZFxUEN6HKHWMOAwe`.

The supplied `5002:2706` node is the **Web page**, not an individual product screen. Access was verified. The following is a scoped structural inventory, not a visual audit or an exhaustive component catalog.

| Page or container      | ID          | Purpose / handling                                                      |
| ---------------------- | ----------- | ----------------------------------------------------------------------- |
| Web                    | `5002:2706` | Current application screens and ecommerce components                    |
| Web (Deprecated)       | `5569:701`  | Historical reference; do not use as the default destination             |
| Mobile (Deprecated)    | `5165:108`  | Historical reference; does not remove current mobile requirements       |
| Ecommerce / Components | `5569:959`  | Frame within Web containing the shared Header and Product Card set      |
| Button                 | `72:2719`   | Component-library page; inspect relevant components when needed         |
| Card                   | `72:2721`   | Component-library page                                                  |
| Carousel               | `72:2722`   | Component-library page; availability does not mandate a carousel design |
| Badge                  | `72:2718`   | Component-library page                                                  |
| Alert                  | `72:2633`   | Component-library page                                                  |
| Lucide Icons           | `135:2`     | Icon-library page consistent with the frontend's icon package           |

Other pages include form controls, navigation, dialogs, charts, examples, blocks, and additional icon libraries. Some names repeat, such as Sidebar and Tooltip. Locate by ID and purpose, not name alone. Do not traverse all library/example pages for an ordinary screen update or reorganize them as incidental cleanup.

Within Web, the inspected structure includes:

```text
Web (5002:2706)
├── Register OTP Page (5023:3730)
├── Register Details Page (5354:467)
├── Register Email Page (5354:429)
├── Register Page / Components (5058:262)
├── TermsOfService [component] (5098:786)
├── Login Page (5100:181)
├── Landing Page (5569:353)
│   ├── Header [instance] (5569:354)
│   └── Content (5569:355)
├── Ecommerce / Components (5569:959)
│   ├── Header [component] (5569:950)
│   └── Product Card / Refined [component set] (5550:5650)
└── AccountOverlay (5587:148)
```

The registry remains the primary lookup for stable screen/component links. Preserve existing nodes and prototype links when updating them. Put new feature screens near the relevant ecommerce content in clear canvas space. Reuse the existing component container for directly related reusable components when appropriate; do not create a second global design library by default.

## 3. Variables, aliases, and semantic tokens

### Observed collections

| Collection family                                        | Role / observed structure                                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `mode`                                                   | Local semantic COLOR variables; `light mode` and `dark mode`                                           |
| `tokens`                                                 | Local numeric FLOAT primitives, such as `0`, `4`, `16`, `24`, `640`; not the semantic theme collection |
| `tw/colors`                                              | Palette variables; not a substitute for semantic UI roles                                              |
| `tw/padding`, `tw/space`, `tw/margin`, `tw/gap`          | Spacing-related variables                                                                              |
| `tw/border-radius`, `tw/border-width`, `tw/stroke-width` | Shape and border dimensions                                                                            |
| `tw/font`, `tw/opacity`                                  | Typography-related values and opacity                                                                  |
| `tw/height`, `tw/min-height`, `tw/max-height`            | Height-related values                                                                                  |
| `tw/min-width`, `tw/max-width`                           | Width-related values                                                                                   |
| `rdx/colors`                                             | Additional palette with its own light/dark modes                                                       |

These are collection names observed in the file. Resolve the specific variable's type, value, alias chain, scope, and source before binding it. A name that resembles a Tailwind utility does not prove its value matches the current code.

The **local** `mode` collection is `VariableCollectionId:372:453`, with light mode `372:1` and dark mode `373:0`. It contains semantic names such as `background`, `foreground`, `card`, `card-foreground`, `primary`, `primary-foreground`, `muted`, `muted-foreground`, `border`, `input`, and `ring`.

### Local and remote variables coexist

The shared Header uses **remote** variables named `card`, `border`, `gap-4`, `p-4`, and `p-6`. Its remote `mode` collection was `VariableCollectionId:4553f4f036029f7306d8e90da3ef52e963ed76cb/1354:16`. Its remote spacing variables alias other numeric variables. The Landing Page root binds its background and border to the **local** semantic collection.

Consequently:

1. Identify variables by ID/key and collection, not just their display name.
2. Inspect a target node's actual bindings before replacing or adding any.
3. Follow aliases to understand the resolved value and all mode-dependent collections involved.
4. Preserve remote bindings on existing instances unless the task requires a deliberate migration.
5. Reuse compatible existing variables. Do not create another `background`, `primary`, or `mode` collection simply because a name search was incomplete.
6. If a dependency cannot be resolved, report it. Do not silently detach the instance or replace every binding with literal values.

### Mapping to the code theme

| UI purpose                        | CSS tokens / semantic utilities                                     |
| --------------------------------- | ------------------------------------------------------------------- |
| Page surface and text             | `--background`, `--foreground` / `bg-background`, `text-foreground` |
| Cards                             | `--card`, `--card-foreground`                                       |
| Menus and popovers                | `--popover`, `--popover-foreground`                                 |
| Primary action                    | `--primary`, `--primary-foreground`                                 |
| Secondary action                  | `--secondary`, `--secondary-foreground`                             |
| Muted surface and supporting text | `--muted`, `--muted-foreground`                                     |
| Interactive accent                | `--accent`, `--accent-foreground`                                   |
| Destructive action or validation  | `--destructive`                                                     |
| Borders, inputs, focus indicators | `--border`, `--input`, `--ring`                                     |

Always reread `index.css`; do not copy a frozen palette from this guide. Bind theme-dependent Figma fills and strokes to semantic variables. Reuse spacing/radius variables and appropriate text/effect styles. Keep photographs as image fills, not theme colors.

**Observed drift:** the local Figma dark `background` has unequal RGB channels, whereas the code uses neutral `oklch(0.145 0 0)`. Figma's light `primary-foreground` is tinted, whereas the code uses neutral `oklch(0.985 0 0)`. The file is not proven to be fully synchronized with code. Do not assume identical token names imply identical values, and do not perform a file-wide token migration during a feature task. Document relevant discrepancies and constrain any authorized correction to its intended impact.

When a new semantic value is necessary, document its purpose and code mapping, define both theme values, use appropriate variable scopes, and reuse the established naming architecture. A token change can affect many screens; review consumers first. Preserve alpha when converting CSS colors to Figma colors, and use an accurate color conversion rather than guessing RGB values.

## 4. Light and dark mode behavior

At inspection, Web explicitly selected dark mode for the local `mode` collection and another remote collection. The inspected Landing Page, Login Page, and Header main component had no explicit mode override of their own. The Header's remote color collection ID differs from the remote collection ID explicitly listed on Web. This is a reason to inspect **resolved modes**, not evidence that all descendants currently render correctly.

For every new or modified screen:

1. Discover all theme collections actually used by its descendants, including remote component dependencies.
2. Read inherited, explicit, and resolved modes. A parent setting for one collection does not set every collection with the same name.
3. Use the relevant collection's real mode IDs. Configure the screen preview rather than changing Web's global mode and unintentionally changing unrelated screens.
4. Check nested instances for explicit mode overrides that defeat inheritance.
5. Validate both themes with screenshots, including menus, overlays, borders, icons, focus indicators, and disabled controls.
6. If temporary preview copies or mode changes are used during an authorized design task, remove only your own temporary nodes and restore the intended preview state afterward.

Do not create separate hard-coded light and dark components. Prefer the same component structure with variable modes. Do not invert product photos to make a dark preview. Avoid lowering opacity on a whole content page to communicate unavailability: essential information still needs to be readable. Product status and visual theme are independent dimensions.

## 5. Components, typography, and effects

Inspect [shared UI components](../src/app/components/ui), [Header](../src/ecommerce/components/Header.tsx), [ProductCard](../src/ecommerce/components/ProductCard.tsx), and [LandingPage](../src/ecommerce/pages/LandingPage.tsx) for current conventions. The project uses shadcn/ui and its installed Button is based on Base UI; do not assume examples for another primitive implementation are interchangeable.

For common controls, inspect the installed component first. If missing, consult the current official shadcn/ui documentation for suitable composition, variants, and accessibility behavior. During Figma-only work, record the intended implementation mapping instead of installing packages. Do not add unused components.

The inspected Product Card set exposes text properties `Product Name`, `Description`, `Price`, and `Sold`, plus `Size=Standard` and `State=Default|Loading`. Do not assume Archived or Draft variants already exist. Reuse the Header instance and suitable controls; use a product-detail composition for product details rather than stretching the catalog card into an unrelated layout.

Use instances and exposed text, boolean, variant, and instance-swap properties. Avoid detaching components to make a one-off edit. Before changing a main component, inspect its relevant consumers and decide whether the change belongs in an instance override, a reusable variant, or a genuinely separate component. Componentize repeated feature elements; keep one-off layout wrappers as frames. Do not create every possible combination of theme, width, status, and content as component variants.

The code uses **Geist Variable**, and sampled Landing Page text uses Figma's **Geist** family. Sampled library text styles such as `Text-sm/Regular` use **Inter**; some style labels also differ from their actual font weight. Inspect actual font properties, sizes, line heights, and letter spacing. Prefer suitable existing product styles; do not apply an Inter library style just because its name sounds correct. Do not globally rewrite all library typography for a feature. Load actual fonts before editing text and verify rendered fonts afterward.

Existing effect styles include `Box Shadow/shadow-*`, focus/destructive effects, and blur families. Reuse an appropriate effect after inspecting its values and theme behavior. A style's presence is not proof that a screen needs elevation or blur.

Prefer existing Lucide icon instances or exact SVG assets from the codebase. Do not reconstruct icons with rotated rectangles and lines or mix icon families casually. Preserve editable vectors and bind their colors to the intended semantic role. Preserve image aspect ratios and document crop behavior; do not replace real product images with generated artwork unless the task calls for it.

## 6. Layout and responsive architecture

Build normal flow with vertical/horizontal Auto Layout. Nest containers where padding, gaps, alignment, or direction change. Use wrapping/grid-like structures for repeated content. Reserve absolute positioning for intentional overlays such as watermarks and badges.

| Sizing | Use                                                                                       |
| ------ | ----------------------------------------------------------------------------------------- |
| Hug    | Content-driven section height, labels, and suitable controls                              |
| Fill   | Available width within an Auto Layout parent, shrinkable content regions                  |
| Fixed  | Preview viewport dimensions, deliberate image ratios/slots, fixed-size icons and controls |

Append nodes to the appropriate parent before configuring Fill/Hug where the API requires an Auto Layout context. Create the screen wrapper first and build sections inside it. A scrollable viewport owns clipping/overflow; its content can grow. Do not clip long descriptions to fit a desktop screenshot.

Use fluid content width and deliberate maximum widths. Account for padding, borders, gaps, and fixed children together at **330px**, the application's minimum supported width. Let long names, descriptions, prices, notices, and actions wrap. Use a deliberate mobile stack rather than shrinking a desktop layout proportionally.

In code, [RootLayout](../src/app/layout/RootLayout.tsx) owns minimum viewport height and stretches routed pages through a grid. Page roots should not repeat viewport-height or minimum-width constraints. Figma should model a full background and growing page content consistently with that shell.

Validate representative widths **330, 375, 768, 1024, and a recorded wide desktop width**, plus at least one short height. Use test resizes or preview frames as appropriate; every width need not become a permanent component variant. Verify both themes and record what was actually inspected. Figma resizing checks do not prove browser responsiveness, keyboard behavior, or accessibility semantics.

## 7. Execution workflow for a design agent

1. **Read context:** user request, AGENTS.md, this guide, registry, feature brief, current theme, relevant source components, and any required business/API documentation.
2. **Declare scope:** target file/page/frame IDs, intended states, reusable dependencies, known decisions, and unresolved behavior. Preserve user authorization; do not reopen already settled decisions.
3. **Load tool guidance:** use the current `figma-use` skill for programmatic inspection/writes and `figma-generate-design` for composed screens. Load `figma-generate-library` when creating components or variables. Load other mandatory skills only for the operations being performed. Locate skills from the current environment; this guide intentionally does not pin machine-specific installation paths.
4. **Inspect narrowly:** target metadata and screenshots first, then exact components, bindings, styles, and modes needed. Check IDs in the registry before searching. Expand discovery only when a required dependency cannot be found locally. Skip Code Connect under current project instructions.
5. **Record baseline:** relevant screenshots, node IDs, variable sources, component properties, existing interactions, and any discrepancies. Report inaccessible links accurately rather than claiming inspection succeeded.
6. **Compose incrementally:** update existing sections in place when practical. For new screens, create the wrapper first, then build each major section inside it. Batch related reads and small edits; avoid one huge mutation script.
7. **Verify each section:** screenshot changed sections and the containing screen. Check bindings, actual fonts, crop behavior, content, and component states. Fix locally rather than rebuilding everything.
8. **Wire required interactions:** preserve existing destinations; document which actions are prototype simulations and which are only visual. Do not modify the landing page solely to add a navigation link if that node is outside the authorized task.
9. **Validate the full matrix:** states, widths, themes, long content, focus/disabled representations, and scrolling. Check affected existing consumers after shared-component edits.
10. **Handoff:** update stable node entries in the registry, provide direct links/screenshots, describe changes and prototype coverage, record unresolved decisions and verification limits, and leave frontend integration to its authorized task.

### Tool discipline

Follow the installed skill and API reference when they change. Current important safeguards include: await page selection and font loads; account for page context resetting between calls; narrow node types before reading type-specific properties; return all created/mutated IDs; clone and reassign paint arrays; capture the paint returned by variable binding; and await every asynchronous operation. Do not call unsupported lifecycle/storage APIs or assume an error rolled back earlier changes. On a partial failure, inspect the affected canvas before retrying if the tool says a read is required.

Use the existing design directly for updates. Avoid browser-to-Figma capture when direct edits suffice. This project guide does not authorize publishing libraries, editing unrelated files, or writing comments/messages to collaborators.

## 8. Completion and handoff checklist

- [ ] Required content and states match the brief; assumptions are labeled.
- [ ] Existing page organization, instances, and prototype links are preserved.
- [ ] Repeated elements reuse components; no accidental detached copies or orphaned nodes remain.
- [ ] Semantic token bindings, alias sources, mode inheritance, fonts, and effects were inspected.
- [ ] Both light and dark previews were checked, including nested components.
- [ ] Required widths, a short height, long text, image behavior, and scrolling were checked.
- [ ] Disabled and selected states are identifiable beyond color alone; keyboard/focus and touch requirements are documented for implementation.
- [ ] Changed sections and containing screens have screenshots, linked in the handoff.
- [ ] Shared changes were checked against relevant consumers.
- [ ] Stable IDs are registered; incomplete work and inaccessible dependencies are disclosed.
- [ ] Frontend runtime checks are not claimed based on Figma inspection alone.

For a design-only change, browser tests and production builds are not evidence of canvas correctness and need not be run. If frontend code is also changed, follow AGENTS.md: relevant type-check, lint, build, interaction, responsive, and theme checks. Current scripts are in [package.json](../package.json); `npm run build` includes TypeScript compilation. Report only checks actually performed.

### Copy-ready instruction for the next agent

```text
Read AGENTS.md, docs/figma-agent-guide.md, docs/figma-nodes.md, and the supplied
feature brief before starting. Re-read src/app/index.css and relevant source
components. Inspect the target Figma nodes and their actual component/token
dependencies, including local versus remote collections and resolved modes.
Preserve the existing file organization, use Auto Layout and reusable instances,
and validate both themes and required responsive widths with screenshots.
Modify only the authorized feature and directly related components. Keep
unsettled behavior labeled as proposed; do not invent API or permission guarantees.
Return exact node links, screenshot evidence, prototype coverage, unresolved
decisions, and an updated registry. The specific task and authorization follow:
[Insert target nodes, requested changes, and accepted decisions here.]
```

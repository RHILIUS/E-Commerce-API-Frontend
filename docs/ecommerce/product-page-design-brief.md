# Product Page design brief

Status: **Accepted design brief**, confirmed by the user on 2026-09-22. The requirements, layout, and state behavior below are the accepted direction for Product Page design work. Read the [Figma agent guide](../figma-agent-guide.md) before execution. The Figma screens have now been created and checked as described in the design handoff below. Acceptance of the brief is distinct from user review of the rendered screens.

## References and destination

- [Original ProductPage wireframe](https://www.figma.com/design/dC74hwxyZCht0LnEn7JIuI/E-Commerce-Wireframe?node-id=141-197&m=dev): file `dC74hwxyZCht0LnEn7JIuI`, frame `141:197`. Inspected as the original visual reference; preserved without changes.
- [Current destination — Web](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5002-2706&m=dev): file `8F5dYlZFxUEN6HKHWMOAwe`, page `5002:2706`. The Product Page designs are located here with the ecommerce content. Preserve the original reference.
- [Node registry](../figma-nodes.md): shared Header, Landing Page, and ecommerce component references.
- Business requirement URL: **Add business requirement link**. No separate requirement URL was supplied.

## Accepted requirements

As a customer, I want to click a product card on the landing page and view full product details so I can decide whether to purchase it.

The page must show:

- Main product image and additional product images/gallery.
- Product name, price, short description, and full description.
- Sold-item count, available stock, and store name.
- Quantity selector with plus and minus controls.
- Add to Cart and Checkout actions.
- Store card with logo/image, name, number of listed products, and selling start date.
- Disabled/grayed purchase actions for out-of-stock products.
- An Archived watermark for archived products.

Provide three page states: **Active**, **Archived**, and **Draft**. Archived products must remain accessible for past transactions and pending-order context, with unavailable styling and a “No longer available” notice. Draft products are unpublished and visible only to store owners and members.

Archiving must not interfere with existing orders. This is an accepted requirement whose backend implementation remains to be verified. Read relevant sibling docs/backend code before implementing archive retention, historical order snapshots, access rules, or deletion semantics. Do not equate archive status with a confirmed soft-delete implementation.

## Accepted layout and behavior

Use one shared product-detail composition with status-dependent messaging and controls. On desktop, place the gallery beside product/purchase information, with full description and store information below. Adapt deliberately to a mobile stack. Reuse the established ecommerce Header and suitable shared controls.

| State                | Accepted behavior                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Active, in stock     | Normal appearance; quantity and purchase actions enabled                                                                   |
| Active, out of stock | Explicit Out of stock notice; purchase actions disabled                                                                    |
| Archived             | Archived watermark on main image, readable unavailable notice, muted purchase area; quantity and purchase actions disabled |
| Draft                | Draft / Preview label and restricted-visibility notice; purchase controls disabled                                         |

Out of stock is an availability condition within Active. The three lifecycle states remain Active, Archived, and Draft. Theme is independent of status. Keep essential archived information readable rather than fading the entire page.

Gallery interaction: main selected image plus selectable thumbnails, with a clear selected state and a horizontally scrollable thumbnail row on narrow screens. Specify behavior for a single image, long thumbnail lists, and missing images during design execution. A zoom modal is outside the accepted scope.

Quantity boundaries: integer quantities starting at one for purchasable items; minus disabled at the minimum and plus disabled at available stock. If the verified backend contract imposes additional purchase limits, document and reconcile them before implementation. Communicate unavailability explicitly rather than displaying an enabled selector with zero purchasable stock.

## Open implementation and interaction decisions

The accepted design above does not supply answers to the following questions. Resolve them when the corresponding interaction or integration is implemented; do not reopen the accepted layout or state model as a proposal.

1. Does Checkout buy only this product and selected quantity, independently of the cart?
2. Who can open an archived product: anyone with the link, previous purchasers, or another verified audience?
3. Does Draft include an Edit product action, or remain a pure preview? Which staff roles can edit/publish?
4. Which price and stock information should archived and draft previews show, and how is historical transaction information distinguished from current product information?
5. What should guests experience when attempting purchase actions? Do not invent an authentication flow.

Ask only for decisions that block the current work, and continue independent design work within the assigned scope. Record unresolved behavior in the handoff without inventing answers or presenting these open questions as completed integration.

## Data and prototype boundaries

The [catalog integration document](product-catalog.md) describes landing-page display currency and conversion estimates. It does not establish a product-detail API or checkout-currency guarantee. Use realistic sample content and explicit currencies; do not assume every price is USD or PHP. Confirm detail fields and store metadata against the backend before implementation.

The design task should demonstrate gallery selection, quantity states, availability messages, and the three requested lifecycle presentations. Purchase actions may remain prototype-only until their behavior is decided; never imply an actual order or cart operation occurred. Restrict draft visibility in the real application through verified authorization, not merely a visual badge or hidden link.

Landing-card navigation belongs to the feature requirement, but editing the Landing Page prototype requires that node to be within the design task's authorized scope. Record intended navigation if it is not.

## Design handoff requirements

- Linked Active, Archived, and Draft screen nodes, plus an Active / Out of stock example.
- Main and additional image treatment, short and full descriptions, purchase controls, and complete store information.
- Desktop/mobile adaptations, light/dark screenshots, and width/short-height validation per the guide.
- Reused component/token references, prototype interaction coverage, and unresolved decisions.
- Updated stable-node registry; no invented route, API, order, or permission guarantees.

## Completed Figma design handoff

The [node registry](../figma-nodes.md#product-page-designs) links the eight retained full-page references: Active, Archived, Draft, and Active / Out of stock, each in Desktop and Mobile layouts. A separate 375 × 568 Active viewport demonstrates vertical scrolling. Temporary responsive QA copies were removed after inspection.

The intended structure is one screen per state and viewport, with theme variables inheriting the parent page or enclosing frame mode through **Auto**. Agents should not create separate light/dark copies.

### Composition and theme

- Shared gallery, purchase-panel, quantity, description, and store-card components compose the screens with Auto Layout. Desktop places gallery and purchase information side by side; mobile stacks them.
- Existing semantic variables, spacing/radius tokens, and Geist text styles are reused. Theme mode is inherited from the parent page or enclosing frame. Existing palette differences from CSS were not changed globally.
- The desktop Header is reused. Its search field now fills available space up to 720px, with a minimum row gap, to keep account controls within narrower desktop widths. The Landing Page was visually checked after the search sizing correction. Mobile uses the related compact Header component.
- Archived content remains readable, with a grayscale image, Archived watermark, unavailable notice, and disabled purchase controls. Draft includes a restricted-preview notice. Out of stock is shown as an Active availability condition.

### Sample content and prototype coverage

- The sample product is iPhone 17 Pro at ₱79,990.00, with 2.4k sold and three units available. Northline Tech, its NT monogram, 128 listed products, and January 1, 2022 start date are illustrative store data.
- The three gallery views use the existing catalog image and two detail crops of that same image. They demonstrate selection and image treatment; they are not three distinct product photographs. Replace these with actual additional images when available.
- Gallery thumbnails change among three image variants. Quantity changes between one, two, and three, with disabled minimum/stock boundary controls. Three units are sample stock, not a production purchase limit.
- The matching first iPhone card on the Landing Page navigates to the Active desktop screen. Other catalog cards are not linked to this sample product.
- Archived, Draft, and Out of stock purchase panels have no click reactions. Add to Cart and Checkout on Active are visual controls without cart/order integration.
- Prototype reaction destinations were inspected programmatically. This is not a claim that every flow was exercised in Figma Present mode.

### Validation and remaining integration work

Screenshots were inspected at 330px, 375px, 768px, 1024px, and 1920px widths across light/dark checks, alongside the desktop references and a short 375 × 568 scrolling viewport. The narrower desktop check exposed a header sizing issue that was corrected and rechecked. Shared disabled-state panels were checked for inactive reactions; screen typography was audited for Geist. Screenshots were viewed through Figma tools, not committed as standalone image files.

The three-thumbnail gallery fits the minimum supported width. Single-image, missing-image, and long-gallery cases do not yet have dedicated visual variants; their production behavior remains to be specified. The open implementation decisions above still apply, including checkout behavior, archived access, draft authorization, and historical product information. No frontend route, API, cart, checkout, archive retention, or authorization behavior was implemented in this design task.

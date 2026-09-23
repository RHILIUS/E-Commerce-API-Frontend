# Shopping cart

`/cart` is an authenticated route linked from the shared header. Guests return
to their requested page after signing in. The implementation consumes the
[backend store-cart contract](../../../backend/docs/ecommerce/carts.md), which
matches the store-linked cart in the shared project ERD.

## Behavior

- Add to Cart on a product adds the chosen units to that product's store cart.
  Repeated additions increment the existing quantity, subject to server stock
  validation. A success toast appears only after the API succeeds, with a
  View cart action and close button. It dismisses after eight seconds (paused
  during hover/focus); repeated additions update the same notification.
- Carts are grouped by store. Select individual products, a store, or all
  products; partially selected groups expose the mixed checkbox state.
- Selected quantities and subtotals update with current API data. Decimal
  amounts are summed exactly and currencies remain separate when conversion
  falls back to store currency. Unavailable lines with a known price still count
  toward their selected total; redacted lines have no price and show a dash.
- Quantity controls respect stock. If stock falls below the saved quantity,
  decrementing reduces it to the available stock. Archived, unpublished, and
  sold-out products remain removable; unpublished products have no detail link.
- Remove asks for confirmation and supports at most 500 selected products per
  request, matching the backend's atomic deletion limit. Failed removals keep
  the dialog open for retry. Cancel receives initial focus; closing restores
  focus to Remove, or the page heading when Remove is unavailable.
- Stock and prices refresh every 15 seconds while visible, on window focus, and
  when the tab becomes visible. Failed writes trigger a refresh. Obsolete reads
  cannot overwrite mutation results, and overlapping writes are blocked.
- Account or country changes remount cart state. Selection is local to the
  current page session and is never a stock reservation.

## Layout and scope

The page uses semantic theme tokens and the existing Base UI/shadcn primitives.
Store and product rows wrap on narrow screens. The action summary sticks to the
viewport bottom at heights of 640px and above; on shorter screens it stays in
document flow so products remain accessible. The removal dialog scrolls within
the viewport when needed.

Checkout is disabled. Order placement, payment, shipping, inventory reservation,
and persistent selection are outside this feature. Adding to cart does not
reserve or reduce stock.

## Future Figma integration

Status: **implemented in frontend; Figma mapping pending**. These notes describe
current code for a future synchronization task, not a newly approved Figma
design. No canvas changes or live-node verification were performed for these
notes. Start with the [pending registry entries](../figma-nodes.md#cart-and-notification-integration--pending-figma-mapping)
and [Figma agent guide](../figma-agent-guide.md). Re-read source and
[the current theme](../../src/app/index.css) before integration.

### New shared controls

- **Checkbox:** [source](../../src/app/components/ui/checkbox.tsx) wraps Base UI.
  Represent unchecked, checked (Lucide Check), and indeterminate (Lucide Minus)
  states, with disabled and keyboard-focus treatments. The visual control uses
  `size-5`, `rounded-sm`, and a border; cart labels provide `size-11` or
  `min-h-11` interaction areas. Use `background`/`input` when unchecked,
  `primary`/`primary-foreground` when selected or indeterminate, and `ring` for
  focus. Disabled opacity is 50%. Do not reduce the clickable area to the visual
  checkbox dimensions or represent partial selection using color alone.
- **Toast:** [renderer](../../src/app/components/ui/toast.tsx) and
  [manager](../../src/app/lib/toast.ts) use Base UI; no SweetAlert or Sonner
  dependency was introduced. The implemented success appearance has a Lucide
  CircleCheck, “Added to your cart.” title, ghost close button (Lucide X), and
  outline “View cart” action. The renderer supports optional description/action
  content, but only success has an implemented status icon; do not infer an
  existing error/warning/loading variant system.

The toast uses `popover`, `popover-foreground`, `muted-foreground`, `border`, and
`ring` tokens, `rounded-2xl`, `shadow-lg`, `p-3`, and a `gap-x-3`/`gap-y-1` content
grid. Its title is `text-sm font-medium`; the close target is `size-11` and the
action is at least `min-h-11`. Model the icon/title/close row and action below the
title with nested Auto Layout. The viewport overlay is intentionally positioned
outside page flow: `max-w-sm`, 1rem side insets on small screens, bottom-right
from `sm`, and a bottom inset equal to the larger of 1rem or the device's bottom
safe-area inset. Use content-driven height.

The application mounts one Toaster in [main.tsx](../../src/app/main.tsx).
Success appears only after the add request succeeds. “View cart” dismisses it
and opens `/cart`; close and right-swipe dismiss it. Timeout is eight seconds,
paused during hover/focus. Repeated additions reuse `cart-added` and restart the
timeout. It does not open a modal backdrop or take focus automatically. Reflect
these behaviors in prototype annotations where Figma cannot reproduce them;
keep add failures as the existing inline error message.

### Cart compositions and state coverage

[CartStoreCard](../../src/ecommerce/cart/CartStoreCard.tsx) is a feature component;
its product rows and image fallback are currently internal compositions.
[CartPage](../../src/ecommerce/pages/CartPage.tsx) owns the summary and removal
dialog. Reuse the existing Button, Skeleton, and AlertDialog foundations; do not
describe them as newly created cart primitives. Candidate Figma component names
and exact library placement should be resolved from the live file during the
authorized integration.

Cover the following implemented states without generating every combination:

- Populated cart with multiple stores; no, partial, and all selection.
- Active items at quantity one, below stock, at stock, and above reduced stock;
  pending mutations disable selection and quantity changes.
- Sold-out and archived items remain selectable/removable. Unpublished items
  use the generic unavailable name, no detail link, and no price. Include missing
  or failed product/store images and long names/prices.
- Separate totals by currency, no-selection dash, unavailable-item explanatory
  text, disabled Checkout, and the over-500-products removal notice.
- Loading skeletons, empty-cart Browse products action, initial-load/refresh
  failure with Retry, and mutation errors.
- Removal confirmation, pending “Removing…”, failed removal with retry, and
  successful removal. Document Cancel's initial focus and focus restoration;
  a Figma simulation does not establish browser accessibility guarantees.

Use the current `max-w-5xl` content width, mobile-first wrapping, `sm` padding
changes, and `md` product-row arrangement. Product image slots use `size-18`,
then `sm:size-24`, with contain sizing; unavailable imagery is grayscale.
Represent the summary as sticky only at viewport heights of at least `40rem`;
it stays in normal flow on shorter screens. The removal dialog fits and scrolls
within the viewport. Resolve utility dimensions from the current theme rather
than assuming a frozen pixel conversion.

Use one screen per layout/product state with theme modes on screens and nested
instances set to Auto/inherit. Validate 330, 375, 768, 1024, and a recorded wide
desktop width, plus a short height and both theme previews. Record screenshots
and verified node IDs in the registry after synchronization. Checkout/order
creation remains deferred, and prototype cart actions must not imply real stock
reservation or API writes.

## Verification

`tests/ecommerce/CartPage.test.tsx` covers auth routing, mixed selection, currency
totals, quantity changes, stock conflicts, confirmed removal and retry, the
500-product removal limit, refresh, empty/error states, and product-page adds
through the real HTTP client with mocked API responses.
`tests/ecommerce/useCart.test.tsx` covers visible-page polling, cleanup, stale
responses, and overlapping writes.
`tests/ecommerce/ProductPage.test.tsx` also checks guest sign-in destinations,
stock-conflict messages, and duplicate prevention while an add is pending.

The completed frontend checks passed all 67 tests, ESLint, Prettier, TypeScript,
and the production build. Vite reports a bundle-size warning for the main chunk.
Chromium checks covered 330, 375, 768, 1024, and 1440px in light and dark modes,
plus 375 × 568 and 768 × 375 short viewports. They checked horizontal overflow,
selection, dialog viewport fit and keyboard focus, confirmed removal, and the
empty state, with no browser runtime errors. Mobile light and desktop dark
screenshots were visually reviewed. Browser checks used contract-shaped mocked
HTTP responses; a live backend/database smoke test remains outstanding.

The success-popup update passed the 24 cart/product tests, lint, formatting,
TypeScript, and production build. Chromium verified popup placement at the same
widths and short heights in both themes, close and View cart actions, repeated
additions, automatic dismissal, and no horizontal overflow or runtime errors.

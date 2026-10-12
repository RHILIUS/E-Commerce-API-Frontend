# Figma Node Registry

This registry maps stable frontend screens and reusable components to their Figma nodes. Check it before searching the Figma file, and update it when a listed node is replaced or removed.

Read the [Figma agent workflow and design architecture](figma-agent-guide.md) before generating or modifying UI. The [Product Page brief](ecommerce/product-page-design-brief.md) records the accepted design and open implementation decisions separately.

## E-Commerce Wireframe

- **File:** [E-Commerce Wireframe](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe)
- **File key:** `8F5dYlZFxUEN6HKHWMOAwe`

| Frontend feature                     | Figma node                                                                                                                    | Node ID     |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Web page (current destination)       | [Open in Figma](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5002-2706&m=dev) | `5002:2706` |
| Ecommerce / Components container     | [Open in Figma](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5569-959&m=dev)  | `5569:959`  |
| Product Card / Refined component set | [Open in Figma](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5550-5650&m=dev) | `5550:5650` |
| Landing page                         | [Open in Figma](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5569-353&m=dev)  | `5569:353`  |
| Header component                     | [Open in Figma](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5569-950&m=dev)  | `5569:950`  |
| Landing page header instance         | [Open in Figma](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5569-354&m=dev)  | `5569:354`  |
| Account overlay                      | [Open in Figma](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5587-148&m=dev)  | `5587:148`  |
| Login page                           | [Open in Figma](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5100-181&m=dev)  | `5100:181`  |

Figma URLs use hyphenated node IDs in query parameters, while Figma APIs use colon-separated IDs. For example, `node-id=5569-353` corresponds to `5569:353`.

## Cart and notification integration — pending Figma mapping

The following UI is implemented in code. This documentation-only inventory was
recorded on **2026-09-23**; the canvas was not inspected or changed for it.
**Pending** means no matching node has been verified or registered, not that the
Figma library necessarily lacks a suitable component. Inspect relevant existing
components before creating new ones.

| UI / scope                                               | Code source                                                                                                        | Figma mapping / next integration step                                                                                                                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checkbox — new shared control                            | [Checkbox](../src/app/components/ui/checkbox.tsx)                                                                  | **Pending.** Match unchecked, checked, indeterminate, disabled, and focus states.                                                                               |
| Toast — new shared notification                          | [Toaster](../src/app/components/ui/toast.tsx), [toast manager](../src/app/lib/toast.ts)                            | **Pending.** Map the implemented success popup, close control, and optional action; this is not a modal alert.                                                  |
| Shopping Cart — new `/cart` screen                       | [CartPage](../src/ecommerce/pages/CartPage.tsx)                                                                    | **Pending.** Map populated, empty, loading, and failure states with responsive layout.                                                                          |
| Store cart and product rows — feature composition        | [CartStoreCard](../src/ecommerce/cart/CartStoreCard.tsx)                                                           | **Pending.** Map store/item selection, stock states, quantity controls, and image fallbacks.                                                                    |
| Cart summary and removal dialog — page compositions      | [CartPage](../src/ecommerce/pages/CartPage.tsx), [existing AlertDialog](../src/app/components/ui/alert-dialog.tsx) | **Pending.** Reuse existing controls/dialog primitives; these are not new exported shared code components.                                                      |
| Header cart navigation — existing component update       | [Header](../src/ecommerce/components/Header.tsx)                                                                   | Existing Header `5569:950`; compact Header `5662:287`. Verify the cart action against code when those nodes are in scope.                                       |
| Product add-to-cart feedback — existing component update | [ProductPurchasePanel](../src/ecommerce/components/ProductPurchasePanel.tsx)                                       | Existing purchase-panel set `5660:326`. Verify pending/disabled controls and connect success feedback to the toast rather than adding inline confirmation text. |

See the [cart code-to-Figma handoff](ecommerce/cart.md#future-figma-integration)
for implemented states, sizing, tokens, and prototype behavior. The existing
Product Page handoff records an earlier prototype where Add to Cart was only a
visual control; the frontend now saves to the cart and shows a success toast.
That code change does not imply the Figma prototype has been synchronized.

After an authorized Figma integration, replace pending entries with verified
file/node links and record which states and interactions were actually checked.
Follow the agent guide for Auto Layout, reuse, inherited theme modes, and scoped
validation. Keep this manual mapping workflow; Code Connect remains out of scope.

## Checkout integration — pending Figma mapping

The following UI is implemented in `src/checkout/` and its product/cart entry
points. This documentation-only inventory was recorded on **2026-10-04** and updated on **2026-10-11** to reflect the
implemented COD and Stripe test flows; no canvas changes or destination-node
verification were performed for this inventory. **Pending**
means the implemented UI has no verified mapping in the current migration file.
Reuse existing Figma components where suitable before creating new ones.

The [original checkout wireframe](https://www.figma.com/design/dC74hwxyZCht0LnEn7JIuI/E-Commerce-Wireframe?node-id=392-1256&m=dev)
(`dC74hwxyZCht0LnEn7JIuI`, node `392:1256`) was inspected during implementation
as a layout guide. It is in a different file and is **not** a synchronized mapping
for the current frontend. Use the implemented code and the
[checkout handoff](checkout/README.md) for current behavior. Checkout supports
COD and Stripe test-mode card payments; the original wireframe's e-wallet options
are not implemented.

The confirmation page now follows the [original receipt wireframe](https://www.figma.com/design/dC74hwxyZCht0LnEn7JIuI/E-Commerce-Wireframe?node-id=304-613&m=dev), node `304:613` in file `dC74hwxyZCht0LnEn7JIuI`. This source was inspected and the frontend layout implemented; its destination mapping remains **pending**. The receipt includes current store/product images with missing/broken-image placeholders, recipient snapshots, a bottom payment summary (COD amount due or confirmed Stripe test payment), and Continue shopping. Image API integration is implemented; imagery is not a purchase snapshot. See the [checkout documentation](checkout/README.md). No confirmation back-to-cart link or Order again action is implemented.

| UI / scope                                                      | Code source                                                                                                                     | Figma mapping / next integration step                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checkout — new `/checkout` screen                             | [CheckoutPage](../src/checkout/pages/CheckoutPage.tsx)                                                                                                                                                                                                                                         | **Pending.** Map payment-method selection → recipient → store items → payment total/action, plus method-preview loading, request failure, invalid selection, item issues, and expired preview states.                                                                                                                                                                        |
| Checkout shell — feature composition                          | [CheckoutLayout](../src/checkout/components/CheckoutLayout.tsx)                                                                                                                                                                                                                                | **Pending composition.** Reuse the registered Header and compact Header; map the responsive content container, source-aware Back to product / Back to cart review navigation, and catalog default. Payment/confirmation pages hide the back link.                                                                                                                            |
| Recipient summary and selection dialog — feature compositions | [RecipientSection](../src/checkout/components/RecipientSection.tsx), [RecipientAddress](../src/account/components/RecipientAddress.tsx), [existing Dialog](../src/app/components/ui/dialog.tsx)                                                                                               | **Pending.** Map default selection, Change, single recipient selection, per-recipient Edit, empty list, incomplete details, and Done. Reuse the address summary for confirmation.                                                                                                                                                                                            |
| Add/edit recipient form — dialog composition                  | [RecipientForm](../src/account/components/RecipientForm.tsx), [RecipientSection](../src/checkout/components/RecipientSection.tsx), [PhoneNumberField](../src/authentication/components/PhoneNumberField.tsx), [AddressCountryField](../src/authentication/components/AddressCountryField.tsx) | **Pending.** Reuse existing form controls and Checkbox; map create and prefilled edit modes, required/optional fields, independent country/phone pickers, default replacement, Save/Cancel, saving, field errors, and uncertain-save reconciliation. Preserve checkout selection when editing; current default cannot be unchecked.                                          |
| Radio group — new shared control                              | [RadioGroup and RadioGroupItem](../src/app/components/ui/radio-group.tsx)                                                                                                                                                                                                                      | **Pending.** Match selected, unselected, disabled, and keyboard-focus states; use it for saved recipients and COD / Card (Stripe test) payment selection.                                                                                                                                                                                                                    |
| Checkout store groups and item rows — feature composition     | [CheckoutItems](../src/checkout/components/CheckoutItems.tsx)                                                                                                                                                                                                                                  | **Pending.** Map product image/fallback, name, unit price, quantity, item/store subtotals, and unavailable/stock messages with mobile wrapping.                                                                                                                                                                                                                              |
| Payment total and placement recovery — page compositions      | [CheckoutPage](../src/checkout/pages/CheckoutPage.tsx)                                                                                                                                                                                                                                         | **Pending.** Map COD total/Place Order, Stripe USD total/Continue to payment, Redirecting to payment…, expired-review message (no visible countdown), Update order details, Retry saved order, View confirmation/View payment, and legacy previous-checkout link. Recovery is account/selection-scoped; opening review alone creates no saved payment. No e-wallet selector. |
| Confirmation — new `/checkout/confirmation/:reference` screen | [CheckoutConfirmationPage](../src/checkout/pages/CheckoutConfirmationPage.tsx)                                                                                                                                                                                                                 | **Pending.** Map loading, failure/read-only retry, reference, total, per-store orders, recipient snapshots, order/payment statuses, COD amount due on delivery or confirmed Stripe test-payment labeling, and Continue shopping to the catalog.                                                                                                                              |
| Product and cart checkout — existing UI updates               | [ProductPurchasePanel](../src/ecommerce/components/ProductPurchasePanel.tsx), [CartPage](../src/ecommerce/pages/CartPage.tsx)                                                                                                                                                                  | Existing purchase-panel set `5660:326`; cart mapping remains pending above. Update Checkout navigation, valid-quantity/selection button states, and cart overstock reset/review feedback. These replace the earlier unavailable/disabled checkout behavior.                                                                                                                  |
| Sign-in return to checkout — existing prototype interaction   | [LoginPage](../src/authentication/pages/LoginPage.tsx)                                                                                                                                                                                                                                         | Existing Login `5100:181`. Verify the protected checkout handoff preserves product quantity or selected cart IDs after sign-in; no new login layout is implied.                                                                                                                                                                                                              |

### Stripe payment and saved-order details — pending additions

These entries reflect the current implementation; **Pending** still means that
no destination node has been verified. Stripe-hosted Checkout is an external
provider screen, not a frontend screen to recreate in this file.

| UI / scope                                                      | Code source                                                                                                                     | Figma mapping / next integration step                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stripe payment return/recovery — `/checkout/payment/:reference` | [StripePaymentPage](../src/checkout/pages/StripePaymentPage.tsx), [useStripePayment](../src/checkout/hooks/useStripePayment.ts) | **Pending.** Map initial Checking your payment…, pending Resume payment / Check payment status / Cancel payment, provider failure and Retry payment status, paused polling, cancellation awaiting confirmation, and completed receipt navigation. Entry and cached-page restoration reconcile automatically; returning alone does not cancel.                                                 |
| Closed payment — cancelled/expired states                       | [StripePaymentPage](../src/checkout/pages/StripePaymentPage.tsx)                                                                | **Pending.** Map Payment closed, reference, demo label, neutral cancelled/expired message, order details, and Return to product catalog targeting `/`. Do not assume cart origin or show resumable-payment controls.                                                                                                                                                                          |
| Saved checkout order summary — reusable feature composition     | [SavedCheckoutSummary](../src/checkout/components/SavedCheckoutSummary.tsx)                                                     | **Pending.** Reuse in the saved checkout card and unresolved/closed payment page. Map stores, product images/fallbacks and names, quantities, unit prices, item/store subtotals, recipient snapshots, total payment, independent loading, and Retry order details. Reading details preserves payment recovery. Images are current catalog presentation; other purchase fields are historical. |
| Direct Stripe handoff — prototype interaction                   | [useCheckoutPlacement](../src/checkout/hooks/useCheckoutPlacement.ts)                                                           | **Pending.** Show Continue to payment → Redirecting to payment… → external Stripe Checkout. Return enters automatic verification, then receipt or recovery. Prototype outcomes must be labelled simulations; payment completion depends on backend/provider verification.                                                                                                                     |

For migration, cover narrow and desktop layouts, scrollable recipient dialogs,
long names/addresses, and both themes through inherited modes rather than
separate light/dark screen copies. The implementation was checked at 330, 375,
768, 1024, and 1440px, including a short viewport. Record verified destination
file/node IDs here only after an authorized Figma synchronization and validation.

## Product Page designs

The [accepted brief and design handoff](ecommerce/product-page-design-brief.md) describe scope, sample content, validation, and prototype limitations. Desktop references are 1440px wide; mobile references are 375px wide.

Use one screen per layout and product state with theme mode set to Auto/inherit from its parent. Theme-specific duplicate screens are not part of the registry.

| State                 | Desktop                                                                                                                 | Mobile                                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Active                | [5652:149](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5652-149&m=dev) | [5666:511](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5666-511&m=dev) |
| Archived              | [5663:402](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5663-402&m=dev) | [5671:581](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5671-581&m=dev) |
| Draft                 | [5663:484](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5663-484&m=dev) | [5671:663](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5671-663&m=dev) |
| Active / Out of stock | [5663:564](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5663-564&m=dev) | [5671:743](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5671-743&m=dev) |

The [Active mobile scrolling viewport](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5677-7524&m=dev) demonstrates vertical scrolling at 375 × 568. The other screen frames show the complete page content.

### Reusable Product Page components

| Component                     | Node                                                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Components container          | [5652:148](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5652-148&m=dev)   |
| Gallery image variants        | [5661:327](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5661-327&m=dev)   |
| Gallery thumbnail             | [5653:170](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5653-170&m=dev)   |
| Purchase panel state variants | [5660:326](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5660-326&m=dev)   |
| Quantity state variants       | [5661:5946](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5661-5946&m=dev) |
| Product description           | [5657:219](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5657-219&m=dev)   |
| Store card                    | [5657:222](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5657-222&m=dev)   |
| Compact header                | [5662:287](https://www.figma.com/design/8F5dYlZFxUEN6HKHWMOAwe/-MIgration--E-Commerce-Wireframe?node-id=5662-287&m=dev)   |

## Customer orders — pending Figma mapping

`/orders` (`src/ecommerce/pages/UserOrdersPage.tsx`) follows the inspected
[original Orders guide](https://www.figma.com/design/dC74hwxyZCht0LnEn7JIuI/E-Commerce-Wireframe?node-id=337-748&m=dev),
file `dC74hwxyZCht0LnEn7JIuI`, node `337:748`. Its migration-file mapping is
**pending**. No canvas changes were made. The implemented six tabs, cancellation
confirmation and card refund states supersede the original five-tab guide.
See [customer orders](ecommerce/user-orders.md) for scope and API dependencies.

## Store Customer View Page — pending migration mapping

`/stores/:storeId` follows the inspected
[original Store Page reference](https://www.figma.com/design/dC74hwxyZCht0LnEn7JIuI/E-Commerce-Wireframe?node-id=181-2&m=dev),
file `dC74hwxyZCht0LnEn7JIuI`, node `181:2`. Migration-file mapping is **pending**;
no canvas changes were made. Accepted implementation refinements and API behavior
are documented in [Store Page](ecommerce/store-page.md): Home previews, All Products,
taxonomy categories, About/public contacts, store search, and mobile adaptation.

## Recipient configuration — pending migration mapping

`/account` (`src/account/pages/UserAccountPage.tsx`) follows the inspected
[original account reference](https://www.figma.com/design/dC74hwxyZCht0LnEn7JIuI/E-Commerce-Wireframe?node-id=396-1519&m=dev),
file `dC74hwxyZCht0LnEn7JIuI`, node `396:1519`. Only Recipients is implemented.
Approved refinements and shared Account/Checkout deletion behavior are described
in [recipient configuration](account/recipients.md). Shared recipient components
now live in `src/account/components/`. Canvas changes and migration-file mapping
remain pending; the original reference does not yet show the implemented delete
confirmation, replacement-default choice, or explicit Make default action.

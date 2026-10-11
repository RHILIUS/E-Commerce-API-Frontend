# Checkout frontend

## Scope

Checkout supports Cash on Delivery and Stripe test-mode card payments. Online payments are reviewed and charged in USD. E-wallet spending and withdrawals remain deferred. Shipping fees, taxes, and discounts are not added by the frontend; totals come directly from the checkout API.

## Routes and contracts

- `/checkout?source=product&product_id=2&quantity=1` purchases that product independently of the cart.
- `/checkout?source=cart&item_ids=1,4` purchases only the selected saved cart items. The server reads their quantities.
- `/checkout/confirmation/:reference` retrieves the authenticated owner's persisted purchase snapshots, with current store/product images. Images are presentation-only and may change with catalog updates; missing, deleted, or broken images use placeholders. Purchase names, recipient details, and prices remain historical.

The checkout back link follows its source: Back to product returns to the selected product; Back to cart returns to the cart. This works after reload and sign-in because the source is retained in the URL.

Checkout URLs contain identifiers and quantities only. Login preserves the query string. Invalid, duplicate, empty, and oversized selections are rejected locally; ownership and availability remain server validations.

API contracts: [recipients](../../../backend/docs/checkout/recipients-api.md), [preview](../../../backend/docs/checkout/preview-api.md), and [COD placement/confirmation](../../../backend/docs/checkout/cod-api.md). Current backend serializers and services were checked against these contracts. Stripe contracts and setup: [online checkout](../../../backend/docs/checkout/stripe-api.md).
The [shared COD business flow](../../../docs/diagrams/specific-business-processes/checkout/cod-checkout.md) also matches these API handoffs. The backend API documentation and shared business flow record the implemented COD frontend and backend scope; Stripe test payment is now implemented; fulfillment and settlement release remain future work.

## Review and recipient selection

The page loads the server preview and saved recipients. A saved default is selected initially; customers can choose exactly one recipient, create a new one, or edit a saved recipient. New recipients use the existing international phone and address-country controls. Choosing a recipient does not change the saved default. Required fields and server field errors remain visible in the recipient form.

Each saved recipient has an Edit action that opens the shared, prefilled form in
the same dialog. Saving updates the existing recipient and returns to the list;
cancel discards the draft. Editing preserves the checkout selection, including
when another recipient becomes default. The current default cannot be unchecked;
choose another recipient as default to replace it. Phone country is derived from
the saved phone independently of the delivery country. Existing order snapshots
are unchanged. Duplicate submissions and dialog dismissal are blocked during saves;
unknown outcomes reload saved recipients before the customer retries.

Prices are decimal strings formatted without floating-point totals. The frontend does not convert currencies or infer currency from phone country. Item issues and unavailable totals block placement. Preview expiry is tracked internally without a customer-facing countdown or stock-check message. Place Order is the normal payment-section action. When the preview expires or placement requires another review, checkout shows “Please update your order details before continuing.” and an Update order details button. This fetches fresh prices and availability for review; it never automatically places the order. No background polling silently changes the accepted price.

Selected cart quantities above positive available stock are reset to one when Checkout is clicked, with a message requiring review before continuing. Zero-stock products remain unavailable and are blocked by preview. Live stock can still change afterward; placement checks it atomically on the server.

## Order placement and recovery

Before POSTing a COD purchase, the client saves the exact request (signed preview token, recipient ID, payment method, and UUID idempotency key) in account- and selection-scoped session storage: `checkout:attempt:<userId>:product:<productId>` or `checkout:attempt:<userId>:cart:<sortedItemIds>`. It does not store recipient contact/address details. Repeated clicks are blocked synchronously.

Network errors, server errors, authentication interruptions, and idempotency conflicts retain that request. Revisiting the same selection in the same tab offers **Retry saved order**, even when the preview has expired. Other products and cart selections load their own review. Product scope excludes quantity so changing quantity cannot bypass an unresolved payment for that product. Cart IDs are sorted before matching. Retry sends the original body and key, allowing the backend to return an existing completed purchase. It does not fetch a replacement token or silently start a new purchase.

Definitive validation/stock failures require another review before a new request. Because the current API exposes conflicts as `detail` text rather than machine-readable codes, the error parser explicitly recognizes the backend's idempotency-conflict message and retains the saved request. A future contract change should add error codes in both applications together.

A successful response saves its confirmation reference before navigating. Confirmation retrieval is read-only; the confirmation page clears only the matching saved attempt. COD order payment remains unpaid. Storage errors prevent a new placement when recovery cannot be preserved.

Session storage survives reload and navigation in the same tab; closing the tab clears it. This is not a cross-device order history or a cross-tab purchase lock.

## Verification

Integration tests live in `tests/checkout/`, with product/cart entry tests in `tests/ecommerce/`. They use actual routes, authentication, and the HTTP client with MSW responses. Browser checks use mocked API responses, so they do not seed or mutate development data.

Verified responsive checkout, recipient selection/form, and confirmation at 330, 375, 768, 1024, and 1440px in light and dark themes; the recipient form also fits a 375×400 viewport with internal scrolling. These 41 browser layout/interaction checks found no horizontal page overflow or browser page errors.

Keyboard checks verified arrow-key recipient selection, Escape closing the dialog and returning focus to Change, country selection, and recipient form validity.

Recipient editing regression coverage verifies prefilled contact/address fields,
save/cancel behavior, selected and unselected recipient edits, default replacement,
field validation, duplicate submissions, and unknown-save reconciliation. Valid
non-geographic E.164 numbers (such as `+800`) retain their full international value.
Chromium checks cover checkout, recipient list, edit form, and saved state at 330,
375, 768, 1024, and 1440px in both themes, with a 375×400 short viewport, keyboard
focus restoration, Escape dismissal, and no horizontal overflow. A further 330×400
check verifies saving a non-geographic number. Browser APIs are mocked.


## Stripe test payments

Payment selection uses the existing radio-group component. Switching methods
requests a fresh preview with `payment_method`; the previous method's prices
cannot be submitted while the new review loads. The backend signs that method
into the token. Stripe review shows the USD charge and labels the flow as a demo.

`useCheckoutPlacement` handles COD and Stripe using the same selection-scoped
recovery keys. Visiting or leaving the review does not write a recovery record or
create a payment; storage is written only when submitting placement. Unknown
outcomes retain the exact body/key for that selection.

Legacy `checkout:cod:<userId>` records have no source information. A legacy record
with a reference appears as a non-blocking link to its payment/confirmation page.
An unresolved legacy request without a reference (or corrupt legacy data) still
requires explicit recovery before another purchase because its selection cannot be
identified safely. Records are retained until their own confirmation/terminal
payment state is read; clearing one reference leaves other selections and accounts
intact. A legacy request rejected definitively is removed, and the next submission
uses the current selection's scoped key.

A successful online response
saves its reference before navigating directly to the hosted Stripe URL when the
payment is pending and resumable. During the request the button reads
**Redirecting to payment…**. Responses without a payable URL open
`/checkout/payment/:reference` for status/recovery instead. Reopening a saved
reference also opens that page, without automatically sending the customer away.

The return/recovery payment page offers **Resume payment** for the saved hosted
Stripe session. On every page entry it automatically reconciles the payment with
Stripe through the authenticated backend POST, showing **Checking your payment…**
until verification finishes. A completed result opens the receipt immediately;
a pending result starts polling saved backend state every three seconds for up to
two minutes. Manual reconciliation and cancellation remain available. An initial
check failure preserves recovery and offers retry rather than implying payment failed.
Browser Back restoring a cached page also triggers reconciliation through the
`pageshow` event; ordinary page-show events do not duplicate the initial check. Polling is aborted/cleaned up on unmount. A
redirect from Stripe does not imply successful payment or cancellation. Confirmed
completion navigates to the existing receipt, with test-payment labeling; confirmed
expiry/cancellation clears only the matching recovery record and links to the product catalog.
Pending cancellation keeps explaining that the provider outcome is unresolved.
Closed payments use neutral wording for direct-product and cart purchases. Their
**Return to product catalog** action opens `/`; the shared shell also defaults to
the catalog. Source-specific back links on the checkout review remain unchanged.
Verified with 57 checkout tests, lint and production build, plus 20 mocked browser
checks of cancelled/expired states at the five supported widths in both themes,
including a short viewport. No horizontal overflow or page errors occurred.

The UI does not collect card details, load a Stripe SDK or calculate order totals.
Configure backend test credentials and the return origin as described in the
[Stripe setup guide](../../../backend/docs/checkout/stripe-api.md). Without that
configuration, the Stripe preview returns an unavailable error; COD remains usable.

Regression tests in `StripeCheckout.test.tsx` cover USD review, saved request
retries, pending callback behavior, verified completion, cancellation and clearing
only the resolved request. The source preview contract tests now include the
explicit COD method field sent by the frontend.

Verified on 2026-10-10: all 109 frontend tests passed with one worker, plus lint,
TypeScript/production build and changed-file formatting checks. Chromium passed
40 review/pending/cancelled/paid layout checks at 330, 375, 768, 1024 and 1440px in
both themes, including a 375×400 viewport and keyboard payment selection. No
horizontal overflow or browser page errors were found. Browser APIs were mocked;
a hosted Stripe test-account payment still requires the backend setup above.
## Confirmed Stripe session-creation rejection

The backend returns a definitive `400` after closing a verified unsupported-parameter
creation rejection and releasing its reservations. The existing placement hook
clears the saved request and requires **Update order details** before submitting a
fresh request with a new idempotency key. Uncertain `503` responses retain the
original request and key. This recovery is covered by the Stripe checkout tests.

Direct-redirect verification: all 46 checkout tests passed, along with lint,
TypeScript/production build and changed-source formatting checks. Chromium checked
20 review/recovery layouts across 330, 375, 768, 1024 and 1440px in both themes,
including a 375×400 viewport. Mocked browser navigation confirmed direct Stripe
handoff, preserved recovery storage and no automatic redirect on return, with no
horizontal overflow or page errors. Stripe itself was not charged by these checks.

Selection-scoped recovery verification: 52 checkout tests passed, plus lint,
TypeScript/production build and formatting checks. Twenty Chromium checks covered
independent product reviews, original-payment recovery and the legacy link at
330, 375, 768, 1024 and 1440px in both themes, including a 375×400 viewport. No
horizontal overflow or page errors occurred; APIs and Stripe navigation were mocked.

Stripe's hosted summary now uses the saved product names, store descriptions, USD
unit prices and quantities. Public HTTPS storage images are included when available;
localhost/relative media URLs are omitted. Carts over 100 product lines show the
first 99 plus a labelled combined remainder, preserving the exact charge. Existing
payment attempts retain their saved Stripe summary; new attempts use the new layout.

Automatic payment verification: all 54 checkout tests passed, including Strict Mode
entry, confirmed completion without a click, unavailable-provider retry and cached
page restoration. Lint, TypeScript/production build and formatting passed. Twenty
Chromium checks covered pending and completed returns at 330, 375, 768, 1024 and
1440px in both themes, including a short viewport. Each entry made one automatic
reconciliation, completed states opened the receipt, and no horizontal overflow or
page errors occurred. Payment APIs were mocked.

## Saved checkout order details

The saved checkout card and unresolved Stripe payment page show an order summary
from the authenticated owner's existing confirmation endpoint. It includes product
names, images, quantities, unit prices, item and store subtotals, delivery details,
and the total payment. Names, prices, quantities and recipients use purchase
snapshots; images use the current catalog with missing/broken-image placeholders.
Reading this summary preserves the pending payment recovery record. Loading and
retry errors are independent of the payment controls.

Verification: all 57 checkout tests passed, including summary rendering on both
pages, recovery preservation and retry after a details request fails. Lint,
TypeScript/production build and changed-source formatting passed. Twenty Chromium
layout checks covered both pages at 330, 375, 768, 1024 and 1440px in both themes,
including a short viewport and long names. No horizontal overflow or page errors
occurred. Browser payment and order APIs were mocked.

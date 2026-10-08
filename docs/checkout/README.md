# COD checkout frontend

## Scope

This version supports Cash on Delivery. Stripe/e-wallet integration is deferred and is not presented as an available payment method. Shipping fees, taxes, and discounts are not added by the frontend; totals come directly from the checkout API.

## Routes and contracts

- `/checkout?source=product&product_id=2&quantity=1` purchases that product independently of the cart.
- `/checkout?source=cart&item_ids=1,4` purchases only the selected saved cart items. The server reads their quantities.
- `/checkout/confirmation/:reference` retrieves the authenticated owner's persisted purchase snapshots, with current store/product images. Images are presentation-only and may change with catalog updates; missing, deleted, or broken images use placeholders. Purchase names, recipient details, and prices remain historical.

The checkout back link follows its source: Back to product returns to the selected product; Back to cart returns to the cart. This works after reload and sign-in because the source is retained in the URL.

Checkout URLs contain identifiers and quantities only. Login preserves the query string. Invalid, duplicate, empty, and oversized selections are rejected locally; ownership and availability remain server validations.

API contracts: [recipients](../../../backend/docs/checkout/recipients-api.md), [preview](../../../backend/docs/checkout/preview-api.md), and [COD placement/confirmation](../../../backend/docs/checkout/cod-api.md). Current backend serializers and services were checked against these contracts. The [shared COD business flow](../../../docs/diagrams/specific-business-processes/checkout/cod-checkout.md) also matches these API handoffs. The backend API documentation and shared business flow record the implemented COD frontend and backend scope; Stripe and fulfillment remain future work.

## Review and recipient selection

The page loads the server preview and saved recipients. A saved default is selected initially; customers can choose exactly one recipient or create a new one. New recipients use the existing international phone and address-country controls. Choosing a recipient does not change the saved default. Required fields and server field errors remain visible in the recipient form.

Prices are decimal strings formatted without floating-point totals. The frontend does not convert currencies or infer currency from phone country. Item issues and unavailable totals block placement. Preview expiry is tracked internally without a customer-facing countdown or stock-check message. Place Order is the normal payment-section action. When the preview expires or placement requires another review, checkout shows “Please update your order details before continuing.” and an Update order details button. This fetches fresh prices and availability for review; it never automatically places the order. No background polling silently changes the accepted price.

Selected cart quantities above positive available stock are reset to one when Checkout is clicked, with a message requiring review before continuing. Zero-stock products remain unavailable and are blocked by preview. Live stock can still change afterward; placement checks it atomically on the server.

## Order placement and recovery

Before POSTing a COD purchase, the client saves the exact request (signed preview token, recipient ID, payment method, and UUID idempotency key) in account-scoped session storage: `checkout:cod:<userId>`. It does not store recipient contact/address details. Repeated clicks are blocked synchronously.

Network errors, server errors, authentication interruptions, and idempotency conflicts retain that request. Revisiting checkout in the same tab offers **Retry saved order**, including when the original source URL is missing or preview has expired. Retry sends the original body and key, allowing the backend to return an existing completed purchase. It does not fetch a replacement token or silently start a new purchase.

Definitive validation/stock failures require another review before a new request. Because the current API exposes conflicts as `detail` text rather than machine-readable codes, the error parser explicitly recognizes the backend's idempotency-conflict message and retains the saved request. A future contract change should add error codes in both applications together.

A successful response saves its confirmation reference before navigating. Confirmation retrieval is read-only and clears only the matching saved attempt. COD order payment remains unpaid. Storage errors prevent a new placement when recovery cannot be preserved.

Session storage survives reload and navigation in the same tab; closing the tab clears it. This is not a cross-device order history or a cross-tab purchase lock.

## Verification

Integration tests live in `tests/checkout/`, with product/cart entry tests in `tests/ecommerce/`. They use actual routes, authentication, and the HTTP client with MSW responses. Browser checks use mocked API responses, so they do not seed or mutate development data.

Verified responsive checkout, recipient selection/form, and confirmation at 330, 375, 768, 1024, and 1440px in light and dark themes; the recipient form also fits a 375×400 viewport with internal scrolling. These 41 browser layout/interaction checks found no horizontal page overflow or browser page errors.

Keyboard checks verified arrow-key recipient selection, Escape closing the dialog and returning focus to Change, country selection, and recipient form validity.

# Customer orders

`/orders` is authenticated and appears as **Orders** above **Log out** in the
shared avatar menu. No Wallet entry or customer wallet feature is included.

## Behavior

| Tab        | Fulfillment statuses                         |
| ---------- | -------------------------------------------- |
| All        | Every status                                 |
| To Ship    | Pending, Accepted, Packed, Shipment Arranged |
| To Receive | Shipped                                      |
| Cancelled  | Cancelled                                    |
| Delivered  | Delivered                                    |
| Completed  | Completed                                    |

The URL preserves `tab` and `page`. Backend filtering precedes pagination (20
orders per page), ordered by creation time descending, then ID descending.
One card is one order from one store; separate purchases at the same store stay
separate. Names and prices are purchase snapshots, images are current catalog
media with placeholders. Subtotals and totals are backend decimal strings;
quantity is included exactly once. No client-side currency conversion occurs.

Cancelled, Delivered and Completed cards display `concluded_at` when recorded,
with the appropriate status label. Older records may lack that timestamp; the
page does not fabricate one or use checkout completion as delivery time.
Dates display in the browser's local timezone.

Pending, Accepted and Packed orders offer cancellation after confirmation.
Shipment Arranged and later orders cannot be cancelled. The backend rechecks
under locks, restores inventory once and safely accepts repeated requests.
Unresolved online checkout payments use **View payment** and the existing
whole-checkout payment-recovery flow, since a live Stripe checkout cannot be
partially cancelled per store. COD cancellation creates no refund. A confirmed
cancellation shows an “Order cancelled.” toast. Refund instructions and status
remain visible on the page and order card rather than depending on the toast.

Paid Stripe test orders request a refund for exactly this store order's USD
amount to the original test card. The confirmation dialog names the destination.
Cancellation and refund status are separate: cancellation may succeed while the
provider outcome is pending or unknown. **Check refund status** safely reconciles
the existing request. A failed/canceled provider refund requires support; it is
never represented as refunded. Zero-value paid store orders need no refund.

Loading, retryable read errors, empty tabs, action conflicts, pagination and
missing images have explicit states. Tabs use the shadcn Base UI composition,
with rounded segmented controls, a three-column mobile arrangement and six
columns from `sm`. The selected tab uses the primary accent. Order cards pair
status text with an icon, emphasize totals, and keep history actions quiet.
Pending payments use a primary **View payment** action. The empty All tab offers
**Browse products**. Theme values come from `src/app/index.css`.

## Design and deferred scope

The [original Orders wireframe](https://www.figma.com/design/dC74hwxyZCht0LnEn7JIuI/E-Commerce-Wireframe?node-id=337-748&m=dev)
was inspected as a visual guide. The current six-tab requirements override its
five tabs. The page reuses the application's header, image fallbacks, buttons,
and confirmation dialog; order search was not part of the agreed scope.
No Figma canvas changes were made.

Contact Seller is deferred and omitted. Delivered orders show a note explaining
that product returns are unavailable in this demo. Completed is the backend
fulfillment status;
seven-day automatic completion, delivery workflow, returns and wallet features
are deferred. The existing internal ledger is used only to reverse a confirmed
Stripe receipt; customer wallets are not created or credited.

## Order history

Each card has **View order history**, opening a scrollable dialog with the complete
recorded timeline, oldest first. Entries show a milestone, full date/time with the
browser's local timezone, and Customer, Seller, System or Actor not recorded.
The dialog loads only when opened and fetches fresh history on reopening. Loading,
retryable errors and an empty history are handled independently of the order list.
Escape and Close return focus to the history button.

`GET /api/shop/orders/{id}/history/` is owner-only and read-only. It returns
`order_id`, `current_status`, `is_partial`, and `events` containing `id`,
`event_type`, `label`, `occurred_at`, `actor_role`, and `is_backfilled`. Actor
identities, provider references and internal retry errors are not exposed.

Placement, fulfillment changes, payment confirmation, cancellation, refund requests
and verified refund-state changes are permanently recorded by the backend. Status
changes and their events commit together; retries do not repeat the same milestone.
Seller fulfillment APIs and automatic seven-day completion remain deferred. The
logging mechanism supports their future status writes without inventing those
workflows or showing unperformed milestones.

Apply `ecommerce.0003_orderevent` and `ecommerce.0004_backfill_order_events`.
The backfill uses only saved creation/payment/conclusion/refund timestamps. Older
orders show an explicit partial-history notice, with unknown actors labelled as
such. A historical Completed order does not gain an invented delivery date.

History verification: nine Orders-page integration tests passed, along with frontend
lint, TypeScript/production build and formatting. The backend suite passed 296 tests
with two existing skips on isolated PostgreSQL; OpenAPI validation and migration
drift/plan checks passed. Fifty Chromium checks covered populated, partial, empty,
error and loading history at 330, 375, 768, 1024 and 1440px in both themes, including
375×400. Dialog bounds, internal scrolling, retry, Escape and focus restoration
were checked; no horizontal overflow or page errors occurred. Browser APIs were
mocked. Development migrations were not applied because database authentication
failed; the build retains its existing large-chunk warning.

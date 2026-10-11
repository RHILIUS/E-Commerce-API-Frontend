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
partially cancelled per store. COD cancellation creates no refund.

Paid Stripe test orders request a refund for exactly this store order's USD
amount to the original test card. The confirmation dialog names the destination.
Cancellation and refund status are separate: cancellation may succeed while the
provider outcome is pending or unknown. **Check refund status** safely reconciles
the existing request. A failed/canceled provider refund requires support; it is
never represented as refunded. Zero-value paid store orders need no refund.

Loading, retryable read errors, empty tabs, action conflicts, pagination and
missing images have explicit states. Tabs use the shadcn Base UI composition,
with a three-column mobile arrangement and six columns from `sm`. Theme values
come from `src/app/index.css`.

## Design and deferred scope

The [original Orders wireframe](https://www.figma.com/design/dC74hwxyZCht0LnEn7JIuI/E-Commerce-Wireframe?node-id=337-748&m=dev)
was inspected as a visual guide. The current six-tab requirements override its
five tabs. The page reuses the application's header, image fallbacks, buttons,
and confirmation dialog; order search was not part of the agreed scope.
No Figma canvas changes were made.

Contact Seller is deferred and omitted. Delivered orders have a disabled
**Return — coming soon** control. Completed is the backend fulfillment status;
seven-day automatic completion, delivery workflow, returns and wallet features
are deferred. The existing internal ledger is used only to reverse a confirmed
Stripe receipt; customer wallets are not created or credited.

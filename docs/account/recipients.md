# Recipient configuration

Authenticated customers open **Header → Account → Account** to reach `/account`
(`UserAccountPage`). Profile is the default tab; Recipients is also directly
accessible at `/account?tab=recipients`. Change Password remains deferred.

## Design and reuse

The [original account wireframe](https://www.figma.com/design/dC74hwxyZCht0LnEn7JIuI/E-Commerce-Wireframe?node-id=396-1519&m=dev)
was inspected. Accepted refinements use readable address cards, an Add recipient
action, Default labels, explicit Make default actions, and confirmed deletion in
both Account and Checkout. Account has no order-selection radio buttons. Both
screens use semantic theme tokens and responsive, scrollable dialogs. The Figma
canvas has not been modified; migration-file mapping remains pending.

`src/account/api.ts` and `src/account/types.ts` own the recipient API and types.
Shared address display, form, list and editor/confirmation components live in
`src/account/components/`; loading and mutation hooks live in `src/account/hooks/`;
error parsing lives in `src/account/utils/recipientError.ts`.
`src/account/routes.tsx` defines `accountProtectedRoutes`, composed directly by the
app router under the shared protected-route guard.
Checkout retains only its selection summary and chooser wrapper. Confirmation
and saved-order summaries reuse the address display with purchase snapshots.

Add/edit share the validated country/phone controls. Making a default uses PATCH
with `is_default: true`. The default label and account preference are separate
from selecting a recipient for a particular checkout. Editing or changing defaults
preserves the checkout selection; a newly created recipient is selected directly.

## Removal and API dependency

Integrates with [backend recipient API](../../../backend/docs/checkout/recipients-api.md)

- Delete opens a confirmation in both Account and Checkout.
- Deleting the default requires an explicit replacement when others remain.
- The last saved recipient may be removed. A subsequent first recipient is default.
- DELETE returns the authoritative remaining list. Removed records are retained
  internally for order history and cannot be used in new purchases.
- Existing order snapshots, pending payments and exact checkout retries are preserved.
- Checkout clears a removed selection, including an implicitly selected default;
  another recipient must be selected/added before placing a new order.
- Requests block duplicate submissions; save/delete dialogs cannot dismiss while busy.
- Unknown mutation outcomes reload the list. If that reload fails, further address
  mutations are disabled until a successful explicit reload. No create is blindly retried.
- Form validation keeps the draft; loading errors expose retry; empty lists expose Add.

## Personal address ownership

Registration creates User, UserAddress and the initial default recipient atomically.
The personal address and delivery recipients are independently editable records.
User no longer stores country_code. Authentication responses expose nullable
`address_country_code`, derived from the personal address, for country-dependent
price refreshes. Recipient countries and the registration address request remain
unchanged. The [Profile tab](profile.md) reads and updates personal details and
address; photo upload and cropping remain deferred.

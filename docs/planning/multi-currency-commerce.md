# Multi-currency commerce plan

Status: staged design. Shared default resolution and manual browsing selection
are implemented; [display currency](../ecommerce/display-currency.md) describes
current behavior. Signed country defaults are implemented locally and need runtime
configuration and deployed verification. Selected-currency checkout and accounting/payout
extensions below remain proposals. It covers the frontend, backend, and deployment;
exact server contracts belong in backend documentation when implemented.

Customers should be able to choose a browsing currency and, where supported,
pay in that currency. Stores continue setting prices and earning proceeds in
their store currency. A buyer's choice never rewrites product prices.

For example, a PHP store lists an item at PHP 1,000. A buyer reviews an
illustrative USD 18 quote. The purchase preserves both amounts, the conversion
terms, and the store's agreed PHP proceeds. Provider settlement may use a third
currency and must be recorded separately.

## Current implementation audit

| Area                | Verified behavior and source                                                                                                                                                                                                                      | Required change                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Original prices     | Products use `Store.currency`; country-to-currency mapping uses Babel. See the [catalog contract](../../../backend/docs/api/ecommerce/product-catalog.md).                                                                                        | Preserve prices, store-currency protections, and ambiguous-country handling.                                              |
| Country options     | [Country helpers](../../src/authentication/countries.ts) use `libphonenumber-js` phone regions and `Intl.DisplayNames`; phone default is PH.                                                                                                      | Keep phone behavior. Do not use phone regions as payment or shipping eligibility.                                         |
| Display conversion  | [Display pricing](../../../backend/apps/ecommerce/services/display_prices.py) resolves account-address currency or USD, caches rates, and retains source amount/currency on missing conversion.                                                   | Separate preference resolution from conversion; preserve safe fallback.                                                   |
| Checkout conversion | [Pricing](../../../backend/apps/checkout/services/pricing.py) already accepts an internal target override and uses strict conversion. COD defaults from address; Stripe forces USD.                                                               | Expose a validated payment-currency request; never silently substitute an explicit payment choice.                        |
| Review terms        | [Preview contract](../../../backend/docs/api/checkout/preview.md) describes customer-bound signed five-minute terms; placement revalidates stock and source prices under locks.                                                                   | Extend this existing mechanism, including seller allocations; a new quote database table is not initially necessary.      |
| Purchase records    | [Checkout models](../../../backend/apps/checkout/models.py) already store decimal amounts/currency, immutable payment terms, attempts, provider events, and refunds.                                                                              | Add seller proceeds and settlement facts without rewriting purchase history.                                              |
| Online payment      | [Stripe contract](../../../backend/docs/api/checkout/stripe.md) implements hosted test checkout, saved session parameters, idempotency, holds, signed webhooks, and scheduled reconciliation.                                                     | Generalize currency validation and provider amounts; retain recovery and test-only safeguards.                            |
| Accounting          | [Wallet models](../../../backend/apps/wallet/models.py) enforce USD; [posting services](../../../backend/apps/wallet/services.py) balance integer cents, lock treasury/accounts, and protect operation keys.                                      | Introduce currency accounts and balance each currency independently.                                                      |
| Refunds             | Refund records use `amount_cents`; provider verification and reversal services assume USD.                                                                                                                                                        | Preserve original payment currency and saved seller allocation on reversal.                                               |
| Frontend recovery   | [Review hook](../../src/checkout/hooks/useCheckoutReview.ts) refreshes on payment-method changes; [recovery storage](../../src/checkout/utils/recovery.ts) preserves the original request.                                                        | Include requested currency in review identity, but do not create a new recovery identity merely because currency changes. |
| Deployment          | [Shared deployment](../../../docs/architecture/production-deployment.md) uses Pages Functions, backend Nginx, PostgreSQL, Redis, workers, and Beat. The [API proxy](../../functions/api/[[path]].ts) currently has no application country policy. | Establish a trusted edge-country path; use a shared production FX cache.                                                  |

### Corrections to earlier assumptions

Stripe test payments, authoritative signed previews, webhook handling, and
retry-safe accounting already exist. Extend them rather than implementing them
from scratch. The journal derives balances from entries; `balance_cents` is not
a persisted wallet field. USD restrictions extend through placement, provider
parameters, success validation, refunds, ledger constraints, and tests.

The shared overview and inspected checkout code agree that online receipts are
simulated USD. Live payments, seller settlement release, and withdrawals remain
unimplemented. Configured hosting does not prove any deployed account or service
supports the proposed currencies.

## Target ownership and policy

Keep a modular Django application, using the existing apps and service boundaries.
No new service deployment or frontend currency conversion engine is needed.

| Responsibility                                        | Owner                                                      |
| ----------------------------------------------------- | ---------------------------------------------------------- |
| Store pricing and original amounts                    | Store and product models                                   |
| Currency metadata and preference resolution           | Focused shared backend currency module                     |
| Browsing conversion and tolerant fallback             | Existing ecommerce display-pricing service                 |
| Strict quoted prices and allocations                  | Existing checkout pricing, preview, and placement services |
| Provider requests, verification, and settlement facts | Checkout payment services                                  |
| Seller liabilities, clearing, and immutable postings  | Wallet accounting services                                 |
| Provider onboarding and withdrawals                   | Later payout responsibility, integrated with the ledger    |

Use separate supported sets for display conversion, Stripe charging, COD, and
seller payouts. Browsing choices come from cached provider capabilities, optionally narrowed by
application configuration. Payment capabilities remain separately controlled; Babel metadata alone grants no eligibility.
Retain known same-currency behavior where permitted by the relevant payment method.

Resolve browsing defaults in this order: explicit browser preference, account
address currency, trusted detected country currency, then USD. Persist only explicit
choices locally; automatic defaults follow the current viewer. A manual choice
survives login/logout and address edits. Provide an automatic option that clears it.
Validate stored values against supported options; storage failure must not block
browsing. Do not persist a new account setting or infer location from phone numbers.

Keep the selected currency in catalog, store, detail, cart display, and history
cache identities. Cancel obsolete requests and reset accumulated catalog pages
without mixing currencies. A failed conversion still shows its actual source code.
Changing a currency must preserve search and predictable focus/scroll behavior.

Checkout requests the preferred currency explicitly. Unsupported choices require
customer review of an alternative, never a silently relabelled or converted charge.
COD retains its existing policy initially; any change to cash collection currency
needs a separate delivery/collection policy. A pending purchase keeps its saved
currency even if the header preference changes.

## Proposed API contracts

Currency metadata and browsing/cart `display_currency` inputs are implemented.
Checkout currency inputs and allocation extensions remain proposals. Read the
[implemented backend contract](../../../backend/docs/api/ecommerce/currencies.md)
for current behavior; country-based defaults require configured signed hints.

| Surface                                                   | Proposed contract                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/shop/currencies/`                               | Public metadata: `currencies` entries with `code`, `name`, `minor_unit`, `display_supported`, and `stripe_supported`; `default_currency` and `default_source` (`address`, `country`, `fallback`). No raw IP or precise location. Client applies its validated explicit preference. |
| Catalog, product detail, public store products, cart read | Optional `display_currency=PHP`; omission preserves defaults during rollout. Existing money objects remain decimal-string amount plus actual currency. Invalid/unavailable requested options return 400 field errors. Transient missing display rates preserve source prices.      |
| Existing checkout preview POST                            | Optional `currency` for Stripe review; omitted requests retain USD compatibility initially. Validate against enabled charging currencies. Existing selection fields and `payment_method` remain.                                                                                   |
| Preview response                                          | Retain `preview_token`, `expires_at`, money objects, issues, and readiness fields. Token version binds payment currency, original amounts, buyer lines, seller allocations, rates, and policy version.                                                                             |
| Existing placement POST                                   | Retain token, recipient, method, and idempotency key. Currency is authoritative inside the token, not an independent placement override.                                                                                                                                           |
| Confirmation                                              | Existing totals remain buyer-payment amounts. Add seller/settlement information only on appropriately authorized surfaces; historical receipts always use saved money.                                                                                                             |

Keep 400 validation, 409 stale/conflicting terms, and 503 required-pricing/provider
outage semantics. Signed quotes remain customer-bound and short-lived. Persist
accepted snapshots at placement. Preserve replay-before-expiry checking, lock
ordering, stock holds, and exact original placement-body recovery.

When a capability is disabled, block new quotes but continue recovering saved
attempts, processing refunds, and reading historical records. Version preview
tokens so deployment can accept already-issued terms for their remaining lifetime
or explicitly require a fresh review; never reinterpret old signed data.

## Seller proceeds and provider settlement

Initial seller entitlement is the original store-currency line amount multiplied
by quantity, with zero new commission or buyer surcharge. The platform provisionally
absorbs provider fees and FX differences. This is a simulation-first design default,
not permission to launch a loss-making live policy. Store exact fee/FX allocations
when introduced and require a reviewed live policy before release.

Round buyer unit prices using the existing documented rule, then multiply and sum.
Save each store's buyer-currency allocation and store-currency entitlement.
Do not derive seller entitlements later by reversing a rounded buyer total.

Provider balance transactions supply actual settlement gross, fees, net, and
currency; browsing rates do not establish those facts. Represent obligations and
provider assets separately. Cross-currency entries use linked clearing accounts
and balance within each currency. Support explicit platform expense and FX gain/loss
accounts rather than pretending every difference is seller revenue.

Keep one wallet owner, with accounts unique by wallet, currency, and bucket.
Retain pending, available, and withdrawal-pending distinctions. Treasury/clearing
uniqueness becomes currency-aware. Use integer minor units in accounting and
explicit precision at the provider boundary; Stripe charging/payout exceptions
must not be inferred solely from Babel. Preserve atomic posting, immutable history,
stable operation keys, and account-lock ordering; do not relax locks casually.

Payment confirmation credits pending entitlement once. Release and withdrawals
remain unavailable until their eligibility and recovery flows are implemented.
Refunds use saved buyer-currency amounts and reverse the saved seller entitlement
once. Later refund-after-release and dispute flows need explicit recovery/debt
accounts; do not weaken current nonnegative account protections to support them.

One charge for several stores suggests evaluating Stripe Connect separate charges
and transfers. This is a candidate, not a selected live integration: platform and
seller countries, settlement support, cross-border eligibility, and funding must
be established first. An internal balance does not guarantee a payout route.

## Country detection boundary

The Pages Function signs `request.cf.country` with a dedicated runtime secret.
Django verifies the country, request method, backend origin, full path/query and
short timestamp window before using it. Client country headers are replaced;
direct requests without verified hints use address/USD defaults. The same optional
`COUNTRY_HINT_SECRET` belongs in Pages secrets and backend `.env`, never the browser
build. With blank configuration, detection stays disabled.

Implementation and mocked tests do not prove Cloudflare metadata availability or
key agreement in a deployed chain. Follow [isolated preview setup](../deployment/cloudflare-pages.md#enable-country-defaults-in-an-isolated-preview)
before release. No production or preview deployment is performed by this plan.
Country is a browsing hint, never authorization, tax residency, delivery eligibility,
or payment-account verification. Checkout continues using its existing rules.

## Migration and rollout

1. Centralize currency policy while preserving existing responses and defaults.
2. Add metadata and optional display inputs, then the frontend selector and cache
   invalidation. Add trusted automatic defaults separately.
3. Extend signed review terms and purchase snapshots. Preserve old token handling
   across the five-minute validity window and existing placement replays.
4. Expand accounting schema before enabling non-USD payments. Rename cents fields
   to minor-unit terminology without scaling existing USD integers. Preserve old
   operation keys, fingerprints, references, receipt links, and refund amounts.
5. Retain legacy USD accounts/balances even for PHP stores. Create new store-currency
   accounts for new purchases; never relabel or automatically convert historical
   liabilities. Keep legacy attempts/refunds on their original USD path.
6. Validate simulated multi-currency receipts and reversals, then enable configured
   Stripe test currencies. Persist settlement facts separately and reconcile them.
7. Design release, seller onboarding, Connect funding/transfers, withdrawals,
   disputes, and live safeguards before enabling real money.

Use additive migrations and a controlled rollout gate for new payment currencies.
Check backups, row counts, journal sums per currency, uniqueness, existing pending
attempts, and rollback compatibility before schema contraction. Rollback disables
new quotes; it must not strand existing purchases or rewrite financial records.

## Stage acceptance and remaining decisions

| Stage         | Required evidence                                                                                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2: policy     | Existing defaults and FX safeguards pass focused tests.                                                                                                                       |
| 3: selection  | Guest/account persistence, login/logout, address edits, all browsing consumers, cancelled requests, history, storage failures, responsive themes, and keyboard behavior work. |
| 4: detection  | Trusted edge path and direct-origin spoof rejection demonstrated; unknown countries fall back safely.                                                                         |
| 5: quotes     | Currency changes invalidate reviews; tampered/expired terms fail; retries recover original purchases; buyer allocations sum exactly.                                          |
| 6: accounting | Migration preserves USD history; per-currency balanced posting, duplicate/conflicting keys, concurrency, refunds, and zero/three-decimal cases pass.                          |
| 7: provider   | Test success/failure, delayed/duplicate events, cancellations, refunds, amount mismatches, and settlement reconciliation pass.                                                |
| 8: payouts    | Eligibility, funds availability, provider failures, disputes, reconciliation, and operational recovery are implemented before live enablement.                                |

Before Stage 7, establish the actual Stripe platform country, permitted seller
countries, account charging currencies, and Connect configuration without exposing
credentials. Do not select an exhaustive currency list from phone metadata.
Before live release, finalize who bears fees/FX losses, seller release timing,
refund-after-release debt handling, payout conversion, and failed withdrawal recovery.
These do not block the browsing stages.

Update exact API/OpenAPI contracts in the backend as implemented. Model changes
require backend ERD guides and editable Draw.io SVGs; changed implemented workflows
require paired shared SBP guides/diagrams and indexes. This proposal does not alter
current workflow diagrams or claim future behavior is implemented.

## References and repository layout

Local `docs/` explains the frontend; sibling `backend/docs/` owns server contracts;
sibling `docs/` owns shared architecture. Links assume all three repositories are
checked out together; see [repository links](../../README.md#where-this-repository-fits)
when reading on GitHub.

- [Stripe currencies, settlement, minor-unit exceptions, and amount limits](https://docs.stripe.com/currencies)
- [Stripe separate charges and transfers](https://docs.stripe.com/connect/separate-charges-and-transfers)
- [Cloudflare request metadata](https://developers.cloudflare.com/workers/runtime-apis/request/)
- [Current frontend checkout](../checkout/README.md)
- [Current shared system behavior](../../../docs/system-overview.md)

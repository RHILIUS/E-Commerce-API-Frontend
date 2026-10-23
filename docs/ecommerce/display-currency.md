# Display currency

Guests and signed-in customers can choose how prices are displayed while browsing.
Open the currency control beside the logo in the shop header, then search by code
or currency name. The selection applies to the catalog, product pages, store
products, and cart prices, including responses after editing cart quantities.

## Defaults and remembered choices

An explicit choice stays selected through login, logout, address edits, and
navigation. It is stored in this browser's localStorage as `shop:display-currency`
and shared with other tabs. Reloading restores it after checking it against the
backend's supported options. Unknown saved values are ignored.

Choose **Automatic** to clear the explicit preference. The backend then uses the
signed-in customer's personal-address currency, or USD for guests and unresolved
addresses. Automatic country detection is not enabled. Phone-number country and
delivery recipient do not choose the browsing currency.

If browser storage is blocked, a selection still works in memory for this visit.
The selector explains that it could not save the preference. A metadata request
failure offers **Try again** and does not block ordinary browsing; previously
validated options stay available during refresh. An automatic default can be
outside the manually selectable currencies, preserving address-based defaults.

## Prices and checkout

The backend converts prices and returns the actual amount and currency together.
Missing conversion rates keep the original store amount and currency. The header
therefore expresses a preference, not a guarantee that every price is converted.
The frontend never relabels amounts or adds different currencies into one total.

This control does not change product prices, account addresses, saved orders,
seller balances, or payment terms. Checkout confirms its own currency: Stripe test
checkout remains USD and cash on delivery retains its existing currency policy.

## Requests and state

The [backend currency contract](../../../backend/docs/api/ecommerce/currencies.md)
defines options and the optional `display_currency` query parameter. The browser
uses metadata from `GET /api/shop/currencies/`, not phone-library country options.
The backend discovers the provider's full current currency list, caches it daily,
and uses Babel for names and precision. An optional backend restriction may narrow
that list. A provider outage can reuse validated metadata for up to seven days;
without usable metadata, the selector offers retry. Requests using Automatic do
not require that list. Currency-list availability does not guarantee that every
product has a usable conversion rate.

[CurrencyProvider](../../src/ecommerce/currency/CurrencyProvider.tsx) owns the
preference and metadata lifecycle. [CurrencySelector](../../src/ecommerce/currency/CurrencySelector.tsx)
uses the installed searchable combobox. Shared browsing hooks include the
preference in request identities and cancel obsolete responses. Catalog history
snapshots include currency, so Back cannot restore prices from a different choice.
Changing currency starts the catalog at its first batch and preserves its search.
The selector stays mounted and returns focus to its trigger when closed; changing
currency does not navigate or deliberately scroll the page. A shorter refreshed
catalog can limit the reachable scroll position.

Cart refreshes hide prices from a different preference. Mutations keep their
original request; changing currency while an edit is in flight does not replay
that edit. After it settles, a fresh read retrieves the current currency.

See the [shared currency-selection process](../../../docs/specific-business-processes/guide/ecommerce/display-currency.md)
for frontend, backend, and exchange-rate responsibilities.

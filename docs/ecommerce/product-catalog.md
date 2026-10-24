# Product catalog integration

The landing page requests `GET /api/shop/products/` through the shared API client.
The backend contract is documented in
[the backend catalog documentation](../../../backend/docs/api/ecommerce/product-catalog.md).

The catalog starts with up to 12 products. **Load more** requests the next page
and appends its products below the existing cards without moving the viewport.
The backend still uses fixed pages of 12 at every screen width; numbered page
controls are not shown on the landing page. Store pages retain their own controls.
Initial loading uses 12 matching card placeholders.

While more products load, the button is unavailable and the E-Commerce logo
shakes gently beside “Loading products…”. The logo stays still when reduced
motion is requested. Existing cards remain usable. A failed request keeps those
cards and offers **Try again** for the same next page. When the API returns no
next page, a stationary muted logo and “You’re all caught up” replace the button.
A search with no matches uses the separate **No products found** state.
Keyboard activation moves focus to the first new card without scrolling.

The search stays in the URL as `q`; submitting a different search starts again
with page 1. Accumulated products live in memory and reset when the catalog
unmounts, reloads, or the viewer/token or personal-address country or selected display currency changes.
Legacy `page` URL parameters do not select a starting page. The frontend sends
successive `page` numbers internally and follows the API's `next` availability.
Rankings can change between requests, so already displayed product IDs are not
appended twice. Page-based ranking does not guarantee a stable snapshot while
products or order activity change.

The catalog waits for authentication restoration and the currency metadata attempt
before requesting products
and uses the shared Bearer-token client. Initial loading failures offer a retry;
obsolete requests are cancelled when the search or viewer changes.

The landing-page route (`/`) is public and remains under `RootLayout` and
`AuthProvider`. Guest requests omit the Bearer token and receive the backend's
popularity-based ordering. Signed-in requests retain personalized ranking.

Ranking and ordered counts include units in every non-cancelled order, including
unpaid and refunded purchases. Cancellation always excludes an order. Personal
category preferences use the viewer's lifetime quantities; product popularity uses
everyone's quantities over seven days by default. Displayed ordered counts use
lifetime product quantities. These figures measure demand rather than completed
sales. Changes appear on the next request; loaded cards are not automatically reordered.

While the session is being restored, the header shows an account placeholder.
Guests see **Log in** and **Sign up** links; signed-in visitors see the existing
account controls. Logging out on the landing page keeps its URL and search
parameters, switches the header to guest controls, and reloads guest products.
Protected pages such as `/home-test` still redirect guests to login.

The shared shop header remains visible while scrolling. After the original header
row passes the top of the viewport, it becomes a compact rounded floating bar.
The same controls stay mounted, preserving search drafts and focus. On screens
narrower than the desktop layout, a search button opens a full-width search row.
Opening it focuses the input; the close button or Escape returns focus to the
search button without discarding the draft. Desktop search stays visible.
Submitting search starts the catalog from its first batch for the new query.
The account menu shows the signed-in user’s name and avatar from the existing
authentication context above its actions. A failed or missing photo uses the same
fallback as the header button. It includes Account, Orders, Log out, and an unavailable Notifications
entry marked Coming soon.

Cards display the backend's `display_price.amount` and `display_price.currency`,
formatted with `Intl.NumberFormat`. The original `price` belongs to the store's
`currency`; it is not necessarily USD. The frontend does not compute exchange rates.

With Automatic selected, guests receive prices converted to USD; signed-in users receive their personal-address
country's currency (USD when no address exists). Same-currency products retain their original amount. If the
backend cannot convert a price, it returns the original store amount and currency,
which the card displays without relabeling it. A page may then show multiple
currencies. Logging out reloads guest prices; personal-address country changes trigger a
new request. Conversion is a display estimate, not a checkout currency guarantee.

The backend shares its personal-address currency default with checkout through
[`default_currency_for_user`](../../../backend/core/common/currencies.py).
This helper chooses a currency; it does not fetch rates or establish payment
support. Browsing keeps its source-price fallback, checkout requires usable
conversion rates, and Stripe test checkout continues to override the default
with USD. The header supports [manual display currency](display-currency.md); location-based defaults remain planned.

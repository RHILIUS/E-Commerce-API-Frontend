# Product catalog integration

The landing page requests `GET /api/shop/products/` through the shared API client.
The backend contract is documented in
[the backend catalog documentation](../../../backend/docs/ecommerce/product-catalog.md).

The frontend displays the API's `results` in their returned order, computes page
count as `ceil(count / 8)`, sends `q` and `page`, and resets to page 1 when changing
the search. It waits for authentication restoration before requesting products
and uses the shared Bearer-token client. Loading, empty, and error states are
distinct; unavailable pages offer navigation back to page 1.

The landing-page route (`/`) is public and remains under `RootLayout` and
`AuthProvider`. Guest requests omit the Bearer token and receive the backend's
popularity-based ordering. Signed-in requests retain personalized ranking.

While the session is being restored, the header shows an account placeholder.
Guests see **Log in** and **Sign up** links; signed-in visitors see the existing
account controls. Logging out on the landing page keeps its URL and search
parameters, switches the header to guest controls, and reloads guest products.
Protected pages such as `/home-test` still redirect guests to login.

Cards display the backend's `display_price.amount` and `display_price.currency`,
formatted with `Intl.NumberFormat`. The original `price` belongs to the store's
`currency`; it is not necessarily USD. The frontend does not compute exchange rates.

Guests receive prices converted to USD; signed-in users receive their personal-address
country's currency (USD when no address exists). Same-currency products retain their original amount. If the
backend cannot convert a price, it returns the original store amount and currency,
which the card displays without relabeling it. A page may then show multiple
currencies. Logging out reloads guest prices; personal-address country changes trigger a
new request. Conversion is a display estimate, not a checkout currency guarantee.

# Store Customer View Page

Status: implemented. The agreed requirements extend the initial
[Store Page wireframe](https://www.figma.com/design/dC74hwxyZCht0LnEn7JIuI/E-Commerce-Wireframe?node-id=181-2&m=dev).
The reference was inspected; its canvas was not modified. The current theme,
shared Header, product cards, and responsive conventions govern the implementation.

## Navigation and browsing

`/stores/:storeId` is public, including for guests. ProductPage links the store
name and Visit store action to this route. The page shows the banner/logo (with
missing/failed-image placeholders), click-to-open full banner and logo images, active listing count, qualifying lifetime units
sold, store creation date, and public business address. About shows the description,
public email, public phone, and address; missing optional text is `Not provided`.
Store member identities and account contact details are never returned.

- Home: New Products, Trending Products, and Best Sellers, up to ten each.
  Sections have no pagination. View all opens All Products with the corresponding
  sort. Trending/Best Sellers previews contain only products with positive sales.
- All Products: ten per page, Latest by default; Oldest, Popular, and Best Sellers
  are also available. All active products remain browsable, including zero-sale
  and out-of-stock products. Cards reuse the landing design with an explicit
  out-of-stock label where the store API supplies zero stock.
- Categories: active shared taxonomy categories directly assigned to the store's
  active products, with counts. Clicking opens All Products with that category.
  Parent categories do not implicitly include descendants. Empty category results
  display `No products in this category.`
- About: public store information only. No editing UI, website, or named contact.

`tab`, `q`, `sort`, `category`, and `page` live in the URL. Enter or the store
search button searches only this store and opens All Products, clearing the
category and resetting pagination and sorting to Latest. Matching is trimmed,
case-insensitive, partial name/short-description search (up to 200 characters).
Sorting preserves query/category and resets pagination. Tabs start with clean
filters. Browser Back/Forward and refresh restore the URL state. The global
Header search continues to navigate to the landing catalog.

Loading, no listings, no search results (`No results found.`), no sales rankings,
missing stores, invalid filters/pages, and retryable request errors are separate
states. Product failures leave the profile visible. Requests wait for auth
restoration, refresh viewer-specific prices after account changes, abort on
navigation, and discard stale responses.

## API and sales contract

See [backend contract](../../../backend/docs/api/ecommerce/store-page.md).

- `GET /api/shop/stores/:id/`: profile, public contact details, counts and categories.
- `GET /api/shop/stores/:id/home/`: three bounded product sections.
- `GET /api/shop/stores/:id/products/`: paginated, filtered and sorted products.

Qualifying units come from **paid Stripe orders** and **delivered/completed COD
orders**, excluding cancelled orders and successful full-order refunds. Trending
and Popular use the rolling **30 days by order placement time**, inclusive of the
cutoff and excluding future orders. Best Sellers and Items sold use all qualifying
history. Ties prefer newest product creation, then highest ID. Oldest reverses
both date and ID. Store totals retain archived/deleted-product order history;
product lists exclude drafts and archived products for every viewer, even members.

Store cards, the landing catalog, and ProductPage use the same qualifying lifetime
units calculated from order history. The landing ranking
still uses its personalized/non-cancelled order logic, so its ordering can differ
from store rankings even though displayed sold counts agree. Display currencies reuse existing
backend conversion and fallback behavior without frontend exchange calculations.

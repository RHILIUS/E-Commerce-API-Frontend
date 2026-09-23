# Product Page implementation

The public route `/products/:productId` renders `ProductPage.tsx` from the
[Figma references](../figma-nodes.md#product-page-designs). Every catalog card
links to its own product ID. Header search returns to the catalog with `q`;
the breadcrumb returns to all products.

The page requests `GET /api/shop/products/<id>/` through the shared API client
after authentication restoration. See the
[backend contract](../../../backend/docs/ecommerce/product-detail.md).
Changes to the product ID, access token, or viewer country discard old results
and reload the product. This also hides a previously visible draft on logout.
The backend enforces draft access; missing and inaccessible products share the
same unavailable screen. Other request failures offer a retry.

## Content and interactions

- Prices use `display_price.amount` and its currency, matching catalog formatting.
- The gallery preserves API ordering and initially selects the first marked
  default, or the first image when none is marked. Multiple images have selectable
  thumbnails in a horizontally scrollable row; a single image hides that row.
  Empty and failed media show readable placeholders. Images use `object-cover`
  like Figma; arbitrary `crop` metadata is not interpreted because its transform
  format is not defined in the API contract.
- Quantity starts at one and is bounded by stock. Purchase and quantity controls
  use `can_purchase` to disable unavailable products. Archived products include
  a grayscale gallery and watermark; draft and out-of-stock notices match Figma.
- Store logos have an initials fallback. The creation timestamp is labeled
  **Store created**, since the API does not provide a selling-start date.
- Add to Cart and Checkout currently display an availability message when clicked.
  They do not mutate a cart or create an order; those write endpoints are not yet
  implemented. No purchase success is simulated.

Layouts stack below the desktop breakpoint and share semantic theme tokens for
light and dark modes. The existing Header retains its guest/member behavior.
There are no sample products or Figma asset URLs in the production page.

## Verification

`tests/ecommerce/ProductPage.test.tsx` exercises the real routing and HTTP client
with mocked API responses: navigation, gallery selection, quantity boundaries,
availability states, missing/failed media, errors, obsolete requests, and draft
visibility after logout. Backend tests validate the contract separately.

The frontend build (including TypeScript), ESLint, formatting, and all 51 tests
passed. Chromium checks with contract-shaped API fixtures covered 330, 375, 768,
1024, 1440, and 1920px in both themes, including a 375 × 568 viewport. Gallery
selection, the upper stock limit, and unavailable purchase controls passed;
no horizontal overflow or browser runtime errors were found. Desktop/mobile
screenshots were visually compared with Figma. These checks used mocked HTTP
responses, not a live backend/database session.

# Product Page implementation

The public route `/products/:productId` renders `ProductPage.tsx` from the
[Figma references](../../design/figma/node-registry.md#product-page-designs). Every catalog card
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
  Empty and failed media show readable placeholders. The main image uses
  `object-contain` to show the entire photo; thumbnails retain `object-cover`.
  Clicking or keyboard-activating the main image opens a viewport-filling dialog
  with a fitted image. Close or Escape dismisses it and restores trigger focus;
  the dialog locks background scrolling. Archived treatment also applies inside
  the viewer. Pinch zoom, panning, and viewer navigation are outside this scope.
  Arbitrary `crop` metadata is not interpreted because its transform
  format is not defined in the API contract.
- Quantity starts at one and is bounded by stock. Purchase and quantity controls
  use `can_purchase` to disable unavailable products. Archived products include
  a grayscale gallery and watermark; draft and out-of-stock notices match Figma.
- Store logos have an initials fallback. The creation timestamp is labeled
  **Store created**, since the API does not provide a selling-start date.
- Add to Cart saves the chosen quantity through the authenticated cart API.
  Guests are sent to sign in with the product URL as their return destination.
  Successful additions show a dismissible toast popup with a View cart action; stock conflicts
  and request failures show an error. See [Shopping cart](cart.md).
- Checkout carries the product ID and selected quantity to the protected [COD checkout flow](../checkout/README.md), preserving the selection through sign-in.

Layouts stack below the desktop breakpoint and share semantic theme tokens for
light and dark modes. The existing Header retains its guest/member behavior.
There are no sample products or Figma asset URLs in the production page.

# Product catalog integration

The landing page requests `GET /api/shop/products/` through the shared API client.
The backend contract is documented in
[the backend catalog documentation](../../backend/docs/ecommerce/product-catalog.md).

The frontend displays the API's `results` in their returned order, computes page
count as `ceil(count / 8)`, sends `q` and `page`, and resets to page 1 when changing
the search. It waits for authentication restoration before requesting products
and uses the shared Bearer-token client. Loading, empty, and error states are
distinct; unavailable pages offer navigation back to page 1. The frontend's
landing-page route currently requires login even though this API is public.

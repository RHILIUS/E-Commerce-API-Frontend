# Cloudflare Pages deployment

## Cloudflare setup

| Setting                       | Value                               |
| ----------------------------- | ----------------------------------- |
| Production branch             | `main`                              |
| Build command                 | `npm run build`                     |
| Output directory              | `dist`                              |
| Root directory                | Repository root                     |
| Build environment variable    | `VITE_API_URL=/`                    |
| Function environment variable | `API_ORIGIN=<BACKEND_HTTPS_ORIGIN>` |

`API_ORIGIN` is a server-side Pages variable/binding, not a `VITE_*` value. Set it
for the production environment; it must contain only an HTTPS origin, without
credentials, paths, query parameters or fragments. The proxy rejects missing or
invalid configuration with 503. Never put database, Django, Stripe, SMTP, or other
backend credentials in the frontend build or the Pages Function.

`<BACKEND_HTTPS_ORIGIN>` is a placeholder for the deployed API's scheme and
hostname. Configure its real value in Cloudflare's runtime variables; a local
frontend `.env` does not configure the deployed Function. Keep real backend and
frontend addresses in the EC2 `.env` and Cloudflare settings, not source defaults.
Proxy tests use fixed reserved `.test` hostnames and do not read deployment `.env`.

Commit and push the Function, route configuration and type-check configuration
before deploying. Pages builds Functions from the root `functions/` directory;
Vite builds only browser assets into `dist`. `public/_routes.json` is copied into
`dist` and limits Function execution to `/api` and `/api/*`. Other paths use Pages'
normal asset/SPA routing. `vite preview` does not execute Pages Functions.

Keep Pages Functions failure behavior **fail closed** if that setting is exposed
in the dashboard, so exhausted Function quota does not fall back to static
content for API requests. Functions use the Workers request allowance. Review
[Pages pricing](https://developers.cloudflare.com/pages/functions/pricing/) and
[routing](https://developers.cloudflare.com/pages/functions/routing/).

Preview deployments are not isolated staging databases. Do not bind previews to
the production API unless their mutations are intentional. A missing preview
`API_ORIGIN` intentionally returns 503; use an isolated backend for future staging.

## Forwarding and cookie contract

`functions/api/[[path]].ts` retains the method, path, query, streaming body, cookies,
bearer token and browser Origin header. Only the destination origin changes; the
upstream Host is derived from that origin so existing Django `ALLOWED_HOSTS` and
TLS verification remain meaningful. Incoming client input cannot choose another
backend. The backend owns authentication, authorization and business validation.

The Function copies the backend response directly, preserving separate
`Set-Cookie` headers, expiry/deletion attributes, response status and body. Current
Django authentication cookies omit `Domain` and have `Path=/`, `HttpOnly`,
`SameSite=Lax`, and `Secure` in production. The browser therefore stores them for
the Pages response hostname. Subsequent same-origin `/api/*` calls send them to
Pages, which forwards them to Django. Existing API payloads and cookie policies
are unchanged. A future backend cookie `Domain` change needs a joint review.

Upstream fetch uses `cache: no-store` and API responses disable browser/CDN
caching. Redirects are not followed server-side, preventing cookie/bearer leakage
to redirect targets. Redirects to the configured backend's `/api/*` paths are
rewritten to Pages; other locations are returned as supplied. Transport errors
produce a generic, non-cacheable 502 without exposing internal diagnostics.
The proxy does not retry: a mutation may have committed before a response was
lost. Existing feature recovery/idempotency rules remain responsible for retries.

## EC2 settings before testing

Configure backend `.env` using the deployed hostnames. Replace the placeholders
below with real values; they are not literal settings or shell substitutions:

```dotenv
ALLOWED_HOSTS=<BACKEND_HOSTNAME>,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=<FRONTEND_HTTPS_ORIGIN>
CSRF_TRUSTED_ORIGINS=<BACKEND_HTTPS_ORIGIN>,<FRONTEND_HTTPS_ORIGIN>
STRIPE_FRONTEND_ORIGIN=<FRONTEND_HTTPS_ORIGIN>
```

`<BACKEND_HOSTNAME>` excludes the scheme; origin placeholders include `https://`.
Use the assigned Pages origin for `<FRONTEND_HTTPS_ORIGIN>`. Browser-to-Pages
requests are same-origin; CORS is not what enables these cookies. Origin headers
are preserved, and Django's own origin policies should name the intended frontend.
Keep the backend's public hostname in `ALLOWED_HOSTS`, because the Function
connects using that hostname. Recreate API/workers/Beat to load `.env` changes;
do not reset the database or delete volumes. Stripe returns must point to Pages.

Nginx currently replaces `X-Forwarded-For` with its immediate peer address. Through
the Function that can identify Cloudflare infrastructure rather than an individual
browser; IP-based throttling may group visitors. Do not blindly increase trusted
proxy count or trust client-supplied forwarded headers. Real-client-IP propagation
requires a separately verified trust boundary; account-level budgets still apply.

Only `/api/*` is proxied. Open Django admin and Swagger directly on the proxy
backend hostname. `/static/*` and `/media/*` are not Pages proxy routes. Existing
media URLs continue to use the backend's HTTPS origin (or Azure when enabled).
Stripe webhooks go directly to the backend's signed webhook endpoint.

The [shared production architecture](../../../docs/architecture/production-deployment.md)
explains the hosting context.

## Enable country defaults in an isolated preview

Automatic country defaults are implemented but disabled without a dedicated
`COUNTRY_HINT_SECRET` shared by the Pages Function and Django. They use country-level
Cloudflare request metadata, not browser GPS or IP-header guesses. A manual currency
choice still wins; otherwise defaults use personal address, supported detected
currency, then USD. This affects browsing estimates only.

The proxy strips client country-hint headers and signs its own hint. Django checks
the signature against the request method, backend origin, full path/query and time.
The hint lasts five minutes with 30 seconds of future clock skew. Bad or absent
hints are ignored, leaving direct API, admin and Stripe webhook access unchanged.
There is no new country endpoint and no change to trusted-IP proxy counts.

1. Prepare an isolated HTTPS backend and a Pages preview with `VITE_API_URL=/` and
   that backend's `API_ORIGIN`. A preview must not use production data by accident.
2. Generate a dedicated secret with at least 32 random bytes, for example with
   `openssl rand -hex 32` in your own terminal. Store the same value as the Pages
   preview runtime **secret** `COUNTRY_HINT_SECRET` and in the isolated backend's
   `.env`. Never put it in a `VITE_*` variable, commit it, print it in diagnostics,
   return it in responses, or reuse Django/payment credentials. Use separate keys
   for production and previews. A local frontend `.env` does not configure Pages.
3. Recreate the isolated backend application services to load their environment and
   deploy the preview. No database migration or reset is needed. Keep server clocks
   synchronized. Existing Nginx HTTPS forwarding and allowed hosts must match the
   HTTPS origin configured in Pages; an origin mismatch invalidates the hint.
4. In a guest browser with no remembered manual choice, inspect
   `GET /api/shop/currencies/` through the Pages hostname. Where Cloudflare supplies
   a recognized country with a supported currency, expect `default_source: country`
   and its currency. Missing metadata legitimately gives `fallback`; mocked local
   tests do not prove actual Cloudflare metadata availability.
5. Supply fake country-hint headers to the Pages API request. They must not override
   the country chosen by Cloudflare. Send an unsigned request directly to the
   backend: it must use address/USD defaults, regardless of fake country headers.
   Do not include authentication when testing the guest fallback.
6. Choose a different display currency, navigate, sign in/out, and return to
   Automatic. Manual selection must stay in control; an account's address currency
   must take priority in Automatic. Checkout must retain its existing policy.
7. Remove the hint configuration to confirm fallback behavior. Key rotation needs
   matching values in both runtimes; a temporary mismatch falls back rather than
   rejecting ordinary browsing requests.

Use the existing API's default currency/source for diagnostics; no raw IP, precise
location, signing secret or signature needs to be exposed. Do not treat a successful
preview build as evidence that country metadata, key agreement or Nginx forwarding
works. Those require requests through the actual deployed chain. No deployment is
performed by local tests.

See the [backend signature contract](../../../backend/docs/api/ecommerce/currencies.md#signed-country-hints)
and [Cloudflare request metadata](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties).

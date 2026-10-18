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

The maintained system context and process are in the sibling documentation repo:
[architecture](../../../docs/architecture/production-deployment.md) and
[API proxy process](../../../docs/diagrams/specific-business-processes/deployment/same-origin-api-proxy.md).

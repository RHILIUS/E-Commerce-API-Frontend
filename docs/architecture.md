# How the frontend works

The frontend is the part of the shop that runs in a customer's browser. It draws
pages, collects input, and asks the backend for information or changes. The backend
owns the saved data and decides whether an action is allowed.

For example, the browser can show an Add to Cart button and ask to add two items.
The backend checks the product and stock before saving the change. Showing an
available button in the browser does not guarantee that the request will succeed.

## The tools and their jobs

| Tool                             | Job in this application                                              |
| -------------------------------- | -------------------------------------------------------------------- |
| React                            | Builds pages from smaller pieces called components                   |
| TypeScript                       | Describes the data each piece of code expects                        |
| Vite                             | Runs the development server and builds browser files for deployment  |
| React Router                     | Chooses the page to show for a URL                                   |
| Axios                            | Sends requests to the backend                                        |
| Tailwind CSS                     | Applies layout and appearance through utility classes                |
| shadcn/ui and Base UI            | Provide shared controls such as buttons, dialogs, and menus          |
| Vitest, Testing Library, and MSW | Run tests, interact with components, and supply mocked API responses |

The installed versions and commands are recorded in
[`package.json`](../package.json). `package-lock.json` records the resolved
versions used by `npm ci`.

## From opening the website to seeing a page

1. The browser loads `index.html`, which starts
   [`src/app/main.tsx`](../src/app/main.tsx).
2. `AuthProvider` checks whether an existing sign-in can be restored. It also
   makes the current account available to components that need it.
3. The router matches the URL to a page. `RootLayout` supplies the shared page
   background and minimum viewport height.
4. The page shows its interface and loads any data it needs from the backend.
   Loading, empty, and error states are handled by the feature's components and
   hooks.

A **hook** is a React function that manages behavior across renders, such as
loading data or updating a countdown. A **context** shares information with a
group of components without passing it through every component in between.

This is a single-page application: React Router changes the visible page inside
the running application. The hosting service must also serve the application when
a customer opens a nested URL directly.

## Pages and access

A **route** connects a URL to a page. The central
[router](../src/app/router.tsx) combines the route lists from each feature.

| URLs                                                | Who can open them                       | Purpose                                  |
| --------------------------------------------------- | --------------------------------------- | ---------------------------------------- |
| `/`                                                 | Anyone                                  | Browse the product catalog               |
| `/products/:productId`                              | Anyone                                  | View one product                         |
| `/stores/:storeId`                                  | Anyone                                  | View one store                           |
| `/login`                                            | Anyone                                  | Sign in                                  |
| `/register/enter-email`                             | Anyone                                  | Start registration                       |
| `/register/verify-otp`, `/register/account-details` | Customers who have started registration | Continue the registration steps          |
| `/account`                                          | Signed-in customers                     | Manage profile, recipients, and password |
| `/cart`                                             | Signed-in customers                     | Manage cart items                        |
| `/orders`                                           | Signed-in customers                     | Read orders and history                  |
| `/checkout`                                         | Signed-in customers                     | Review and place an order                |
| `/checkout/payment/:reference`                      | Signed-in customers                     | Check or recover a Stripe test payment   |
| `/checkout/confirmation/:reference`                 | Signed-in customers                     | Read a saved purchase confirmation       |

Names starting with `:` are placeholders. For example, `/products/12` opens the
product whose ID is 12. Unknown URLs show the public Not Found page. The router
also includes `/home-test`, a protected development page.

[`ProtectedRoute`](../src/app/routes/ProtectedRoute.tsx) waits for the initial
sign-in check. If the customer is not signed in, it sends them to Login and saves
the requested location for their return. Intentional sign-out clears that return
destination. The backend still checks authentication and ownership on protected
requests; the browser's route guard only controls navigation.

## Sign-in and registration

After a successful login, the frontend holds an **access token** in React memory.
It is a short-lived credential sent with backend requests in the
`Authorization: Bearer ...` header. The backend also sets a refresh-token cookie.
That cookie is HttpOnly, which means browser JavaScript cannot read its value.

When the website starts, `AuthProvider` calls `/api/auth/refresh/` with the cookie
to restore the account and access token. For an eligible API request that returns
401, meaning its authentication was rejected, the shared Axios interceptor tries
to refresh the token and retries that request once. Concurrent refreshes share
one request. Authentication endpoints handle their own failures so they do not
start a refresh loop.

Signing out clears local account state and asks the backend to revoke the refresh
token. A refresh response that arrives after local sign-out cannot restore that
old session.

Registration has three screens: enter an email, verify the emailed one-time code
(OTP), and enter account details. `RegistrationProvider` holds the email and resend
countdown in memory. After code verification, the backend uses a separate HttpOnly
registration cookie to authorize account creation. The backend creates the
account, personal address, and first default delivery recipient together.

Start with [`AuthProvider`](../src/authentication/contexts/Auth/AuthProvider.tsx),
the [request interceptor](../src/authentication/hooks/useAxiosInterceptor.ts), and
[authentication API functions](../src/authentication/api.ts) for this behavior.

## How requests reach the backend

A typical feature has a page, a hook that manages its requests, and API functions
that use the shared [Axios client](../src/app/api/axios.ts). For example, saving a
profile follows this path:

```text
Profile form → useProfile → saveProfile → shared Axios client → backend
```

The backend checks the input and saves it. Its response travels back along the
same path, and the hook updates the screen. Feature types describe the expected
response; feature error helpers translate server errors into messages the page
can display.

`VITE_API_URL` supplies the client's base address. API functions include the
`/api/...` path themselves, so the base address should not add another `/api`.
The client enables credentials so the browser can send the authentication cookies
where cookie and origin policies permit.

- **Local development:** the browser calls Django directly, normally at
  `http://localhost:8000`. The backend must allow the frontend's origin.
- **Cloudflare Pages:** the build uses `VITE_API_URL=/`. The browser sends requests
  to `/api/...` on the website's own host. A Pages Function forwards them to the
  backend configured by the server-side `API_ORIGIN` setting.

The Function passes requests and responses between the browser and backend; it
does not own business rules or a database. Its source is
[`functions/api/[[path]].ts`](../functions/api/[[path]].ts). See the
[deployment guide](deployment/cloudflare-pages.md) for configuration.

## Where the code lives

| Location              | Responsibility                                                                    |
| --------------------- | --------------------------------------------------------------------------------- |
| `src/app/`            | Startup, router, root layout, shared API client, UI controls, and theme           |
| `src/authentication/` | Login, registration, account context, token refresh, and reusable identity fields |
| `src/account/`        | Personal profile, profile photos, recipients, and password changes                |
| `src/ecommerce/`      | Product catalog, stores, cart, orders, and the shared shop header                 |
| `src/checkout/`       | Order review, placement, confirmation, and Stripe test-payment recovery           |
| `functions/`          | Cloudflare Pages server-side API proxy                                            |
| `public/`             | Files copied into the build, including Pages Function route configuration         |
| `tests/`              | Automated tests grouped by feature                                                |
| `docs/`               | Frontend guides                                                                   |

Imports starting with `@/` refer to `src/`. For example, `@/app/api/axios` means
`src/app/api/axios.ts`.

Within features, pages compose the screen, components supply interface pieces,
hooks manage stateful behavior, and utils contain focused helpers. Some small
features keep these files together rather than creating a directory for each job.

## What is remembered, and where

The backend stores durable information such as profiles, recipients, carts, and
purchases. React memory holds temporary values such as form drafts and the access
token. Those memory values do not survive a full reload.

Checkout also uses the browser's **session storage**, which survives reloads in
the same tab. Before submitting an order, it saves the exact request and its
idempotency key: an identifier that lets the backend recognize a retry of the same
purchase instead of creating another one. This matters when an order was saved
but its response never reached the browser.

Recovery records are scoped to the account and product or cart selection. Session
storage is not a cross-device order history. The
[checkout guide](checkout/README.md) explains retry and payment recovery in detail.
Do not assume every failed request is safe to repeat; each feature handles its own
uncertain outcomes.

## Shared appearance and layout

[`src/app/index.css`](../src/app/index.css) defines colors, typography, and theme
values. Classes such as `bg-background` and `text-foreground` use those values,
allowing the same component to support light and dark appearances. The `.dark`
class activates the dark theme.

Shared controls live in `src/app/components/ui/`. Check them before building
another button, input, dialog, or menu. Shop pages compose the shared header;
`RootLayout` itself does not insert it.

The document and React root set a minimum supported width of 330px. `RootLayout`
uses a grid to let the routed page fill the available height. Page components
adapt their content to the available space rather than repeating the root's
viewport-height rules.

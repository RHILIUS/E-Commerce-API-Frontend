# E-Commerce frontend

This is the customer-facing website for the E-Commerce project. Customers can
browse products and stores, create an account, manage delivery addresses, build a
shopping cart, and place orders. Checkout supports cash on delivery and Stripe
test payments. Stripe payments are a demo and do not take real money.

The website runs in the customer's browser. It asks a separate backend application
for products, account details, prices, and orders. The backend checks the rules and
saves the data.

## Where this repository fits

The project has three separate Git repositories. Keep their checkouts next to one
another when working across the system:

```text
E-Commerce-API/
├── frontend/    # This repository: pages and browser behavior
├── backend/     # API, business rules, database access, and background jobs
└── docs/        # Shared architecture and business-process diagrams
```

| Repository                                                          | What to read it for                                                     |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [Frontend](https://github.com/RHILIUS/E-Commerce-API-Frontend)      | How customers use the website and how its browser code works            |
| [Backend](https://github.com/RHILIUS/E-Commerce-API)                | How requests are checked, data is saved, and external services are used |
| [Project documentation](https://github.com/RHILIUS/E-Commerce-Docs) | How the parts of the system fit together                                |

This repository also has its own `docs/` folder. It explains the frontend. The
sibling `../docs/` repository explains the whole system. They are different places.
Links to sibling files work with the checkout layout above; when reading on
GitHub, open the corresponding repository from the table instead.

## Start reading here

1. Read the [frontend architecture guide](docs/architecture.md) to understand how
   a page, a request, and the backend work together.
2. Use the [documentation index](docs/README.md) to find the feature you need.
3. Follow that feature's backend and process links when you need its full rules.

## Run the website locally

You need Git, Node.js, npm, and a running backend. Use Node.js 22.12 or later in the
22.x release line, which meets the installed Vite version's requirement. npm is
used with the committed `package-lock.json` to install matching dependencies.

1. Open a terminal in the `frontend/` directory.
2. Install dependencies:

   ```sh
   npm ci
   ```

3. If you do not already have a `.env` file, copy the example:

   ```sh
   cp .env.example .env
   ```

   The example contains `VITE_API_URL=http://localhost:8000`. This tells the browser
   where the backend is running. Change it if your local backend uses another
   address. Keep the frontend and backend hostnames consistent; for example, use
   `localhost` for both rather than mixing it with `127.0.0.1`.

4. Start the backend using its
   [development Docker guide](../backend/docs/development/docker.md). Configure
   its allowed frontend origin to match the address used by your browser. Sign-in
   uses cookies, so the backend must allow credentialed requests from that origin.
5. Start the frontend:

   ```sh
   npm run dev
   ```

   Open the local URL printed by Vite. Restart Vite after changing `.env`.
   A working frontend server alone does not provide product or account data; those
   requests still need the backend.

Values named `VITE_*` become part of the browser application. Use them only for
public configuration, such as the API address. Backend passwords and service
secrets belong in the backend environment.

## Everyday commands

Run these commands from the repository root:

| Command            | Purpose                                             |
| ------------------ | --------------------------------------------------- |
| `npm run dev`      | Start the local development server                  |
| `npm run build`    | Check TypeScript and build the website into `dist/` |
| `npm run preview`  | Serve the built website locally                     |
| `npm run lint`     | Find code issues using ESLint                       |
| `npm run test:run` | Run the automated tests once                        |
| `npm test`         | Run tests in watch mode while developing            |

Tests live in `tests/`. Browser-oriented tests use a simulated browser and mocked
API responses, so they do not require a running backend. Tests also cover the
Cloudflare API proxy.

## Deploy the website

The frontend is configured for Cloudflare Pages. The build produces browser files
in `dist/`; a separate Pages Function forwards `/api` requests to the backend.
`npm run preview` serves the browser files but does not run that Function.

Follow the [Cloudflare Pages deployment guide](docs/deployment/cloudflare-pages.md)
for build settings, backend connection settings, and cookie handling.

# Frontend documentation

These guides explain the customer website and the code behind it. Start with the
[project README](../README.md) for local setup, then read
[frontend architecture](architecture.md) before opening a feature guide.

## A customer's journey

A customer first browses products or a store. They sign in when they need their
account, cart, or orders. At checkout, they choose who receives the items, review
the price, and place the order. Account settings let them maintain their personal
details, delivery recipients, and password.

A **recipient** is a saved person and address for deliveries. It can be different
from the customer's own personal address. An **API** is the set of request URLs
the frontend uses to talk to the backend.

## Find a guide

| Area        | Guide                                              | What it explains                                                   |
| ----------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| Foundations | [Frontend architecture](architecture.md)           | How pages, shared state, requests, and folders fit together        |
| Browsing    | [Product catalog](ecommerce/product-catalog.md)    | Loading and displaying the product list                            |
| Browsing    | [Product page](ecommerce/product-page.md)          | Product details and purchase actions                               |
| Browsing    | [Store page](ecommerce/store-page.md)              | Browsing a store and its products                                  |
| Shopping    | [Shopping cart](ecommerce/cart.md)                 | Grouping items by store, quantities, and checkout selection        |
| Shopping    | [Checkout](checkout/README.md)                     | Reviewing orders, choosing recipients, payment, and recovery       |
| Orders      | [Customer orders](ecommerce/user-orders.md)        | Saved orders and their history                                     |
| Account     | [Account profile](account/profile.md)              | Personal details, personal address, and profile photos             |
| Account     | [Delivery recipients](account/recipients.md)       | Saved delivery details shared by Account and Checkout              |
| Account     | [Change password](account/change-password.md)      | Changing a password using the current password and an emailed code |
| Hosting     | [Cloudflare Pages](deployment/cloudflare-pages.md) | Publishing the frontend and connecting it to the backend           |

Sign-in and registration are introduced in the architecture guide. Their code
lives in `src/authentication/`.

## When you need the rest of the system

Frontend guides explain what the browser displays and how it handles requests.
Backend API contracts explain the exact request fields, responses, and server
rules. The central documentation repository holds shared architecture and
business-process diagrams, which explain the steps owned by each part of the
system.

- [Backend documentation](../../backend/docs/)
- [Project-wide documentation](../../docs/README.md)
- [Shared architecture](../../docs/architecture/README.md)
- [Business-process and data diagrams](../../docs/diagrams/README.md)

Sibling links assume the repository layout in the project README. If you are
reading on GitHub, use its
[repository links](../README.md#where-this-repository-fits) to open the matching
repository and find the same path.

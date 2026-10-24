import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

/** Intercepts API requests made by frontend integration tests. */
export const server = setupServer(
  http.get("http://localhost/api/shop/currencies/", ({ request }) =>
    HttpResponse.json({
      currencies: [
        {
          code: "USD",
          name: "US Dollar",
          minor_unit: 2,
          display_supported: true,
          stripe_supported: true,
        },
        {
          code: "PHP",
          name: "Philippine Peso",
          minor_unit: 2,
          display_supported: true,
          stripe_supported: false,
        },
        {
          code: "EUR",
          name: "Euro",
          minor_unit: 2,
          display_supported: true,
          stripe_supported: false,
        },
      ],
      default_currency: request.headers.has("Authorization") ? "PHP" : "USD",
      default_source: request.headers.has("Authorization")
        ? "address"
        : "fallback",
    }),
  ),
);

const pendingRequests = new Set<string>();
const idleWaiters = new Set<() => void>();

server.events.on("request:start", ({ requestId }) => {
  pendingRequests.add(requestId);
});

// Aborting a client request does not stop a delayed mock handler from finishing.
const finishRequest = ({ requestId }: { requestId: string }) => {
  pendingRequests.delete(requestId);
  if (pendingRequests.size === 0) {
    idleWaiters.forEach((resolve) => resolve());
    idleWaiters.clear();
  }
};
server.events.on("request:end", finishRequest);
server.events.on("unhandledException", finishRequest);

/** Drain mock handlers before resetting routes or tearing down the browser environment. */
export async function waitForMockRequests() {
  while (pendingRequests.size > 0) {
    await new Promise<void>((resolve) => idleWaiters.add(resolve));
  }
}

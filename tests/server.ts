import { setupServer } from "msw/node";

/** Intercepts API requests made by frontend integration tests. */
export const server = setupServer();

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

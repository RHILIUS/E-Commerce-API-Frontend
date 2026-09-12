import { setupServer } from "msw/node";

/** Intercepts API requests made by frontend integration tests. */
export const server = setupServer();

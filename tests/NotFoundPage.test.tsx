import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, expect, test } from "vitest";

import { router as appRouter } from "@/app/router";
import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";

import { render } from "./render";
import { server } from "./server";

beforeEach(() => {
  // Session restoration returns 401 for a guest with no refresh cookie.
  server.use(
    http.post("http://localhost/api/auth/refresh/", () =>
      HttpResponse.json({}, { status: 401 }),
    ),
  );
});

// Use production routes so nested misses cannot accidentally enter auth guards.
const renderRoute = (entry: string) => {
  const router = createMemoryRouter(appRouter.routes, {
    initialEntries: [entry],
  });
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
  return router;
};

test.each(["/unsupported", "/register/unsupported", "/account/unsupported"])(
  "shows a public branded 404 at %s without redirecting",
  async (path) => {
    const router = renderRoute(path);
    expect(
      await screen.findByRole("heading", { name: "Page not found", level: 1 }),
    ).toBeVisible();
    expect(screen.getByRole("main")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "E-Commerce home" }),
    ).toHaveAttribute("href", "/");
    expect(router.state.location.pathname).toBe(path);
    expect(screen.queryByText("Unexpected Application Error!")).toBeNull();
  },
);

test("returns to the public catalog from a direct unknown URL", async () => {
  server.use(
    http.get("http://localhost/api/shop/products/", () =>
      HttpResponse.json({ count: 0, next: null, previous: null, results: [] }),
    ),
  );
  const router = renderRoute("/missing/deep/link?from=email");
  await userEvent.click(screen.getByRole("link", { name: "Back to home" }));
  expect(
    await screen.findByRole("heading", { name: "Featured products" }),
  ).toBeVisible();
  expect(router.state.location.pathname).toBe("/");
  expect(router.state.location.search).toBe("");
});

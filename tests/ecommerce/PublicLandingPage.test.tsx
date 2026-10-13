import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, test } from "vitest";

import { router as appRouter } from "@/app/router";
import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";

import { server } from "../server";

const user = {
  id: 1,
  fullName: "Test User",
  email: "test@example.com",
  address_country_code: "PH",
};
const catalogHeaders: (string | null)[] = [];

// Exercise the application's actual public/protected route configuration.
const renderRoute = (entry = "/") => {
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

beforeEach(() => {
  catalogHeaders.length = 0;
  server.use(
    http.post("http://localhost/api/auth/refresh/", () =>
      HttpResponse.json({}, { status: 401 }),
    ),
    http.get("http://localhost/api/shop/products/", ({ request }) => {
      const authorization = request.headers.get("Authorization");
      catalogHeaders.push(authorization);
      return HttpResponse.json({
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            name: authorization ? "Personalized product" : "Popular product",
            short_description: "Product summary",
            price: "123.45",
            currency: "USD",
            display_price: authorization
              ? { amount: "6913.20", currency: "PHP" }
              : { amount: "123.45", currency: "USD" },
            sold_count: 2,
            default_image: null,
          },
        ],
      });
    }),
  );
});

describe("Public landing page", () => {
  test("guests can visit the actual landing route and browse without a bearer token", async () => {
    const router = renderRoute("/?q=laptop");
    await screen.findByRole("article", { name: "Popular product" });
    expect(router.state.location.pathname).toBe("/");
    expect(catalogHeaders).toEqual([null]);
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/register/enter-email",
    );
    expect(
      screen.queryByRole("button", { name: "Account" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cart (coming soon)" }),
    ).not.toBeInTheDocument();
  });

  test("session restoration shows a placeholder before authenticated controls", async () => {
    server.use(
      http.post("http://localhost/api/auth/refresh/", async () => {
        await delay(50);
        return HttpResponse.json({ access: "test-access", user });
      }),
    );
    renderRoute();
    expect(
      screen.getByRole("status", { name: "Loading account" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Log in" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Account" }),
    ).not.toBeInTheDocument();
    expect(catalogHeaders).toEqual([]);
    await screen.findByRole("article", { name: "Personalized product" });
    expect(screen.getByRole("button", { name: "Account" })).toBeVisible();
    expect(
      screen.queryByRole("status", { name: "Loading account" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Sign up" }),
    ).not.toBeInTheDocument();
    expect(catalogHeaders).toEqual(["Bearer test-access"]);
    expect(screen.getByText("₱6,913.20")).toBeVisible();
  });

  test.each([200, 500])(
    "logout stays on the catalog and reloads guest rankings (HTTP %s)",
    async (status) => {
      server.use(
        http.post("http://localhost/api/auth/refresh/", () =>
          HttpResponse.json({ access: "test-access", user }),
        ),
        http.post("http://localhost/api/auth/logout/", () =>
          HttpResponse.json({}, { status }),
        ),
      );
      const router = renderRoute("/?q=laptop");
      await screen.findByRole("article", { name: "Personalized product" });
      await userEvent.click(screen.getByRole("button", { name: "Account" }));
      await userEvent.click(
        await screen.findByRole("menuitem", { name: "Log out" }),
      );
      await screen.findByRole("article", { name: "Popular product" });
      expect(router.state.location.pathname).toBe("/");
      expect(router.state.location.search).toBe("?q=laptop");
      expect(screen.getByRole("link", { name: "Log in" })).toBeVisible();
      expect(
        screen.queryByRole("button", { name: "Account" }),
      ).not.toBeInTheDocument();
      expect(catalogHeaders).toEqual(["Bearer test-access", null]);
      expect(screen.getByText("$123.45")).toBeVisible();
    },
  );

  test("guest login returns to the landing page with personalized products", async () => {
    server.use(
      http.post("http://localhost/api/auth/login/", () =>
        HttpResponse.json({ access: "new-access", user }),
      ),
    );
    const router = renderRoute();
    await screen.findByRole("article", { name: "Popular product" });
    const interaction = userEvent.setup();
    await interaction.click(screen.getByRole("link", { name: "Log in" }));
    await interaction.type(
      await screen.findByRole("textbox", { name: "Email" }),
      user.email,
    );
    await interaction.type(screen.getByLabelText("Password"), "test-password");
    await interaction.click(screen.getByRole("button", { name: "Login" }));
    await screen.findByRole("article", { name: "Personalized product" });
    expect(router.state.location.pathname).toBe("/");
    expect(screen.getByRole("button", { name: "Account" })).toBeVisible();
    expect(catalogHeaders).toEqual([null, "Bearer new-access"]);
  });

  test("protected routes still redirect guests to login", async () => {
    const router = renderRoute("/home-test");
    await screen.findByRole("button", { name: "Login" });
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.state.from.pathname).toBe("/home-test");
    expect(catalogHeaders).toEqual([]);
  });
});

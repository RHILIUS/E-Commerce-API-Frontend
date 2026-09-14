import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, test } from "vitest";

import HomePage from "@/app/pages/HomePage";
import ProtectedRoute from "@/app/routes/ProtectedRoute";
import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import LoginPage from "@/authentication/pages/LoginPage";
import { Header } from "@/ecommerce/components/Header";

import { server } from "../../server";

const user = {
  id: 1,
  fullName: "Test User",
  email: "user@example.com",
  country_code: "PH",
};

// Exercise the data router used by the application, including guard redirects.
const renderProtectedPage = (header = false) => {
  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/home-test",
            element: header ? (
              <Header searchQuery="" onSearch={() => {}} />
            ) : (
              <HomePage />
            ),
          },
          { path: "/", element: <h1>Landing page</h1> },
        ],
      },
    ],
    { initialEntries: ["/home-test"] },
  );
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
  return router;
};

// Submit through the real login form to verify its chosen return destination.
const signIn = async () => {
  const interaction = userEvent.setup();
  await interaction.type(
    await screen.findByRole("textbox", { name: "Email" }),
    user.email,
  );
  await interaction.type(screen.getByLabelText("Password"), "password123");
  await interaction.click(screen.getByRole("button", { name: "Login" }));
};

describe("Logout navigation", () => {
  test("account menu opens by keyboard and Escape restores focus", async () => {
    server.use(
      http.post("http://localhost/api/auth/refresh/", () =>
        HttpResponse.json({ access: "token", user }),
      ),
    );
    renderProtectedPage(true);
    const account = await screen.findByRole("button", { name: "Account" });
    account.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(
      await screen.findByRole("menuitem", { name: "Log out" }),
    ).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
    expect(account).toHaveFocus();
  });

  test.each([
    { status: 204, header: false },
    { status: 500, header: false },
    { status: 204, header: true },
    { status: 500, header: true },
  ])(
    "intentional logout clears the destination (status=$status, header=$header)",
    async ({ status, header }) => {
      server.use(
        http.post("http://localhost/api/auth/refresh/", () =>
          HttpResponse.json({ access: "initial-token", user }),
        ),
        http.post(
          "http://localhost/api/auth/logout/",
          () => new HttpResponse(null, { status }),
        ),
        http.post("http://localhost/api/auth/login/", () =>
          HttpResponse.json({ access: "new-token", user }),
        ),
      );
      const router = renderProtectedPage(header);
      if (header) {
        await userEvent.click(
          await screen.findByRole("button", { name: "Account" }),
        );
        expect(await screen.findAllByRole("menuitem")).toHaveLength(1);
        await userEvent.click(
          screen.getByRole("menuitem", { name: "Log out" }),
        );
      } else {
        await userEvent.click(
          await screen.findByRole("button", { name: "Logout" }),
        );
      }
      await screen.findByRole("button", { name: "Login" });
      expect(router.state.location.pathname).toBe("/login");
      expect(router.state.location.state).toBeNull();
      await signIn();
      expect(
        await screen.findByRole("heading", { name: "Landing page" }),
      ).toBeVisible();
      expect(router.state.location.pathname).toBe("/");
    },
  );

  test("a signed-out visitor returns to the protected page after login", async () => {
    server.use(
      http.post("http://localhost/api/auth/refresh/", () =>
        HttpResponse.json({}, { status: 401 }),
      ),
      http.post("http://localhost/api/auth/login/", () =>
        HttpResponse.json({ access: "new-token", user }),
      ),
    );
    const router = renderProtectedPage();
    await signIn();
    expect(await screen.findByRole("button", { name: "Logout" })).toBeVisible();
    expect(router.state.location.pathname).toBe("/home-test");
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, test } from "vitest";

import HomePage from "@/app/pages/HomePage";
import ProtectedRoute from "@/app/routes/ProtectedRoute";
import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import LoginPage from "@/authentication/pages/LoginPage";

import { server } from "../../server";

const user = {
  id: 1,
  fullName: "Test User",
  email: "user@example.com",
  country_code: "PH",
};

// Exercise the data router used by the application, including guard redirects.
const renderProtectedPage = () => {
  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/home-test", element: <HomePage /> },
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
  test.each([204, 500])(
    "intentional logout clears the destination even when the logout API returns %s",
    async (status) => {
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
      const router = renderProtectedPage();
      await userEvent.click(
        await screen.findByRole("button", { name: "Logout" }),
      );
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

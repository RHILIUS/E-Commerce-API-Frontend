import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, test } from "vitest";

import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import LoginPage from "@/authentication/pages/LoginPage";

import { render } from "../../render";
import { server } from "../../server";

const apiUrl = "http://localhost";
const user = { id: 1, fullName: "Test User", email: "user@example.com" };

const renderLoginPage = () =>
  render(
    <AuthProvider>
      <MemoryRouter
        initialEntries={[
          { pathname: "/login", state: { from: { pathname: "/account" } } },
        ]}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<h1>Account</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );

describe("LoginPage", () => {
  test("explains Google availability without submitting the login form", async () => {
    let loginRequests = 0;
    server.use(
      http.post(`${apiUrl}/api/auth/refresh/`, () =>
        HttpResponse.json({}, { status: 401 }),
      ),
      http.post(`${apiUrl}/api/auth/login/`, () => {
        loginRequests += 1;
        return HttpResponse.json({}, { status: 401 });
      }),
    );

    renderLoginPage();
    const interaction = userEvent.setup();
    await interaction.click(
      screen.getByRole("button", { name: /Login with Google/ }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Google sign-in isn’t available yet. Please use your email and password.",
    );
    expect(loginRequests).toBe(0);
    expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
  });

  test("submits credentials and returns to the requested page", async () => {
    let requestBody: unknown;

    server.use(
      http.post(`${apiUrl}/api/auth/refresh/`, () =>
        HttpResponse.json({}, { status: 401 }),
      ),
      http.post(`${apiUrl}/api/auth/login/`, async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({ access: "access-token", user });
      }),
    );

    renderLoginPage();
    const interaction = userEvent.setup();
    await interaction.type(
      screen.getByRole("textbox", { name: "Email" }),
      "user@example.com",
    );
    await interaction.type(screen.getByLabelText("Password"), "password123");
    await interaction.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByRole("heading", { name: "Account" }),
    ).toBeVisible();
    expect(requestBody).toEqual({
      email: "user@example.com",
      password: "password123",
    });
  });

  test("shows a useful message for invalid credentials", async () => {
    server.use(
      http.post(`${apiUrl}/api/auth/refresh/`, () =>
        HttpResponse.json({}, { status: 401 }),
      ),
      http.post(`${apiUrl}/api/auth/login/`, () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    );

    renderLoginPage();
    const interaction = userEvent.setup();
    await interaction.type(
      screen.getByRole("textbox", { name: "Email" }),
      "user@example.com",
    );
    await interaction.type(screen.getByLabelText("Password"), "wrong-password");
    await interaction.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Invalid email or password")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();

    await interaction.type(screen.getByLabelText("Password"), "1");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Password")).not.toHaveAttribute(
      "aria-invalid",
    );
  });
  test.each(["server", "network"])(
    "shows %s failures without marking credentials invalid",
    async (failure) => {
      server.use(
        http.post(`${apiUrl}/api/auth/refresh/`, () =>
          HttpResponse.json({}, { status: 401 }),
        ),
        http.post(`${apiUrl}/api/auth/login/`, () =>
          failure === "network"
            ? HttpResponse.error()
            : HttpResponse.json({}, { status: 500 }),
        ),
      );
      renderLoginPage();
      const interaction = userEvent.setup();
      await interaction.type(
        screen.getByRole("textbox", { name: "Email" }),
        "user@example.com",
      );
      await interaction.type(screen.getByLabelText("Password"), "password123");
      await interaction.click(screen.getByRole("button", { name: "Login" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Something went wrong. Please try again.",
      );
      expect(
        screen.getByRole("textbox", { name: "Email" }),
      ).not.toHaveAttribute("aria-invalid");
      expect(screen.getByLabelText("Password")).not.toHaveAttribute(
        "aria-invalid",
      );
      expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
    },
  );
});

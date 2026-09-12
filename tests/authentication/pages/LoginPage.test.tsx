import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, test } from "vitest";

import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import LoginPage from "@/authentication/pages/LoginPage";

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
    expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
  });
});

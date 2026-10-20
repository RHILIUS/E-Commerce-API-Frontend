import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import { RegistrationContext } from "@/authentication/contexts/Registration/RegistrationContext";
import RegisterDetailsPage from "@/authentication/pages/RegisterDetailsPage";

import { render } from "../../render";
import { server } from "../../server";

const registerUrl = "http://localhost/api/auth/register/";

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  server.use(
    http.post("http://localhost/api/auth/refresh/", () =>
      HttpResponse.json({}, { status: 401 }),
    ),
  );
});
afterEach(() => vi.unstubAllGlobals());

// Open the verified-email stage with the real form controls and API client.
function openDetails() {
  render(
    <AuthProvider>
      <RegistrationContext.Provider
        value={{
          email: "shopper@example.com",
          cooldownEndsAt: null,
          beginRegistration: vi.fn(),
          startOtpCooldown: vi.fn(),
          clearRegistration: vi.fn(),
        }}
      >
        <MemoryRouter initialEntries={["/register/account-details"]}>
          <Routes>
            <Route
              path="/register/account-details"
              element={<RegisterDetailsPage />}
            />
            <Route path="/login" element={<h1>Login fallback</h1>} />
          </Routes>
        </MemoryRouter>
      </RegistrationContext.Provider>
    </AuthProvider>,
  );
  return userEvent.setup({ delay: null });
}

// Complete the personal step without submitting account creation.
async function fillPersonal(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Username"), "shopper");
  await user.type(screen.getByLabelText("Full name"), "Sample Shopper");
  await user.type(screen.getByLabelText("Phone number"), "9123456789");
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

// Select a real combobox option so its hidden request value is exercised too.
async function fillAddress(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    await screen.findByRole("combobox", { name: "Country" }),
    "Philippines",
  );
  await user.click(await screen.findByRole("option", { name: /Philippines/ }));
  await user.type(screen.getByLabelText("Address line 1"), "123 Sample Street");
  await user.type(screen.getByLabelText("City / Town"), "Manila");
  await user.click(screen.getByRole("button", { name: "Continue" }));
}

// Passwords remain in memory as users navigate among the mounted steps.
async function fillSecurity(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByLabelText("Password", { exact: true }),
    "Password123",
  );
  await user.type(screen.getByLabelText("Confirm Password"), "Password123");
}

test("only shows the current step and blocks Continue on missing fields", async () => {
  const user = openDetails();
  expect(
    screen.getByRole("region", { name: "Personal details" }),
  ).toBeVisible();
  expect(
    screen.queryByRole("region", { name: "Address" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Create account" }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByLabelText("Username")).toHaveFocus();
  expect(
    screen.getByRole("heading", { name: "Your personal details" }),
  ).toBeVisible();
});

test("preserves values with Back and submits all steps only from Security", async () => {
  let requests = 0;
  let body: unknown;
  server.use(
    http.post(registerUrl, async ({ request }) => {
      requests++;
      body = await request.json();
      return HttpResponse.json({ message: "Created" }, { status: 201 });
    }),
    http.post("http://localhost/api/auth/login/", () =>
      HttpResponse.json({}, { status: 401 }),
    ),
  );
  const user = openDetails();
  await fillPersonal(user);
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByLabelText("Full name")).toHaveValue("Sample Shopper");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await fillAddress(user);
  await fillSecurity(user);
  await user.clear(screen.getByLabelText("Confirm Password"));
  await user.type(screen.getByLabelText("Confirm Password"), "Different123");
  await user.click(screen.getByRole("button", { name: "Create account" }));
  expect(requests).toBe(0);
  expect(screen.getByText("Passwords do not match.")).toBeVisible();
  await user.clear(screen.getByLabelText("Confirm Password"));
  await user.type(screen.getByLabelText("Confirm Password"), "Password123");
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByLabelText("City / Town")).toHaveValue("Manila");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByLabelText("Password", { exact: true })).toHaveValue(
    "Password123",
  );
  expect(requests).toBe(0);
  await user.click(screen.getByRole("button", { name: "Create account" }));
  await screen.findByRole("heading", { name: "Login fallback" });
  expect(requests).toBe(1);
  expect(body).toMatchObject({
    username: "shopper",
    full_name: "Sample Shopper",
    phone_number: "+639123456789",
    country_code: "PH",
    address_line1: "123 Sample Street",
    city: "Manila",
    password: "Password123",
  });
});

test("returns to the earliest server error and keeps later-step errors and values", async () => {
  server.use(
    http.post(registerUrl, () =>
      HttpResponse.json(
        { username: ["Username taken."], city: ["Check this city."] },
        { status: 400 },
      ),
    ),
  );
  const user = openDetails();
  await fillPersonal(user);
  await fillAddress(user);
  await fillSecurity(user);
  await user.click(screen.getByRole("button", { name: "Create account" }));
  expect(await screen.findByText("Username taken.")).toBeVisible();
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: "Your personal details" }),
    ).toHaveFocus(),
  );
  await user.clear(screen.getByRole("textbox", { name: /Username/ }));
  await user.type(
    screen.getByRole("textbox", { name: "Username" }),
    "newshopper",
  );
  await user.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByText("Check this city.")).toBeVisible();
  expect(screen.getByRole("textbox", { name: /City \/ Town/ })).toHaveValue(
    "Manila",
  );
});

test("unlocks reached details steps and revalidates edits after jumping forward", async () => {
  let requests = 0;
  server.use(
    http.post(registerUrl, () => {
      requests++;
      return HttpResponse.json({ message: "Created" }, { status: 201 });
    }),
  );
  const user = openDetails();
  expect(
    screen.getByRole("button", { name: "Address", exact: true }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Security", exact: true }),
  ).toBeDisabled();
  expect(
    screen.queryByRole("button", { name: "Email", exact: true }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Verify", exact: true }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Back", exact: true }),
  ).not.toBeInTheDocument();
  await fillPersonal(user);
  expect(
    screen.getByRole("button", { name: "Security", exact: true }),
  ).toBeDisabled();
  await fillAddress(user);
  await fillSecurity(user);
  await user.click(
    screen.getByRole("button", { name: "Personal details", exact: true }),
  );
  expect(
    screen.getByRole("heading", { name: "Your personal details" }),
  ).toHaveFocus();
  expect(screen.getByLabelText("Full name")).toHaveValue("Sample Shopper");
  await user.clear(screen.getByLabelText("Full name"));
  const security = screen.getByRole("button", {
    name: "Security",
    exact: true,
  });
  security.focus();
  await user.keyboard("{Enter}");
  expect(screen.getByLabelText("Password", { exact: true })).toHaveValue(
    "Password123",
  );
  await user.click(screen.getByRole("button", { name: "Create account" }));
  expect(requests).toBe(0);
  expect(screen.getByLabelText("Full name")).toHaveFocus();
  await user.type(screen.getByLabelText("Full name"), "Updated Shopper");
  await user.click(
    screen.getByRole("button", { name: "Address", exact: true }),
  );
  expect(screen.getByLabelText("City / Town")).toHaveValue("Manila");
  expect(screen.getByLabelText("Email", { exact: true })).toHaveValue(
    "shopper@example.com",
  );
});

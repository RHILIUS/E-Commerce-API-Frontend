import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { accountProtectedRoutes } from "@/account/routes";
import ProtectedRoute from "@/app/routes/ProtectedRoute";
import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import LoginPage from "@/authentication/pages/LoginPage";

import { member, recipient } from "../checkout/fixtures";
import { server } from "../server";

const root = "http://localhost/api/account/change-password/";
const challenge = () => ({
  challenge_id: "d9b67e1c-0891-401e-a5bf-d7be0a98ef72",
  masked_email: "b***@example.com",
  expires_at: new Date(Date.now() + 300_000).toISOString(),
  retry_after: 60,
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

beforeEach(() => {
  Object.defineProperty(document, "elementFromPoint", {
    configurable: true,
    value: () => null,
  });
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
      HttpResponse.json({ access: "token", user: member }),
    ),
    http.get("http://localhost/api/account/recipients/", () =>
      HttpResponse.json({ recipients: [recipient] }),
    ),
    http.post(`${root}request/`, () => HttpResponse.json(challenge())),
    http.post(`${root}resend/`, () => HttpResponse.json(challenge())),
    http.post(`${root}confirm/`, () =>
      HttpResponse.json({ message: "Password changed." }),
    ),
  );
});

function open() {
  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginPage /> },
      { element: <ProtectedRoute />, children: accountProtectedRoutes },
    ],
    { initialEntries: ["/account?tab=change-password"] },
  );
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
  return router;
}

async function fill(interaction: ReturnType<typeof userEvent.setup>) {
  await interaction.type(
    await screen.findByLabelText("Current password"),
    "OriginalPassword1",
  );
  await interaction.type(
    screen.getByLabelText("New password"),
    "UpdatedPassword2",
  );
  await interaction.type(
    screen.getByLabelText("Confirm new password"),
    "UpdatedPassword2",
  );
}

test("new tab requests a user-bound code and commits before redirecting to login", async () => {
  let requested: unknown;
  let confirmed: unknown;
  server.use(
    http.post(`${root}request/`, async ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer token");
      requested = await request.json();
      return HttpResponse.json(challenge());
    }),
    http.post(`${root}confirm/`, async ({ request }) => {
      confirmed = await request.json();
      return HttpResponse.json({ message: "Changed" });
    }),
  );
  const interaction = userEvent.setup();
  const router = open();
  await fill(interaction);
  await interaction.click(
    screen.getByRole("button", { name: "Send verification code" }),
  );
  expect(await screen.findByText(/b\*\*\*@example.com/)).toBeVisible();
  expect(requested).toEqual({
    current_password: "OriginalPassword1",
    new_password: "UpdatedPassword2",
  });
  expect(screen.getByRole("button", { name: /Resend code in/ })).toBeDisabled();
  await interaction.type(
    screen.getByRole("textbox", { name: "Six-digit verification code" }),
    "123456",
  );
  await interaction.click(
    screen.getByRole("button", { name: "Verify and change password" }),
  );
  expect(
    await screen.findByText(
      "Password changed successfully. Sign in with your new password.",
    ),
  ).toBeVisible();
  expect(router.state.location.pathname).toBe("/login");
  expect(confirmed).toEqual({
    current_password: "OriginalPassword1",
    new_password: "UpdatedPassword2",
    challenge_id: challenge().challenge_id,
    otp: "123456",
  });
});

test("password mismatch blocks sending and show/hide controls work", async () => {
  let sent = 0;
  server.use(
    http.post(`${root}request/`, () => {
      sent++;
      return HttpResponse.json(challenge());
    }),
  );
  const interaction = userEvent.setup();
  open();
  await fill(interaction);
  await interaction.clear(screen.getByLabelText("Confirm new password"));
  await interaction.type(
    screen.getByLabelText("Confirm new password"),
    "DifferentPassword3",
  );
  await interaction.click(
    screen.getByRole("button", { name: "Show passwords" }),
  );
  expect(screen.getByLabelText("Current password")).toHaveAttribute(
    "type",
    "text",
  );
  await interaction.click(
    screen.getByRole("button", { name: "Send verification code" }),
  );
  expect(await screen.findByText("Passwords do not match.")).toBeVisible();
  expect(sent).toBe(0);
});

test("incorrect OTP stays in verification; exhausted challenge restarts the form", async () => {
  server.use(
    http.post(`${root}confirm/`, () =>
      HttpResponse.json(
        { otp: ["Incorrect verification code."] },
        { status: 400 },
      ),
    ),
  );
  const interaction = userEvent.setup();
  open();
  await fill(interaction);
  await interaction.click(
    screen.getByRole("button", { name: "Send verification code" }),
  );
  const code = await screen.findByRole("textbox", {
    name: "Six-digit verification code",
  });
  await interaction.type(code, "111111");
  await interaction.click(
    screen.getByRole("button", { name: "Verify and change password" }),
  );
  expect(await screen.findByText("Incorrect verification code.")).toBeVisible();
  expect(code).toBeVisible();
  server.use(
    http.post(`${root}confirm/`, () =>
      HttpResponse.json(
        {
          code: "challenge_exhausted",
          detail: "Too many incorrect codes. Start again.",
        },
        { status: 400 },
      ),
    ),
  );
  await interaction.click(
    screen.getByRole("button", { name: "Verify and change password" }),
  );
  expect(await screen.findByLabelText("Current password")).toBeVisible();
  expect(
    screen.getByText("Too many incorrect codes. Start again."),
  ).toBeVisible();
});

test("unknown confirmation outcome directs to sign-in without automatic replay", async () => {
  let confirms = 0;
  server.use(
    http.post(`${root}confirm/`, () => {
      confirms++;
      return HttpResponse.error();
    }),
  );
  const interaction = userEvent.setup();
  open();
  await fill(interaction);
  await interaction.click(
    screen.getByRole("button", { name: "Send verification code" }),
  );
  await interaction.type(
    await screen.findByRole("textbox", { name: "Six-digit verification code" }),
    "123456",
  );
  await interaction.click(
    screen.getByRole("button", { name: "Verify and change password" }),
  );
  expect(
    await screen.findByText(/password change may have completed/),
  ).toBeVisible();
  expect(confirms).toBe(1);
});

test("switching account tabs preserves password details while hiding the form", async () => {
  const interaction = userEvent.setup();
  open();
  await fill(interaction);
  await interaction.click(screen.getByRole("tab", { name: "Recipients" }));
  await screen.findByText(recipient.name);
  expect(screen.getByLabelText("Current password")).not.toBeVisible();
  await interaction.click(screen.getByRole("tab", { name: "Change Password" }));
  expect(screen.getByLabelText("Current password")).toHaveValue(
    "OriginalPassword1",
  );
  expect(screen.getByLabelText("New password")).toHaveValue("UpdatedPassword2");
});

test("returning to verification preserves the code and credentials without requesting again", async () => {
  let sent = 0;
  let confirmed: unknown;
  server.use(
    http.post(`${root}request/`, () => {
      sent++;
      return HttpResponse.json(challenge());
    }),
    http.post(`${root}confirm/`, async ({ request }) => {
      confirmed = await request.json();
      return HttpResponse.json({ message: "Changed" });
    }),
  );
  const interaction = userEvent.setup();
  open();
  await fill(interaction);
  await interaction.click(
    screen.getByRole("button", { name: "Send verification code" }),
  );
  const code = await screen.findByRole("textbox", {
    name: "Six-digit verification code",
  });
  await interaction.type(code, "123456");
  await interaction.click(screen.getByRole("tab", { name: "Recipients" }));
  await screen.findByText(recipient.name);
  expect(code).not.toBeVisible();
  expect(
    screen.queryByRole("textbox", { name: "Six-digit verification code" }),
  ).not.toBeInTheDocument();
  await interaction.click(screen.getByRole("tab", { name: "Change Password" }));
  expect(code).toBeVisible();
  expect(code).toHaveValue("123456");
  expect(screen.getByRole("button", { name: /Resend code in/ })).toBeDisabled();
  expect(sent).toBe(1);
  await interaction.click(
    screen.getByRole("button", { name: "Verify and change password" }),
  );
  await screen.findByText(
    "Password changed successfully. Sign in with your new password.",
  );
  expect(confirmed).toEqual({
    current_password: "OriginalPassword1",
    new_password: "UpdatedPassword2",
    challenge_id: challenge().challenge_id,
    otp: "123456",
  });
});

test("original deadlines expire while verification is hidden", async () => {
  const interaction = userEvent.setup();
  open();
  await fill(interaction);
  await interaction.click(
    screen.getByRole("button", { name: "Send verification code" }),
  );
  await screen.findByRole("textbox", { name: "Six-digit verification code" });
  await interaction.click(screen.getByRole("tab", { name: "Recipients" }));
  await screen.findByText(recipient.name);
  const afterExpiry = Date.now() + 301_000;
  vi.spyOn(Date, "now").mockReturnValue(afterExpiry);
  await waitFor(() => expect(screen.getByText("Resend code")).toBeEnabled(), {
    timeout: 2000,
  });
  await interaction.click(screen.getByRole("tab", { name: "Change Password" }));
  expect(screen.getByRole("button", { name: "Resend code" })).toBeEnabled();
  expect(
    screen.getByRole("button", { name: "Verify and change password" }),
  ).toBeDisabled();
  expect(
    screen.getByText("This code has expired. Request a new code."),
  ).toBeVisible();
});

test("leaving the account page clears sensitive form values", async () => {
  const interaction = userEvent.setup();
  const router = open();
  await fill(interaction);
  await act(() => router.navigate("/login"));
  await act(() => router.navigate("/account?tab=change-password"));
  expect(await screen.findByLabelText("Current password")).toHaveValue("");
  expect(screen.getByLabelText("New password")).toHaveValue("");
});

test("resend clears the old input and expired codes cannot be submitted", async () => {
  server.use(
    http.post(`${root}request/`, () =>
      HttpResponse.json({
        ...challenge(),
        retry_after: 0,
        expires_at: new Date(Date.now() - 1000).toISOString(),
      }),
    ),
  );
  const interaction = userEvent.setup();
  open();
  await fill(interaction);
  await interaction.click(
    screen.getByRole("button", { name: "Send verification code" }),
  );
  const code = await screen.findByRole("textbox", {
    name: "Six-digit verification code",
  });
  await interaction.type(code, "123456");
  expect(
    screen.getByRole("button", { name: "Verify and change password" }),
  ).toBeDisabled();
  await interaction.click(screen.getByRole("button", { name: "Resend code" }));
  await waitFor(() => expect(code).toHaveValue(""));
  expect(
    await screen.findByRole("button", { name: /Resend code in/ }),
  ).toBeDisabled();
});

test("delivery failure uses the server cooldown and retains password details", async () => {
  server.use(
    http.post(`${root}request/`, () =>
      HttpResponse.json(
        {
          detail: "Email unavailable.",
          code: "delivery_unavailable",
          retry_after: 60,
        },
        { status: 503 },
      ),
    ),
  );
  const interaction = userEvent.setup();
  open();
  await fill(interaction);
  await interaction.click(
    screen.getByRole("button", { name: "Send verification code" }),
  );
  expect(await screen.findByText("Email unavailable.")).toBeVisible();
  expect(screen.getByLabelText("New password")).toHaveValue("UpdatedPassword2");
  expect(screen.getByRole("button", { name: /Send code in/ })).toBeDisabled();
});

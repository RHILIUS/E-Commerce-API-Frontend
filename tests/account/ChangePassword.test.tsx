import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { accountProtectedRoutes } from "@/account/routes";
import ProtectedRoute from "@/app/routes/ProtectedRoute";
import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import LoginPage from "@/authentication/pages/LoginPage";

import { member, recipient } from "../checkout/fixtures";
import { render } from "../render";
import { server } from "../server";

const root = "http://localhost/api/account/change-password/";
const challenge = () => ({
  challenge_id: "d9b67e1c-0891-401e-a5bf-d7be0a98ef72",
  masked_email: "b***@example.com",
  expires_at: new Date(Date.now() + 300_000).toISOString(),
  retry_after: 60,
});
const verified = () => ({
  expires_at: new Date(Date.now() + 600_000).toISOString(),
  message: "Verified",
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
    http.get(root, () =>
      HttpResponse.json({
        csrf_token: "csrf",
        masked_email: challenge().masked_email,
      }),
    ),
    http.post(`${root}request/`, () => HttpResponse.json(challenge())),
    http.post(`${root}resend/`, () => HttpResponse.json(challenge())),
    http.post(`${root}verify/`, () => HttpResponse.json(verified())),
    http.post(`${root}confirm/`, () =>
      HttpResponse.json({ message: "Changed" }),
    ),
  );
});

// Exercise account replacement and sign-out through the real provider, not a mocked hook.
function SessionControls() {
  const { setUser, endSession } = useAuth();
  return (
    <>
      <button
        onClick={() =>
          setUser({ ...member, id: member.id + 1, email: "other@example.com" })
        }
      >
        Switch account
      </button>
      <button onClick={endSession}>Sign out test session</button>
    </>
  );
}

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
      <SessionControls />
      <RouterProvider router={router} />
    </AuthProvider>,
  );
  return router;
}

async function send(interaction: ReturnType<typeof userEvent.setup>) {
  await interaction.click(
    await screen.findByRole("button", { name: "Send verification code" }),
  );
  return screen.findByRole("textbox", { name: "Six-digit verification code" });
}

async function verify(interaction: ReturnType<typeof userEvent.setup>) {
  await interaction.type(await send(interaction), "123456");
  await interaction.click(screen.getByRole("button", { name: "Verify code" }));
  await screen.findByLabelText("New password");
}

async function fill(interaction: ReturnType<typeof userEvent.setup>) {
  await interaction.type(
    screen.getByLabelText("New password"),
    "UpdatedPassword2",
  );
  await interaction.type(
    screen.getByLabelText("Confirm new password"),
    "UpdatedPassword2",
  );
}

test("fixed email and three stages use authentication, fresh CSRF and the exact revised payloads", async () => {
  const requests: { operation: string; body: unknown }[] = [];
  let bootstraps = 0;
  server.use(
    http.get(root, ({ request }) => {
      expect(request.headers.get("Authorization")).toBe("Bearer token");
      return HttpResponse.json({
        csrf_token: `csrf-${++bootstraps}`,
        masked_email: challenge().masked_email,
      });
    }),
  );
  for (const operation of ["request", "verify", "confirm"]) {
    server.use(
      http.post(`${root}${operation}/`, async ({ request }) => {
        expect(request.headers.get("Authorization")).toBe("Bearer token");
        expect(request.headers.get("X-CSRFToken")).toBe(`csrf-${bootstraps}`);
        requests.push({ operation, body: await request.json() });
        return HttpResponse.json(
          operation === "request"
            ? challenge()
            : operation === "verify"
              ? verified()
              : { message: "Changed" },
        );
      }),
    );
  }
  const interaction = userEvent.setup();
  const router = open();
  expect(await screen.findByText("b***@example.com")).toBeVisible();
  expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
  expect(requests).toEqual([]);
  await verify(interaction);
  expect(
    screen.getByRole("heading", { name: "Choose a new password" }),
  ).toHaveFocus();
  expect(requests.map((r) => r.operation)).toEqual(["request", "verify"]);
  await fill(interaction);
  await interaction.click(
    screen.getByRole("button", { name: "Change password" }),
  );
  expect(
    await screen.findByText(
      "Password changed successfully. Sign in with your new password.",
    ),
  ).toBeVisible();
  expect(router.state.location.pathname).toBe("/login");
  expect(requests).toEqual([
    { operation: "request", body: {} },
    {
      operation: "verify",
      body: { challenge_id: challenge().challenge_id, otp: "123456" },
    },
    { operation: "confirm", body: { new_password: "UpdatedPassword2" } },
  ]);
  expect(bootstraps).toBe(4);
});

test("bootstrap failure offers retry without sending email", async () => {
  let sends = 0;
  server.use(
    http.get(root, () =>
      HttpResponse.json({ detail: "Email unavailable." }, { status: 503 }),
    ),
    http.post(`${root}request/`, () => {
      sends++;
      return HttpResponse.json(challenge());
    }),
  );
  const interaction = userEvent.setup();
  open();
  expect(await screen.findByText("Email unavailable.")).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Send verification code" }),
  ).not.toBeInTheDocument();
  server.use(
    http.get(root, () =>
      HttpResponse.json({
        csrf_token: "fresh",
        masked_email: "b***@example.com",
      }),
    ),
  );
  await interaction.click(screen.getByRole("button", { name: "Try again" }));
  expect(
    await screen.findByRole("button", { name: "Send verification code" }),
  ).toBeEnabled();
  expect(sends).toBe(0);
});

test("password mismatch blocks saving and show/hide controls work", async () => {
  let saves = 0;
  server.use(
    http.post(`${root}confirm/`, () => {
      saves++;
      return HttpResponse.json({});
    }),
  );
  const interaction = userEvent.setup();
  open();
  await verify(interaction);
  await fill(interaction);
  await interaction.clear(screen.getByLabelText("Confirm new password"));
  await interaction.type(
    screen.getByLabelText("Confirm new password"),
    "DifferentPassword3",
  );
  await interaction.click(
    screen.getByRole("button", { name: "Show passwords" }),
  );
  expect(screen.getByLabelText("New password")).toHaveAttribute("type", "text");
  await interaction.click(
    screen.getByRole("button", { name: "Hide passwords" }),
  );
  expect(screen.getByLabelText("New password")).toHaveAttribute(
    "type",
    "password",
  );
  await interaction.click(
    screen.getByRole("button", { name: "Change password" }),
  );
  expect(await screen.findByText("Passwords do not match.")).toBeVisible();
  expect(screen.getByLabelText("Confirm new password")).toHaveFocus();
  expect(saves).toBe(0);
});

test("incorrect OTP permits correction; exhausted budget restarts with server wait", async () => {
  server.use(
    http.post(`${root}verify/`, () =>
      HttpResponse.json(
        { code: "invalid_code", detail: "Incorrect verification code." },
        { status: 400 },
      ),
    ),
  );
  const interaction = userEvent.setup();
  open();
  const code = await send(interaction);
  await interaction.type(code, "111111");
  await interaction.click(screen.getByRole("button", { name: "Verify code" }));
  expect(await screen.findByText("Incorrect verification code.")).toBeVisible();
  expect(code).toBeVisible();
  expect(code).toHaveAttribute("aria-invalid", "true");
  expect(code).toHaveAccessibleDescription(/Incorrect verification code/);
  server.use(
    http.post(`${root}verify/`, () =>
      HttpResponse.json(
        {
          code: "challenge_exhausted",
          detail: "Wait and start again.",
          retry_after: 120,
        },
        { status: 429 },
      ),
    ),
  );
  await interaction.click(screen.getByRole("button", { name: "Verify code" }));
  expect(
    await screen.findByRole("button", { name: /Send code in/ }),
  ).toBeDisabled();
  expect(
    screen.queryByLabelText("Six-digit verification code"),
  ).not.toBeInTheDocument();
  expect(screen.getByText("Wait and start again.")).toBeVisible();
});

test("unknown final save response returns to Login without replay", async () => {
  let saves = 0;
  server.use(
    http.post(`${root}confirm/`, () => {
      saves++;
      return HttpResponse.error();
    }),
  );
  const interaction = userEvent.setup();
  open();
  await verify(interaction);
  await fill(interaction);
  await interaction.click(
    screen.getByRole("button", { name: "Change password" }),
  );
  expect(
    await screen.findByText(/password change may have completed/),
  ).toBeVisible();
  expect(saves).toBe(1);
});

test("CSRF bootstrap failure before save retains the draft and does not claim uncertainty", async () => {
  const interaction = userEvent.setup();
  const router = open();
  await verify(interaction);
  await fill(interaction);
  server.use(
    http.get(root, () =>
      HttpResponse.json(
        { detail: "Security service unavailable." },
        { status: 503 },
      ),
    ),
  );
  await interaction.click(
    screen.getByRole("button", { name: "Change password" }),
  );
  expect(
    await screen.findByText("Security service unavailable."),
  ).toBeVisible();
  expect(screen.getByLabelText("New password")).toHaveValue("UpdatedPassword2");
  expect(router.state.location.pathname).toBe("/account");
});

test("password policy errors preserve verified permission; unavailable permission clears drafts", async () => {
  server.use(
    http.post(`${root}confirm/`, () =>
      HttpResponse.json(
        { new_password: ["Choose a different password."] },
        { status: 400 },
      ),
    ),
  );
  const interaction = userEvent.setup();
  open();
  await verify(interaction);
  await fill(interaction);
  await interaction.click(
    screen.getByRole("button", { name: "Change password" }),
  );
  expect(await screen.findByText("Choose a different password.")).toBeVisible();
  expect(screen.getByLabelText("New password")).toHaveValue("UpdatedPassword2");
  server.use(
    http.post(`${root}confirm/`, () =>
      HttpResponse.json(
        { code: "change_unavailable", detail: "Verify again." },
        { status: 400 },
      ),
    ),
  );
  await interaction.click(
    screen.getByRole("button", { name: "Change password" }),
  );
  expect(await screen.findByText("Verify again.")).toBeVisible();
  expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
  // Restart retains cooldown; advance the clock to obtain fresh permission.
  vi.spyOn(Date, "now").mockReturnValue(Date.now() + 61_000);
  await waitFor(
    () =>
      expect(
        screen.getByRole("button", { name: "Send verification code" }),
      ).toBeEnabled(),
    { timeout: 2000 },
  );
  await verify(interaction);
  expect(screen.getByLabelText("New password")).toHaveValue("");
});

test("tab changes preserve code, password draft and original deadlines without sending again", async () => {
  let sends = 0;
  server.use(
    http.post(`${root}request/`, () => {
      sends++;
      return HttpResponse.json(challenge());
    }),
  );
  const interaction = userEvent.setup();
  open();
  const code = await send(interaction);
  await interaction.type(code, "123456");
  await interaction.click(screen.getByRole("tab", { name: "Recipients" }));
  await screen.findByText(recipient.name);
  expect(code).not.toBeVisible();
  await interaction.click(screen.getByRole("tab", { name: "Change Password" }));
  expect(code).toHaveValue("123456");
  expect(screen.getByRole("button", { name: /Resend code in/ })).toBeDisabled();
  await interaction.click(screen.getByRole("button", { name: "Verify code" }));
  await screen.findByLabelText("New password");
  await fill(interaction);
  await interaction.click(screen.getByRole("tab", { name: "Recipients" }));
  await interaction.click(screen.getByRole("tab", { name: "Change Password" }));
  expect(screen.getByLabelText("New password")).toHaveValue("UpdatedPassword2");
  expect(sends).toBe(1);
});

test("hidden verification deadlines continue and expired codes cannot submit", async () => {
  const interaction = userEvent.setup();
  open();
  const code = await send(interaction);
  await interaction.type(code, "123456");
  await interaction.click(screen.getByRole("tab", { name: "Recipients" }));
  await screen.findByText(recipient.name);
  vi.spyOn(Date, "now").mockReturnValue(Date.now() + 301_000);
  await waitFor(() => expect(screen.getByText("Resend code")).toBeEnabled(), {
    timeout: 2000,
  });
  await interaction.click(screen.getByRole("tab", { name: "Change Password" }));
  expect(screen.getByRole("button", { name: "Verify code" })).toBeDisabled();
  expect(
    screen.getByText("This code has expired. Request a new code."),
  ).toBeVisible();
});

test("resend clears the old code and verification uses the rotated identifier", async () => {
  server.use(
    http.post(`${root}request/`, () =>
      HttpResponse.json({ ...challenge(), retry_after: 0 }),
    ),
  );
  const replacement = "d9b67e1c-0891-401e-a5bf-d7be0a98ef73";
  server.use(
    http.post(`${root}resend/`, () =>
      HttpResponse.json({ ...challenge(), challenge_id: replacement }),
    ),
    http.post(`${root}verify/`, async ({ request }) => {
      expect(await request.json()).toEqual({
        challenge_id: replacement,
        otp: "654321",
      });
      return HttpResponse.json(verified());
    }),
  );
  const interaction = userEvent.setup();
  open();
  const code = await send(interaction);
  await interaction.type(code, "123456");
  await interaction.click(screen.getByRole("button", { name: "Resend code" }));
  await waitFor(() => expect(code).toHaveValue(""));
  await screen.findByRole("button", { name: /Resend code in/ });
  await interaction.type(code, "654321");
  await interaction.click(screen.getByRole("button", { name: "Verify code" }));
  expect(await screen.findByLabelText("New password")).toBeVisible();
});

test("delivery failure respects cooldown and does not expose password entry", async () => {
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
  await interaction.click(
    await screen.findByRole("button", { name: "Send verification code" }),
  );
  expect(await screen.findByText("Email unavailable.")).toBeVisible();
  expect(screen.getByRole("button", { name: /Send code in/ })).toBeDisabled();
  expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
});

test("lost verification response restarts instead of assuming permission", async () => {
  server.use(http.post(`${root}verify/`, () => HttpResponse.error()));
  const interaction = userEvent.setup();
  open();
  await interaction.type(await send(interaction), "123456");
  await interaction.click(screen.getByRole("button", { name: "Verify code" }));
  expect(
    await screen.findByRole("button", { name: /Send code in/ }),
  ).toBeDisabled();
  expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
});

test("permission expires while hidden and restart clears password drafts", async () => {
  const interaction = userEvent.setup();
  open();
  await verify(interaction);
  await fill(interaction);
  await interaction.click(screen.getByRole("tab", { name: "Recipients" }));
  await screen.findByText(recipient.name);
  vi.spyOn(Date, "now").mockReturnValue(Date.now() + 601_000);
  await waitFor(
    () =>
      expect(screen.getByText(/Verification has expired/)).toBeInTheDocument(),
    { timeout: 2000 },
  );
  await interaction.click(screen.getByRole("tab", { name: "Change Password" }));
  expect(
    screen.getByRole("button", { name: "Change password" }),
  ).toBeDisabled();
  await interaction.click(
    screen.getByRole("button", { name: "Restart email verification" }),
  );
  await verify(interaction);
  expect(screen.getByLabelText("New password")).toHaveValue("");
});

test("leaving the page, changing accounts and signing out discard sensitive stages", async () => {
  const interaction = userEvent.setup();
  const router = open();
  await verify(interaction);
  await fill(interaction);
  await act(() => router.navigate("/login"));
  await act(() => router.navigate("/account?tab=change-password"));
  await verify(interaction);
  expect(screen.getByLabelText("New password")).toHaveValue("");
  await fill(interaction);
  await interaction.click(
    screen.getByRole("button", { name: "Switch account" }),
  );
  expect(
    await screen.findByRole("button", { name: "Send verification code" }),
  ).toBeVisible();
  expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
  await interaction.click(
    screen.getByRole("button", { name: "Sign out test session" }),
  );
  expect(await screen.findByRole("heading", { name: "Log in" })).toBeVisible();
});

test("duplicate clicks do not issue another code", async () => {
  let sends = 0;
  server.use(
    http.post(`${root}request/`, async () => {
      sends++;
      await delay(100);
      return HttpResponse.json(challenge());
    }),
  );
  const interaction = userEvent.setup();
  open();
  await interaction.dblClick(
    await screen.findByRole("button", { name: "Send verification code" }),
  );
  await screen.findByLabelText("Six-digit verification code");
  expect(sends).toBe(1);
});

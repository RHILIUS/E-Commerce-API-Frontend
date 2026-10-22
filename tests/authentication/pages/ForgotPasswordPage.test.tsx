import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import ForgotPasswordPage from "@/authentication/pages/ForgotPasswordPage";
import LoginPage from "@/authentication/pages/LoginPage";

import { render } from "../../render";
import { server } from "../../server";

const root = "http://localhost/api/auth/forgot-password/";
const challenge = () => ({
  challenge_id: "3166f96c-78fd-498d-9a11-44a88d9e1b15",
  expires_at: new Date(Date.now() + 300_000).toISOString(),
  retry_after: 0,
  message: "If an account exists, we'll send a code.",
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
      HttpResponse.json({}, { status: 401 }),
    ),
    http.get(root, () =>
      HttpResponse.json({ csrf_token: "masked-csrf-token" }),
    ),
    http.post(`${root}request/`, () => HttpResponse.json(challenge())),
    http.post(`${root}resend/`, () => HttpResponse.json(challenge())),
    http.post(`${root}verify/`, () =>
      HttpResponse.json({
        message: "Verified",
        expires_at: new Date(Date.now() + 600_000).toISOString(),
      }),
    ),
    http.post(`${root}confirm/`, () =>
      HttpResponse.json({ message: "Password reset." }),
    ),
  );
});
afterEach(() => vi.unstubAllGlobals());

function open(path = "/forgot-password") {
  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
    ],
    { initialEntries: [path] },
  );
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
  return router;
}

async function requestCode(interaction: ReturnType<typeof userEvent.setup>) {
  await interaction.type(screen.getByLabelText("Email"), "person@example.com");
  await interaction.click(
    screen.getByRole("button", { name: "Send verification code" }),
  );
  await screen.findByLabelText("Six-digit verification code");
}

async function verifyCode(interaction: ReturnType<typeof userEvent.setup>) {
  await interaction.type(
    screen.getByLabelText("Six-digit verification code"),
    "123456",
  );
  await interaction.click(screen.getByRole("button", { name: "Verify code" }));
  await screen.findByLabelText("New password");
}

async function enterPasswords(
  interaction: ReturnType<typeof userEvent.setup>,
  confirmation = "UpdatedPassword2",
) {
  await interaction.type(
    screen.getByLabelText("New password"),
    "UpdatedPassword2",
  );
  await interaction.type(
    screen.getByLabelText("Confirm new password"),
    confirmation,
  );
}

test("login links to recovery, prefills email, uses CSRF and submits only the new password", async () => {
  const bodies: Record<string, unknown> = {};
  for (const operation of ["request", "verify", "confirm"]) {
    server.use(
      http.post(`${root}${operation}/`, async ({ request }) => {
        expect(request.headers.get("X-CSRFToken")).toBe("masked-csrf-token");
        bodies[operation] = await request.json();
        return HttpResponse.json(
          operation === "request"
            ? challenge()
            : operation === "verify"
              ? {
                  message: "Verified",
                  expires_at: new Date(Date.now() + 600_000).toISOString(),
                }
              : { message: "Password reset." },
        );
      }),
    );
  }
  const interaction = userEvent.setup();
  open("/login");
  await interaction.type(screen.getByLabelText("Email"), "person@example.com");
  await interaction.click(
    screen.getByRole("link", { name: "Forgot password?" }),
  );
  expect(screen.getByLabelText("Email")).toHaveValue("person@example.com");
  await interaction.click(
    screen.getByRole("button", { name: "Send verification code" }),
  );
  expect(
    await screen.findByRole("heading", { name: "Check your email" }),
  ).toHaveFocus();
  expect(screen.getByText(/If an account exists for/)).toBeVisible();
  await verifyCode(interaction);
  await enterPasswords(interaction);
  await interaction.click(
    screen.getByRole("button", { name: "Show passwords" }),
  );
  expect(screen.getByLabelText("New password")).toHaveAttribute("type", "text");
  await interaction.click(
    screen.getByRole("button", { name: "Reset password" }),
  );
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Password reset successfully",
  );
  expect(bodies.request).toEqual({ email: "person@example.com" });
  expect(bodies.verify).toEqual({
    email: "person@example.com",
    challenge_id: challenge().challenge_id,
    otp: "123456",
  });
  expect(bodies.confirm).toEqual({ new_password: "UpdatedPassword2" });
});

test("password mismatch blocks saving and field-policy errors preserve the draft", async () => {
  let saves = 0;
  server.use(
    http.post(`${root}confirm/`, () => {
      saves++;
      return HttpResponse.json(
        { new_password: ["Choose a different password."] },
        { status: 400 },
      );
    }),
  );
  const interaction = userEvent.setup();
  open();
  await requestCode(interaction);
  await verifyCode(interaction);
  await enterPasswords(interaction, "DifferentPassword3");
  await interaction.click(
    screen.getByRole("button", { name: "Reset password" }),
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Passwords do not match");
  expect(screen.getByLabelText("Confirm new password")).toHaveFocus();
  expect(saves).toBe(0);
  await interaction.clear(screen.getByLabelText("Confirm new password"));
  await interaction.type(
    screen.getByLabelText("Confirm new password"),
    "UpdatedPassword2",
  );
  await interaction.click(
    screen.getByRole("button", { name: "Reset password" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Choose a different password",
  );
  expect(screen.getByLabelText("New password")).toHaveValue("UpdatedPassword2");
  expect(saves).toBe(1);
});

test("incorrect codes allow retry and resending clears the old input", async () => {
  server.use(
    http.post(`${root}verify/`, () =>
      HttpResponse.json(
        { code: "invalid_code", detail: "Incorrect code." },
        { status: 400 },
      ),
    ),
  );
  const interaction = userEvent.setup();
  open();
  await requestCode(interaction);
  await interaction.type(
    screen.getByLabelText("Six-digit verification code"),
    "000000",
  );
  await interaction.click(screen.getByRole("button", { name: "Verify code" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect code");
  await interaction.click(screen.getByRole("button", { name: "Resend code" }));
  await waitFor(() =>
    expect(screen.getByLabelText("Six-digit verification code")).toHaveValue(
      "",
    ),
  );
  expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
});

test("exhausted attempts restart recovery and preserve the server wait", async () => {
  server.use(
    http.post(`${root}verify/`, () =>
      HttpResponse.json(
        {
          code: "challenge_exhausted",
          detail: "Wait and start again.",
          retry_after: 900,
        },
        { status: 429 },
      ),
    ),
  );
  const interaction = userEvent.setup();
  open();
  await requestCode(interaction);
  await interaction.type(
    screen.getByLabelText("Six-digit verification code"),
    "000000",
  );
  await interaction.click(screen.getByRole("button", { name: "Verify code" }));
  expect(await screen.findByLabelText("Email")).toHaveValue(
    "person@example.com",
  );
  expect(
    await screen.findByRole("button", { name: /Send code in/ }),
  ).toBeDisabled();
});

test("expired permission restarts verification and removes password fields", async () => {
  server.use(
    http.post(`${root}confirm/`, () =>
      HttpResponse.json(
        { code: "reset_unavailable", detail: "Verify your email again." },
        { status: 400 },
      ),
    ),
  );
  const interaction = userEvent.setup();
  open();
  await requestCode(interaction);
  await verifyCode(interaction);
  await enterPasswords(interaction);
  await interaction.click(
    screen.getByRole("button", { name: "Reset password" }),
  );
  expect(await screen.findByLabelText("Email")).toBeVisible();
  expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Verify your email again",
  );
});

test("an uncertain final response goes to login without automatically replaying the reset", async () => {
  let saves = 0;
  server.use(
    http.post(`${root}confirm/`, () => {
      saves++;
      return HttpResponse.json(
        { code: "operation_unavailable" },
        { status: 503 },
      );
    }),
  );
  const interaction = userEvent.setup();
  const router = open();
  await requestCode(interaction);
  await verifyCode(interaction);
  await enterPasswords(interaction);
  await interaction.click(
    screen.getByRole("button", { name: "Reset password" }),
  );
  expect(await screen.findByRole("status")).toHaveTextContent(
    "may have completed",
  );
  expect(router.state.location.pathname).toBe("/login");
  expect(saves).toBe(1);
});

test("a delivery error retains cooldown without opening the code step", async () => {
  server.use(
    http.post(`${root}request/`, () =>
      HttpResponse.json(
        {
          code: "delivery_unavailable",
          detail: "Please try again later.",
          retry_after: 60,
        },
        { status: 503 },
      ),
    ),
  );
  const interaction = userEvent.setup();
  open();
  await interaction.type(screen.getByLabelText("Email"), "person@example.com");
  await interaction.click(
    screen.getByRole("button", { name: "Send verification code" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Please try again later",
  );
  expect(
    await screen.findByRole("button", { name: /Send code in/ }),
  ).toBeDisabled();
  expect(
    screen.queryByLabelText("Six-digit verification code"),
  ).not.toBeInTheDocument();
});

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { expect, test } from "vitest";

import { RegistrationProvider } from "@/authentication/contexts/Registration/RegistrationProvider";
import { useRegistration } from "@/authentication/contexts/Registration/useRegistration";
import RegisterEmailPage from "@/authentication/pages/RegisterEmailPage";

import { render } from "../../render";
import { server } from "../../server";

const apiUrl = "http://localhost";

const RegistrationResult = () => {
  const { email } = useRegistration();
  return <h1>Verify {email}</h1>;
};

test("normalizes the email and continues to OTP verification", async () => {
  let requestedEmail: unknown;

  server.use(
    http.post(`${apiUrl}/api/auth/send-otp/`, async ({ request }) => {
      requestedEmail = await request.json();
      return HttpResponse.json({
        email: "user@example.com",
        message: "Verification email queued.",
        retry_after: 60,
      });
    }),
  );

  render(
    <RegistrationProvider>
      <MemoryRouter initialEntries={["/register/enter-email"]}>
        <Routes>
          <Route path="/register/enter-email" element={<RegisterEmailPage />} />
          <Route path="/register/verify-otp" element={<RegistrationResult />} />
        </Routes>
      </MemoryRouter>
    </RegistrationProvider>,
  );

  const interaction = userEvent.setup();
  await interaction.type(
    screen.getByRole("textbox", { name: "Email" }),
    "USER@EXAMPLE.COM",
  );
  await interaction.click(
    screen.getByRole("button", { name: "Send verification code" }),
  );

  expect(
    await screen.findByRole("heading", { name: "Verify user@example.com" }),
  ).toBeVisible();
  expect(requestedEmail).toEqual({ email: "user@example.com" });
});

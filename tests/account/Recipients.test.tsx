import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, expect, test } from "vitest";

import { accountProtectedRoutes } from "@/account/routes";
import type { Recipient } from "@/account/types";
import ProtectedRoute from "@/app/routes/ProtectedRoute";
import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import LoginPage from "@/authentication/pages/LoginPage";

import { member, recipient } from "../checkout/fixtures";
import { server } from "../server";

const url = "http://localhost/api/account/recipients/";
const second: Recipient = {
  ...recipient,
  id: 8,
  name: "Joan",
  is_default: false,
};
let saved: Recipient[];
// Exercise the actual guarded account route, header and shared dialogs over HTTP.
function renderAccount() {
  const router = createMemoryRouter(
    [
      { path: "/login", element: <LoginPage /> },
      { element: <ProtectedRoute />, children: accountProtectedRoutes },
    ],
    { initialEntries: ["/account?tab=recipients"] },
  );
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
  return router;
}
beforeEach(() => {
  saved = [recipient, second];
  server.use(
    http.post("http://localhost/api/auth/refresh/", () =>
      HttpResponse.json({ access: "token", user: member }),
    ),
    http.get("http://localhost/api/account/profile/", () =>
      HttpResponse.json({
        id: member.id,
        username: "buyer",
        email: member.email,
        full_name: member.fullName,
        phone_number: recipient.phone_number,
        address: null,
        profile_image: null,
        profile_image_crop: {},
      }),
    ),
    http.get(url, () => HttpResponse.json({ recipients: saved })),
  );
});

test("account menu exposes the guarded page and recipient tab", async () => {
  const user = userEvent.setup();
  const router = renderAccount();
  await screen.findByText(recipient.name);
  expect(screen.getByRole("heading", { name: "Recipients" })).toBeVisible();
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  expect(screen.queryByText("Change Password")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Account" }));
  await user.click(await screen.findByRole("menuitem", { name: "Account" }));
  expect(router.state.location.pathname).toBe("/account");
});

test("unauthenticated account entry redirects to login", async () => {
  server.use(
    http.post("http://localhost/api/auth/refresh/", () =>
      HttpResponse.json({}, { status: 401 }),
    ),
  );
  const router = renderAccount();
  await screen.findByRole("button", { name: "Login" });
  expect(router.state.location.pathname).toBe("/login");
});

test("load failure can be retried and empty recipients can be added", async () => {
  saved = [];
  server.use(
    http.get(url, () => HttpResponse.json({}, { status: 503 }), { once: true }),
  );
  let body: unknown;
  server.use(
    http.post(url, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(
        { ...(body as object), id: 9, is_default: true },
        { status: 201 },
      );
    }),
  );
  const user = userEvent.setup();
  renderAccount();
  await user.click(await screen.findByRole("button", { name: "Try again" }));
  await screen.findByText("You have no saved recipients yet.");
  await user.click(screen.getByRole("button", { name: "Add recipient" }));
  await user.type(screen.getByLabelText("Full name"), "New person");
  await user.type(screen.getByLabelText("Address line 1"), "10 Street");
  await user.type(screen.getByLabelText("City"), "Manila");
  await user.type(
    screen.getByRole("combobox", { name: "Country" }),
    "Philippines",
  );
  await user.click(await screen.findByRole("option", { name: /Philippines/ }));
  await user.type(screen.getByLabelText("Phone number"), "9123456789");
  await user.click(screen.getByRole("button", { name: "Save recipient" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(screen.getByText("New person")).toBeVisible();
  expect(screen.getByText("Default", { exact: true })).toBeVisible();
  expect(body).toMatchObject({
    name: "New person",
    phone_number: "+639123456789",
    country_code: "PH",
  });
});

test("default change sends only the default field and edit shares the prefilled form", async () => {
  const user = userEvent.setup();
  let body: unknown;
  server.use(
    http.patch(`${url}8/`, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({ ...second, is_default: true });
    }),
  );
  renderAccount();
  await user.click(
    await screen.findByRole("button", { name: "Make Joan default" }),
  );
  await screen.findByText("Default recipient updated.");
  expect(body).toEqual({ is_default: true });
  expect(
    screen.getByRole("button", { name: `Make ${recipient.name} default` }),
  ).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Edit Joan" }));
  expect(screen.getByLabelText("Full name")).toHaveValue("Joan");
  await user.clear(screen.getByLabelText("Full name"));
  await user.type(screen.getByLabelText("Full name"), "Draft");
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByText("Joan")).toBeVisible();
});

test("deleting the default requires a replacement and blocks duplicate submissions", async () => {
  const user = userEvent.setup();
  let calls = 0;
  let replacement: string | null = null;
  server.use(
    http.delete(`${url}7/`, async ({ request }) => {
      calls++;
      replacement = new URL(request.url).searchParams.get(
        "replacement_default_id",
      );
      await delay(100);
      saved = [{ ...second, is_default: true }];
      return HttpResponse.json({ recipients: saved });
    }),
  );
  renderAccount();
  await user.click(
    await screen.findByRole("button", { name: `Delete ${recipient.name}` }),
  );
  const dialog = screen.getByRole("alertdialog");
  const submit = within(dialog).getByRole("button", {
    name: "Delete recipient",
  });
  expect(submit).toBeDisabled();
  await user.click(within(dialog).getByRole("radio", { name: /Joan/ }));
  await user.dblClick(submit);
  await waitFor(() =>
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
  );
  expect(calls).toBe(1);
  expect(replacement).toBe("8");
  expect(screen.queryByText(recipient.name)).not.toBeInTheDocument();
  expect(screen.getByText("Default", { exact: true })).toBeVisible();
  expect(screen.getByRole("button", { name: "Add recipient" })).toHaveFocus();
});

test("cancel does not delete and a failed deletion keeps the address and allows retry", async () => {
  const user = userEvent.setup();
  let calls = 0;
  server.use(
    http.delete(`${url}8/`, () => {
      calls++;
      return HttpResponse.json(
        { detail: "Recipient changed. Please review it." },
        { status: 409 },
      );
    }),
  );
  renderAccount();
  await user.click(await screen.findByRole("button", { name: "Delete Joan" }));
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(calls).toBe(0);
  await user.click(screen.getByRole("button", { name: "Delete Joan" }));
  await user.click(screen.getByRole("button", { name: "Delete recipient" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Recipient changed",
  );
  expect(screen.getByRole("alertdialog")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByText("Joan")).toBeVisible();
});

test("unknown deletion reconciles the saved list without repeating the mutation", async () => {
  saved = [recipient];
  const user = userEvent.setup();
  let calls = 0;
  server.use(
    http.delete(`${url}7/`, () => {
      calls++;
      saved = [];
      return HttpResponse.error();
    }),
  );
  renderAccount();
  await user.click(
    await screen.findByRole("button", { name: `Delete ${recipient.name}` }),
  );
  await user.click(screen.getByRole("button", { name: "Delete recipient" }));
  await screen.findByText("You have no saved recipients yet.");
  expect(calls).toBe(1);
  expect(screen.getByRole("alert")).toHaveTextContent("result is unknown");
});

test("an unconfirmed save with a failed reload blocks another mutation until reconciliation", async () => {
  const user = userEvent.setup();
  renderAccount();
  await user.click(await screen.findByRole("button", { name: "Edit Joan" }));
  server.use(
    http.patch(`${url}8/`, () => HttpResponse.error()),
    http.get(url, () => HttpResponse.error(), { once: true }),
  );
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(screen.getByRole("button", { name: "Add recipient" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Reload recipients" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Add recipient" })).toBeEnabled(),
  );
});

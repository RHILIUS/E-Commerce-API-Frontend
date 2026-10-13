import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, expect, test } from "vitest";

import { accountProtectedRoutes } from "@/account/routes";
import type { Profile, ProfileInput } from "@/account/types";
import ProtectedRoute from "@/app/routes/ProtectedRoute";
import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";

import { member, recipient } from "../checkout/fixtures";
import { server } from "../server";

const url = "http://localhost/api/account/profile/";
let profile: Profile;
function Session() {
  const { user } = useAuth();
  return (
    <output aria-label="Session">
      {user?.fullName}:{user?.address_country_code}
    </output>
  );
}
function open() {
  const router = createMemoryRouter(
    [{ element: <ProtectedRoute />, children: accountProtectedRoutes }],
    { initialEntries: ["/account"] },
  );
  render(
    <AuthProvider>
      <Session />
      <RouterProvider router={router} />
    </AuthProvider>,
  );
  return router;
}
beforeEach(() => {
  profile = {
    id: member.id,
    username: "buyer",
    email: member.email,
    full_name: member.fullName,
    phone_number: recipient.phone_number,
    address: {
      country_code: "PH",
      address_line1: "10 Main Street",
      address_line2: "",
      city: "Manila",
      region: "",
      postal_code: "",
    },
    profile_image: null,
    profile_image_crop: {},
  };
  server.use(
    http.post("http://localhost/api/auth/refresh/", () =>
      HttpResponse.json({ access: "token", user: member }),
    ),
    http.get(url, () => HttpResponse.json(profile)),
    http.get("http://localhost/api/account/recipients/", () =>
      HttpResponse.json({ recipients: [recipient] }),
    ),
  );
});
test("loads profile, keeps account identity read-only, and switches tabs", async () => {
  const user = userEvent.setup();
  const router = open();
  expect(await screen.findByLabelText("Full name")).toHaveValue(
    member.fullName,
  );
  expect(screen.getByText(member.email)).toBeVisible();
  expect(
    screen.queryByRole("textbox", { name: "Email" }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("tab", { name: "Recipients" }));
  expect(await screen.findByText(recipient.name)).toBeVisible();
  expect(router.state.location.search).toBe("?tab=recipients");
  await user.click(screen.getByRole("tab", { name: "Profile" }));
  expect(await screen.findByLabelText("Full name")).toBeVisible();
});
test("saves the complete profile and synchronizes the session", async () => {
  let body: ProfileInput | undefined;
  server.use(
    http.put(url, async ({ request }) => {
      body = (await request.json()) as ProfileInput;
      await delay(100);
      profile = {
        ...profile,
        ...body,
        full_name: body.full_name.trim(),
        address: { ...body.address, country_code: "US" },
      };
      return HttpResponse.json(profile);
    }),
  );
  const user = userEvent.setup();
  open();
  const name = await screen.findByLabelText("Full name");
  await user.clear(name);
  await user.type(name, "New name");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
  expect(await screen.findByText("Profile saved.")).toBeVisible();
  expect(body).toMatchObject({
    full_name: "New name",
    phone_number: profile.phone_number,
    address: { city: "Manila", country_code: "PH" },
  });
  expect(screen.getByLabelText("Session")).toHaveTextContent("New name:US");
});
test("maps nested validation errors while retaining the draft", async () => {
  server.use(
    http.put(url, () =>
      HttpResponse.json(
        {
          address: { city: ["Unsupported city."] },
          phone_number: ["Phone number is already taken."],
        },
        { status: 400 },
      ),
    ),
  );
  const user = userEvent.setup();
  open();
  const name = await screen.findByLabelText("Full name");
  await user.clear(name);
  await user.type(name, "Draft name");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByText("Unsupported city.")).toBeVisible();
  expect(screen.getByLabelText("City")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByText("Phone number is already taken.")).toBeVisible();
  expect(name).toHaveValue("Draft name");
});
test("cancel restores saved fields and a missing address stays empty", async () => {
  profile.address = null;
  const user = userEvent.setup();
  open();
  const name = await screen.findByLabelText("Full name");
  expect(screen.getByLabelText("Address line 1")).toHaveValue("");
  await user.clear(name);
  await user.type(name, "Discard me");
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByLabelText("Full name")).toHaveValue(member.fullName);
});
test("retries loading and reconciles an uncertain save", async () => {
  let loads = 0;
  server.use(
    http.get(url, () =>
      ++loads === 1
        ? new HttpResponse(null, { status: 503 })
        : HttpResponse.json(profile),
    ),
    http.put(url, () => {
      profile.full_name = "Saved on server";
      return new HttpResponse(null, { status: 503 });
    }),
  );
  const user = userEvent.setup();
  open();
  await user.click(await screen.findByRole("button", { name: "Try again" }));
  await screen.findByLabelText("Full name");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByText(/Your current profile has been reloaded/);
  expect(screen.getByLabelText("Full name")).toHaveValue("Saved on server");
  await waitFor(() =>
    expect(screen.getByLabelText("Session")).toHaveTextContent(
      "Saved on server",
    ),
  );
});

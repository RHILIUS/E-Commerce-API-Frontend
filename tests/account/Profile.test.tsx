import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { accountProtectedRoutes } from "@/account/routes";
import type { Profile, ProfileInput } from "@/account/types";
import api from "@/app/api/axios";
import { Toaster } from "@/app/components/ui/toast";
import ProtectedRoute from "@/app/routes/ProtectedRoute";
import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";

import { member, recipient } from "../checkout/fixtures";
import { render } from "../render";
import { server } from "../server";

vi.mock("react-easy-crop", () => ({
  default: ({
    onCropComplete,
  }: {
    onCropComplete: (area: {
      x: number;
      y: number;
      width: number;
      height: number;
    }) => void;
  }) => (
    <button
      type="button"
      onClick={() => onCropComplete({ x: 25, y: 0, width: 50, height: 100 })}
    >
      Position photo
    </button>
  ),
}));

afterEach(() => vi.restoreAllMocks());

const url = "http://localhost/api/account/profile/";
let profile: Profile;
function Session() {
  const { user } = useAuth();
  return (
    <output aria-label="Session">
      {user?.fullName}:{user?.address_country_code}
      <span aria-label="Session photo">{user?.profile_image ?? "none"}</span>
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
      <Toaster />
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
    http.get("http://localhost/api/account/profile/photo/", () =>
      HttpResponse.json({
        profile_image: null,
        original_image: null,
        source_id: "",
        crop: null,
      }),
    ),
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
  const success = await screen.findByText("Profile saved.");
  expect(success.closest('[data-slot="toast"]')).toBeVisible();
  expect(screen.getAllByText("Profile saved.")).toHaveLength(1);
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
  await waitFor(() =>
    expect(document.activeElement).toHaveAttribute("aria-invalid", "true"),
  );
});
test("cancel restores saved fields and a missing address stays empty", async () => {
  profile.address = null;
  const user = userEvent.setup();
  open();
  const name = await screen.findByLabelText("Full name");
  expect(screen.getByLabelText("Address line 1")).toHaveValue("");
  await user.clear(name);
  await user.type(name, "Discard me");
  await user.click(screen.getByRole("button", { name: "Discard changes" }));
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
  await user.type(screen.getByLabelText("Full name"), " draft");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByText(/Your current profile has been reloaded/);
  expect(screen.queryByText("Profile saved.")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Full name")).toHaveValue("Saved on server");
  await waitFor(() =>
    expect(screen.getByLabelText("Session")).toHaveTextContent(
      "Saved on server",
    ),
  );
});

test("re-crops and removes photos without discarding personal-detail drafts", async () => {
  const photoUrl = "http://localhost/api/account/profile/photo/";
  const photo = {
    profile_image: "https://example.com/avatar.webp",
    original_image: "https://example.com/source.webp",
    source_id: "users/profile/originals/source.webp",
    crop: { x: 0.25, y: 0, width: 0.5, height: 1 },
  };
  let body: unknown;
  let detailSaves = 0;
  server.use(
    http.get(photoUrl, () => HttpResponse.json(photo)),
    http.put(photoUrl, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({
        ...photo,
        profile_image: "https://example.com/recropped.webp",
      });
    }),
    http.delete(photoUrl, () =>
      HttpResponse.json({
        profile_image: null,
        original_image: null,
        source_id: "",
        crop: null,
      }),
    ),
    http.put(url, () => {
      detailSaves++;
      return HttpResponse.json(profile);
    }),
  );
  const user = userEvent.setup();
  open();
  const name = await screen.findByLabelText("Full name");
  await user.clear(name);
  await user.type(name, "Unfinished details");
  await user.click(await screen.findByRole("button", { name: "Adjust crop" }));
  const dialog = screen.getByRole("dialog", {
    name: /^(Edit profile photo|Remove profile photo\?|Your profile photo)$/,
  });
  await user.click(
    within(dialog).getByRole("button", { name: "Position photo" }),
  );
  await user.click(within(dialog).getByRole("button", { name: "Save photo" }));
  await screen.findByText("Photo saved.");
  expect(body).toEqual({ source_id: photo.source_id, crop: photo.crop });
  expect(screen.getByLabelText("Session photo")).toHaveTextContent(
    "https://example.com/recropped.webp",
  );
  expect(name).toHaveValue("Unfinished details");
  expect(detailSaves).toBe(0);
  await user.click(screen.getByRole("button", { name: "Remove photo" }));
  await user.click(
    within(
      screen.getByRole("dialog", {
        name: /^(Edit profile photo|Remove profile photo\?|Your profile photo)$/,
      }),
    ).getByRole("button", { name: "Cancel" }),
  );
  expect(screen.getByRole("button", { name: "Adjust crop" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Remove photo" }));
  await user.click(
    within(
      screen.getByRole("dialog", {
        name: /^(Edit profile photo|Remove profile photo\?|Your profile photo)$/,
      }),
    ).getByRole("button", {
      name: "Remove photo",
    }),
  );
  await screen.findByText("Photo removed.");
  expect(screen.getByLabelText("Session photo")).toHaveTextContent("none");
  expect(screen.getByRole("button", { name: "Upload photo" })).toBeVisible();
  expect(name).toHaveValue("Unfinished details");
  expect(detailSaves).toBe(0);
});

test("uploads an image and normalized crop as multipart and releases the preview URL", async () => {
  const create = vi.fn(() => "blob:photo-preview");
  const revoke = vi.fn();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: create,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: revoke,
  });
  // Assert the multipart contract at the Axios boundary; the real browser check
  // covers transport because jsdom file serialization stalls in this environment.
  const put = vi.spyOn(api, "put").mockResolvedValue({
    data: {
      profile_image: "https://example.com/avatar.webp",
      original_image: "https://example.com/source.webp",
      source_id: "new.webp",
      crop: { x: 0.25, y: 0, width: 0.5, height: 1 },
    },
  });
  const user = userEvent.setup();
  open();
  await screen.findByRole("button", { name: "Upload photo" });
  await user.upload(
    screen.getByLabelText("Choose profile photo"),
    new File(["image"], "photo.jpg", { type: "image/jpeg" }),
  );
  const dialog = screen.getByRole("dialog", {
    name: /^(Edit profile photo|Remove profile photo\?|Your profile photo)$/,
  });
  await user.click(
    within(dialog).getByRole("button", { name: "Position photo" }),
  );
  await user.click(within(dialog).getByRole("button", { name: "Save photo" }));
  await screen.findByText("Photo saved.");
  expect(put.mock.calls[0][0]).toBe("/api/account/profile/photo/");
  const body = put.mock.calls[0][1] as FormData;
  expect(body.get("image")).toHaveProperty("name", "photo.jpg");
  expect(JSON.parse(String(body.get("crop")))).toEqual({
    x: 0.25,
    y: 0,
    width: 0.5,
    height: 1,
  });
  await waitFor(() =>
    expect(revoke).toHaveBeenCalledWith("blob:photo-preview"),
  );
});

test("rejects oversized uploads before opening the crop editor", async () => {
  const user = userEvent.setup();
  open();
  await screen.findByRole("button", { name: "Upload photo" });
  await user.upload(
    screen.getByLabelText("Choose profile photo"),
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
      type: "image/png",
    }),
  );
  expect(
    await screen.findByText("Choose an image no larger than 5 MB."),
  ).toBeVisible();
  expect(
    screen.queryByRole("dialog", {
      name: /^(Edit profile photo|Remove profile photo\?|Your profile photo)$/,
    }),
  ).not.toBeInTheDocument();
});

test("reloads an uncertain photo change before allowing another edit", async () => {
  const photoUrl = "http://localhost/api/account/profile/photo/";
  let loads = 0;
  let saves = 0;
  server.use(
    http.get(photoUrl, () => {
      loads++;
      return HttpResponse.json({
        profile_image: `https://example.com/avatar-${loads}.webp`,
        original_image: `https://example.com/source-${loads}.webp`,
        source_id: `source-${loads}.webp`,
        crop: { x: 0.25, y: 0, width: 0.5, height: 1 },
      });
    }),
    http.put(photoUrl, () => {
      saves++;
      return new HttpResponse(null, { status: 503 });
    }),
  );
  const user = userEvent.setup();
  open();
  const name = await screen.findByLabelText("Full name");
  await user.clear(name);
  await user.type(name, "Keep my draft");
  await user.click(await screen.findByRole("button", { name: "Adjust crop" }));
  await user.click(screen.getByRole("button", { name: "Position photo" }));
  await user.click(screen.getByRole("button", { name: "Save photo" }));
  await screen.findByText(/Your current photo has been reloaded/);
  expect(
    screen.queryByRole("dialog", {
      name: /^(Edit profile photo|Remove profile photo\?|Your profile photo)$/,
    }),
  ).not.toBeInTheDocument();
  expect(screen.getByAltText("Your profile")).toHaveAttribute(
    "src",
    "https://example.com/avatar-2.webp",
  );
  expect(screen.getByLabelText("Session photo")).toHaveTextContent(
    "https://example.com/avatar-2.webp",
  );
  expect(name).toHaveValue("Keep my draft");
  expect(saves).toBe(1);
});

test("preserves profile edits across tabs and disables unchanged actions", async () => {
  const user = userEvent.setup();
  open();
  const name = await screen.findByLabelText("Full name");
  expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Discard changes" }),
  ).toBeDisabled();
  await user.clear(name);
  await user.type(name, "Draft profile");
  expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
  await user.click(screen.getByRole("tab", { name: "Recipients" }));
  await user.click(screen.getByRole("tab", { name: "Profile" }));
  expect(screen.getByLabelText("Full name")).toHaveValue("Draft profile");
  await user.clear(name);
  await user.type(name, member.fullName);
  expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
});

test("profile photo opens a preview independently of editing and preserves drafts", async () => {
  server.use(
    http.get("http://localhost/api/account/profile/photo/", () =>
      HttpResponse.json({
        profile_image: "https://example.com/avatar.webp",
        original_image: "https://example.com/source.webp",
        source_id: "users/profile/originals/source.webp",
        crop: { x: 0.25, y: 0, width: 0.5, height: 1 },
      }),
    ),
  );
  const user = userEvent.setup();
  // jsdom ignores focus options; model preventScroll support used by dialog dismissal.
  const nativeFocus = HTMLElement.prototype.focus;
  vi.spyOn(HTMLElement.prototype, "focus").mockImplementation(function (
    this: HTMLElement,
    options,
  ) {
    void options?.preventScroll;
    nativeFocus.call(this, options);
  });
  const router = open();
  const name = await screen.findByLabelText("Full name");
  await user.clear(name);
  await user.type(name, "Unsaved name");
  const trigger = await screen.findByRole("button", {
    name: "View profile photo",
  });
  trigger.focus();
  await user.keyboard("{Enter}");
  const viewer = await screen.findByRole("dialog", {
    name: "Your profile photo",
  });
  expect(
    within(viewer).getByRole("img", { name: "Your profile" }),
  ).toHaveAttribute("src", "https://example.com/avatar.webp");
  expect(
    within(viewer).queryByRole("button", { name: "Save photo" }),
  ).not.toBeInTheDocument();
  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", {
        name: /^(Edit profile photo|Remove profile photo\?|Your profile photo)$/,
      }),
    ).not.toBeInTheDocument(),
  );
  expect(trigger).toHaveFocus();
  expect(name).toHaveValue("Unsaved name");
  expect(router.state.location.pathname).toBe("/account");
  await user.click(trigger);
  await user.click(
    document.querySelector<HTMLElement>('[data-slot="dialog-backdrop"]')!,
  );
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", {
        name: /^(Edit profile photo|Remove profile photo\?|Your profile photo)$/,
      }),
    ).not.toBeInTheDocument(),
  );
  expect(trigger).toHaveFocus();
});

test("profile without a photo has no empty preview control", async () => {
  open();
  await screen.findByRole("button", { name: "Upload photo" });
  expect(
    screen.queryByRole("button", { name: "View profile photo" }),
  ).not.toBeInTheDocument();
});

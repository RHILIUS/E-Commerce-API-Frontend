import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";

import type { AuthContextType } from "@/authentication/contexts/Auth/AuthContext";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import avatarImage from "@/ecommerce/assets/avatar.webp";
import { Header } from "@/ecommerce/components/Header";

import { render } from "../render";

vi.mock("@/authentication/contexts/Auth/useAuth");

test("shows the saved avatar, falls back on failure or removal, and accepts a replacement", async () => {
  const auth: AuthContextType = {
    user: {
      id: 1,
      fullName: "Buyer",
      email: "buyer@example.com",
      address_country_code: "PH",
      profile_image: "https://example.com/first.webp",
    },
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn(),
    accessToken: "token",
    didLogOut: false,
    setUser: vi.fn(),
    setAccessToken: vi.fn(),
    setIsLoading: vi.fn(),
    endSession: vi.fn(),
    login: vi.fn(),
  };
  vi.mocked(useAuth).mockReturnValue(auth);
  const element = (
    <MemoryRouter>
      <Header searchQuery="" onSearch={vi.fn()} />
    </MemoryRouter>
  );
  const view = render(element);
  const image = () =>
    screen.getByRole("button", { name: "Account" }).querySelector("img")!;
  expect(image()).toHaveAttribute("src", auth.user!.profile_image);
  await userEvent.click(screen.getByRole("button", { name: "Account" }));
  const menu = await screen.findByRole("menu");
  const menuImage = () => menu.querySelector("img")!;
  expect(menu).toHaveTextContent("Buyer");
  expect(
    screen.queryByRole("menuitem", { name: "Buyer" }),
  ).not.toBeInTheDocument();
  expect(menuImage()).toHaveAttribute("src", auth.user!.profile_image);
  fireEvent.error(menuImage());
  expect(image()).toHaveAttribute("src", avatarImage);
  expect(menuImage()).toHaveAttribute("src", avatarImage);
  auth.user!.profile_image = "https://example.com/replacement.webp";
  view.rerender(
    <MemoryRouter>
      <Header searchQuery="" onSearch={vi.fn()} />
    </MemoryRouter>,
  );
  expect(image()).toHaveAttribute("src", auth.user!.profile_image);
  expect(menuImage()).toHaveAttribute("src", auth.user!.profile_image);
  auth.user!.profile_image = null;
  view.rerender(
    <MemoryRouter>
      <Header searchQuery="" onSearch={vi.fn()} />
    </MemoryRouter>,
  );
  expect(image()).toHaveAttribute("src", avatarImage);
});

// Supply a guest session without involving token restoration or network requests.
function guestAuth(): AuthContextType {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    logout: vi.fn(),
    accessToken: null,
    didLogOut: false,
    setUser: vi.fn(),
    setAccessToken: vi.fn(),
    setIsLoading: vi.fn(),
    endSession: vi.fn(),
    login: vi.fn(),
  };
}

test("mobile search focuses on open, retains its draft on close, and submits trimmed text", async () => {
  vi.mocked(useAuth).mockReturnValue(guestAuth());
  const onSearch = vi.fn();
  render(
    <MemoryRouter>
      <Header searchQuery="" onSearch={onSearch} />
    </MemoryRouter>,
  );
  const user = userEvent.setup({ delay: null });
  await user.click(screen.getByRole("button", { name: "Open search" }));
  const input = screen.getByRole("searchbox", { name: "Search products" });
  expect(input).toHaveFocus();
  await user.type(input, "  headphones  ");
  await user.keyboard("{Escape}");
  expect(screen.getByRole("button", { name: "Open search" })).toHaveFocus();
  expect(onSearch).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Open search" }));
  expect(input).toHaveValue("  headphones  ");
  await user.click(screen.getByRole("button", { name: /^Search$/ }));
  expect(onSearch).toHaveBeenCalledWith("headphones");
});

test("floating mode preserves the same focused search input and disconnects its observer", async () => {
  let notify: IntersectionObserverCallback;
  const disconnect = vi.fn();
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        notify = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  try {
    vi.mocked(useAuth).mockReturnValue(guestAuth());
    const view = render(
      <MemoryRouter>
        <Header searchQuery="" onSearch={vi.fn()} />
      </MemoryRouter>,
    );
    const user = userEvent.setup({ delay: null });
    await user.click(screen.getByRole("button", { name: "Open search" }));
    const input = screen.getByRole("searchbox", { name: "Search products" });
    await user.type(input, "draft");
    act(() =>
      notify(
        [
          {
            isIntersecting: false,
            boundingClientRect: { top: -1 },
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      ),
    );
    expect(screen.getByRole("banner")).toHaveAttribute("data-floating", "true");
    expect(screen.getByRole("searchbox", { name: "Search products" })).toBe(
      input,
    );
    expect(input).toHaveFocus();
    expect(input).toHaveValue("draft");
    act(() =>
      notify(
        [
          {
            isIntersecting: true,
            boundingClientRect: { top: 72 },
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      ),
    );
    expect(screen.getByRole("banner")).toHaveAttribute(
      "data-floating",
      "false",
    );
    view.unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  } finally {
    vi.unstubAllGlobals();
  }
});

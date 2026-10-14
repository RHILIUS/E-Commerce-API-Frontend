import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";

import type { AuthContextType } from "@/authentication/contexts/Auth/AuthContext";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import avatarImage from "@/ecommerce/assets/avatar.webp";
import { Header } from "@/ecommerce/components/Header";

vi.mock("@/authentication/contexts/Auth/useAuth");

test("shows the saved avatar, falls back on failure or removal, and accepts a replacement", () => {
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
  fireEvent.error(image());
  expect(image()).toHaveAttribute("src", avatarImage);
  auth.user!.profile_image = "https://example.com/replacement.webp";
  view.rerender(
    <MemoryRouter>
      <Header searchQuery="" onSearch={vi.fn()} />
    </MemoryRouter>,
  );
  expect(image()).toHaveAttribute("src", auth.user!.profile_image);
  auth.user!.profile_image = null;
  view.rerender(
    <MemoryRouter>
      <Header searchQuery="" onSearch={vi.fn()} />
    </MemoryRouter>,
  );
  expect(image()).toHaveAttribute("src", avatarImage);
});

import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, test, vi } from "vitest";

import type { AuthContextType } from "@/authentication/contexts/Auth/AuthContext";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";
import { useDisplayCurrency } from "@/ecommerce/currency/context";
import { CurrencyProvider } from "@/ecommerce/currency/CurrencyProvider";
import { CurrencySelector } from "@/ecommerce/currency/CurrencySelector";
import LandingPage from "@/ecommerce/pages/LandingPage";

import { render } from "../render";
import { server } from "../server";

vi.mock("@/authentication/contexts/Auth/useAuth");
let auth: AuthContextType;
const key = "shop:display-currency";

function CurrentPreference() {
  const { currency } = useDisplayCurrency();
  return <output aria-label="Preference">{currency ?? "automatic"}</output>;
}
const controls = () => (
  <CurrencyProvider>
    <CurrencySelector />
    <CurrentPreference />
  </CurrencyProvider>
);

beforeEach(() => {
  localStorage.clear();
  auth = {
    user: null,
    accessToken: null,
    isLoading: false,
    isAuthenticated: false,
    logout: vi.fn(),
  } as unknown as AuthContextType;
  vi.mocked(useAuth).mockImplementation(() => auth);
});

async function choose(name: RegExp) {
  await userEvent.click(
    screen.getByRole("combobox", { name: /^Display currency:/ }),
  );
  await userEvent.click(await screen.findByRole("option", { name }));
}

test("searches and remembers explicit choices through account changes; automatic clears storage", async () => {
  const view = render(controls());
  await screen.findByRole("combobox", { name: "Display currency: USD" });
  await userEvent.click(
    screen.getByRole("combobox", { name: "Display currency: USD" }),
  );
  await userEvent.type(
    await screen.findByLabelText("Search currencies"),
    "peso",
  );
  await userEvent.click(
    await screen.findByRole("option", { name: /PHP — Philippine Peso/ }),
  );
  expect(screen.getByLabelText("Preference")).toHaveTextContent("PHP");
  expect(localStorage.getItem(key)).toBe("PHP");
  auth = {
    ...auth,
    accessToken: "signed-in",
    isAuthenticated: true,
    user: {
      id: 1,
      fullName: "Buyer",
      email: "buyer@example.com",
      address_country_code: "PH",
      profile_image: null,
    },
  };
  view.rerender(controls());
  expect(screen.getByLabelText("Preference")).toHaveTextContent("PHP");
  await choose(/USD — US Dollar/);
  auth = { ...auth, accessToken: null, user: null, isAuthenticated: false };
  view.rerender(controls());
  await waitFor(() =>
    expect(screen.getByLabelText("Preference")).toHaveTextContent("USD"),
  );
  await choose(/Automatic/);
  expect(localStorage.getItem(key)).toBeNull();
  expect(screen.getByLabelText("Preference")).toHaveTextContent("automatic");
});

test("invalid stored choices are ignored and metadata failure offers recovery", async () => {
  localStorage.setItem(key, "INVALID");
  server.use(
    http.get("http://localhost/api/shop/currencies/", () =>
      HttpResponse.json({}, { status: 503 }),
    ),
  );
  render(controls());
  await userEvent.click(
    screen.getByRole("combobox", { name: /^Display currency:/ }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load");
  server.resetHandlers();
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByRole("option", { name: /PHP — Philippine Peso/ });
  expect(screen.getByLabelText("Preference")).toHaveTextContent("automatic");
});

test("selection still works when local storage cannot be written", async () => {
  render(controls());
  await screen.findByRole("combobox", { name: "Display currency: USD" });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  await choose(/PHP — Philippine Peso/);
  expect(screen.getByLabelText("Preference")).toHaveTextContent("PHP");
  await userEvent.click(
    screen.getByRole("combobox", { name: /^Display currency:/ }),
  );
  expect(
    await screen.findByText(/couldn.t save the preference/),
  ).toBeInTheDocument();
});

test("changing currency cancels obsolete catalog requests and restarts pagination", async () => {
  const calls: string[] = [];
  server.use(
    http.get("http://localhost/api/shop/products/", async ({ request }) => {
      const url = new URL(request.url);
      const currency = url.searchParams.get("display_currency") ?? "USD";
      calls.push(`${currency}:${url.searchParams.get("page")}`);
      if (currency === "PHP") await delay(150);
      return HttpResponse.json({
        count: 24,
        next: "?page=2",
        previous: null,
        results: [
          {
            id: 1,
            name: `${currency} product`,
            short_description: "Camera",
            price: "10.00",
            currency: "USD",
            display_price: { amount: "10.00", currency },
            ordered_count: 0,
            default_image: null,
          },
        ],
      });
    }),
  );
  render(
    <MemoryRouter>
      <CurrencyProvider>
        <LandingPage />
      </CurrencyProvider>
    </MemoryRouter>,
  );
  await screen.findByRole("link", { name: "View USD product" });
  await userEvent.click(screen.getByRole("button", { name: "Load more" }));
  await waitFor(() => expect(calls).toContain("USD:2"));
  await choose(/PHP — Philippine Peso/);
  await choose(/EUR — Euro/);
  await screen.findByRole("link", { name: "View EUR product" });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 180));
  });
  expect(
    screen.queryByRole("link", { name: "View PHP product" }),
  ).not.toBeInTheDocument();
  expect(calls).toContain("PHP:1");
  expect(calls).toContain("EUR:1");
});

test("restores and selects provider currencies beyond the original sample options", async () => {
  localStorage.setItem(key, "BRL");
  server.use(
    http.get("http://localhost/api/shop/currencies/", () =>
      HttpResponse.json({
        currencies: [
          {
            code: "USD",
            name: "US Dollar",
            minor_unit: 2,
            display_supported: true,
            stripe_supported: true,
          },
          {
            code: "BRL",
            name: "Brazilian Real",
            minor_unit: 2,
            display_supported: true,
            stripe_supported: false,
          },
          {
            code: "INR",
            name: "Indian Rupee",
            minor_unit: 2,
            display_supported: true,
            stripe_supported: false,
          },
        ],
        default_currency: "USD",
        default_source: "fallback",
      }),
    ),
  );
  render(controls());
  await screen.findByRole("combobox", { name: "Display currency: BRL" });
  expect(screen.getByLabelText("Preference")).toHaveTextContent("BRL");
  await choose(/INR — Indian Rupee/);
  expect(localStorage.getItem(key)).toBe("INR");
});

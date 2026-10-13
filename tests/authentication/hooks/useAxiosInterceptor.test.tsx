import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { StrictMode, useState } from "react";
import { describe, expect, test } from "vitest";

import api from "@/app/api/axios";
import { AuthProvider } from "@/authentication/contexts/Auth/AuthProvider";
import { useAuth } from "@/authentication/contexts/Auth/useAuth";

import { server } from "../../server";

const apiUrl = "http://localhost";
const user = { id: 1, fullName: "Test User", email: "user@example.com" };

type AuthProbeProps = {
  request?: () => Promise<unknown>;
};

const AuthProbe = ({ request }: AuthProbeProps) => {
  const auth = useAuth();
  const [requestState, setRequestState] = useState("idle");

  const sendRequest = async () => {
    try {
      await request?.();
      setRequestState("succeeded");
    } catch {
      setRequestState("failed");
    }
  };

  return (
    <>
      <output aria-label="Authentication state">
        {auth.isLoading
          ? "loading"
          : auth.isAuthenticated
            ? `authenticated:${auth.accessToken}`
            : "anonymous"}
      </output>
      <button type="button" onClick={auth.endSession}>
        End session
      </button>
      <output aria-label="Request state">{requestState}</output>
      <button type="button" onClick={() => void sendRequest()}>
        Send request
      </button>
    </>
  );
};

describe("JWT interceptor", () => {
  test("refreshes an expired access token and retries the request", async () => {
    const interaction = userEvent.setup();
    let refreshCount = 0;
    const authorizationHeaders: Array<string | null> = [];

    server.use(
      http.post(`${apiUrl}/api/auth/refresh/`, () => {
        refreshCount += 1;
        return HttpResponse.json({
          access: refreshCount === 1 ? "expired-token" : "refreshed-token",
          user,
        });
      }),
      http.get(`${apiUrl}/api/products/`, ({ request }) => {
        const authorization = request.headers.get("Authorization");
        authorizationHeaders.push(authorization);

        if (authorization === "Bearer expired-token") {
          return HttpResponse.json({}, { status: 401 });
        }

        return HttpResponse.json({ products: [] });
      }),
    );

    render(
      <AuthProvider>
        <AuthProbe request={() => api.get("/api/products/")} />
      </AuthProvider>,
    );

    expect(
      await screen.findByText("authenticated:expired-token"),
    ).toBeVisible();
    await interaction.click(
      screen.getByRole("button", { name: "Send request" }),
    );

    expect(await screen.findByText("succeeded")).toBeVisible();
    expect(refreshCount).toBe(2);
    expect(authorizationHeaders).toEqual([
      "Bearer expired-token",
      "Bearer refreshed-token",
    ]);
  });

  test("shares one refresh between simultaneous authentication failures", async () => {
    const interaction = userEvent.setup();
    let refreshCount = 0;

    server.use(
      http.post(`${apiUrl}/api/auth/refresh/`, async () => {
        refreshCount += 1;
        await delay(20);
        return HttpResponse.json({
          access: refreshCount === 1 ? "expired-token" : "refreshed-token",
          user,
        });
      }),
      http.get(`${apiUrl}/api/:resource/`, async ({ request }) => {
        if (request.headers.get("Authorization") === "Bearer expired-token") {
          await delay(10);
          return HttpResponse.json({}, { status: 401 });
        }

        return HttpResponse.json({});
      }),
    );

    render(
      <AuthProvider>
        <AuthProbe
          request={() =>
            Promise.all([api.get("/api/products/"), api.get("/api/orders/")])
          }
        />
      </AuthProvider>,
    );

    expect(
      await screen.findByText("authenticated:expired-token"),
    ).toBeVisible();
    await interaction.click(
      screen.getByRole("button", { name: "Send request" }),
    );

    expect(await screen.findByText("succeeded")).toBeVisible();
    expect(refreshCount).toBe(2);
  });

  test("clears authentication when the refresh token is rejected", async () => {
    const interaction = userEvent.setup();
    let refreshCount = 0;

    server.use(
      http.post(`${apiUrl}/api/auth/refresh/`, () => {
        refreshCount += 1;
        if (refreshCount > 1) {
          return HttpResponse.json({}, { status: 401 });
        }
        return HttpResponse.json({ access: "expired-token", user });
      }),
      http.get(`${apiUrl}/api/products/`, () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    );

    render(
      <AuthProvider>
        <AuthProbe request={() => api.get("/api/products/")} />
      </AuthProvider>,
    );

    expect(
      await screen.findByText("authenticated:expired-token"),
    ).toBeVisible();
    await interaction.click(
      screen.getByRole("button", { name: "Send request" }),
    );

    expect(await screen.findByText("anonymous")).toBeVisible();
    expect(screen.getByText("failed")).toBeVisible();
    expect(refreshCount).toBe(2);
  });

  test("does not refresh repeatedly when the retried request is unauthorized", async () => {
    const interaction = userEvent.setup();
    let refreshCount = 0;
    let protectedRequestCount = 0;

    server.use(
      http.post(`${apiUrl}/api/auth/refresh/`, () => {
        refreshCount += 1;
        return HttpResponse.json({
          access: refreshCount === 1 ? "expired-token" : "refreshed-token",
          user,
        });
      }),
      http.get(`${apiUrl}/api/products/`, () => {
        protectedRequestCount += 1;
        return HttpResponse.json({}, { status: 401 });
      }),
    );

    render(
      <AuthProvider>
        <AuthProbe request={() => api.get("/api/products/")} />
      </AuthProvider>,
    );

    expect(
      await screen.findByText("authenticated:expired-token"),
    ).toBeVisible();
    await interaction.click(
      screen.getByRole("button", { name: "Send request" }),
    );

    expect(await screen.findByText("failed")).toBeVisible();
    expect(refreshCount).toBe(2);
    expect(protectedRequestCount).toBe(2);
  });

  test("keeps the current session when refreshing fails temporarily", async () => {
    const interaction = userEvent.setup();
    let refreshCount = 0;

    server.use(
      http.post(`${apiUrl}/api/auth/refresh/`, () => {
        refreshCount += 1;
        if (refreshCount > 1) {
          return HttpResponse.json({}, { status: 500 });
        }
        return HttpResponse.json({ access: "expired-token", user });
      }),
      http.get(`${apiUrl}/api/products/`, () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    );

    render(
      <AuthProvider>
        <AuthProbe request={() => api.get("/api/products/")} />
      </AuthProvider>,
    );

    expect(
      await screen.findByText("authenticated:expired-token"),
    ).toBeVisible();
    await interaction.click(
      screen.getByRole("button", { name: "Send request" }),
    );

    expect(await screen.findByText("failed")).toBeVisible();
    expect(screen.getByText("authenticated:expired-token")).toBeVisible();
    expect(refreshCount).toBe(2);
  });

  test("initializes only once under React Strict Mode", async () => {
    let refreshCount = 0;

    server.use(
      http.post(`${apiUrl}/api/auth/refresh/`, () => {
        refreshCount += 1;
        return HttpResponse.json({ access: "access-token", user });
      }),
    );

    render(
      <StrictMode>
        <AuthProvider>
          <AuthProbe />
        </AuthProvider>
      </StrictMode>,
    );

    expect(await screen.findByText("authenticated:access-token")).toBeVisible();
    await waitFor(() => expect(refreshCount).toBe(1));
  });
});

test("a late refresh cannot restore authentication after ending the session", async () => {
  const interaction = userEvent.setup();
  let refreshes = 0;
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http.post(`${apiUrl}/api/auth/refresh/`, async () => {
      refreshes++;
      if (refreshes > 1) await pending;
      return HttpResponse.json({
        access: refreshes > 1 ? "late-token" : "initial-token",
        user,
      });
    }),
    http.get(`${apiUrl}/api/products/`, () =>
      HttpResponse.json({}, { status: 401 }),
    ),
  );
  render(
    <AuthProvider>
      <AuthProbe request={() => api.get("/api/products/")} />
    </AuthProvider>,
  );
  await screen.findByText("authenticated:initial-token");
  await interaction.click(screen.getByRole("button", { name: "Send request" }));
  await waitFor(() => expect(refreshes).toBe(2));
  await interaction.click(screen.getByRole("button", { name: "End session" }));
  release();
  await screen.findByText("failed");
  expect(screen.getByLabelText("Authentication state")).toHaveTextContent(
    "anonymous",
  );
});

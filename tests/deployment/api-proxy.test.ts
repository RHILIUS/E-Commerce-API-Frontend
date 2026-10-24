// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { onRequest } from "../../functions/api/[[path]]";

// Reserved test domains keep proxy checks independent of deployment configuration.
const API_ORIGIN = "https://api.example.test";
const pagesOrigin = "https://frontend.example.test";

afterEach(() => vi.unstubAllGlobals());

describe("Pages API proxy", () => {
  it("forwards method, query, body, bearer token and cookies to the fixed backend", async () => {
    const upstream = vi
      .fn()
      .mockResolvedValue(Response.json({ access: "demo-access" }));
    vi.stubGlobal("fetch", upstream);
    const request = new Request(`${pagesOrigin}/api/auth/login/?next=cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer demo-token",
        Cookie: "registration_token=demo-registration",
        Host: "untrusted.example",
        Origin: pagesOrigin,
      },
      body: JSON.stringify({
        email: "demo@example.test",
        password: "test-only",
      }),
    });

    const response = await onRequest({ request, env: { API_ORIGIN } });

    const forwarded: Request = upstream.mock.calls[0][0];
    expect(forwarded.url).toBe(`${API_ORIGIN}/api/auth/login/?next=cart`);
    expect(forwarded.method).toBe("POST");
    expect(await forwarded.json()).toEqual({
      email: "demo@example.test",
      password: "test-only",
    });
    expect(forwarded.headers.get("Authorization")).toBe("Bearer demo-token");
    expect(forwarded.headers.get("Cookie")).toBe(
      "registration_token=demo-registration",
    );
    expect(forwarded.headers.get("Origin")).toBe(pagesOrigin);
    expect(forwarded.headers.has("Host")).toBe(false);
    expect(upstream.mock.calls[0][1]).toEqual({
      redirect: "manual",
      cache: "no-store",
    });
    expect(await response.json()).toEqual({ access: "demo-access" });
  });

  it("preserves independent cookies, including deletion and comma-containing expiry dates", async () => {
    const headers = new Headers();
    const cookies = [
      "refresh_token=demo; Path=/; HttpOnly; Secure; SameSite=Lax",
      "registration_token=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; Path=/; SameSite=Lax",
    ];
    cookies.forEach((cookie) => headers.append("Set-Cookie", cookie));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204, headers })),
    );

    const response = await onRequest({
      request: new Request(`${pagesOrigin}/api/auth/logout/`, {
        method: "POST",
      }),
      env: { API_ORIGIN },
    });

    expect(response.status).toBe(204);
    expect(response.headers.getSetCookie()).toEqual(cookies);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Cloudflare-CDN-Cache-Control")).toBe(
      "no-store",
    );
  });

  it("streams multipart uploads without replacing their boundary", async () => {
    const form = new FormData();
    form.set(
      "photo",
      new Blob(["image-content"], { type: "image/png" }),
      "profile.png",
    );
    const request = new Request(`${pagesOrigin}/api/account/photo/`, {
      method: "PATCH",
      body: form,
    });
    const contentType = request.headers.get("Content-Type");
    const upstream = vi
      .fn()
      .mockResolvedValue(Response.json({ photo: "saved" }));
    vi.stubGlobal("fetch", upstream);

    await onRequest({ request, env: { API_ORIGIN } });

    const forwarded: Request = upstream.mock.calls[0][0];
    expect(forwarded.headers.get("Content-Type")).toBe(contentType);
    const image = (await forwarded.formData()).get("photo") as File;
    expect(image.name).toBe("profile.png");
    expect(await image.text()).toBe("image-content");
  });

  it.each([
    undefined,
    "http://api.example",
    `${API_ORIGIN}/api`,
    `${API_ORIGIN}?target=other`,
    pagesOrigin,
    "https://user:password@api.example",
  ])(
    "rejects an invalid origin without making an upstream request: %s",
    async (origin) => {
      const upstream = vi.fn();
      vi.stubGlobal("fetch", upstream);
      const response = await onRequest({
        request: new Request(`${pagesOrigin}/api/auth/refresh/`),
        env: { API_ORIGIN: origin },
      });
      expect(response.status).toBe(503);
      expect(upstream).not.toHaveBeenCalled();
    },
  );

  it("keeps backend API redirects on Pages without following them server-side", async () => {
    const upstream = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 301,
        headers: { Location: `${API_ORIGIN}/api/shop/products/?page=2` },
      }),
    );
    vi.stubGlobal("fetch", upstream);
    const response = await onRequest({
      request: new Request(`${pagesOrigin}/api/shop/products?page=2`),
      env: { API_ORIGIN },
    });
    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe(
      `${pagesOrigin}/api/shop/products/?page=2`,
    );
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it("preserves backend validation failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ email: ["Invalid email."] }, { status: 400 }),
        ),
    );
    const response = await onRequest({
      request: new Request(`${pagesOrigin}/api/auth/login/`),
      env: { API_ORIGIN },
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ email: ["Invalid email."] });
  });

  it("returns a non-cacheable gateway error without retrying a possibly committed mutation", async () => {
    const upstream = vi
      .fn()
      .mockRejectedValue(new Error("private upstream diagnostics"));
    vi.stubGlobal("fetch", upstream);
    const response = await onRequest({
      request: new Request(`${pagesOrigin}/api/shop/checkout/`, {
        method: "POST",
      }),
      env: { API_ORIGIN },
    });
    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).not.toContain("private upstream diagnostics");
    expect(upstream).toHaveBeenCalledTimes(1);
  });
});

describe("signed country hints", () => {
  const secret = "country-hint-test-only-secret-000000000000";

  it("replaces browser hints with a request-bound signature matching the Django fixture", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1780000000000);
    const upstream = vi.fn().mockResolvedValue(Response.json({}));
    vi.stubGlobal("fetch", upstream);
    const request = new Request(
      `${pagesOrigin}/api/shop/products/?q=caf%C3%A9+camera`,
      {
        headers: {
          "X-Shop-Country": "US",
          "X-Shop-Country-Time": "forged",
          "X-Shop-Country-Signature": "forged",
          "CF-IPCountry": "US",
        },
      },
    );
    Object.defineProperty(request, "cf", { value: { country: "PH" } });
    await onRequest({
      request,
      env: { API_ORIGIN, COUNTRY_HINT_SECRET: secret },
    });
    const forwarded: Request = upstream.mock.calls[0][0];
    expect(forwarded.headers.get("X-Shop-Country")).toBe("PH");
    expect(forwarded.headers.get("X-Shop-Country-Time")).toBe("1780000000");
    expect(forwarded.headers.get("CF-IPCountry")).toBeNull();
    expect(forwarded.headers.get("X-Shop-Country-Signature")).toBe(
      "0fc0202ba0f767217e8f9f113f6fc9e24446b1f495314cea08d6412aaf3ea96a",
    );
    expect([...forwarded.headers.values()].join(" ")).not.toContain(secret);
  });

  it.each([undefined, null, "XX", "T1", "ph", "INVALID"])(
    "ignores absent/unknown edge country %s and strips browser hints",
    async (country) => {
      const upstream = vi.fn().mockResolvedValue(Response.json({}));
      vi.stubGlobal("fetch", upstream);
      const request = new Request(`${pagesOrigin}/api/shop/currencies/`, {
        headers: {
          "X-Shop-Country": "PH",
          "X-Shop-Country-Time": "1780000000",
          "X-Shop-Country-Signature": "forged",
          "CF-IPCountry": "PH",
        },
      });
      Object.defineProperty(request, "cf", { value: { country } });
      await onRequest({
        request,
        env: { API_ORIGIN, COUNTRY_HINT_SECRET: secret },
      });
      const forwarded: Request = upstream.mock.calls[0][0];
      for (const name of [
        "X-Shop-Country",
        "X-Shop-Country-Time",
        "X-Shop-Country-Signature",
        "CF-IPCountry",
      ]) {
        expect(forwarded.headers.get(name)).toBeNull();
      }
    },
  );

  it.each([undefined, "too-short"])(
    "keeps proxy requests usable when the hint secret is %s",
    async (hintSecret) => {
      const upstream = vi.fn().mockResolvedValue(Response.json({}));
      vi.stubGlobal("fetch", upstream);
      const request = new Request(`${pagesOrigin}/api/shop/currencies/`, {
        headers: {
          "X-Shop-Country": "PH",
          "X-Shop-Country-Signature": "forged",
        },
      });
      Object.defineProperty(request, "cf", { value: { country: "PH" } });
      const response = await onRequest({
        request,
        env: { API_ORIGIN, COUNTRY_HINT_SECRET: hintSecret },
      });
      expect(response.status).toBe(200);
      expect(
        upstream.mock.calls[0][0].headers.get("X-Shop-Country"),
      ).toBeNull();
    },
  );
});

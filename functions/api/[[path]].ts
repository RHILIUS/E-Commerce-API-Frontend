type ProxyContext = {
  request: Request & { cf?: { country?: string | null } };
  env: { API_ORIGIN?: string; COUNTRY_HINT_SECRET?: string };
};

/** Replace untrusted country hints with request-bound, signed Cloudflare metadata. */
async function attachCountryHint(
  incoming: ProxyContext["request"],
  upstream: Request,
  url: URL,
  secret?: string,
) {
  for (const name of [
    "X-Shop-Country",
    "X-Shop-Country-Time",
    "X-Shop-Country-Signature",
    "CF-IPCountry",
  ]) {
    upstream.headers.delete(name);
  }
  const country = incoming.cf?.country;
  const encoder = new TextEncoder();
  if (
    !country ||
    !/^[A-Z]{2}$/.test(country) ||
    country === "XX" ||
    !secret ||
    encoder.encode(secret).length < 32
  )
    return;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const message = JSON.stringify([
    "country-hint-v1",
    timestamp,
    country,
    upstream.method,
    url.origin,
    url.pathname + url.search,
  ]);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );
  upstream.headers.set("X-Shop-Country", country);
  upstream.headers.set("X-Shop-Country-Time", timestamp);
  upstream.headers.set(
    "X-Shop-Country-Signature",
    Array.from(new Uint8Array(signature), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join(""),
  );
}

// Return non-cacheable errors without exposing upstream configuration or credentials.
function proxyError(status: number, detail: string): Response {
  return Response.json(
    { detail },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

/** Forward API traffic to the configured HTTPS backend while preserving host-only cookies. */
export async function onRequest({
  request,
  env,
}: ProxyContext): Promise<Response> {
  const incoming = new URL(request.url);
  let origin: URL;

  try {
    origin = new URL(env.API_ORIGIN ?? "");
    if (
      origin.protocol !== "https:" ||
      origin.username ||
      origin.password ||
      origin.pathname !== "/" ||
      origin.search ||
      origin.hash ||
      origin.origin === incoming.origin
    ) {
      throw new Error("Invalid API origin");
    }
  } catch {
    return proxyError(503, "API proxy is not configured.");
  }

  // Replace only the origin; user-supplied paths cannot select a different backend.
  const upstreamUrl = new URL(request.url);
  upstreamUrl.protocol = origin.protocol;
  upstreamUrl.host = origin.host;
  const upstreamRequest = new Request(upstreamUrl, request);
  upstreamRequest.headers.delete("Host");
  await attachCountryHint(
    request,
    upstreamRequest,
    upstreamUrl,
    env.COUNTRY_HINT_SECRET,
  );

  let upstream: Response;
  try {
    upstream = await fetch(upstreamRequest, {
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    // Do not retry mutations: Django may have committed before the connection failed.
    return proxyError(
      502,
      "API is temporarily unavailable. The request outcome may be unknown.",
    );
  }

  // Clone the response directly so separate Set-Cookie headers remain separate.
  const response = new Response(upstream.body, upstream);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("CDN-Cache-Control", "no-store");
  response.headers.set("Cloudflare-CDN-Cache-Control", "no-store");

  // Keep Django's API slash redirects on the browser's Pages origin.
  const location = response.headers.get("Location");
  if (location) {
    const destination = new URL(location, upstreamUrl);
    if (
      destination.origin === origin.origin &&
      destination.pathname.startsWith("/api/")
    ) {
      destination.protocol = incoming.protocol;
      destination.host = incoming.host;
      response.headers.set("Location", destination.toString());
    }
  }

  return response;
}

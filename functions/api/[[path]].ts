type ProxyContext = {
  request: Request;
  env: { API_ORIGIN?: string };
};

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

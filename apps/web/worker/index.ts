export interface Env {
  ASSETS: Fetcher;
  WAITLIST_DB: D1Database;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WAITLIST_PER_IP_HOUR = 8;

const SECURITY_HEADERS: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "cross-origin-opener-policy": "same-origin",
  "content-security-policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

function applySecurityHeaders(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) headers.set(key, value);
  }
  if (new URL(request.url).protocol === "https:") {
    headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function isSameOrigin(request: Request): boolean {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).origin === url.origin;
    } catch {
      return false;
    }
  }
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === url.origin;
    } catch {
      return false;
    }
  }
  return false;
}

const JOINED_MESSAGE = "You are on the list. We will write when access opens.";

async function handleWaitlist(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }
  if (!isSameOrigin(request)) {
    return json({ error: "Invalid origin." }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email.trim().toLowerCase()
      : "";

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return json({ error: "Enter a valid email address." }, 400);
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 512) ?? null;
  const ip = request.headers.get("cf-connecting-ip")?.slice(0, 64) ?? null;

  try {
    if (ip) {
      const recent = await env.WAITLIST_DB.prepare(
        `SELECT COUNT(*) AS n FROM waitlist WHERE ip = ? AND created_at >= datetime('now', '-1 hour')`,
      )
        .bind(ip)
        .first<{ n: number }>();
      if ((recent?.n ?? 0) >= WAITLIST_PER_IP_HOUR) {
        return json({ error: "Too many tries. Try again later." }, 429);
      }
    }

    const existing = await env.WAITLIST_DB.prepare(
      "SELECT id FROM waitlist WHERE email = ? LIMIT 1",
    )
      .bind(email)
      .first<{ id: number }>();

    if (existing) {
      return json({ ok: true, message: JOINED_MESSAGE });
    }

    await env.WAITLIST_DB.prepare(
      "INSERT INTO waitlist (email, user_agent, ip) VALUES (?, ?, ?)",
    )
      .bind(email, userAgent, ip)
      .run();

    return json({ ok: true, message: JOINED_MESSAGE });
  } catch (error) {
    console.error("waitlist_insert_failed", error);
    return json({ error: "Could not join the waitlist. Try again." }, 500);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/waitlist") {
      return applySecurityHeaders(request, await handleWaitlist(request, env));
    }

    return applySecurityHeaders(request, await env.ASSETS.fetch(request));
  },
} satisfies ExportedHandler<Env>;

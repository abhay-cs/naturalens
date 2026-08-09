export interface Env {
  ASSETS: Fetcher;
  WAITLIST_DB: D1Database;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function handleWaitlist(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-methods": "POST, OPTIONS",
        "access-control-allow-headers": "content-type",
        "access-control-max-age": "86400",
      },
    });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
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
  const ip =
    request.headers.get("cf-connecting-ip")?.slice(0, 64) ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) ??
    null;

  try {
    const existing = await env.WAITLIST_DB.prepare(
      "SELECT id FROM waitlist WHERE email = ? LIMIT 1",
    )
      .bind(email)
      .first<{ id: number }>();

    if (existing) {
      return json({
        ok: true,
        alreadyJoined: true,
        message: "You are already on the waitlist.",
      });
    }

    await env.WAITLIST_DB.prepare(
      "INSERT INTO waitlist (email, user_agent, ip) VALUES (?, ?, ?)",
    )
      .bind(email, userAgent, ip)
      .run();

    return json({
      ok: true,
      alreadyJoined: false,
      message: "You are on the list. We will write when access opens.",
    });
  } catch (error) {
    console.error("waitlist_insert_failed", error);
    return json({ error: "Could not join the waitlist. Try again." }, 500);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/waitlist") {
      return handleWaitlist(request, env);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

import { createRemoteJWKSet, jwtVerify } from "jose";

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  WAITLIST_DB: D1Database;
  DATA: R2Bucket;
  TRAIN_TOKEN?: string;
  TEAM_DOMAIN?: string;
  POLICY_AUD?: string;
  AUTH_MODE?: string;
  /** Comma-separated allowlist for pin auth. */
  PIN_AUTH_EMAILS?: string;
  /** Shared PIN (set via `wrangler secret put PIN_AUTH_PIN`). */
  PIN_AUTH_PIN?: string;
  /** HMAC secret for session cookies (`wrangler secret put PIN_AUTH_SECRET`). */
  PIN_AUTH_SECRET?: string;
  PIN_AUTH_MAX_ATTEMPTS?: string;
  PIN_AUTH_LOCK_MINUTES?: string;
  /** Hard caps under R2 free tier (defaults = 80% of free). */
  R2_CAP_STORAGE_BYTES?: string;
  R2_CAP_CLASS_A_MONTH?: string;
  R2_CAP_CLASS_B_MONTH?: string;
  R2_CAP_MAX_OBJECT_BYTES?: string;
}

export type AuthContext = {
  email: string | null;
  via: "access" | "train" | "dev" | "pin";
};

const SESSION_COOKIE = "nl_skim_session";
const SESSION_DAYS = 14;

function unauthorized(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function forbidden(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

export function isTrainAuth(request: Request, env: Env): boolean {
  const token = bearerToken(request);
  return Boolean(env.TRAIN_TOKEN && token && timingSafeEqual(token, env.TRAIN_TOKEN));
}

/** Constant-time string compare (length still leaks; PIN/HMAC values are fixed-size). */
export function timingSafeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  const n = Math.max(left.length, right.length, 1);
  let diff = left.length ^ right.length;
  for (let i = 0; i < n; i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedTeam: string | null = null;

function jwksFor(teamDomain: string) {
  if (cachedJwks && cachedTeam === teamDomain) return cachedJwks;
  cachedTeam = teamDomain;
  cachedJwks = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
  return cachedJwks;
}

function nowIso(): string {
  return new Date().toISOString();
}

function allowedEmails(env: Env): Set<string> {
  return new Set(
    String(env.PIN_AUTH_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

function maxAttempts(env: Env): number {
  const n = Number(env.PIN_AUTH_MAX_ATTEMPTS || 4);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 4;
}

function lockMinutes(env: Env): number {
  const n = Number(env.PIN_AUTH_LOCK_MINUTES || 30);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 30;
}

function clientKey(request: Request, email?: string): string {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return `${ip}|${(email || "").toLowerCase()}`;
}

function parseCookies(request: Request): Record<string, string> {
  const raw = request.headers.get("cookie") || "";
  const out: Record<string, string> = {};
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlJson(obj: unknown): string {
  const json = JSON.stringify(obj);
  return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64urlJson<T>(raw: string): T | null {
  try {
    const pad = "=".repeat((4 - (raw.length % 4)) % 4);
    const b64 = raw.replace(/-/g, "+").replace(/_/g, "/") + pad;
    return JSON.parse(atob(b64)) as T;
  } catch {
    return null;
  }
}

export async function mintSessionCookie(
  env: Env,
  email: string,
  opts: { secure?: boolean } = {},
): Promise<string | null> {
  if (!env.PIN_AUTH_SECRET) return null;
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = b64urlJson({ email: email.toLowerCase(), exp });
  const sig = await hmacSign(env.PIN_AUTH_SECRET, payload);
  const value = `${payload}.${sig}`;
  const secure = opts.secure !== false;
  const securePart = secure ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly${securePart}; SameSite=Strict; Max-Age=${SESSION_DAYS * 24 * 60 * 60}`;
}

export function clearSessionCookie(opts: { secure?: boolean } = {}): string {
  const secure = opts.secure !== false;
  const securePart = secure ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly${securePart}; SameSite=Strict; Max-Age=0`;
}

export async function readPinSession(
  request: Request,
  env: Env,
): Promise<{ email: string } | null> {
  if (!env.PIN_AUTH_SECRET) return null;
  const raw = parseCookies(request)[SESSION_COOKIE];
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = await hmacSign(env.PIN_AUTH_SECRET, payload);
  if (!timingSafeEqual(expected, sig)) return null;
  const data = fromB64urlJson<{ email?: string; exp?: number }>(payload);
  if (!data?.email || typeof data.exp !== "number" || data.exp < Date.now()) return null;
  const allow = allowedEmails(env);
  if (!allow.size || !allow.has(data.email.toLowerCase())) return null;
  return { email: data.email.toLowerCase() };
}

async function getAttempt(env: Env, key: string) {
  return env.DB.prepare(`SELECT key, fails, locked_until, updated_at FROM auth_attempts WHERE key = ?`)
    .bind(key)
    .first<{ key: string; fails: number; locked_until: string | null; updated_at: string }>();
}

async function bumpFailure(env: Env, key: string): Promise<{ fails: number; locked: boolean; remaining: number }> {
  const max = maxAttempts(env);
  const row = await getAttempt(env, key);
  const now = Date.now();
  if (row?.locked_until && Date.parse(row.locked_until) > now) {
    return { fails: row.fails, locked: true, remaining: 0 };
  }
  const fails = (row?.fails || 0) + 1;
  const locked = fails >= max;
  const lockedUntil = locked
    ? new Date(now + lockMinutes(env) * 60 * 1000).toISOString()
    : null;
  await env.DB.prepare(
    `INSERT INTO auth_attempts (key, fails, locked_until, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET fails = excluded.fails, locked_until = excluded.locked_until, updated_at = excluded.updated_at`,
  )
    .bind(key, fails, lockedUntil, nowIso())
    .run();
  return { fails, locked, remaining: Math.max(0, max - fails) };
}

async function clearFailures(env: Env, key: string): Promise<void> {
  await env.DB.prepare(`DELETE FROM auth_attempts WHERE key = ?`).bind(key).run();
}

export type LoginResult =
  | { ok: true; email: string; setCookie: string }
  | { ok: false; status: number; error: string; remaining?: number };

export async function handlePinLogin(request: Request, env: Env): Promise<LoginResult> {
  const allow = allowedEmails(env);
  if (!env.PIN_AUTH_PIN || !env.PIN_AUTH_SECRET || !allow.size) {
    return { ok: false, status: 503, error: "Pin auth is not configured." };
  }
  let body: { email?: string; pin?: string };
  try {
    body = (await request.json()) as { email?: string; pin?: string };
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON body." };
  }
  const email = String(body.email || "").trim().toLowerCase();
  const pin = String(body.pin || "").trim();
  if (!email || !pin) {
    return { ok: false, status: 400, error: "Email and PIN are required." };
  }

  const key = clientKey(request, email);
  const existing = await getAttempt(env, key);
  if (existing?.locked_until && Date.parse(existing.locked_until) > Date.now()) {
    return {
      ok: false,
      status: 429,
      error: "Too many tries. Wait a bit, then try again.",
      remaining: 0,
    };
  }

  const emailOk = allow.has(email);
  const pinOk = timingSafeEqual(pin, String(env.PIN_AUTH_PIN));

  if (!emailOk || !pinOk) {
    const result = await bumpFailure(env, key);
    if (result.locked) {
      return {
        ok: false,
        status: 429,
        error: "Too many tries. Locked for a while.",
        remaining: 0,
      };
    }
    return {
      ok: false,
      status: 401,
      error: `Wrong email or PIN. ${result.remaining} tr${result.remaining === 1 ? "y" : "ies"} left.`,
      remaining: result.remaining,
    };
  }

  await clearFailures(env, key);
  const secure = new URL(request.url).protocol === "https:";
  const setCookie = await mintSessionCookie(env, email, { secure });
  if (!setCookie) {
    return { ok: false, status: 503, error: "Could not create session." };
  }
  return { ok: true, email, setCookie };
}

/**
 * Auth rules:
 * - /api/runs/:id/status with TRAIN_TOKEN → allowed (Colab)
 * - AUTH_MODE=pin → signed session cookie from email+PIN login
 * - AUTH_MODE=required + TEAM_DOMAIN + POLICY_AUD → Access JWT required
 * - AUTH_MODE=optional → Access JWT verified when present; otherwise allow as "dev"
 * - AUTH_MODE unset → pin (fail closed)
 */
export async function authenticate(
  request: Request,
  env: Env,
  opts: { allowTrain?: boolean } = {},
): Promise<{ ok: true; auth: AuthContext } | { ok: false; response: Response }> {
  if (opts.allowTrain && isTrainAuth(request, env)) {
    return { ok: true, auth: { email: "colab@train", via: "train" } };
  }

  const mode = (env.AUTH_MODE || "pin").toLowerCase();

  if (mode === "pin") {
    const session = await readPinSession(request, env);
    if (session) {
      return { ok: true, auth: { email: session.email, via: "pin" } };
    }
    return { ok: false, response: unauthorized("Sign in required.") };
  }

  const token = request.headers.get("cf-access-jwt-assertion");

  if (env.TEAM_DOMAIN && env.POLICY_AUD) {
    if (!token) {
      if (mode === "required") {
        return { ok: false, response: unauthorized("Missing Cloudflare Access JWT.") };
      }
      return { ok: true, auth: { email: "dev@local", via: "dev" } };
    }
    try {
      const { payload } = await jwtVerify(token, jwksFor(env.TEAM_DOMAIN), {
        issuer: env.TEAM_DOMAIN,
        audience: env.POLICY_AUD,
      });
      const email =
        (typeof payload.email === "string" && payload.email) ||
        (typeof payload.sub === "string" ? payload.sub : "access-user");
      return { ok: true, auth: { email, via: "access" } };
    } catch (error) {
      return { ok: false, response: forbidden("Invalid Access token.") };
    }
  }

  if (mode === "required") {
    return {
      ok: false,
      response: unauthorized("Access is required but TEAM_DOMAIN/POLICY_AUD are not configured."),
    };
  }

  return { ok: true, auth: { email: "dev@local", via: "dev" } };
}

/** Paths that stay public when AUTH_MODE=pin. */
export function isPublicPinPath(path: string): boolean {
  if (path === "/api/health") return true;
  if (path === "/api/auth/login" || path === "/api/auth/logout" || path === "/api/auth/me") return true;
  if (path === "/login" || path === "/login.html" || path === "/login.js") return true;
  if (
    path === "/app.css" ||
    path === "/tokens.css" ||
    path === "/favicon.ico" ||
    path === "/favicon.svg" ||
    path === "/favicon-32.png" ||
    path === "/apple-touch-icon.png" ||
    path === "/owl.png" ||
    path === "/site.webmanifest"
  ) {
    return true;
  }
  return false;
}

export function wantsHtml(request: Request): boolean {
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

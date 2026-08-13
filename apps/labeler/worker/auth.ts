import { createRemoteJWKSet, jwtVerify } from "jose";

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  DATA: R2Bucket;
  TRAIN_TOKEN?: string;
  TEAM_DOMAIN?: string;
  POLICY_AUD?: string;
  AUTH_MODE?: string;
  /** Hard caps under R2 free tier (defaults = 80% of free). */
  R2_CAP_STORAGE_BYTES?: string;
  R2_CAP_CLASS_A_MONTH?: string;
  R2_CAP_CLASS_B_MONTH?: string;
  R2_CAP_MAX_OBJECT_BYTES?: string;
}

export type AuthContext = {
  email: string | null;
  via: "access" | "train" | "dev";
};

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
  return Boolean(env.TRAIN_TOKEN && token && token === env.TRAIN_TOKEN);
}

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedTeam: string | null = null;

function jwksFor(teamDomain: string) {
  if (cachedJwks && cachedTeam === teamDomain) return cachedJwks;
  cachedTeam = teamDomain;
  cachedJwks = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
  return cachedJwks;
}

/**
 * Auth rules:
 * - /api/runs/:id/status with TRAIN_TOKEN → allowed (Colab)
 * - AUTH_MODE=required + TEAM_DOMAIN + POLICY_AUD → Access JWT required
 * - AUTH_MODE=optional (default) → Access JWT verified when present; otherwise allow as "dev"
 */
export async function authenticate(
  request: Request,
  env: Env,
  opts: { allowTrain?: boolean } = {},
): Promise<{ ok: true; auth: AuthContext } | { ok: false; response: Response }> {
  if (opts.allowTrain && isTrainAuth(request, env)) {
    return { ok: true, auth: { email: "colab@train", via: "train" } };
  }

  const mode = (env.AUTH_MODE || "optional").toLowerCase();
  const token = request.headers.get("cf-access-jwt-assertion");
  const emailHeader = request.headers.get("cf-access-authenticated-user-email");

  if (env.TEAM_DOMAIN && env.POLICY_AUD) {
    if (!token) {
      if (mode === "required") {
        return { ok: false, response: unauthorized("Missing Cloudflare Access JWT.") };
      }
      return { ok: true, auth: { email: emailHeader || "dev@local", via: "dev" } };
    }
    try {
      const { payload } = await jwtVerify(token, jwksFor(env.TEAM_DOMAIN), {
        issuer: env.TEAM_DOMAIN,
        audience: env.POLICY_AUD,
      });
      const email =
        (typeof payload.email === "string" && payload.email) ||
        emailHeader ||
        (typeof payload.sub === "string" ? payload.sub : null);
      return { ok: true, auth: { email, via: "access" } };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid Access token";
      return { ok: false, response: forbidden(`Invalid Access token: ${message}`) };
    }
  }

  if (mode === "required") {
    return {
      ok: false,
      response: unauthorized("Access is required but TEAM_DOMAIN/POLICY_AUD are not configured."),
    };
  }

  return { ok: true, auth: { email: emailHeader || "dev@local", via: "dev" } };
}

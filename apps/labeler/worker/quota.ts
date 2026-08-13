import type { Env } from "./auth";
import { json, nowIso } from "./util";

/** Cloudflare R2 free-tier ceilings (account-wide). */
export const FREE_TIER = {
  storageBytes: 10 * 1024 * 1024 * 1024, // 10 GB
  classA: 1_000_000,
  classB: 10_000_000,
} as const;

/**
 * Hard internal caps — stay under free tier so overages cannot happen
 * from this app. Defaults are 80% of free limits.
 */
export function caps(env: Env) {
  return {
    storageBytes: num(env.R2_CAP_STORAGE_BYTES, Math.floor(FREE_TIER.storageBytes * 0.8)),
    classA: num(env.R2_CAP_CLASS_A_MONTH, Math.floor(FREE_TIER.classA * 0.8)),
    classB: num(env.R2_CAP_CLASS_B_MONTH, Math.floor(FREE_TIER.classB * 0.8)),
    maxObjectBytes: num(env.R2_CAP_MAX_OBJECT_BYTES, 20 * 1024 * 1024),
  };
}

function num(raw: string | undefined, fallback: number): number {
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export function monthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type QuotaSnapshot = {
  month: string;
  storage_bytes: number;
  class_a: number;
  class_b: number;
  caps: {
    storage_bytes: number;
    class_a: number;
    class_b: number;
    max_object_bytes: number;
  };
  free_tier: {
    storage_bytes: number;
    class_a: number;
    class_b: number;
  };
  remaining: {
    storage_bytes: number;
    class_a: number;
    class_b: number;
  };
  blocked: {
    storage: boolean;
    class_a: boolean;
    class_b: boolean;
    any: boolean;
  };
};

async function ensureMonth(env: Env, month: string): Promise<void> {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO r2_usage_month (month, class_a, class_b, updated_at) VALUES (?, 0, 0, ?)`,
  )
    .bind(month, nowIso())
    .run();
}

export async function snapshot(env: Env): Promise<QuotaSnapshot> {
  const c = caps(env);
  const month = monthKey();
  await ensureMonth(env, month);
  const storage = await env.DB.prepare(`SELECT bytes FROM r2_storage WHERE id = 1`).first<{ bytes: number }>();
  const usage = await env.DB.prepare(
    `SELECT class_a, class_b FROM r2_usage_month WHERE month = ?`,
  )
    .bind(month)
    .first<{ class_a: number; class_b: number }>();

  const storageBytes = storage?.bytes ?? 0;
  const classA = usage?.class_a ?? 0;
  const classB = usage?.class_b ?? 0;
  const remaining = {
    storage_bytes: Math.max(0, c.storageBytes - storageBytes),
    class_a: Math.max(0, c.classA - classA),
    class_b: Math.max(0, c.classB - classB),
  };
  const blocked = {
    storage: storageBytes >= c.storageBytes,
    class_a: classA >= c.classA,
    class_b: classB >= c.classB,
    any: false,
  };
  blocked.any = blocked.storage || blocked.class_a || blocked.class_b;

  return {
    month,
    storage_bytes: storageBytes,
    class_a: classA,
    class_b: classB,
    caps: {
      storage_bytes: c.storageBytes,
      class_a: c.classA,
      class_b: c.classB,
      max_object_bytes: c.maxObjectBytes,
    },
    free_tier: {
      storage_bytes: FREE_TIER.storageBytes,
      class_a: FREE_TIER.classA,
      class_b: FREE_TIER.classB,
    },
    remaining,
    blocked,
  };
}

export function quotaExceeded(kind: "storage" | "class_a" | "class_b", snap: QuotaSnapshot): Response {
  const labels = {
    storage: "R2 storage cap",
    class_a: "R2 Class A (write) monthly cap",
    class_b: "R2 Class B (read) monthly cap",
  };
  return json(
    {
      error: `${labels[kind]} reached. Uploads/training are paused to stay on the free tier.`,
      code: "r2_quota_exceeded",
      kind,
      quota: snap,
    },
    429,
  );
}

/** Atomically reserve Class A ops. Returns false if it would exceed the cap. */
export async function reserveClassA(env: Env, n: number): Promise<boolean> {
  if (n <= 0) return true;
  const c = caps(env);
  const month = monthKey();
  await ensureMonth(env, month);
  const result = await env.DB.prepare(
    `UPDATE r2_usage_month
     SET class_a = class_a + ?, updated_at = ?
     WHERE month = ? AND class_a + ? <= ?`,
  )
    .bind(n, nowIso(), month, n, c.classA)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function reserveClassB(env: Env, n: number): Promise<boolean> {
  if (n <= 0) return true;
  const c = caps(env);
  const month = monthKey();
  await ensureMonth(env, month);
  const result = await env.DB.prepare(
    `UPDATE r2_usage_month
     SET class_b = class_b + ?, updated_at = ?
     WHERE month = ? AND class_b + ? <= ?`,
  )
    .bind(n, nowIso(), month, n, c.classB)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function reserveStorage(env: Env, bytes: number): Promise<boolean> {
  if (bytes <= 0) return true;
  const c = caps(env);
  const result = await env.DB.prepare(
    `UPDATE r2_storage
     SET bytes = bytes + ?, updated_at = ?
     WHERE id = 1 AND bytes + ? <= ?`,
  )
    .bind(bytes, nowIso(), bytes, c.storageBytes)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

/** Release reserved storage if a put failed after reserve. */
export async function releaseStorage(env: Env, bytes: number): Promise<void> {
  if (bytes <= 0) return;
  await env.DB.prepare(
    `UPDATE r2_storage SET bytes = MAX(0, bytes - ?), updated_at = ? WHERE id = 1`,
  )
    .bind(bytes, nowIso())
    .run();
}

export async function putCounted(
  env: Env,
  key: string,
  value: ArrayBuffer | string | Uint8Array,
  contentType: string,
): Promise<Response | null> {
  if (!(await reserveClassA(env, 1))) {
    return quotaExceeded("class_a", await snapshot(env));
  }
  await env.DATA.put(key, value, { httpMetadata: { contentType } });
  return null;
}

export async function getCounted(env: Env, key: string): Promise<R2ObjectBody | null | Response> {
  if (!(await reserveClassB(env, 1))) {
    return quotaExceeded("class_b", await snapshot(env));
  }
  return env.DATA.get(key);
}

export async function handleQuotaReport(
  request: Request,
  env: Env,
): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }
  const classA = Math.max(0, Math.floor(Number(body.class_a) || 0));
  const classB = Math.max(0, Math.floor(Number(body.class_b) || 0));
  const storage = Math.floor(Number(body.storage_bytes_delta) || 0);

  if (classA > 50_000 || classB > 200_000 || Math.abs(storage) > 2 * 1024 * 1024 * 1024) {
    return json({ error: "Report chunk too large." }, 400);
  }

  if (classA && !(await reserveClassA(env, classA))) {
    return quotaExceeded("class_a", await snapshot(env));
  }
  if (classB && !(await reserveClassB(env, classB))) {
    return quotaExceeded("class_b", await snapshot(env));
  }
  if (storage > 0 && !(await reserveStorage(env, storage))) {
    return quotaExceeded("storage", await snapshot(env));
  }
  if (storage < 0) {
    await releaseStorage(env, -storage);
  }

  return json({ ok: true, quota: await snapshot(env) });
}

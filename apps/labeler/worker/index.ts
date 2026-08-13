import {
  authenticate,
  clearSessionCookie,
  handlePinLogin,
  isPublicPinPath,
  isTrainAuth,
  readPinSession,
  wantsHtml,
  type AuthContext,
  type Env,
} from "./auth";
import {
  caps,
  getCounted,
  handleQuotaReport,
  putCounted,
  quotaExceeded,
  releaseStorage,
  reserveClassA,
  reserveStorage,
  snapshot,
} from "./quota";
import { flagsFor, json, nowIso, runId, sanitizeBoxes, type Box } from "./util";

type ImageRow = {
  id: string;
  file: string;
  width: number;
  height: number;
  split: string;
  boxes: string;
  reviewed: number;
  version: number;
  updated_at: string;
  updated_by: string | null;
  bytes?: number;
};

type RunRow = {
  id: string;
  status: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  images: number | null;
  epochs: number | null;
  map50: number | null;
  precision_: number | null;
  recall: number | null;
  error: string | null;
};

function parseBoxes(raw: string): Box[] {
  try {
    const parsed = JSON.parse(raw);
    return sanitizeBoxes(parsed) || [];
  } catch {
    return [];
  }
}

async function handleDataset(env: Env): Promise<Response> {
  const rows = await env.DB.prepare(
    `SELECT id, file, width, height, split, boxes, reviewed, version, updated_at, updated_by
     FROM images ORDER BY file COLLATE NOCASE ASC`,
  ).all<ImageRow>();

  const images = (rows.results || []).map((row) => {
    const boxes = parseBoxes(row.boxes);
    return {
      id: row.id,
      file: row.file,
      stem: row.file.replace(/\.[^.]+$/, ""),
      width: row.width,
      height: row.height,
      split: row.split,
      boxes,
      reviewed: Boolean(row.reviewed),
      version: row.version,
      flags: flagsFor(boxes),
      updated_at: row.updated_at,
      updated_by: row.updated_by,
    };
  });
  return json({ images, quota: await snapshot(env) });
}

async function handleUpload(request: Request, env: Env, auth: AuthContext): Promise<Response> {
  const form = await request.formData();
  const image = form.get("image");
  const thumb = form.get("thumb");
  const display = form.get("display");
  const original = form.get("original");
  const fileName = String(form.get("file") || "").trim();
  const id = String(form.get("id") || "").trim().toLowerCase();
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));
  const split = String(form.get("split") || "train").trim() || "train";
  const boxesRaw = form.get("boxes");
  let boxes: Box[] = [];
  if (typeof boxesRaw === "string" && boxesRaw.trim()) {
    const sanitized = sanitizeBoxes(JSON.parse(boxesRaw));
    if (!sanitized) return json({ error: "Invalid boxes JSON." }, 400);
    boxes = sanitized;
  }

  if (!(image instanceof File) || !(thumb instanceof File) || !(display instanceof File)) {
    return json({ error: "image, thumb, and display files are required." }, 400);
  }
  if (!id || !/^[a-f0-9]{64}$/.test(id)) {
    return json({ error: "id must be the sha256 hex of the normalized jpeg." }, 400);
  }
  if (!fileName || !Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    return json({ error: "file, width, and height are required." }, 400);
  }

  const limits = caps(env);
  const imageBuf = await image.arrayBuffer();
  const thumbBuf = await thumb.arrayBuffer();
  const displayBuf = await display.arrayBuffer();
  const originalBuf = original instanceof File ? await original.arrayBuffer() : null;

  for (const [label, buf] of [
    ["image", imageBuf],
    ["thumb", thumbBuf],
    ["display", displayBuf],
    ...(originalBuf ? [["original", originalBuf] as const] : []),
  ] as const) {
    if (buf.byteLength > limits.maxObjectBytes) {
      return json(
        {
          error: `${label} exceeds max object size (${limits.maxObjectBytes} bytes).`,
          code: "r2_object_too_large",
          max_object_bytes: limits.maxObjectBytes,
        },
        413,
      );
    }
  }

  const existing = await env.DB.prepare(`SELECT id, file, version, bytes FROM images WHERE id = ?`)
    .bind(id)
    .first<{ id: string; file: string; version: number; bytes: number }>();

  const totalBytes =
    imageBuf.byteLength +
    thumbBuf.byteLength +
    displayBuf.byteLength +
    (originalBuf?.byteLength || 0);

  const putCount = 3 + (originalBuf ? 1 : 0);
  if (!(await reserveClassA(env, putCount))) {
    return quotaExceeded("class_a", await snapshot(env));
  }

  // Only charge storage for brand-new images (dedupe overwrites keep roughly same size).
  const storageDelta = existing ? 0 : totalBytes;
  if (storageDelta > 0 && !(await reserveStorage(env, storageDelta))) {
    return quotaExceeded("storage", await snapshot(env));
  }

  try {
    await env.DATA.put(`images/${id}.jpg`, imageBuf, {
      httpMetadata: { contentType: "image/jpeg" },
    });
    await env.DATA.put(`thumbs/${id}.jpg`, thumbBuf, {
      httpMetadata: { contentType: "image/jpeg" },
    });
    await env.DATA.put(`display/${id}.jpg`, displayBuf, {
      httpMetadata: { contentType: "image/jpeg" },
    });
    if (originalBuf && original instanceof File) {
      const ext = (fileName.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
      await env.DATA.put(`originals/${id}.${ext}`, originalBuf, {
        httpMetadata: { contentType: original.type || "application/octet-stream" },
      });
    }
  } catch (error) {
    if (storageDelta > 0) await releaseStorage(env, storageDelta);
    throw error;
  }

  const at = nowIso();
  if (existing) {
    return json({
      ok: true,
      deduped: true,
      id: existing.id,
      file: existing.file,
      version: existing.version,
      quota: await snapshot(env),
    });
  }

  await env.DB.prepare(
    `INSERT INTO images (id, file, width, height, split, boxes, reviewed, version, updated_at, updated_by, bytes)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`,
  )
    .bind(id, fileName, width, height, split, JSON.stringify(boxes), at, auth.email, totalBytes)
    .run();

  if (boxes.length) {
    await env.DB.prepare(
      `INSERT INTO label_history (image_id, boxes, version, at, by) VALUES (?, ?, 0, ?, ?)`,
    )
      .bind(id, JSON.stringify(boxes), at, auth.email)
      .run();
  }

  return json({
    ok: true,
    deduped: false,
    id,
    file: fileName,
    version: 0,
    quota: await snapshot(env),
  });
}

async function handleLabelPut(
  request: Request,
  env: Env,
  auth: AuthContext,
  idOrStem: string,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }
  if (!body || typeof body !== "object") return json({ error: "Invalid JSON body." }, 400);
  const rec = body as Record<string, unknown>;
  const boxes = sanitizeBoxes(rec.boxes);
  if (!boxes) return json({ error: "boxes must be an array of {cls,cx,cy,w,h}." }, 400);
  const version = Number(rec.version);
  if (!Number.isInteger(version) || version < 0) {
    return json({ error: "version is required." }, 400);
  }
  const reviewed =
    typeof rec.reviewed === "boolean" ? (rec.reviewed ? 1 : 0) : null;

  let image =
    (await env.DB.prepare(`SELECT * FROM images WHERE id = ?`).bind(idOrStem).first<ImageRow>()) ||
    (await env.DB.prepare(`SELECT * FROM images WHERE file = ?`).bind(idOrStem).first<ImageRow>());
  if (!image) {
    const all = await env.DB.prepare(`SELECT * FROM images`).all<ImageRow>();
    image =
      (all.results || []).find(
        (r) => r.id === idOrStem || r.file === idOrStem || r.file.replace(/\.[^.]+$/, "") === idOrStem,
      ) || null;
  }
  if (!image) return json({ error: "Image not found." }, 404);
  if (image.version !== version) {
    return json(
      {
        error: "Version conflict.",
        current: {
          id: image.id,
          version: image.version,
          boxes: parseBoxes(image.boxes),
          reviewed: Boolean(image.reviewed),
        },
      },
      409,
    );
  }

  const nextVersion = image.version + 1;
  const at = nowIso();
  const nextReviewed = reviewed == null ? image.reviewed : reviewed;
  const boxesJson = JSON.stringify(boxes);

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO label_history (image_id, boxes, version, at, by) VALUES (?, ?, ?, ?, ?)`,
    ).bind(image.id, boxesJson, nextVersion, at, auth.email),
    env.DB.prepare(
      `UPDATE images SET boxes = ?, reviewed = ?, version = ?, updated_at = ?, updated_by = ? WHERE id = ? AND version = ?`,
    ).bind(boxesJson, nextReviewed, nextVersion, at, auth.email, image.id, version),
  ]);

  const updated = await env.DB.prepare(`SELECT * FROM images WHERE id = ?`)
    .bind(image.id)
    .first<ImageRow>();
  if (!updated || updated.version !== nextVersion) {
    return json({ error: "Version conflict." }, 409);
  }

  return json({
    ok: true,
    id: updated.id,
    file: updated.file,
    version: updated.version,
    reviewed: Boolean(updated.reviewed),
    boxes: parseBoxes(updated.boxes),
    flags: flagsFor(parseBoxes(updated.boxes)),
  });
}

async function serveObject(env: Env, key: string, cache: string): Promise<Response> {
  const obj = await getCounted(env, key);
  if (obj instanceof Response) return obj;
  if (!obj) return json({ error: "Not found." }, 404);
  const headers = new Headers();
  headers.set("content-type", obj.httpMetadata?.contentType || "image/jpeg");
  headers.set("cache-control", cache);
  headers.set("etag", obj.httpEtag);
  return new Response(obj.body, { headers });
}

async function freezeManifest(
  env: Env,
  id: string,
  epochs: number,
): Promise<{ images: number; train: number; val: number } | Response> {
  // Manifest + status.json = 2 Class A puts; refuse early if near cap.
  if (!(await reserveClassA(env, 2))) {
    return quotaExceeded("class_a", await snapshot(env));
  }

  const rows = await env.DB.prepare(
    `SELECT id, file, width, height, split, boxes, reviewed, version FROM images ORDER BY file COLLATE NOCASE ASC`,
  ).all<ImageRow>();
  const images = (rows.results || []).map((row) => ({
    id: row.id,
    file: row.file,
    width: row.width,
    height: row.height,
    split: row.split === "val" ? "val" : "train",
    boxes: parseBoxes(row.boxes),
    reviewed: Boolean(row.reviewed),
    version: row.version,
    image_key: `images/${row.id}.jpg`,
  }));
  const train = images.filter((i) => i.split === "train").map((i) => i.file);
  const val = images.filter((i) => i.split === "val").map((i) => i.file);
  const manifest = {
    run_id: id,
    created_at: nowIso(),
    epochs,
    class_names: ["polar_bear"],
    images,
    split: { seed: 13, train, val },
  };
  const manifestBody = JSON.stringify(manifest, null, 2);
  const status = {
    run_id: id,
    status: "queued",
    updated_at: nowIso(),
    images: images.length,
    epochs,
  };
  const statusBody = JSON.stringify(status, null, 2);

  // Rough storage for run sidecars (tiny vs images, but still metered).
  const sidecarBytes = new TextEncoder().encode(manifestBody).length + new TextEncoder().encode(statusBody).length;
  if (!(await reserveStorage(env, sidecarBytes))) {
    return quotaExceeded("storage", await snapshot(env));
  }

  await env.DATA.put(`runs/${id}/manifest.json`, manifestBody, {
    httpMetadata: { contentType: "application/json" },
  });
  await env.DATA.put(`runs/${id}/status.json`, statusBody, {
    httpMetadata: { contentType: "application/json" },
  });
  return { images: images.length, train: train.length, val: val.length };
}

async function readR2Json<T>(env: Env, key: string): Promise<T | null | Response> {
  const obj = await getCounted(env, key);
  if (obj instanceof Response) return obj;
  if (!obj) return null;
  try {
    return (await obj.json()) as T;
  } catch {
    return null;
  }
}

function runFromRow(row: RunRow) {
  return {
    id: row.id,
    status: row.status,
    created_at: row.created_at,
    started_at: row.started_at,
    finished_at: row.finished_at,
    images: row.images,
    epochs: row.epochs,
    map50: row.map50,
    precision: row.precision_,
    recall: row.recall,
    error: row.error,
  };
}

async function mergeRun(env: Env, row: RunRow) {
  const remote = await readR2Json<{
    status?: string;
    started_at?: string;
    finished_at?: string;
    map50?: number;
    precision?: number;
    recall?: number;
    error?: string;
    epoch?: number;
    updated_at?: string;
  }>(env, `runs/${row.id}/status.json`);

  if (remote instanceof Response) {
    // Quota blocked reads — return D1 state only.
    return { ...runFromRow(row), remote: null, quota_blocked: true };
  }

  if (remote?.status && remote.status !== row.status) {
    await env.DB.prepare(
      `UPDATE runs SET status = ?, started_at = coalesce(?, started_at), finished_at = coalesce(?, finished_at),
       map50 = coalesce(?, map50), precision_ = coalesce(?, precision_), recall = coalesce(?, recall),
       error = coalesce(?, error) WHERE id = ?`,
    )
      .bind(
        remote.status,
        remote.started_at || null,
        remote.finished_at || null,
        remote.map50 ?? null,
        remote.precision ?? null,
        remote.recall ?? null,
        remote.error || null,
        row.id,
      )
      .run();
    row = (await env.DB.prepare(`SELECT * FROM runs WHERE id = ?`).bind(row.id).first<RunRow>()) || row;
  }

  return { ...runFromRow(row), remote };
}

async function handleCreateRun(request: Request, env: Env): Promise<Response> {
  const quota = await snapshot(env);
  if (quota.blocked.any) {
    return quotaExceeded(
      quota.blocked.storage ? "storage" : quota.blocked.class_a ? "class_a" : "class_b",
      quota,
    );
  }
  // Leave headroom for Colab to download the snapshot and write a few artifacts.
  if (quota.remaining.class_a < 200 || quota.remaining.class_b < 500) {
    return json(
      {
        error:
          "Not enough R2 quota headroom for a training run. Wait for next month or free space before creating another run.",
        code: "r2_quota_headroom",
        quota,
      },
      429,
    );
  }

  let epochs = 30;
  try {
    const body = (await request.json()) as { epochs?: number };
    if (body?.epochs && Number.isFinite(body.epochs)) epochs = Math.max(1, Math.min(200, Math.floor(body.epochs)));
  } catch {
    // empty body is fine
  }
  const id = runId();
  const at = nowIso();
  const frozen = await freezeManifest(env, id, epochs);
  if (frozen instanceof Response) return frozen;
  await env.DB.prepare(
    `INSERT INTO runs (id, status, created_at, images, epochs) VALUES (?, 'queued', ?, ?, ?)`,
  )
    .bind(id, at, frozen.images, epochs)
    .run();
  return json({
    ok: true,
    run: {
      id,
      status: "queued",
      created_at: at,
      images: frozen.images,
      train: frozen.train,
      val: frozen.val,
      epochs,
      manifest: `runs/${id}/manifest.json`,
    },
    quota: await snapshot(env),
  });
}

async function handleListRuns(env: Env): Promise<Response> {
  // D1 only — avoid N Class B reads on every refresh.
  const rows = await env.DB.prepare(`SELECT * FROM runs ORDER BY created_at DESC LIMIT 50`).all<RunRow>();
  const runs = (rows.results || []).map(runFromRow);
  return json({ runs, quota: await snapshot(env) });
}

async function handleGetRun(env: Env, id: string): Promise<Response> {
  const row = await env.DB.prepare(`SELECT * FROM runs WHERE id = ?`).bind(id).first<RunRow>();
  if (!row) return json({ error: "Run not found." }, 404);
  const merged = await mergeRun(env, row);
  const metrics = await readR2Json(env, `runs/${id}/metrics.json`);
  if (metrics instanceof Response) return metrics;
  const preds = await readR2Json(env, `runs/${id}/preds.json`);
  if (preds instanceof Response) return preds;
  const manifest = await readR2Json(env, `runs/${id}/manifest.json`);
  if (manifest instanceof Response) return manifest;
  return json({ run: merged, metrics, preds, manifest, quota: await snapshot(env) });
}

async function handleDeleteRun(env: Env, id: string): Promise<Response> {
  const row = await env.DB.prepare(`SELECT * FROM runs WHERE id = ?`).bind(id).first<RunRow>();
  if (!row) return json({ error: "Run not found." }, 404);

  const prefix = `runs/${id}/`;
  let cursor: string | undefined;
  let freed = 0;
  let deleted = 0;
  do {
    const page = await env.DATA.list({ prefix, limit: 1000, cursor });
    for (const obj of page.objects) {
      freed += obj.size || 0;
      await env.DATA.delete(obj.key);
      deleted += 1;
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  if (freed > 0) await releaseStorage(env, freed);
  await env.DB.prepare(`DELETE FROM runs WHERE id = ?`).bind(id).run();

  return json({
    ok: true,
    id,
    deleted_objects: deleted,
    freed_bytes: freed,
    quota: await snapshot(env),
  });
}

async function handleRunStatus(request: Request, env: Env, id: string): Promise<Response> {
  if (!isTrainAuth(request, env)) {
    return json({ error: "Bearer TRAIN_TOKEN required." }, 401);
  }
  const row = await env.DB.prepare(`SELECT * FROM runs WHERE id = ?`).bind(id).first<RunRow>();
  if (!row) return json({ error: "Run not found." }, 404);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const status = String(body.status || "").toLowerCase();
  if (!["queued", "running", "done", "failed"].includes(status)) {
    return json({ error: "status must be queued|running|done|failed." }, 400);
  }

  const started_at =
    typeof body.started_at === "string" ? body.started_at : status === "running" ? nowIso() : row.started_at;
  const finished_at =
    typeof body.finished_at === "string"
      ? body.finished_at
      : status === "done" || status === "failed"
        ? nowIso()
        : row.finished_at;
  const map50 = typeof body.map50 === "number" ? body.map50 : row.map50;
  const precision = typeof body.precision === "number" ? body.precision : row.precision_;
  const recall = typeof body.recall === "number" ? body.recall : row.recall;
  const error = typeof body.error === "string" ? body.error : status === "failed" ? String(body.message || "failed") : null;

  await env.DB.prepare(
    `UPDATE runs SET status = ?, started_at = ?, finished_at = ?, map50 = ?, precision_ = ?, recall = ?, error = ? WHERE id = ?`,
  )
    .bind(status, started_at, finished_at, map50, precision, recall, error, id)
    .run();

  const statusObj = {
    run_id: id,
    status,
    started_at,
    finished_at,
    map50,
    precision,
    recall,
    error,
    epoch: typeof body.epoch === "number" ? body.epoch : undefined,
    updated_at: nowIso(),
  };
  const blocked = await putCounted(
    env,
    `runs/${id}/status.json`,
    JSON.stringify(statusObj, null, 2),
    "application/json",
  );
  if (blocked) return blocked;

  return json({ ok: true, status: statusObj, quota: await snapshot(env) });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const mode = (env.AUTH_MODE || "optional").toLowerCase();

    if (path === "/api/health" && request.method === "GET") {
      return json({ ok: true, service: "naturalens-labeler" });
    }

    if (path === "/api/auth/login" && request.method === "POST") {
      const result = await handlePinLogin(request, env);
      if (!result.ok) {
        return json(
          { error: result.error, remaining: result.remaining },
          result.status,
        );
      }
      return new Response(JSON.stringify({ ok: true, email: result.email }), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
          "set-cookie": result.setCookie,
        },
      });
    }

    if (path === "/api/auth/logout" && request.method === "POST") {
      const secure = url.protocol === "https:";
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
          "set-cookie": clearSessionCookie({ secure }),
        },
      });
    }

    if (path === "/api/auth/me" && request.method === "GET") {
      const session = await readPinSession(request, env);
      if (!session) return json({ ok: false }, 401);
      return json({ ok: true, email: session.email });
    }

    const allowTrain =
      (path.match(/^\/api\/runs\/[^/]+\/status$/) != null && request.method === "POST") ||
      (path === "/api/quota/report" && request.method === "POST");

    // Pin mode: public assets + login stay open; everything else needs a session (or TRAIN_TOKEN).
    if (mode === "pin") {
      if (isPublicPinPath(path) && !path.startsWith("/api/")) {
        return env.ASSETS.fetch(request);
      }
      if (!(allowTrain && isTrainAuth(request, env))) {
        const session = await readPinSession(request, env);
        if (!session) {
          if (wantsHtml(request) || !path.startsWith("/api/")) {
            return Response.redirect(new URL("/login.html", url).toString(), 302);
          }
          return json({ error: "Sign in required." }, 401);
        }
      }
    }

    const authResult = await authenticate(request, env, { allowTrain });
    if (!authResult.ok) {
      if (mode === "pin" && (wantsHtml(request) || !path.startsWith("/api/"))) {
        return Response.redirect(new URL("/login.html", url).toString(), 302);
      }
      return authResult.response;
    }
    const { auth } = authResult;

    try {
      if (path === "/api/quota" && request.method === "GET") {
        return json(await snapshot(env));
      }
      if (path === "/api/quota/report" && request.method === "POST") {
        // Colab uses TRAIN_TOKEN; Access/dev/pin users can report for admin adjustments.
        if (!(isTrainAuth(request, env) || auth.via === "access" || auth.via === "dev" || auth.via === "pin")) {
          return json({ error: "Bearer TRAIN_TOKEN or Access required." }, 401);
        }
        return await handleQuotaReport(request, env);
      }
      if (path === "/api/dataset" && request.method === "GET") {
        return await handleDataset(env);
      }
      if (path === "/api/upload" && request.method === "POST") {
        return await handleUpload(request, env, auth);
      }
      if (path.startsWith("/api/labels/") && request.method === "PUT") {
        const id = decodeURIComponent(path.slice("/api/labels/".length));
        return await handleLabelPut(request, env, auth, id);
      }
      if (path.startsWith("/media/") && request.method === "GET") {
        const id = decodeURIComponent(path.slice("/media/".length)).replace(/\.jpg$/i, "");
        // One Class B get (no HEAD). Display is always written at upload.
        return await serveObject(env, `display/${id}.jpg`, "public, max-age=31536000, immutable");
      }
      if (path.startsWith("/thumb/") && request.method === "GET") {
        const id = decodeURIComponent(path.slice("/thumb/".length)).replace(/\.jpg$/i, "");
        return await serveObject(env, `thumbs/${id}.jpg`, "public, max-age=31536000, immutable");
      }
      if (path === "/api/runs" && request.method === "GET") {
        return await handleListRuns(env);
      }
      if (path === "/api/runs" && request.method === "POST") {
        return await handleCreateRun(request, env);
      }
      if (path.match(/^\/api\/runs\/[^/]+$/) && request.method === "DELETE") {
        const id = decodeURIComponent(path.slice("/api/runs/".length));
        return await handleDeleteRun(env, id);
      }
      if (path.match(/^\/api\/runs\/[^/]+$/) && request.method === "GET") {
        const id = decodeURIComponent(path.slice("/api/runs/".length));
        return await handleGetRun(env, id);
      }
      if (path.match(/^\/api\/runs\/[^/]+\/status$/) && request.method === "POST") {
        const id = decodeURIComponent(path.slice("/api/runs/".length).replace(/\/status$/, ""));
        return await handleRunStatus(request, env, id);
      }
    } catch (error) {
      console.error("labeler_error", error);
      const message = error instanceof Error ? error.message : "Internal error";
      return json({ error: message }, 500);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

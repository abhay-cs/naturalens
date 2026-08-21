const els = {
  progress: document.getElementById("progress"),
  runList: document.getElementById("runList"),
  createBtn: document.getElementById("createBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  deleteBtn: document.getElementById("deleteBtn"),
  epochs: document.getElementById("epochs"),
  createHint: document.getElementById("createHint"),
  detailPanel: document.getElementById("detailPanel"),
  detailTitle: document.getElementById("detailTitle"),
  detailId: document.getElementById("detailId"),
  detailStatus: document.getElementById("detailStatus"),
  detailScores: document.getElementById("detailScores"),
  detailHint: document.getElementById("detailHint"),
  predFilm: document.getElementById("predFilm"),
  predStage: document.getElementById("predStage"),
  predPhoto: document.getElementById("predPhoto"),
  predCanvas: document.getElementById("predCanvas"),
  toast: document.getElementById("toast"),
};

let runs = [];
let selected = null;
let toastTimer = null;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const STATUS_LABEL = {
  queued: "Waiting",
  running: "Training",
  done: "Finished",
  failed: "Failed",
};

function toast(message) {
  els.toast.hidden = false;
  els.toast.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.hidden = true;
  }, 2800);
}

function pct(n) {
  return typeof n === "number" && Number.isFinite(n) ? `${Math.round(n * 100)}%` : "—";
}

function statusLabel(status) {
  return STATUS_LABEL[status] || status || "Unknown";
}

function formatWhen(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function runTitle(run) {
  const when = formatWhen(run.created_at);
  const photos = typeof run.images === "number" ? `${run.images} photos` : null;
  const rounds = typeof run.epochs === "number" ? `${run.epochs} practice rounds` : null;
  const bits = [when, photos, rounds].filter(Boolean);
  return bits.length ? bits.join(" · ") : run.id;
}

function scoreCards(run) {
  return `
    <article class="score-card">
      <p class="score-value">${pct(run.map50)}</p>
      <p class="score-label">Overall score</p>
      <p class="score-help">How well the boxes match overall</p>
    </article>
    <article class="score-card">
      <p class="score-value">${pct(run.precision)}</p>
      <p class="score-label">When it says “bear”</p>
      <p class="score-help">How often that call is right</p>
    </article>
    <article class="score-card">
      <p class="score-value">${pct(run.recall)}</p>
      <p class="score-label">Bears found</p>
      <p class="score-help">Share of real bears it caught</p>
    </article>`;
}

function renderRuns() {
  els.runList.innerHTML = "";
  if (!runs.length) {
    els.runList.innerHTML = `<li class="empty">No training runs yet. Fix labels on Label, then start a run here.</li>`;
    els.progress.textContent = "No runs";
    return;
  }
  for (const run of runs) {
    const li = document.createElement("li");
    li.className = "run-item";
    if (selected && selected.id === run.id) li.dataset.active = "1";
    const hasScores = typeof run.map50 === "number";
    li.innerHTML = `
      <div class="run-row">
        <button type="button" class="run-open">
          <span class="run-title">${escapeHtml(runTitle(run))}</span>
          <span class="run-meta">
            <span class="pill ${escapeHtml(run.status)}">${escapeHtml(statusLabel(run.status))}</span>
            ${
              hasScores
                ? `<span>Overall ${pct(run.map50)}</span>
                   <span>Right calls ${pct(run.precision)}</span>
                   <span>Found ${pct(run.recall)}</span>`
                : `<span class="muted">No scores yet</span>`
            }
          </span>
        </button>
        <button type="button" class="ghost danger run-delete" title="Delete this run">Delete</button>
      </div>`;
    li.querySelector(".run-open").addEventListener("click", () => openRun(run.id));
    li.querySelector(".run-delete").addEventListener("click", (event) => {
      event.stopPropagation();
      deleteRun(run.id);
    });
    els.runList.appendChild(li);
  }
  els.progress.textContent = `${runs.length} run${runs.length === 1 ? "" : "s"}`;
}

async function loadRuns() {
  const res = await fetch("/api/runs");
  const data = await res.json();
  runs = data.runs || [];
  if (data.quota && window.NaturaQuota) {
    window.NaturaQuota.renderQuota(els.quota || document.getElementById("quota"), data.quota);
    els.createBtn.disabled = Boolean(data.quota.blocked?.any);
  }
  renderRuns();
}

async function createRun() {
  els.createBtn.disabled = true;
  try {
    const epochs = Number(els.epochs.value) || 30;
    const res = await fetch("/api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ epochs }),
    });
    const data = await res.json();
    if (data.quota && window.NaturaQuota) {
      window.NaturaQuota.renderQuota(document.getElementById("quota"), data.quota);
    }
    if (!res.ok) throw new Error(data.error || "Could not create run");
    toast("Training snapshot saved — open Colab with this run next");
    els.createHint.textContent = `Snapshot ready (${data.run.images} photos, ${data.run.epochs} practice rounds). In Colab, set RUN_ID to: ${data.run.id}`;
    await loadRuns();
    await openRun(data.run.id);
  } catch (error) {
    toast(error instanceof Error ? error.message : "Could not start run");
    els.createBtn.disabled = false;
  }
}

async function deleteRun(id) {
  const run = runs.find((r) => r.id === id) || selected;
  const label = run ? runTitle(run) : id;
  const ok = window.confirm(
    `Delete this training run?\n\n${label}\n\nThis removes the frozen snapshot and scores. Your photo labels on the Label page stay.`,
  );
  if (!ok) return;

  els.deleteBtn.disabled = true;
  try {
    const res = await fetch(`/api/runs/${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await res.json();
    if (data.quota && window.NaturaQuota) {
      window.NaturaQuota.renderQuota(document.getElementById("quota"), data.quota);
    }
    if (!res.ok) throw new Error(data.error || "Could not delete run");
    toast("Run deleted");
    if (selected && selected.id === id) {
      selected = null;
      els.detailPanel.hidden = true;
      els.predFilm.innerHTML = "";
      els.predStage.hidden = true;
    }
    await loadRuns();
  } catch (error) {
    toast(error instanceof Error ? error.message : "Delete failed");
  } finally {
    els.deleteBtn.disabled = false;
  }
}

function semanticColor(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** Normalize training / manifest box shapes into drawable objects. */
function asBoxList(raw) {
  if (!Array.isArray(raw) || !raw.length) return [];
  // A lone count was sometimes stored as gt: 3 (number) — already rejected above.
  return raw
    .map((box) => {
      if (!box) return null;
      if (Array.isArray(box) && box.length >= 4) return { xyxy: box.slice(0, 4).map(Number) };
      if (Array.isArray(box.xyxy) && box.xyxy.length >= 4) {
        return { xyxy: box.xyxy.slice(0, 4).map(Number), score: box.score };
      }
      if (box.cx != null && box.cy != null && box.w != null && box.h != null) {
        return {
          cx: Number(box.cx),
          cy: Number(box.cy),
          w: Number(box.w),
          h: Number(box.h),
          score: box.score,
        };
      }
      return null;
    })
    .filter(Boolean);
}

function drawBoxes(ctx, boxes, color, labelPrefix, width, height) {
  const list = asBoxList(boxes);
  if (!list.length) return;
  const stroke = Math.max(2, Math.round(Math.min(width, height) / 400));
  ctx.lineWidth = stroke;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.font = `600 ${Math.max(12, Math.round(Math.min(width, height) / 45))}px Archivo, ui-sans-serif, sans-serif`;
  list.forEach((box, i) => {
    let x;
    let y;
    let w;
    let h;
    if (box.xyxy) {
      [x, y, , ,] = box.xyxy;
      w = box.xyxy[2] - box.xyxy[0];
      h = box.xyxy[3] - box.xyxy[1];
    } else if (box.cx != null) {
      w = box.w * width;
      h = box.h * height;
      x = box.cx * width - w / 2;
      y = box.cy * height - h / 2;
    } else {
      return;
    }
    ctx.strokeRect(x, y, w, h);
    const label = `${labelPrefix}${i + 1}${box.score != null ? ` ${Math.round(box.score * 100)}%` : ""}`;
    const ty = Math.max(14, y - 4);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    const tw = ctx.measureText(label).width + 8;
    ctx.fillRect(x, ty - 14, tw, 18);
    ctx.fillStyle = color;
    ctx.fillText(label, x + 4, ty);
  });
}

function boxesForEntry(entry, manifestById) {
  let gt = asBoxList(entry.gt_boxes);
  if (!gt.length && Array.isArray(entry.gt)) gt = asBoxList(entry.gt);
  if (!gt.length) {
    const meta = manifestById.get(entry.id) || manifestById.get(entry.file);
    if (meta) gt = asBoxList(meta.boxes);
  }

  let preds = asBoxList(entry.preds);
  if (!preds.length) preds = asBoxList(entry.pred_boxes);
  if (!preds.length && Array.isArray(entry.boxes) && Array.isArray(entry.scores)) {
    preds = asBoxList(
      entry.boxes.map((box, i) =>
        Array.isArray(box) ? { xyxy: box, score: entry.scores[i] } : { ...box, score: entry.scores[i] },
      ),
    );
  }
  return { gt, preds };
}

async function showPrediction(entry, manifestById) {
  els.predStage.hidden = false;
  const img = els.predPhoto;
  const { gt, preds } = boxesForEntry(entry, manifestById);
  img.onload = () => {
    const canvas = els.predCanvas;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Bright overlays so they read on snow / low-contrast photos.
    const gtColor = "#1DBF73";
    const predColor = "#F5A524";
    drawBoxes(ctx, gt, gtColor, "yours ", canvas.width, canvas.height);
    drawBoxes(ctx, preds, predColor, "model ", canvas.width, canvas.height);
    if (!gt.length && !preds.length) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "600 18px Archivo, ui-sans-serif, sans-serif";
      ctx.fillText("No box overlay for this photo (re-train to upload model boxes).", 16, 32);
    }
  };
  // Force reload when switching photos with the same cached handler.
  img.src = "";
  img.src = `/media/${encodeURIComponent(entry.id || entry.image_id)}`;
}

async function openRun(id) {
  const res = await fetch(`/api/runs/${encodeURIComponent(id)}`);
  const data = await res.json();
  if (!res.ok) {
    toast(data.error || "Could not load run");
    return;
  }
  selected = data.run;
  els.detailPanel.hidden = false;
  els.detailTitle.textContent = runTitle(data.run);
  els.detailId.textContent = data.run.id;
  const status = statusLabel(data.run.status);
  if (data.run.error) {
    els.detailStatus.textContent = `${status}. ${data.run.error}`;
  } else if (data.run.status === "queued") {
    els.detailStatus.textContent =
      "Waiting — snapshot is ready. Train it in Colab (set RUN_ID to the id below), then refresh.";
  } else if (data.run.status === "running") {
    els.detailStatus.textContent = "Training in progress. Scores appear when Colab finishes.";
  } else if (data.run.status === "done") {
    els.detailStatus.textContent = "Finished — scores below. Check the trickiest photos next.";
  } else if (data.run.status === "failed") {
    els.detailStatus.textContent = "Failed — you can delete this run and start a fresh one.";
  } else {
    els.detailStatus.textContent = status;
  }
  els.detailScores.innerHTML = scoreCards(data.run);
  els.detailHint.textContent = "";

  const manifestImages = Array.isArray(data.manifest?.images) ? data.manifest.images : [];
  const manifestById = new Map();
  for (const im of manifestImages) {
    if (im.id) manifestById.set(im.id, im);
    if (im.file) manifestById.set(im.file, im);
  }

  const preds = data.preds;
  const entries = Array.isArray(preds)
    ? preds
    : Array.isArray(preds?.images)
      ? preds.images
      : Array.isArray(preds?.per_image)
        ? preds.per_image
        : [];

  const ranked = entries
    .map((e) => ({
      ...e,
      id: e.id || e.image_id || e.file_id,
      score:
        (e.false_negatives ?? e.fn ?? 0) * 3 +
        (e.false_positives ?? e.fp ?? 0) * 2 +
        (1 - (e.best_iou || e.iou || 1)),
    }))
    .sort((a, b) => b.score - a.score);

  els.predFilm.innerHTML = "";
  if (!ranked.length) {
    // Fall back to manifest photos so GT boxes can still be reviewed.
    if (manifestImages.length) {
      for (const im of manifestImages.slice(0, 40)) {
        const entry = { id: im.id, file: im.file, gt: im.boxes, preds: [] };
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "pred-shot";
        btn.innerHTML = `
          <img src="/thumb/${encodeURIComponent(im.id)}" alt="" loading="lazy" />
          <span>${escapeHtml(im.file || im.id)}</span>`;
        btn.addEventListener("click", () => showPrediction(entry, manifestById));
        btn.addEventListener("dblclick", () => {
          location.href = `/?id=${encodeURIComponent(im.id)}`;
        });
        els.predFilm.appendChild(btn);
      }
      showPrediction(
        { id: manifestImages[0].id, file: manifestImages[0].file, gt: manifestImages[0].boxes, preds: [] },
        manifestById,
      );
      renderRuns();
      return;
    }
    els.predFilm.innerHTML =
      data.run.status === "done"
        ? `<p class="empty">No photo comparisons came back with this run.</p>`
        : `<p class="empty">No model results yet. Finish training in Colab, then hit Refresh.</p>`;
    els.predStage.hidden = true;
    renderRuns();
    return;
  }

  for (const entry of ranked.slice(0, 40)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pred-shot";
    const name = entry.file || entry.id || "image";
    btn.innerHTML = `
      <img src="/thumb/${encodeURIComponent(entry.id)}" alt="" loading="lazy" />
      <span>${escapeHtml(name)}</span>`;
    btn.addEventListener("click", () => {
      showPrediction(entry, manifestById);
    });
    btn.addEventListener("dblclick", () => {
      location.href = `/?id=${encodeURIComponent(entry.id)}`;
    });
    els.predFilm.appendChild(btn);
  }
  showPrediction(ranked[0], manifestById);
  renderRuns();
}

els.createBtn.addEventListener("click", createRun);
els.refreshBtn.addEventListener("click", loadRuns);
els.deleteBtn.addEventListener("click", () => {
  if (selected?.id) deleteRun(selected.id);
});
loadRuns();
setInterval(loadRuns, 20000);

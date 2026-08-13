const els = {
  progress: document.getElementById("progress"),
  runList: document.getElementById("runList"),
  createBtn: document.getElementById("createBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  epochs: document.getElementById("epochs"),
  createHint: document.getElementById("createHint"),
  detailPanel: document.getElementById("detailPanel"),
  detailTitle: document.getElementById("detailTitle"),
  detailMetrics: document.getElementById("detailMetrics"),
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

function toast(message) {
  els.toast.hidden = false;
  els.toast.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.hidden = true;
  }, 2800);
}

function fmt(n) {
  return typeof n === "number" ? n.toFixed(3) : "—";
}

function renderRuns() {
  els.runList.innerHTML = "";
  if (!runs.length) {
    els.runList.innerHTML = `<li class="empty">No runs yet. Create one after labels look good.</li>`;
    els.progress.textContent = "No runs";
    return;
  }
  for (const run of runs) {
    const li = document.createElement("li");
    li.className = "run-item";
    if (selected && selected.id === run.id) li.dataset.active = "1";
    li.innerHTML = `
      <button type="button">
        <span class="run-id">${run.id}</span>
        <span class="run-meta">
          <span class="pill ${run.status}">${run.status}</span>
          <span>mAP ${fmt(run.map50)}</span>
          <span>P ${fmt(run.precision)}</span>
          <span>R ${fmt(run.recall)}</span>
        </span>
      </button>`;
    li.querySelector("button").addEventListener("click", () => openRun(run.id));
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
    toast(`Created ${data.run.id}`);
    els.createHint.textContent = `Run ${data.run.id} frozen with ${data.run.images} images. Set RUN_ID in Colab to that value.`;
    await loadRuns();
    await openRun(data.run.id);
  } catch (error) {
    toast(error instanceof Error ? error.message : "Create failed");
    els.createBtn.disabled = false;
  }
}

function semanticColor(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function drawBoxes(ctx, boxes, color, labelPrefix, width, height) {
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.font = "500 13px Archivo, ui-sans-serif, sans-serif";
  (boxes || []).forEach((box, i) => {
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
    const label = `${labelPrefix}${i + 1}${box.score != null ? ` ${(box.score * 100).toFixed(0)}%` : ""}`;
    ctx.fillText(label, x + 4, Math.max(14, y - 4));
  });
}

async function showPrediction(entry) {
  els.predStage.hidden = false;
  const img = els.predPhoto;
  img.onload = () => {
    const canvas = els.predCanvas;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const gt = semanticColor("--nl-success", "#2F6B4F");
    const pred = semanticColor("--nl-warning", "#8A6A1F");
    drawBoxes(ctx, entry.gt || [], gt, "gt", canvas.width, canvas.height);
    drawBoxes(ctx, entry.preds || entry.boxes || [], pred, "p", canvas.width, canvas.height);
  };
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
  els.detailTitle.textContent = data.run.id;
  els.detailMetrics.textContent = `status ${data.run.status} · mAP ${fmt(data.run.map50)} · P ${fmt(data.run.precision)} · R ${fmt(data.run.recall)}`;
  els.detailHint.textContent = data.run.error
    ? data.run.error
    : "Green = ground truth, amber = model. Click a hard case to open it in Skim.";

  const preds = data.preds;
  const entries = Array.isArray(preds)
    ? preds
    : Array.isArray(preds?.images)
      ? preds.images
      : Array.isArray(preds?.per_image)
        ? preds.per_image
        : [];

  // Prefer hard cases: false negatives / low IoU if present, else all.
  const ranked = entries
    .map((e) => ({
      ...e,
      id: e.id || e.image_id || e.file_id,
      score:
        (e.false_negatives || 0) * 3 +
        (e.false_positives || 0) * 2 +
        (1 - (e.best_iou || e.iou || 1)),
    }))
    .sort((a, b) => b.score - a.score);

  els.predFilm.innerHTML = "";
  if (!ranked.length) {
    els.predFilm.innerHTML = `<p class="empty">No predictions uploaded yet. Wait for Colab to finish.</p>`;
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
      <span>${name}</span>`;
    btn.addEventListener("click", () => {
      showPrediction(entry);
    });
    btn.addEventListener("dblclick", () => {
      location.href = `/?id=${encodeURIComponent(entry.id)}`;
    });
    els.predFilm.appendChild(btn);
  }
  showPrediction(ranked[0]);
  renderRuns();
}

els.createBtn.addEventListener("click", createRun);
els.refreshBtn.addEventListener("click", loadRuns);
loadRuns();
setInterval(loadRuns, 20000);

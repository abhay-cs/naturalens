const CONCURRENCY = 3;

const els = {
  drop: document.getElementById("drop"),
  fileInput: document.getElementById("fileInput"),
  pickBtn: document.getElementById("pickBtn"),
  queue: document.getElementById("queue"),
  queueStats: document.getElementById("queueStats"),
  progress: document.getElementById("progress"),
  toast: document.getElementById("toast"),
  quota: document.getElementById("quota"),
};

const queue = [];
let active = 0;
let toastTimer = null;
let quotaBlocked = false;

function toast(message) {
  els.toast.hidden = false;
  els.toast.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.hidden = true;
  }, 2800);
}

function applyQuota(quota) {
  if (!quota) return;
  if (window.NaturaQuota) window.NaturaQuota.renderQuota(els.quota, quota);
  quotaBlocked = Boolean(quota.blocked?.any);
  els.pickBtn.disabled = quotaBlocked;
  els.drop.style.opacity = quotaBlocked ? "0.55" : "1";
  if (quotaBlocked) {
    els.progress.textContent = "R2 cap reached — uploads paused";
  }
}

function hex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(blob) {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return hex(digest);
}

function canvasToBlob(canvas, quality = 0.88) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      quality,
    );
  });
}

async function resizeBitmap(bitmap, maxEdge) {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return { canvas, width: w, height: h };
}

async function prepare(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const full = await resizeBitmap(bitmap, 8192);
    const display = await resizeBitmap(bitmap, 2048);
    const thumb = await resizeBitmap(bitmap, 400);
    const imageBlob = await canvasToBlob(full.canvas, 0.92);
    const displayBlob = await canvasToBlob(display.canvas, 0.88);
    const thumbBlob = await canvasToBlob(thumb.canvas, 0.82);
    const id = await sha256(imageBlob);
    return {
      id,
      file: file.name,
      width: full.width,
      height: full.height,
      imageBlob,
      displayBlob,
      thumbBlob,
      original: file,
    };
  } finally {
    bitmap.close();
  }
}

function renderQueue() {
  els.queue.innerHTML = "";
  for (const item of queue) {
    const li = document.createElement("li");
    li.className = `q-item ${item.status}`;
    li.innerHTML = `
      <span class="q-name">${item.file.name}</span>
      <span class="q-status">${item.message || item.status}</span>`;
    els.queue.appendChild(li);
  }
  const waiting = queue.filter((q) => q.status === "queued" || q.status === "uploading").length;
  const done = queue.filter((q) => q.status === "done").length;
  const failed = queue.filter((q) => q.status === "failed").length;
  els.queueStats.textContent = `${waiting} in flight · ${done} done · ${failed} failed`;
  if (!quotaBlocked) {
    els.progress.textContent = waiting ? `Uploading ${done + 1} / ${queue.length}` : `${done} uploaded`;
  }
}

async function uploadOne(item) {
  if (quotaBlocked) {
    item.status = "failed";
    item.message = "R2 cap reached";
    renderQueue();
    return;
  }
  item.status = "uploading";
  item.message = "Preparing";
  renderQueue();
  try {
    const prepared = await prepare(item.file);
    item.message = "Uploading";
    renderQueue();
    const form = new FormData();
    form.set("id", prepared.id);
    form.set("file", prepared.file);
    form.set("width", String(prepared.width));
    form.set("height", String(prepared.height));
    form.set("split", "train");
    form.set("image", prepared.imageBlob, `${prepared.id}.jpg`);
    form.set("display", prepared.displayBlob, `${prepared.id}-display.jpg`);
    form.set("thumb", prepared.thumbBlob, `${prepared.id}-thumb.jpg`);
    form.set("original", prepared.original, prepared.file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    if (data.quota) applyQuota(data.quota);
    if (res.status === 429) {
      quotaBlocked = true;
      throw new Error(data.error || "R2 quota exceeded");
    }
    if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
    item.status = "done";
    item.message = data.deduped ? "Already present" : "Uploaded";
    item.id = prepared.id;
  } catch (error) {
    item.retries = (item.retries || 0) + 1;
    item.message = error instanceof Error ? error.message : "Failed";
    if (/quota|cap reached/i.test(item.message)) {
      item.status = "failed";
    } else if (item.retries < 3) {
      item.status = "queued";
      item.message = `Retry ${item.retries}/3 — ${item.message}`;
    } else {
      item.status = "failed";
    }
  }
  renderQueue();
}

async function pump() {
  while (active < CONCURRENCY) {
    const next = queue.find((q) => q.status === "queued");
    if (!next) break;
    active += 1;
    next.status = "uploading";
    uploadOne(next).finally(() => {
      active -= 1;
      pump();
    });
  }
}

function enqueue(files) {
  if (quotaBlocked) {
    toast("R2 cap reached — uploads paused to stay on free tier");
    return;
  }
  for (const file of files) {
    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp)$/i.test(file.name)) continue;
    queue.push({ file, status: "queued", message: "Waiting", retries: 0 });
  }
  renderQueue();
  pump();
}

els.pickBtn.addEventListener("click", () => els.fileInput.click());
els.fileInput.addEventListener("change", () => {
  enqueue([...els.fileInput.files]);
  els.fileInput.value = "";
});

["dragenter", "dragover"].forEach((name) => {
  els.drop.addEventListener(name, (event) => {
    event.preventDefault();
    els.drop.dataset.active = "1";
  });
});
["dragleave", "drop"].forEach((name) => {
  els.drop.addEventListener(name, (event) => {
    event.preventDefault();
    els.drop.dataset.active = "0";
  });
});
els.drop.addEventListener("drop", (event) => {
  enqueue([...event.dataTransfer.files]);
  if (!quotaBlocked) toast("Added to upload queue");
});

if (window.NaturaQuota) {
  window.NaturaQuota.loadQuota(els.quota).then((q) => applyQuota(q));
}

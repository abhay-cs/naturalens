const HANDLE = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const RETRY_KEY = "naturalens.labeler.retryQueue";

const state = {
  images: [],
  index: 0,
  boxes: [],
  selected: new Set(),
  drawing: false,
  dirty: false,
  undo: [],
  nid: 1,
  world: { scale: 1, x: 0, y: 0 },
  drag: null,
  saveTimer: null,
};

const els = {
  film: document.getElementById("film"),
  photo: document.getElementById("photo"),
  boxes: document.getElementById("boxes"),
  draft: document.getElementById("draft"),
  world: document.getElementById("world"),
  stage: document.getElementById("stage"),
  progress: document.getElementById("progress"),
  saveState: document.getElementById("saveState"),
  fileName: document.getElementById("fileName"),
  inspectTitle: document.getElementById("inspectTitle"),
  flagHint: document.getElementById("flagHint"),
  bearList: document.getElementById("bearList"),
  emptyStage: document.getElementById("emptyStage"),
  needsWork: document.getElementById("needsWork"),
  drawBtn: document.getElementById("drawBtn"),
  mergeBtn: document.getElementById("mergeBtn"),
  deleteBtn: document.getElementById("deleteBtn"),
  doneBtn: document.getElementById("doneBtn"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  toast: document.getElementById("toast"),
};

let toastTimer = null;
function toast(message) {
  if (!els.toast) return;
  els.toast.hidden = false;
  els.toast.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.hidden = true;
  }, 2800);
}

function current() {
  return state.images[state.index] || null;
}

function cloneBoxes() {
  return state.boxes.map((b) => ({ ...b }));
}

function pushUndo() {
  state.undo.push(cloneBoxes());
  if (state.undo.length > 40) state.undo.shift();
}

function markDirty() {
  state.dirty = true;
  els.saveState.dataset.state = "dirty";
  els.saveState.textContent = "Unsaved";
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(save, 450);
}

function setSave(kind, text) {
  els.saveState.dataset.state = kind;
  els.saveState.textContent = text;
}

function nextId() {
  const max = state.boxes.reduce((m, b) => Math.max(m, b.id || 0), 0);
  state.nid = max + 1;
  return state.nid++;
}

function flagsOf(boxes) {
  const split = boxes.some((a, i) => boxes.slice(i + 1).some((b) => looksSplit(a, b)));
  const flags = [];
  if (split) flags.push("split");
  if (!boxes.length) flags.push("empty");
  return flags;
}

function looksSplit(a, b) {
  if (Math.max(a.h, b.h) <= 0) return false;
  if (Math.abs(a.h - b.h) / Math.max(a.h, b.h) > 0.5) return false;
  if (Math.abs(a.cy - b.cy) > 0.45 * Math.max(a.h, b.h)) return false;
  const a1 = a.cx - a.w / 2;
  const a2 = a.cx + a.w / 2;
  const b1 = b.cx - b.w / 2;
  const b2 = b.cx + b.w / 2;
  const overlap = Math.min(a2, b2) - Math.max(a1, b1);
  const gap = Math.max(0, -overlap);
  if (gap > 0.35 * Math.min(a.w, b.w)) return false;
  const unionW = Math.max(a2, b2) - Math.min(a1, b1);
  return unionW > 1.25 * Math.max(a.w, b.w);
}

function loadRetryQueue() {
  try {
    return JSON.parse(localStorage.getItem(RETRY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRetryQueue(queue) {
  localStorage.setItem(RETRY_KEY, JSON.stringify(queue.slice(-40)));
}

function enqueueRetry(payload) {
  const queue = loadRetryQueue().filter((item) => item.id !== payload.id);
  queue.push({ ...payload, at: Date.now() });
  saveRetryQueue(queue);
}

async function flushRetryQueue() {
  const queue = loadRetryQueue();
  if (!queue.length) return;
  const remain = [];
  for (const item of queue) {
    try {
      const res = await fetch(`/api/labels/${encodeURIComponent(item.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.body),
      });
      if (res.status === 409) {
        const data = await res.json();
        const img = state.images.find((i) => i.id === item.id);
        if (img && data.current) {
          img.version = data.current.version;
          img.boxes = data.current.boxes;
          img.reviewed = data.current.reviewed;
        }
        continue;
      }
      if (!res.ok) {
        remain.push(item);
        continue;
      }
      const data = await res.json();
      const img = state.images.find((i) => i.id === item.id);
      if (img) {
        img.version = data.version;
        img.boxes = data.boxes;
        img.reviewed = data.reviewed;
        img.flags = data.flags || flagsOf(data.boxes || []);
      }
    } catch {
      remain.push(item);
    }
  }
  saveRetryQueue(remain);
  if (remain.length) setSave("dirty", "Unsaved (retrying)");
}

function orderedImages() {
  const list = state.images.map((img, index) => ({ img, index }));
  if (!els.needsWork.checked) return list;
  const rank = (img) => {
    if (img.reviewed) return 2;
    if ((img.flags || []).includes("split") || (img.flags || []).includes("empty")) return 0;
    return 1;
  };
  return list.sort((a, b) => rank(a.img) - rank(b.img) || a.index - b.index);
}

function renderFilm() {
  const cur = current();
  els.film.innerHTML = "";
  for (const { img, index } of orderedImages()) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "shot";
    if (img.reviewed) btn.classList.add("reviewed");
    if ((img.flags || []).includes("split")) btn.classList.add("split");
    if (cur && img.id === cur.id) btn.setAttribute("aria-current", "true");
    btn.innerHTML = `
      <img src="/thumb/${encodeURIComponent(img.id)}" alt="" loading="lazy" />
      <span class="meta">
        <span class="name">${img.file}</span>
        <span class="count">${img.boxes.length} bear${img.boxes.length === 1 ? "" : "s"}</span>
      </span>`;
    btn.addEventListener("click", () => go(index));
    els.film.appendChild(btn);
  }
  const reviewed = state.images.filter((i) => i.reviewed).length;
  const splits = state.images.filter((i) => (i.flags || []).includes("split")).length;
  els.progress.textContent = `${reviewed} / ${state.images.length} reviewed · ${splits} look split`;
}

function fitWorld() {
  const img = els.photo;
  if (!img.naturalWidth) return;
  const stage = els.stage.getBoundingClientRect();
  const pad = 28;
  const scale = Math.min(
    (stage.width - pad) / img.naturalWidth,
    (stage.height - pad) / img.naturalHeight,
  );
  state.world.scale = Math.max(0.05, scale);
  state.world.x = (stage.width - img.naturalWidth * state.world.scale) / 2;
  state.world.y = (stage.height - img.naturalHeight * state.world.scale) / 2;
  applyWorld();
}

function applyWorld() {
  const scale = Math.max(state.world.scale || 1, 0.01);
  els.world.style.transform = `translate(${state.world.x}px, ${state.world.y}px) scale(${scale})`;
  els.world.style.width = `${els.photo.naturalWidth}px`;
  els.world.style.height = `${els.photo.naturalHeight}px`;
  // Keep box stroke/handles/tags at ~constant screen size while the world zooms.
  els.world.style.setProperty("--world-inv", String(1 / scale));
}

function renderBoxes() {
  els.boxes.innerHTML = "";
  state.boxes.forEach((box, i) => {
    const el = document.createElement("div");
    el.className = "box";
    if (state.selected.has(box.id)) el.classList.add("selected");
    el.style.left = `${(box.cx - box.w / 2) * 100}%`;
    el.style.top = `${(box.cy - box.h / 2) * 100}%`;
    el.style.width = `${box.w * 100}%`;
    el.style.height = `${box.h * 100}%`;
    el.dataset.id = String(box.id);
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = String(i + 1);
    el.appendChild(tag);
    for (const h of HANDLE) {
      const handle = document.createElement("div");
      handle.className = `handle ${h}`;
      handle.dataset.handle = h;
      el.appendChild(handle);
    }
    el.addEventListener("pointerdown", onBoxPointer);
    els.boxes.appendChild(el);
  });
  renderInspect();
}

function renderInspect() {
  const img = current();
  const n = state.boxes.length;
  els.inspectTitle.textContent = n === 1 ? "1 bear" : `${n} bears`;
  const flags = flagsOf(state.boxes);
  if (flags.includes("split") && n === 2) {
    els.flagHint.textContent = "Looks like two halves of one bear. Hit Merge.";
  } else if (flags.includes("split")) {
    els.flagHint.textContent = "Some boxes overlap. Delete extras or merge the wrong pair.";
  } else if (!n) {
    els.flagHint.textContent = "No box yet. Press A and drag around the bear.";
  } else {
    els.flagHint.textContent = "";
  }
  els.bearList.innerHTML = "";
  state.boxes.forEach((box, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML = `<span>Bear ${i + 1}</span><span>${Math.round(box.w * 100)}×${Math.round(box.h * 100)}</span>`;
    if (state.selected.has(box.id)) btn.setAttribute("aria-current", "true");
    btn.addEventListener("click", (event) => {
      if (event.shiftKey || event.metaKey) {
        if (state.selected.has(box.id)) state.selected.delete(box.id);
        else state.selected.add(box.id);
      } else {
        state.selected = new Set([box.id]);
      }
      renderBoxes();
    });
    li.appendChild(btn);
    els.bearList.appendChild(li);
  });
  if (img) els.fileName.textContent = img.file;
}

async function go(index, { skipSave } = {}) {
  if (!skipSave && state.dirty) await save();
  state.index = Math.max(0, Math.min(state.images.length - 1, index));
  const img = current();
  if (!img) return;
  state.boxes = img.boxes.map((b, i) => ({ ...b, id: b.id || i + 1 }));
  state.selected = new Set();
  state.undo = [];
  state.drawing = false;
  els.stage.classList.remove("drawing");
  els.photo.src = `/media/${encodeURIComponent(img.id)}`;
  renderFilm();
  renderBoxes();
}

function onPhotoLoad() {
  fitWorld();
}

function stageToNorm(clientX, clientY) {
  const rect = els.photo.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / rect.width,
    y: (clientY - rect.top) / rect.height,
  };
}

function onBoxPointer(event) {
  if (state.drawing) return;
  event.preventDefault();
  event.stopPropagation();
  const node = event.currentTarget;
  const id = Number(node.dataset.id);
  const handle = event.target.dataset.handle || "move";
  if (event.shiftKey || event.metaKey) {
    if (state.selected.has(id)) state.selected.delete(id);
    else state.selected.add(id);
  } else {
    state.selected = new Set([id]);
  }
  for (const el of els.boxes.children) {
    el.classList.toggle("selected", state.selected.has(Number(el.dataset.id)));
  }
  renderInspect();
  const box = state.boxes.find((b) => b.id === id);
  if (!box) return;
  pushUndo();
  node.setPointerCapture(event.pointerId);
  state.drag = {
    kind: handle,
    id,
    start: stageToNorm(event.clientX, event.clientY),
    origin: { ...box },
  };
}

function applyHandle(box, origin, dx, dy, kind) {
  let x1 = origin.cx - origin.w / 2;
  let y1 = origin.cy - origin.h / 2;
  let x2 = origin.cx + origin.w / 2;
  let y2 = origin.cy + origin.h / 2;
  if (kind === "move") {
    box.cx = clamp(origin.cx + dx, origin.w / 2, 1 - origin.w / 2);
    box.cy = clamp(origin.cy + dy, origin.h / 2, 1 - origin.h / 2);
    return;
  }
  if (kind.includes("w")) x1 = origin.cx - origin.w / 2 + dx;
  if (kind.includes("e")) x2 = origin.cx + origin.w / 2 + dx;
  if (kind.includes("n")) y1 = origin.cy - origin.h / 2 + dy;
  if (kind.includes("s")) y2 = origin.cy + origin.h / 2 + dy;
  x1 = clamp(x1, 0, 0.997);
  y1 = clamp(y1, 0, 0.997);
  x2 = clamp(x2, x1 + 0.003, 1);
  y2 = clamp(y2, y1 + 0.003, 1);
  box.w = x2 - x1;
  box.h = y2 - y1;
  box.cx = (x1 + x2) / 2;
  box.cy = (y1 + y2) / 2;
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function onPointerMove(event) {
  if (state.drag) {
    const now = stageToNorm(event.clientX, event.clientY);
    const dx = now.x - state.drag.start.x;
    const dy = now.y - state.drag.start.y;
    const box = state.boxes.find((b) => b.id === state.drag.id);
    if (box) {
      applyHandle(box, state.drag.origin, dx, dy, state.drag.kind);
      renderBoxes();
      markDirty();
    }
    return;
  }
  if (state.drawing && state.drawStart) {
    const now = stageToNorm(event.clientX, event.clientY);
    const x1 = clamp(Math.min(state.drawStart.x, now.x), 0, 1);
    const y1 = clamp(Math.min(state.drawStart.y, now.y), 0, 1);
    const x2 = clamp(Math.max(state.drawStart.x, now.x), 0, 1);
    const y2 = clamp(Math.max(state.drawStart.y, now.y), 0, 1);
    els.draft.hidden = false;
    els.draft.style.left = `${x1 * 100}%`;
    els.draft.style.top = `${y1 * 100}%`;
    els.draft.style.width = `${(x2 - x1) * 100}%`;
    els.draft.style.height = `${(y2 - y1) * 100}%`;
  }
}

function onPointerUp(event) {
  if (state.drag) {
    state.drag = null;
    return;
  }
  if (state.drawing && state.drawStart) {
    const now = stageToNorm(event.clientX, event.clientY);
    const x1 = clamp(Math.min(state.drawStart.x, now.x), 0, 1);
    const y1 = clamp(Math.min(state.drawStart.y, now.y), 0, 1);
    const x2 = clamp(Math.max(state.drawStart.x, now.x), 0, 1);
    const y2 = clamp(Math.max(state.drawStart.y, now.y), 0, 1);
    els.draft.hidden = true;
    state.drawStart = null;
    if (x2 - x1 > 0.004 && y2 - y1 > 0.004) {
      pushUndo();
      const box = {
        id: nextId(),
        cls: 0,
        cx: (x1 + x2) / 2,
        cy: (y1 + y2) / 2,
        w: x2 - x1,
        h: y2 - y1,
      };
      state.boxes.push(box);
      state.selected = new Set([box.id]);
      renderBoxes();
      markDirty();
    }
    state.drawing = false;
    els.stage.classList.remove("drawing");
  }
}

function onStagePointerDown(event) {
  if (event.target.closest(".box")) return;
  if (event.button !== 0) return;
  if (state.drawing || event.altKey || els.drawBtn.dataset.active === "1") {
    state.drawing = true;
    els.stage.classList.add("drawing");
    state.drawStart = stageToNorm(event.clientX, event.clientY);
    event.preventDefault();
    return;
  }
  state.pan = {
    x: event.clientX - state.world.x,
    y: event.clientY - state.world.y,
  };
}

function onStagePointerMove(event) {
  if (state.pan && !state.drawing && !state.drag) {
    state.world.x = event.clientX - state.pan.x;
    state.world.y = event.clientY - state.pan.y;
    applyWorld();
  }
}

function onStagePointerUp() {
  state.pan = null;
}

function onWheel(event) {
  event.preventDefault();
  const rect = els.stage.getBoundingClientRect();
  const mx = event.clientX - rect.left;
  const my = event.clientY - rect.top;
  const before = state.world.scale;
  const next = clamp(before * (event.deltaY > 0 ? 0.9 : 1.1), 0.05, 8);
  const imgX = (mx - state.world.x) / before;
  const imgY = (my - state.world.y) / before;
  state.world.scale = next;
  state.world.x = mx - imgX * next;
  state.world.y = my - imgY * next;
  applyWorld();
}

function mergeSelected() {
  let group;
  if (state.selected.size >= 2) {
    group = state.boxes.filter((b) => state.selected.has(b.id));
  } else if (state.boxes.length === 2) {
    group = state.boxes.slice();
  } else {
    toast("Select two boxes first (Shift-click), then Merge.");
    return;
  }
  if (group.length < 2) {
    toast("Select two boxes first (Shift-click), then Merge.");
    return;
  }
  pushUndo();
  const x1 = Math.min(...group.map((b) => b.cx - b.w / 2));
  const y1 = Math.min(...group.map((b) => b.cy - b.h / 2));
  const x2 = Math.max(...group.map((b) => b.cx + b.w / 2));
  const y2 = Math.max(...group.map((b) => b.cy + b.h / 2));
  const keep = {
    id: group[0].id,
    cls: 0,
    cx: (x1 + x2) / 2,
    cy: (y1 + y2) / 2,
    w: x2 - x1,
    h: y2 - y1,
  };
  const drop = new Set(group.map((b) => b.id));
  state.boxes = [keep, ...state.boxes.filter((b) => !drop.has(b.id))];
  state.selected = new Set([keep.id]);
  renderBoxes();
  markDirty();
  toast("Merged into one box.");
}

function deleteSelected() {
  if (!state.selected.size) return;
  pushUndo();
  state.boxes = state.boxes.filter((b) => !state.selected.has(b.id));
  state.selected = new Set();
  renderBoxes();
  markDirty();
}

function undo() {
  const prev = state.undo.pop();
  if (!prev) return;
  state.boxes = prev;
  state.selected = new Set();
  renderBoxes();
  markDirty();
}

function toggleDraw() {
  state.drawing = !state.drawing;
  els.stage.classList.toggle("drawing", state.drawing);
  els.drawBtn.dataset.active = state.drawing ? "1" : "0";
}

async function save(extra = {}) {
  const img = current();
  if (!img) return;
  clearTimeout(state.saveTimer);
  setSave("saving", "Saving");
  img.boxes = cloneBoxes();
  img.flags = flagsOf(img.boxes);
  const body = {
    version: img.version ?? 0,
    boxes: img.boxes,
    ...extra,
  };
  if (extra.reviewed != null) img.reviewed = extra.reviewed;
  try {
    const res = await fetch(`/api/labels/${encodeURIComponent(img.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 409) {
      const data = await res.json();
      toast("Someone else saved this photo. Reloaded.");
      if (data.current) {
        img.version = data.current.version;
        img.boxes = data.current.boxes;
        img.reviewed = data.current.reviewed;
        img.flags = flagsOf(img.boxes);
        state.boxes = img.boxes.map((b, i) => ({ ...b, id: b.id || i + 1 }));
        renderBoxes();
        renderFilm();
      }
      state.dirty = false;
      setSave("idle", "Reloaded");
      return;
    }
    if (!res.ok) {
      enqueueRetry({ id: img.id, body });
      setSave("dirty", "Unsaved (retrying)");
      return;
    }
    const data = await res.json();
    img.version = data.version;
    img.boxes = data.boxes;
    img.reviewed = data.reviewed;
    img.flags = data.flags || flagsOf(data.boxes || []);
    state.dirty = false;
    setSave("idle", "Saved");
    renderFilm();
  } catch {
    enqueueRetry({ id: img.id, body });
    setSave("dirty", "Unsaved (retrying)");
  }
}

async function looksRight() {
  await save({ reviewed: true });
  const next = state.images.findIndex((img, i) => i > state.index && !img.reviewed);
  const fallback = state.images.findIndex((img) => !img.reviewed);
  if (next >= 0) go(next, { skipSave: true });
  else if (fallback >= 0) go(fallback, { skipSave: true });
  else go(Math.min(state.index + 1, state.images.length - 1), { skipSave: true });
}

function nextUnchecked() {
  const next = state.images.findIndex((img, i) => i > state.index && !img.reviewed);
  const fallback = state.images.findIndex((img) => !img.reviewed);
  go(next >= 0 ? next : fallback >= 0 ? fallback : state.index);
}

function onKey(event) {
  if (event.target.matches("input, textarea")) return;
  const key = event.key.toLowerCase();
  if (key === "arrowleft") {
    event.preventDefault();
    go(state.index - 1);
  } else if (key === "arrowright") {
    event.preventDefault();
    go(state.index + 1);
  } else if (key === " " || key === "enter") {
    event.preventDefault();
    looksRight();
  } else if (key === "a") {
    event.preventDefault();
    toggleDraw();
  } else if (key === "m") {
    event.preventDefault();
    mergeSelected();
  } else if (key === "backspace" || key === "delete") {
    event.preventDefault();
    deleteSelected();
  } else if (key === "z") {
    event.preventDefault();
    undo();
  } else if (key === "n") {
    event.preventDefault();
    nextUnchecked();
  } else if (key === "s" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    save();
  } else if (key === "0") {
    fitWorld();
  } else if (key === "escape") {
    state.drawing = false;
    els.stage.classList.remove("drawing");
    state.selected = new Set();
    renderBoxes();
  }
}

async function boot() {
  await flushRetryQueue();
  if (window.NaturaQuota) window.NaturaQuota.loadQuota(document.getElementById("quota"));
  const focusId = new URLSearchParams(location.search).get("id");
  const res = await fetch("/api/dataset");
  const data = await res.json();
  if (data.quota && window.NaturaQuota) {
    window.NaturaQuota.renderQuota(document.getElementById("quota"), data.quota);
  }
  state.images = data.images || [];
  if (!state.images.length) {
    els.emptyStage.hidden = false;
    els.progress.textContent = "No photos found";
    return;
  }
  let start = 0;
  if (focusId) {
    const idx = state.images.findIndex((img) => img.id === focusId || img.file === focusId);
    if (idx >= 0) start = idx;
  } else {
    const first = state.images.findIndex(
      (img) => !img.reviewed && ((img.flags || []).includes("split") || !img.boxes.length),
    );
    const unchecked = state.images.findIndex((img) => !img.reviewed);
    start = first >= 0 ? first : unchecked >= 0 ? unchecked : 0;
  }
  await go(start, { skipSave: true });
}

els.photo.addEventListener("load", onPhotoLoad);
els.stage.addEventListener("pointerdown", onStagePointerDown);
window.addEventListener("pointermove", (e) => {
  onPointerMove(e);
  onStagePointerMove(e);
});
window.addEventListener("pointerup", (e) => {
  onPointerUp(e);
  onStagePointerUp();
});
els.stage.addEventListener("wheel", onWheel, { passive: false });
els.needsWork.addEventListener("change", renderFilm);
els.prevBtn.addEventListener("click", () => go(state.index - 1));
els.nextBtn.addEventListener("click", () => go(state.index + 1));
els.drawBtn.addEventListener("click", toggleDraw);
els.mergeBtn.addEventListener("click", mergeSelected);
els.deleteBtn.addEventListener("click", deleteSelected);
els.doneBtn.addEventListener("click", looksRight);
window.addEventListener("keydown", onKey);
window.addEventListener("resize", fitWorld);
window.addEventListener("beforeunload", (e) => {
  if (state.dirty) e.preventDefault();
});
window.addEventListener("online", flushRetryQueue);
setInterval(flushRetryQueue, 15000);

boot();

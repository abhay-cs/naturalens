export type Box = {
  id?: number;
  cls: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
};

function boxIou(a: Box, b: Box): number {
  const ax1 = a.cx - a.w / 2;
  const ay1 = a.cy - a.h / 2;
  const ax2 = a.cx + a.w / 2;
  const ay2 = a.cy + a.h / 2;
  const bx1 = b.cx - b.w / 2;
  const by1 = b.cy - b.h / 2;
  const bx2 = b.cx + b.w / 2;
  const by2 = b.cy + b.h / 2;
  const ix1 = Math.max(ax1, bx1);
  const iy1 = Math.max(ay1, by1);
  const ix2 = Math.min(ax2, bx2);
  const iy2 = Math.min(ay2, by2);
  const inter = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
  const union = a.w * a.h + b.w * b.h - inter;
  return union > 0 ? inter / union : 0;
}

function isSplitPair(a: Box, b: Box): boolean {
  if (Math.max(a.h, b.h) <= 0 || Math.max(a.w, b.w) <= 0) return false;
  if (Math.abs(a.h - b.h) / Math.max(a.h, b.h) > 0.5) return false;
  if (Math.abs(a.cy - b.cy) > 0.45 * Math.max(a.h, b.h)) return false;
  const a1 = a.cx - a.w / 2;
  const a2 = a.cx + a.w / 2;
  const b1 = b.cx - b.w / 2;
  const b2 = b.cx + b.w / 2;
  const overlap = Math.min(a2, b2) - Math.max(a1, b1);
  const gap = Math.max(0, -overlap);
  if (gap > 0.35 * Math.min(a.w, b.w)) return false;
  const iou = boxIou(a, b);
  if (iou > 0.55) return true;
  const unionW = Math.max(a2, b2) - Math.min(a1, b1);
  return unionW > 1.25 * Math.max(a.w, b.w);
}

export function flagsFor(boxes: Box[]): string[] {
  const flags: string[] = [];
  if (boxes.length >= 2) {
    outer: for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        if (isSplitPair(boxes[i], boxes[j])) {
          flags.push("split");
          break outer;
        }
      }
    }
  }
  if (!boxes.length) flags.push("empty");
  return flags;
}

export function sanitizeBoxes(raw: unknown): Box[] | null {
  if (!Array.isArray(raw)) return null;
  const boxes: Box[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") return null;
    const rec = item as Record<string, unknown>;
    const cls = Number(rec.cls ?? 0);
    const cx = Number(rec.cx);
    const cy = Number(rec.cy);
    const w = Number(rec.w);
    const h = Number(rec.h);
    if (![cls, cx, cy, w, h].every((n) => Number.isFinite(n))) return null;
    if (w <= 0 || h <= 0) return null;
    if (cx < 0 || cy < 0 || cx > 1 || cy > 1) return null;
    boxes.push({
      id: typeof rec.id === "number" ? rec.id : i + 1,
      cls: Math.max(0, Math.floor(cls)),
      cx,
      cy,
      w,
      h,
    });
  }
  return boxes;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function runId(): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const rand = crypto.randomUUID().slice(0, 8);
  return `${stamp}-${rand}`;
}

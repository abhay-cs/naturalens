function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function renderQuota(el, quota) {
  if (!el || !quota) return;
  const blocked = quota.blocked?.any;
  el.dataset.blocked = blocked ? "1" : "0";
  el.title = [
    `Storage ${formatBytes(quota.storage_bytes)} / ${formatBytes(quota.caps.storage_bytes)} (free tier ${formatBytes(quota.free_tier.storage_bytes)})`,
    `Class A ${formatCount(quota.class_a)} / ${formatCount(quota.caps.class_a)} this month`,
    `Class B ${formatCount(quota.class_b)} / ${formatCount(quota.caps.class_b)} this month`,
  ].join("\n");
  el.innerHTML = blocked
    ? `<span class="q-warn">R2 cap reached — uploads & training paused</span>`
    : `<span>R2 ${formatBytes(quota.storage_bytes)} / ${formatBytes(quota.caps.storage_bytes)}</span>
       <span>A ${formatCount(quota.class_a)}/${formatCount(quota.caps.class_a)}</span>
       <span>B ${formatCount(quota.class_b)}/${formatCount(quota.caps.class_b)}</span>`;
}

async function loadQuota(el) {
  try {
    const res = await fetch("/api/quota");
    if (!res.ok) return null;
    const quota = await res.json();
    renderQuota(el, quota);
    return quota;
  } catch {
    return null;
  }
}

window.NaturaQuota = { formatBytes, formatCount, renderQuota, loadQuota };

const els = {
  progress: document.getElementById("progress"),
  hint: document.getElementById("hint"),
  tbody: document.getElementById("tbody"),
  empty: document.getElementById("empty"),
  copyBtn: document.getElementById("copyBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  toast: document.getElementById("toast"),
};

let signups = [];
let toastTimer = null;

function toast(message) {
  els.toast.hidden = false;
  els.toast.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.hidden = true;
  }, 2800);
}

function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value.includes("T") ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function render() {
  els.tbody.replaceChildren();
  const hasRows = signups.length > 0;
  els.empty.hidden = hasRows;
  els.copyBtn.disabled = !hasRows;

  for (const row of signups) {
    const tr = document.createElement("tr");
    const emailTd = document.createElement("td");
    emailTd.className = "waitlist-email";
    emailTd.textContent = row.email || "";
    const joinedTd = document.createElement("td");
    joinedTd.className = "waitlist-joined";
    joinedTd.textContent = formatWhen(row.created_at);
    tr.append(emailTd, joinedTd);
    els.tbody.append(tr);
  }
}

async function load() {
  els.progress.textContent = "Loading signups…";
  try {
    const res = await fetch("/api/waitlist", { credentials: "same-origin" });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Could not load waitlist.");
    }
    signups = Array.isArray(data.signups) ? data.signups : [];
    const count = typeof data.count === "number" ? data.count : signups.length;
    els.progress.textContent = `${count} signup${count === 1 ? "" : "s"}`;
    els.hint.textContent =
      count === 0
        ? "Emails from the Naturalens.ca waitlist."
        : `${count} email${count === 1 ? "" : "s"} from the Naturalens.ca waitlist.`;
    render();
  } catch (error) {
    signups = [];
    render();
    const message = error instanceof Error ? error.message : "Could not load waitlist.";
    els.progress.textContent = "Could not load";
    els.hint.textContent = message;
    toast(message);
  }
}

async function copyEmails() {
  const emails = signups.map((row) => row.email).filter(Boolean);
  if (!emails.length) return;
  try {
    await navigator.clipboard.writeText(emails.join("\n"));
    toast("Copied emails.");
  } catch {
    toast("Could not copy.");
  }
}

els.refreshBtn.addEventListener("click", () => {
  load();
});
els.copyBtn.addEventListener("click", () => {
  copyEmails();
});

load();

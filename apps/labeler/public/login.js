(function () {
  const form = document.getElementById("loginForm");
  const errorEl = document.getElementById("error");
  const submitBtn = document.getElementById("submitBtn");
  const params = new URLSearchParams(location.search);
  const next = safeNext(params.get("next"));

  function safeNext(raw) {
    if (!raw || raw.charAt(0) !== "/" || raw.startsWith("//")) return "/";
    if (raw.includes("\\") || raw.includes("://") || /\s/.test(raw)) return "/";
    return raw;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    errorEl.textContent = "";
    submitBtn.disabled = true;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: document.getElementById("email").value.trim(),
          pin: document.getElementById("pin").value.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        errorEl.textContent = data.error || "Could not sign in.";
        errorEl.hidden = false;
        submitBtn.disabled = false;
        return;
      }
      location.replace(next);
    } catch {
      errorEl.textContent = "Network error. Try again.";
      errorEl.hidden = false;
      submitBtn.disabled = false;
    }
  });
})();

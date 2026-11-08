(function(root) {
  "use strict";
  const ENDPOINT = "/api/stratos-ai";
  const ACCESS_KEY = "stratos-ai-access-code";
  async function analyze(model, task, run, allowPrompt = true) {
    const headers = { "content-type": "application/json" };
    try {
      const code = localStorage.getItem(ACCESS_KEY);
      if (code) headers["x-stratos-access-code"] = code;
    } catch (_) {}
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, task, run: run || null })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && allowPrompt) {
        const entered = window.prompt("Enter the STRATOS AI access code configured by the site owner:");
        if (entered) {
          try { localStorage.setItem(ACCESS_KEY, entered); } catch (_) {}
          return analyze(model, task, run, false);
        }
      }
      throw new Error(data.error || "AI request failed (" + response.status + ").");
    }
    return data.analysis;
  }
  root.STRATOSAI = Object.freeze({ analyze });
})(window);

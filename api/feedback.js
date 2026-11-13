module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST to submit feedback." });
  }

  const rating = typeof req.body?.rating === "string" ? req.body.rating : "";
  const issue = typeof req.body?.issue === "string" ? req.body.issue : "none";
  const comment = typeof req.body?.comment === "string" ? req.body.comment.trim().slice(0, 1500) : "";
  const moduleName = req.body?.module === "research" ? "research" : "scenario";
  const mode = typeof req.body?.mode === "string" ? req.body.mode.slice(0, 40) : "unknown";
  const rawDiagnostics = req.body?.diagnostics && typeof req.body.diagnostics === "object" ? req.body.diagnostics : null;
  const diagnostics = rawDiagnostics ? {
    status: rawDiagnostics.status === "success" ? "success" : rawDiagnostics.status === "failed" ? "failed" : "unknown",
    provider: typeof rawDiagnostics.provider === "string" ? rawDiagnostics.provider.slice(0, 60) : null,
    total_ms: Number.isFinite(rawDiagnostics.total_ms) ? rawDiagnostics.total_ms : null,
    attempts: Array.isArray(rawDiagnostics.attempts) ? rawDiagnostics.attempts.slice(0, 3).map(item => ({
      provider: typeof item?.provider === "string" ? item.provider.slice(0, 60) : "unknown",
      ok: item?.ok === true,
      ms: Number.isFinite(item?.ms) ? item.ms : null,
      error: typeof item?.error === "string" ? item.error.slice(0, 220) : undefined
    })) : []
  } : null;
  const allowedRatings = new Set(["useful", "partly-useful", "not-useful", "failed"]);
  const allowedIssues = new Set(["none", "accuracy", "missing", "generic", "format", "speed", "other"]);

  if (!allowedRatings.has(rating)) {
    return res.status(400).json({ error: "Choose an overall quality rating before sending feedback." });
  }

  const entry = {
    event: "STRATOS_USER_FEEDBACK",
    module: moduleName,
    mode,
    rating,
    issue: allowedIssues.has(issue) ? issue : "other",
    diagnostics,
    comment,
    received_at: new Date().toISOString()
  };

  // Temporary collection: visible in Vercel function logs, with no permanent database.
  console.info("[STRATOS_FEEDBACK]", entry);
  return res.status(200).json({ ok: true, message: "Thank you. Your feedback was recorded for this testing period." });
};

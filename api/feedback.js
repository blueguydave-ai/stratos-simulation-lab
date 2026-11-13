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
    comment,
    received_at: new Date().toISOString()
  };

  // Temporary collection: visible in Vercel function logs, with no permanent database.
  console.info("[STRATOS_FEEDBACK]", entry);
  return res.status(200).json({ ok: true, message: "Thank you. Your feedback was recorded for this testing period." });
};

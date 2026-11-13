const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST to run a research investigation." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "The AI connection is not configured. Add GEMINI_API_KEY to your deployment environment variables, then redeploy." });
  }

  const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
  const context = typeof req.body?.context === "string" ? req.body.context.trim() : "";
  const focus = typeof req.body?.focus === "string" ? req.body.focus.slice(0, 80) : "Auto-detect";
  const geography = typeof req.body?.geography === "string" ? req.body.geography.slice(0, 120) : "";
  const timeframe = typeof req.body?.timeframe === "string" ? req.body.timeframe.slice(0, 100) : "Current and relevant historical context";
  const depth = req.body?.depth === "focused" ? "focused" : "comprehensive";

  if (question.length < 12) return res.status(400).json({ error: "Give the research question a little more detail." });
  if (question.length > 4000 || context.length > 5000) return res.status(413).json({ error: "The research request is too long. Shorten the question or context and try again." });

  const depthInstruction = depth === "comprehensive"
    ? "Run a broad, multi-angle investigation. Search across the most relevant source types and perspectives, including primary/official sources, reputable research, industry sources, credible reporting, specialist publications and informed counter-arguments where appropriate. Search for disconfirming evidence and overlooked dimensions, not only material that supports the first hypothesis."
    : "Run a tightly scoped investigation. Prioritize the most authoritative sources and the highest-value evidence. Still check for counter-evidence, material caveats and important unknowns.";

  const prompt = [
    "You are RESEARCH EXPERT, the professional research desk inside STRATOS. Conduct a web-grounded investigation, not a generic language-model answer.",
    "RESEARCH QUESTION: " + question,
    "USER CONTEXT: " + (context || "No additional context supplied."),
    "RESEARCH FOCUS: " + focus,
    "PROFESSIONAL KNOWLEDGE RULE: If the focus is a profession or specialist field, identify the actual source hierarchy and materials used in that field and jurisdiction. Search relevant official regulators and professional bodies, legislation and standards repositories, technical/clinical practice guidelines, manuals, protocols, specifications, professional publications and primary research as appropriate. Do not force legal sources onto non-legal fields or assume one country’s standards apply elsewhere. Distinguish binding requirements, official guidance, consensus standards, institutional policy and informal practice. Prefer current primary sources and state when a source is outdated, superseded or not verified.",
    "GEOGRAPHY / MARKET: " + (geography || "Infer only if clearly implied; otherwise keep geography open and say what is unknown."),
    "TIMEFRAME: " + timeframe,
    "DEPTH: " + depth,
    depthInstruction,
    "",
    "RESEARCH PROTOCOL:",
    "1. Decompose the question into the sub-questions that must be answered. Search for each important dimension, not just the wording of the original question. Use multiple distinct search queries when useful.",
    "2. Look for information asymmetries and fragmented clues: who knows what, who has incentives to disclose or conceal it, and what can be inferred from public traces such as filings, official registers, procurement records, pricing pages, product documentation, job postings, patents, academic repositories, public datasets, specialist forums, customer reviews and local reporting. Use only sources that are publicly accessible to the search tool; never imply access to private, login-only or paywalled material that was not actually available.",
    "3. Prioritize primary evidence: official statistics, regulators, legislation, company filings, academic papers, original datasets, institutional reports and direct documentation. Use reputable secondary sources to add context, interpretation and criticism.",
    "4. Cross-check important claims across independent sources where possible. Distinguish primary evidence from commentary. Note publication dates and whether information may be outdated.",
    "5. Search for counter-evidence, competing explanations, failed examples, incentives, conflicts of interest, hidden dependencies, omitted populations, implementation barriers and second-order effects.",
    "6. Separate sourced facts, reasonable interpretations, estimates and unknowns. Never invent numbers, market sizes, rankings, quotes, named sources, dates or URLs.",
    "7. For every important finding, explain why it matters and include the exact source URLs used when available. URLs must be from sources actually consulted in this research. Do not fabricate links.",
    "8. Produce charts only when retrieved evidence supports real numeric values. Never manufacture values to make a chart. If reliable comparable data are unavailable, return an empty charts array and explain why.",
    "9. Audit blind spots explicitly: what a quick answer would miss, what has not been verified, which assumptions could reverse the conclusion, and what further evidence would materially improve confidence.",
    "10. Give practical recommendations tied to findings. Make them conditional where the evidence is uncertain. Include what to do first, what to monitor, and what would change the recommendation.",
    "11. Be comprehensive but digestible. Lead with the answer, then layer evidence, context, charts, risks, gaps and actions. Avoid padding and generic advice.",
    "12. When the focus is a working profession, write for a practitioner: use familiar field terminology, concise findings and clear next steps. Prioritize decision-relevant material. Keep technical detail available where it supports a conclusion, but do not overwhelm the reader. When focus is Auto-detect or general strategy, remain accessible and cross-disciplinary.",
    "",
    "QUALITY AND HONESTY RULES:",
    "- Do not claim to have searched every website or found every possible fact. Describe the actual coverage and remaining gaps.",
    "- Do not present search-result snippets as if you inspected a full report. Be transparent when a source was only available in limited form.",
    "- Do not treat correlation as causation or a forecast as certainty.",
    "- Do not assume that a source is reliable merely because it is official; identify relevant incentives or limitations.",
    "- If evidence conflicts, show the disagreement rather than forcing false consensus.",
    "- If the topic is legal, medical, financial, safety-critical or otherwise high-stakes, clearly identify the need for qualified professional or primary-source verification.",
    "- Do not expose private personal data or facilitate wrongdoing.",
    "",
    "RETURN ONLY ONE VALID JSON OBJECT. No markdown fences, no preamble. Use this exact schema; use empty arrays when a section genuinely does not apply:",
    JSON.stringify({
      title: "Concise research title",
      executive_summary: "Direct answer and bottom line, with the most important qualification.",
      confidence: "High | Moderate | Limited",
      confidence_reason: "Why this confidence level is justified.",
      scope_and_method: "What was investigated, the search approach and boundaries.",
      key_findings: [
        { title: "Finding", detail: "What the evidence indicates", significance: "Why it matters", evidence_strength: "Strong | Moderate | Limited", source_urls: ["exact consulted URL"] }
      ],
      evidence_points: [
        { claim: "Specific factual claim", evidence: "What the source says and relevant date/context", source_urls: ["exact consulted URL"], caveat: "Limit or qualification" }
      ],
      landscape: [
        { dimension: "Market, system, technology, policy or other relevant dimension", current_state: "What is happening", direction: "Growing | Declining | Stable | Mixed | Unclear", implication: "Why it matters", source_urls: ["exact consulted URL"] }
      ],
      competitive_landscape: [
        { name: "Competitor, substitute or incumbent", positioning: "Who they serve and how they compete", offer_or_model: "Product, service or business model", strengths: ["..."], weaknesses_or_gaps: ["..."], source_urls: ["exact consulted URL"] }
      ],
      market_segments: [
        { segment: "Customer, user or stakeholder segment", need: "What they need", unmet_need: "Evidence-backed gap or underserved need", barriers: ["..."], source_urls: ["exact consulted URL"] }
      ],
      charts: [
        { title: "Chart title", unit: "%, USD, count, index, etc.", takeaway: "What the comparison shows", caveat: "Data limitation", data: [{ label: "Category or date", value: 0, source_urls: ["exact consulted URL"] }] }
      ],
      stakeholders: [
        { name: "Actor or group", role: "Role in this issue", interest: "Likely incentive or interest", influence: "High | Medium | Low", implication: "What to watch" }
      ],
      information_asymmetries: [
        { actor: "Who may hold an information advantage", information_advantage: "What they may know or control", public_evidence: "Public traces that reveal part of the picture", why_it_matters: "How the information gap changes decisions or bargaining power", how_to_verify: "A practical verification path", source_urls: ["exact consulted URL"] }
      ],
      opportunities: [
        { title: "Opportunity", why_now: "Evidence-based reason", practical_move: "Concrete action", effort: "Low | Medium | High", potential: "Low | Medium | High", source_urls: ["exact consulted URL"] }
      ],
      risks: [
        { title: "Risk", likelihood: "High | Medium | Low | Unclear", impact: "High | Medium | Low", early_warning: "Signal to monitor", mitigation: "Practical response", source_urls: ["exact consulted URL"] }
      ],
      blind_spot_audit: [
        { blind_spot: "Overlooked factor or assumption", why_it_is_missed: "Why a superficial analysis overlooks it", consequence: "How it could change the conclusion", how_to_check: "Specific verification step", priority: "Critical | High | Medium | Low" }
      ],
      open_questions: [
        { question: "Unresolved question", why_it_matters: "Decision relevance", best_next_source: "Where or how to verify" }
      ],
      recommendations: [
        { action: "Specific recommendation", rationale: "Finding or evidence supporting it", priority: "Now | Next | Later", trigger_to_revisit: "What new evidence would change this" }
      ],
      watchlist: [
        { signal: "Metric, event or development to monitor", why: "Why it matters", direction_to_watch: "What change would mean" }
      ],
      limitations: ["What this investigation could not verify or cover"],
      search_queries: ["Research query used or search avenue pursued"]
    }, null, 2),
    "",
    "For each source_urls field, include only URLs you actually consulted. If the research does not support a chart, return charts: []. If the question cannot be answered reliably, state that plainly and prioritize the missing evidence."
  ].join("\n");

  const researchStartedAt = Date.now();
  try {
    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(MODEL) + ":generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.35, maxOutputTokens: 18000 }
      })
    });

    const result = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status === 429 ? 429 : 502).json({ error: result?.error?.message || "The research provider rejected the request." });
    }

    const candidate = result?.candidates?.[0];
    const rawText = candidate?.content?.parts?.map(part => part.text || "").join("").trim();
    if (!rawText) return res.status(502).json({ error: "The research service returned no report. Please try again." });

    const cleaned = rawText.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace < 0 || lastBrace <= firstBrace) throw new Error("No JSON object in research response.");
    const report = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));

    const grounding = candidate?.groundingMetadata || {};
    const chunks = Array.isArray(grounding.groundingChunks) ? grounding.groundingChunks : [];
    const sources = chunks
      .filter(chunk => typeof chunk?.web?.uri === "string" && /^https?:\/\//i.test(chunk.web.uri))
      .map(chunk => ({ title: chunk.web.title || chunk.web.uri, url: chunk.web.uri }))
      .filter((source, index, all) => all.findIndex(item => item.url === source.url) === index);

    const allowedUrls = new Set(sources.map(source => source.url));
    const sanitizeUrls = items => {
      if (!Array.isArray(items)) return [];
      return items.filter(url => typeof url === "string" && allowedUrls.has(url)).slice(0, 8);
    };
    for (const key of ["key_findings", "evidence_points", "landscape", "competitive_landscape", "market_segments", "information_asymmetries", "opportunities", "risks"]) {
      if (!Array.isArray(report[key])) report[key] = [];
      report[key] = report[key].slice(0, 30).map(item => ({ ...item, source_urls: sanitizeUrls(item.source_urls) }));
    }
    for (const key of ["charts", "stakeholders", "blind_spot_audit", "open_questions", "recommendations", "watchlist", "limitations", "search_queries"]) {
      if (!Array.isArray(report[key])) report[key] = [];
      report[key] = report[key].slice(0, 24);
    }
    report.charts = report.charts.filter(chart => Array.isArray(chart.data) && chart.data.length > 0 && chart.data.length <= 14
      && chart.data.every(point => typeof point.value === "number" && Number.isFinite(point.value)));
    report.charts = report.charts.slice(0, 6).map(chart => ({
      ...chart,
      data: chart.data.map(point => ({ ...point, source_urls: sanitizeUrls(point.source_urls) }))
    }));

    return res.status(200).json({
      report,
      sources,
      search_queries: Array.isArray(grounding.webSearchQueries) ? grounding.webSearchQueries.slice(0, 30) : [],
      source_count: sources.length,
      diagnostics: { status: "success", provider: "Gemini", total_ms: Date.now() - researchStartedAt, grounded: sources.length > 0, source_count: sources.length }
    });
  } catch (error) {
    console.error("[STRATOS] Research failed.", { provider: "Gemini", error: error?.message || "unknown error", total_ms: Date.now() - researchStartedAt });
    return res.status(502).json({ error: "The research report could not be structured reliably. Please run the investigation again.", diagnostics: { status: "failed", provider: "Gemini", error: String(error?.message || "Research request failed.").slice(0, 220), total_ms: Date.now() - researchStartedAt } });
  }
};

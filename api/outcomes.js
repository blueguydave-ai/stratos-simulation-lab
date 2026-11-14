const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Extract one complete JSON object without being confused by braces inside strings.
function extractJsonObject(raw) {
  const text = String(raw || "").replace(/^\uFEFF/, "").trim()
    .replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  const start = text.indexOf("{");
  if (start < 0) throw new Error("No JSON object in AI response.");
  let depth = 0, inString = false, escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  throw new Error("AI response ended before the JSON object was complete.");
}

function parseJsonResponse(raw) {
  const extracted = extractJsonObject(raw);
  try {
    return JSON.parse(extracted);
  } catch (firstError) {
    // Recover the common harmless formatting error: trailing commas.
    const repaired = extracted.replace(/,\s*([}\]])/g, "$1");
    if (repaired === extracted) throw firstError;
    return JSON.parse(repaired);
  }
}


module.exports = async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Use POST to run an outcome analysis." }); }
  const apiKey = process.env.GEMINI_API_KEY;

  const scenario = typeof req.body?.scenario === "string" ? req.body.scenario.trim() : "";
  const scope = req.body?.scope === "expanded" ? "expanded" : "focused";
  const action = req.body?.action === "expand" ? "expand" : "initial";
  const profession = typeof req.body?.profession === "string" ? req.body.profession.slice(0, 100) : "";
  const country = typeof req.body?.country === "string" ? req.body.country.trim().slice(0, 120) : "";
  const professionalMode = req.body?.professional_mode === true;
  const existing = Array.isArray(req.body?.existing_outcomes) ? req.body.existing_outcomes.slice(0, 100).map(x => String(x).slice(0, 180)) : [];
  if (scenario.length < 20) return res.status(400).json({ error: "Please provide a more detailed description of the situation." });
  if (scenario.length > 8000) return res.status(413).json({ error: "The description is too long. Please keep it under 8,000 characters." });

  const scopeRules = scope === "expanded"
    ? [
      "CONTEXT SCOPE — SMALL CONTEXT PLUS WIDER INFLUENCES:",
      "Start with the immediate situation exactly as described. Then widen the lens by ONE relevant layer at a time: nearest surrounding systems, upstream dependencies, downstream consequences, external actors, institutions, infrastructure, market, ecological or social conditions that can plausibly alter the immediate situation.",
      "Use a controlled radius. Include a wider factor only when you can explain a credible causal path from it to the described situation or its outcomes. Prefer the nearest influential wider layer. Do not drift into national, global or macro forces unless they materially connect.",
      "Explicitly distinguish immediate factors from wider influences. Surface hidden actors and components only when they have a plausible role. Reveal mysteries the narrow view cannot explain; do not model the entire world."
    ].join("\n")
    : [
      "CONTEXT SCOPE — SMALL / IMMEDIATE CONTEXT:",
      "Keep the lens close to the situation described. Model the immediate actors, groups, variables, constants, constraints, resources, processes, relationships and direct environment that materially shape it.",
      "Include an outside influence only if it directly enters or constrains this immediate situation. Do not expand into wider systems simply because they exist. The goal is a useful close-up, not an exhaustive world model."
    ].join("\n");

  const taskRules = action === "expand"
    ? [
      "TASK — EXPAND THE OUTCOME SET:",
      "The user has already received these outcome titles: " + JSON.stringify(existing),
      "Generate 5–7 ADDITIONAL outcomes not already represented by those titles. Look for distinct causal pathways, overlooked interactions, conditional branches, actor responses and plausible second-order effects within the selected scope.",
      "Do not merely rename, rephrase or split an existing outcome into trivial variants. Do not widen the scope beyond the selected mode. If no further meaningful outcomes exist at this scope, return an empty outcomes array and explain why in overview."
    ].join("\n")
    : [
      "TASK — INITIAL EXPLORATION:",
      "Generate an initial set of 6–8 distinct, leading plausible outcomes. This is a starting flashlight beam, not an exhaustive list. Choose breadth based on situation complexity: simple situations may need fewer; complex situations may support more.",
      "Rank outcomes by comparative plausibility. Include favourable, unfavourable, mixed and surprising-but-plausible paths where supported. Do not force a quota of artificial outcomes."
    ].join("\n");

  const instructions = [
    "You are STRATOS, a rigorous outcome-discovery and scenario-analysis engine. The user provides ONE natural-language description. Expose plausible ways the situation could unfold and the conditions that cause each. Build a provisional causal model, then challenge it. Do not merely paraphrase the input or generate generic pros and cons.",
    scopeRules,
    "OPERATING MODE: " + (professionalMode ? "PROFESSIONAL MODE" : "STRATEGIC MODE"),
    professionalMode
      ? "PROFESSIONAL MODE OUTPUT STANDARD: Serve the working professional, not a casual explorer. Lead with the decision-relevant point. Use the terminology practitioners actually use in this field, but explain uncommon terms briefly. Keep each point short, specific and actionable. Prioritize the few material issues; do not flood the user with every conceivable detail. Put supporting analysis, source references and technical depth behind clearly separated details. Identify the relevant specialty and real workflow; do not assume all people in a broad profession work alike."
      : "STRATEGIC MODE OUTPUT STANDARD: Remain profession-neutral unless the scenario itself requires a specialist role. Explore causal dynamics, actors, incentives, counter-moves, vulnerabilities, strategic options and second-order effects in clear language. Do not turn a general strategy question into professional advice.",
    ...(professionalMode ? [
      "PROFESSIONAL AND COUNTRY CONTEXT:",
      profession ? ("PROFESSION: " + profession) : "Infer the relevant specialty only from the selected role and scenario; do not invent a profile.",
      country ? ("COUNTRY / JURISDICTION: " + country) : "Do not assume a country. Mark local context as unknown when it matters.",
      "Model the actual specialty, workflow, decision rights, deliverables, tools, standards, licensing, client or patient relationships, counterparties, liability, ethics, safety duties, commercial pressures, failure modes and quality controls. Identify only materials relevant to the task and jurisdiction: legislation, official guidance, professional-body standards, technical codes, clinical guidelines, manuals, protocols, specifications, contracts, accounting or audit standards, research and institutional policies. Never invent titles, clauses, standards or citations. Distinguish binding requirements from guidance, common practice and opinion.",
      "Adapt to the supplied jurisdiction. Consider relevant regulators, licensing bodies, labour rules, tax, procurement, payment infrastructure, professional associations, public/private sector differences, language, infrastructure and economic conditions only where material. Do not stereotype or assume uniform practice.",
      "For jurisdiction-specific legal, regulatory, licensing, tax or safety claims, prioritize current official or primary sources. If evidence is unavailable or conflicting, label it unverified and identify what a local professional should confirm. Never invent statutes, rules, salary data, credentials or local customs.",
      "Generate distinct outcomes grounded in the profession and jurisdiction. Model interactions among professionals, clients, managers, regulators, suppliers, institutions and the public, accounting for limited information, competing incentives, workload, resource scarcity and local constraints."
    ] : [
      "CONTEXT: Keep Strategic Mode profession-neutral unless the scenario itself requires specialist roles. Do not add professional or jurisdiction-specific assumptions that the scenario does not support."
    ]),
    "ANALYSIS METHOD:",
    "Build a small causal model of the selected scope. Separate stated facts, inferences and unknowns. Identify only material actors, incentives, variables, fixed constants, constraints, resources, processes, dependencies and feedback loops.",
    "Explain the important interactions: what amplifies, blocks, delays or redirects what. Account for plausible reactions by actors with limited information and competing incentives.",
    "For each distinct outcome, show the causal chain, required conditions, main drivers, observable early signs, what could change the path, and the strongest relevant counter-move. Give a practical response, what evidence or information would verify it, and a warning signal. Do not assume deception or fabrication without evidence.",
    "Audit blind spots, fragile assumptions and second-order effects. Keep outcomes causally distinct and consistent with the scenario's real constraints. Branch on important unknowns rather than treating guesses as facts.",
    "OUTPUT DISCIPLINE:",
    "- Initial analysis: 6–8 distinct plausible outcomes; expansion: 5–7 additional outcomes. Rank by comparative plausibility and include favourable, unfavourable, mixed or surprising paths only when supported.",
    "- For each outcome, use concise, information-dense writing: normally 1–3 sentences for description and causal chain, 2–3 conditions, 2–3 drivers, 2–3 early signs, 1–2 changing conditions and 1–2 material counter-moves.",
    "- Each counter-move must include a practical response, evidence_needed and watch_for. Avoid repeating advice.",
    "- Keep overview and supporting sections brief. Include only material components; wider factors need a credible causal link to the situation.",
    "- Likelihood is comparative only (Higher, Moderate, Lower), never a measured probability. Do not invent statistics, named entities, rules, citations or facts.",
    "- Strategic Mode stays profession-neutral. Professional Mode uses the actual specialty, workflow and jurisdiction; distinguish binding requirements from guidance and common practice. Never invent standards or local rules; flag verification gaps and prefer official sources for jurisdiction-specific claims.",
    "- Respect physical, financial, legal, social, operational and time constraints. This is scenario exploration, not a guaranteed forecast.",
    "Return ONLY valid JSON with this structure:",
    JSON.stringify({
      title:"short situation-specific title",
      overview:"brief description of model, scope and main uncertainty",
      scope_boundary:"what was included and deliberately left outside the lens",
      influential_variables:[{name:"...",why:"...",status:"stated|inferred",reach:"immediate|wider"}],
      constants:[{name:"...",why:"...",status:"stated|inferred",reach:"immediate|wider"}],
      constraints:[{name:"...",why:"...",status:"stated|inferred",reach:"immediate|wider"}],
      actors:[{name:"actor or group",role:"what they can affect",incentive_or_interest:"plausible motivation",reach:"immediate|wider"}],
      components:[{name:"process, resource, institution, tool, infrastructure or other component",why:"how it can affect the situation",reach:"immediate|wider"}],
      unknowns:[{name:"...",why_it_matters:"..."}],
      interactions:[{name:"...",why:"..."}],
      key_drivers:["..."],
      outcomes:[{rank:1,title:"distinct outcome",category:"dominant driver",likelihood:"Higher|Moderate|Lower",description:"what happens",causal_chain:"cause to effect chain",conditions:["..."],drivers:["..."],early_signs:["..."],changing_conditions:["..."],counter_moves:[{move:"Plausible challenge, objection, reaction or failure mode",response:"Practical response or preparation",evidence_needed:"Information or evidence needed",watch_for:"Signal that this branch is developing"}],blind_spot:"..."}],
      blind_spots:[{title:"...",why_it_matters:"..."}],
      ...(professionalMode ? {professional_context:{profession:"selected or inferred profession",country:"selected country or jurisdiction",workflow_nuances:["..."],local_practice_and_rules:["..."],role_dynamics:["..."],professional_risks:["..."],verification_gaps:["..."]}} : {}),
      caveat:"how to interpret and test these scenarios"
    }),
    "For expansion, outcomes may be empty only if no additional distinct outcomes can responsibly be identified. Do not put markdown fences or commentary outside the JSON."
  ].join("\n\n");

  const requestStartedAt = Date.now();
  const providerAttempts = [];
  // Keep total provider work safely below Vercel's 120-second function limit.
  const executionBudgetMs = 65000;
  const providerTimeout = maxMs => {
    const remaining = executionBudgetMs - (Date.now() - requestStartedAt) - 5000;
    if (remaining < 1000) throw new Error("STRATOS reached its safe execution time budget.");
    return Math.min(maxMs, remaining);
  };
  try {
    const userPrompt = "Analyse this situation within the selected scope and return the required JSON:\n\n" + scenario;
    const groundedMode = professionalMode || Boolean(profession) || Boolean(country);
    let output = "";
    let grounding = {};
    let providerUsed = "Gemini";
    let geminiError = "";

    if (apiKey) {
      const providerStartedAt = Date.now();
      try {
        const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(MODEL) + ":generateContent", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          signal: AbortSignal.timeout(providerTimeout(24000)),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: instructions }] },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            tools: groundedMode ? [{ google_search: {} }] : undefined,
            generationConfig: { ...(groundedMode ? {} : { responseMimeType: "application/json" }), temperature: action === "expand" ? 0.75 : 0.65, maxOutputTokens: 5000 }
          })
        });
        const result = await upstream.json();
        if (!upstream.ok) throw new Error(result?.error?.message || ("Gemini returned HTTP " + upstream.status));
        const candidate = result?.candidates?.[0];
        output = candidate?.content?.parts?.map(part => part.text || "").join("").trim() || "";
        grounding = candidate?.groundingMetadata || {};
        if (!output) throw new Error("Gemini returned an empty response.");
        providerAttempts.push({
          provider: "Gemini",
          ms: Date.now() - providerStartedAt,
          ok: true,
          finish_reason: candidate?.finishReason || null,
          output_chars: output.length,
          usage: result?.usageMetadata || null
        });
      } catch (error) {
        geminiError = error?.message || "Gemini request failed.";
        providerAttempts.push({ provider: "Gemini", ms: Date.now() - providerStartedAt, ok: false, error: geminiError });
      }
    } else {
      geminiError = "GEMINI_API_KEY is not configured.";
    }

    const parseAnalysis = raw => {
      const parsed = parseJsonResponse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("The response was not a JSON object.");
      if (!Array.isArray(parsed.outcomes)) throw new Error("The response did not contain an outcomes array.");
      parsed.outcomes = parsed.outcomes.filter(item => item && typeof item === "object" && !Array.isArray(item));
      if (action === "initial" && parsed.outcomes.length < 3) throw new Error("The response contained fewer than 3 usable outcomes.");
      // Optional sections can be absent without invalidating otherwise useful outcomes.
      for (const key of ["influential_variables", "constants", "constraints", "actors", "components", "unknowns", "interactions", "key_drivers", "blind_spots"]) {
        if (!Array.isArray(parsed[key])) parsed[key] = [];
      }
      parsed.outcomes = parsed.outcomes.map(item => ({
        ...item,
        conditions: Array.isArray(item.conditions) ? item.conditions : [],
        drivers: Array.isArray(item.drivers) ? item.drivers : [],
        early_signs: Array.isArray(item.early_signs) ? item.early_signs : [],
        changing_conditions: Array.isArray(item.changing_conditions) ? item.changing_conditions : [],
        counter_moves: Array.isArray(item.counter_moves) ? item.counter_moves : []
      }));
      return parsed;
    };

    let analysis = null;
    if (output) {
      try { analysis = parseAnalysis(output); }
      catch (error) {
        geminiError = error?.message || "Gemini returned invalid JSON.";
        grounding = {};
        const lastAttempt = providerAttempts[providerAttempts.length - 1];
        if (lastAttempt?.provider === "Gemini") { lastAttempt.ok = false; lastAttempt.error = geminiError; }
      }
    }

    // Gemini is always attempted first. If it fails, fall back sequentially in every mode.
    // Professional Mode receives an explicit grounding warning when a fallback is used.
    if (!analysis) {
      const providers = [];
      if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) providers.push({
        name: "Cloudflare Workers AI",
        run: async () => {
          const model = process.env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
          const response = await fetch("https://api.cloudflare.com/client/v4/accounts/" + encodeURIComponent(process.env.CLOUDFLARE_ACCOUNT_ID) + "/ai/run/" + encodeURI(model), {
            method: "POST",
            headers: { "Authorization": "Bearer " + process.env.CLOUDFLARE_API_TOKEN, "Content-Type": "application/json" },
            signal: AbortSignal.timeout(providerTimeout(16000)),
            body: JSON.stringify({ messages: [{ role: "system", content: instructions }, { role: "user", content: userPrompt }], temperature: action === "expand" ? 0.75 : 0.65, max_tokens: 4200 })
          });
          const data = await response.json();
          if (!response.ok || data?.success === false) throw new Error(data?.errors?.[0]?.message || ("Cloudflare returned HTTP " + response.status));
          return data?.result?.response || "";
        }
      });
      if (process.env.OPENROUTER_API_KEY) providers.push({
        name: "OpenRouter",
        run: async () => {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY, "Content-Type": "application/json", "X-Title": "STRATOS" },
            signal: AbortSignal.timeout(providerTimeout(18000)),
            body: JSON.stringify({ model: "openrouter/free", messages: [{ role: "system", content: instructions }, { role: "user", content: userPrompt }], temperature: action === "expand" ? 0.75 : 0.65, max_tokens: 6000 })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data?.error?.message || ("OpenRouter returned HTTP " + response.status));
          return data?.choices?.[0]?.message?.content || "";
        }
      });

      const fallbackErrors = [];
      for (const provider of providers) {
        const providerStartedAt = Date.now();
        try {
          const candidate = await provider.run();
          const parsed = parseAnalysis(candidate);
          analysis = parsed;
          providerUsed = provider.name;
          providerAttempts.push({ provider: provider.name, ms: Date.now() - providerStartedAt, ok: true });
          break;
        } catch (error) {
          const message = error?.message || "request failed";
          fallbackErrors.push(provider.name + ": " + message);
          providerAttempts.push({ provider: provider.name, ms: Date.now() - providerStartedAt, ok: false, error: message });
        }
      }
      if (!analysis) {
        const totalMs = Date.now() - requestStartedAt;
        console.error("[STRATOS] All providers failed.", { attempts: providerAttempts, gemini: geminiError || "not attempted", fallbacks: fallbackErrors, total_ms: totalMs });
        return res.status(503).json({ error: "STRATOS couldn't complete this analysis right now. Your scenario is still here. Please try again.", diagnostics: { status: "failed", provider: null, attempts: providerAttempts.map(item => ({ provider: item.provider, ms: item.ms, ok: item.ok, error: String(item.error || "").slice(0, 220) })), total_ms: totalMs } });
      }
    }

    if (providerUsed !== "Gemini" && groundedMode) {
      analysis.professional_context = analysis.professional_context && typeof analysis.professional_context === "object" ? analysis.professional_context : {};
      const gaps = Array.isArray(analysis.professional_context.verification_gaps) ? analysis.professional_context.verification_gaps : [];
      gaps.unshift("Fallback AI was used without Gemini live Search grounding. Independently verify current laws, regulations, professional standards and local requirements before relying on jurisdiction-specific details.");
      analysis.professional_context.verification_gaps = [...new Set(gaps)].slice(0, 8);
      analysis.caveat = [analysis.caveat, "This response was generated by a fallback provider without live Google Search grounding; verify current jurisdiction-specific requirements against authoritative sources."].filter(Boolean).join(" ");
    }
    console.info("[STRATOS] Analysis completed.", { provider: providerUsed, attempts: providerAttempts, total_ms: Date.now() - requestStartedAt });

    analysis.outcomes = analysis.outcomes.slice(0, action === "expand" ? 7 : 12).map((item, index) => ({ ...item, rank: index + 1 }));
    const sources = (Array.isArray(grounding.groundingChunks) ? grounding.groundingChunks : [])
      .filter(chunk => typeof chunk?.web?.uri === "string" && /^https?:\/\//i.test(chunk.web.uri))
      .map(chunk => ({ title: chunk.web.title || chunk.web.uri, url: chunk.web.uri }))
      .filter((source, index, all) => all.findIndex(item => item.url === source.url) === index)
      .slice(0, 12);
    if (analysis.professional_context && typeof analysis.professional_context === "object") {
      analysis.professional_context.source_links = sources;
    }
    return res.status(200).json({ analysis, sources, diagnostics: { status: "success", provider: providerUsed, attempts: providerAttempts.map(item => ({ provider: item.provider, ms: item.ms, ok: item.ok, error: item.error ? String(item.error).slice(0, 220) : undefined })), total_ms: Date.now() - requestStartedAt, grounded: providerUsed === "Gemini" && sources.length > 0 } });
  } catch (error) {
    console.error("[STRATOS] Unexpected analysis error:", error?.message || error);
    return res.status(500).json({ error: "Something interrupted the analysis. Your scenario is still here—please try again." });
  }
};
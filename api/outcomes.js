const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Use POST to run an outcome analysis." }); }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "The AI connection is not configured yet. Add GEMINI_API_KEY to the deployment's environment variables, then redeploy." });

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
      "Generate an initial set of 8–12 distinct, leading plausible outcomes. This is a starting flashlight beam, not an exhaustive list. Choose breadth based on situation complexity: simple situations may need fewer; complex situations may support more.",
      "Rank outcomes by comparative plausibility. Include favourable, unfavourable, mixed and surprising-but-plausible paths where supported. Do not force a quota of artificial outcomes."
    ].join("\n");

  const instructions = [
    "You are STRATOS, a rigorous outcome-discovery and scenario-analysis engine. The user provides ONE natural-language description. Expose plausible ways the situation could unfold and the conditions that cause each. Build a provisional causal model, then challenge it. Do not merely paraphrase the input or generate generic pros and cons.",
    scopeRules,
    "OPERATING MODE: " + (professionalMode ? "PROFESSIONAL MODE" : "STRATEGIC MODE"),
    professionalMode
      ? "PROFESSIONAL MODE OUTPUT STANDARD: Serve the working professional, not a casual explorer. Lead with the decision-relevant point. Use the terminology practitioners actually use in this field, but explain uncommon terms briefly. Keep each point short, specific and actionable. Prioritize the few material issues; do not flood the user with every conceivable detail. Put supporting analysis, source references and technical depth behind clearly separated details. Identify the relevant specialty and real workflow; do not assume all people in a broad profession work alike."
      : "STRATEGIC MODE OUTPUT STANDARD: Remain profession-neutral unless the scenario itself requires a specialist role. Explore causal dynamics, actors, incentives, counter-moves, vulnerabilities, strategic options and second-order effects in clear language. Do not turn a general strategy question into professional advice.",
    "PROFESSIONAL AND COUNTRY CONTEXT:",
    profession ? ("PROFESSION: " + profession) : "PROFESSION: Infer relevant roles only when supported by the scenario; otherwise keep the analysis cross-functional.",
    country ? ("COUNTRY / JURISDICTION: " + country) : "COUNTRY / JURISDICTION: Do not assume a country. Mark local context as unknown when it matters.",
    "When Professional Mode is active, identify the actual profession or specialty from the selected role and scenario. Model real workflows, decision rights, deliverables, tools, standards, licensing or registration where applicable, client/patient/customer relationships, counterparties, liability, ethics, safety duties, commercial pressures, failure modes and quality controls. Identify the real materials practitioners rely on where relevant: current legislation and regulations, official guidance, professional-body standards, technical codes, clinical guidelines, manuals, protocols, specifications, contracts, accounting/audit standards, research literature, institutional policies and authoritative databases. Select only materials relevant to the actual task and jurisdiction; do not invent titles, clauses, standards or citations. Distinguish binding requirements from guidance, common practice and opinion.",
    "When a country is supplied, adapt the model to that jurisdiction. Distinguish law/regulation from local custom, institutional practice and employer policy. Consider relevant regulators, licensing bodies, labour rules, tax, procurement, payment infrastructure, professional associations, public/private sector differences, language, infrastructure and economic conditions where material. Never stereotype or assume uniform practice within a country.",
    "For jurisdiction-specific legal, regulatory, licensing, tax or safety claims, prioritize current official or primary sources. If evidence is unavailable or conflicting, label the point unverified and identify what a local professional should confirm. Never invent statutes, rules, salary data, credentials or local customs.",
    "Generate multiple distinct outcomes grounded in the selected profession and jurisdiction. Include routine, favourable, adverse, edge-case and second-order pathways where relevant. Model interactions among professionals, clients, managers, regulators, suppliers, institutions and the public. Account for limited information, competing incentives, workload, resource scarcity and local constraints.",
    "If profession or country is not supplied, do not fabricate a profile. Treat missing context as an uncertainty.",
    "ANALYSIS METHOD:",
    "1. Separate facts explicitly stated by the user from inferences and unknowns. Never silently promote an assumption into a fact.",
    "2. Discover potentially relevant components within the selected scope: actors, groups, incentives, information gaps, influential variables, constants, constraints, resources, processes, dependencies, relationships, institutions, tools, infrastructure, feedback loops, bottlenecks and external forces. Include only components that can plausibly affect this situation.",
    "3. A variable can change. A constant is fixed or effectively fixed within the scenario's stated boundary and timeframe. A constraint limits possible actions or states. An unknown is missing information that could change the analysis. Do not confuse these categories.",
    "4. Identify interactions: one factor amplifying, suppressing, delaying or redirecting another. Include reactions and counter-reactions by actors with limited information and plausible incentives.",
    "5. COUNTER-MOVE AND RESPONSE ANALYSIS: For each major outcome, identify the most plausible opposing move, challenge, objection, competing explanation, failure mode or adverse development. Then give a proportionate response or preparation step, what evidence or information would be needed, and what could make that response fail. In professional contexts, use the field’s real procedures and standards. In general strategic contexts, keep recommendations role-neutral. Do not assume deception or fabrication without evidence; describe indicators and verification steps instead.",
    taskRules,
    "6. For every outcome, explain what happens, its causal chain, the combination of conditions required, key drivers, observable early signs and what would increase, reduce or prevent it.",
    "7. Conduct a blind-spot audit for hidden dependencies, overlooked actors, indirect effects, constraints, constants, feedback loops and fragile assumptions.",
    "8. Check that outcomes are causally distinct, grounded in the scenario and consistent with constraints. Branch on uncertainty instead of pretending missing facts are known.",
    "REALISM RULES:",
    "- This is scenario exploration, not a guarantee or calibrated forecast. Never invent numerical probabilities.",
    "- Likelihood labels are comparative only: Higher, Moderate or Lower. They describe relative plausibility within this set, not measured odds.",
    "- Respect physical, financial, legal, social, operational and time constraints when relevant.",
    "- Do not assume a country, legal system, market or culture unless the user specifies it or the situation makes it clear.",
    "- Never invent exact statistics, named entities, regulations or research findings.",
    "- Be concrete, specific and plain-spoken. Avoid jargon and padding.",
    "- Wider factors must have an explained causal connection to the situation. No speculative universe expansion.",
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
      professional_context:{profession:"selected or inferred profession",country:"selected country or jurisdiction",workflow_nuances:["..."],local_practice_and_rules:["..."],role_dynamics:["..."],professional_risks:["..."],verification_gaps:["..."]},
      caveat:"how to interpret and test these scenarios"
    }, null, 2),
    "For expansion, outcomes may be empty only if no additional distinct outcomes can responsibly be identified. Do not put markdown fences or commentary outside the JSON."
  ].join("\n\n");

  try {
    const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(MODEL) + ":generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instructions }] },
        contents: [{ role: "user", parts: [{ text: "Analyse this situation within the selected scope and return the required JSON:\n\n" + scenario }] }],
        tools: professionalMode || profession || country ? [{ google_search: {} }] : undefined,
        // Gemini does not support application/json response MIME type together with Google Search tools.
        // Keep JSON-only instructions in the prompt when grounding is enabled; use constrained JSON mode otherwise.
        generationConfig: { ...(professionalMode || profession || country ? {} : { responseMimeType: "application/json" }), temperature: action === "expand" ? 0.75 : 0.65, maxOutputTokens: 18000 }
      })
    });
    const result = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status === 429 ? 429 : 502).json({ error: result?.error?.message || "The AI provider rejected the request." });
    const output = result?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
    if (!output) return res.status(502).json({ error: "The AI model returned an empty analysis. Please try again." });
    const cleaned = output.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace < 0 || lastBrace <= firstBrace) throw new Error("No JSON object in outcome response.");
    const analysis = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    if (!Array.isArray(analysis.outcomes)) return res.status(502).json({ error: "The analysis returned an unexpected outcome format." });
    if (action === "initial" && analysis.outcomes.length < 5) return res.status(502).json({ error: "The analysis returned too few distinct outcomes. Please run it again." });
    analysis.outcomes = analysis.outcomes.slice(0, action === "expand" ? 7 : 12).map((item, index) => ({ ...item, rank: index + 1 }));
    const grounding = result?.candidates?.[0]?.groundingMetadata || {};
    const sources = (Array.isArray(grounding.groundingChunks) ? grounding.groundingChunks : [])
      .filter(chunk => typeof chunk?.web?.uri === "string" && /^https?:\/\//i.test(chunk.web.uri))
      .map(chunk => ({ title: chunk.web.title || chunk.web.uri, url: chunk.web.uri }))
      .filter((source, index, all) => all.findIndex(item => item.url === source.url) === index)
      .slice(0, 12);
    if (analysis.professional_context && typeof analysis.professional_context === "object") {
      analysis.professional_context.source_links = sources;
    }
    return res.status(200).json({ analysis, sources });
  } catch (error) {
    return res.status(500).json({ error: "Unable to reach the AI service or parse its response. Please try again." });
  }
};
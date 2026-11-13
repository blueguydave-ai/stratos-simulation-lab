const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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
    "- Be concrete, specific and plain-spoken. Avoid jargon, repetition and padding.",
    "- Keep the initial response compact but analytically complete: aim for 6–8 outcomes, not an exhaustive catalogue.",
    "- For each outcome, use concise, information-dense sentences. Include the actual causal mechanism, not generic explanation.",
    "- Usually provide 2–4 conditions, 2–4 drivers, 2–4 observable early signs and 1–3 changing conditions per outcome; include fewer when fewer are genuinely relevant.",
    "- For each major outcome, include up to 3 material counter-moves. Each response must state a practical preparation/action and the key evidence or signal to verify. Do not repeat the same advice across outcomes.",
    "- Keep overview, scope boundary, component explanations and blind spots brief. Prioritize decision-relevant distinctions over length.",
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
    }),
    "For expansion, outcomes may be empty only if no additional distinct outcomes can responsibly be identified. Do not put markdown fences or commentary outside the JSON."
  ].join("\n\n");

  const requestStartedAt = Date.now();
  const providerAttempts = [];
  try {
    const userPrompt = "Analyse this situation within the selected scope and return the required JSON:\n\n" + scenario;
    const groundedMode = professionalMode || Boolean(profession) || Boolean(country);
    let output = "";
    let grounding = {};
    let providerUsed = "Gemini";
    let geminiError = "";

    if (apiKey) try {
      const providerStartedAt = Date.now();
      const upstream = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(MODEL) + ":generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: instructions }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          tools: groundedMode ? [{ google_search: {} }] : undefined,
          generationConfig: { ...(groundedMode ? {} : { responseMimeType: "application/json" }), temperature: action === "expand" ? 0.75 : 0.65, maxOutputTokens: 7000 }
        })
      });
      const result = await upstream.json();
      if (!upstream.ok) throw new Error(result?.error?.message || ("Gemini returned HTTP " + upstream.status));
      output = result?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim() || "";
      grounding = result?.candidates?.[0]?.groundingMetadata || {};
      if (!output) throw new Error("Gemini returned an empty response.");
      providerAttempts.push({ provider: "Gemini", ms: Date.now() - providerStartedAt, ok: true });
    } catch (error) {
      geminiError = error?.message || "Gemini request failed.";
      providerAttempts.push({ provider: "Gemini", ms: Date.now() - providerStartedAt, ok: false, error: geminiError });
    } else {
      geminiError = "GEMINI_API_KEY is not configured.";
    }

    const parseAnalysis = raw => {
      const cleaned = String(raw || "").trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```\s*$/, "");
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace < 0 || lastBrace <= firstBrace) throw new Error("No JSON object in outcome response.");
      const parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      if (!Array.isArray(parsed.outcomes)) throw new Error("The response did not contain an outcomes array.");
      if (action === "initial" && parsed.outcomes.length < 5) throw new Error("The response contained too few distinct outcomes.");
      return parsed;
    };

    let analysis = null;
    if (output) {
      try { analysis = parseAnalysis(output); }
      catch (error) { geminiError = error?.message || "Gemini returned invalid JSON."; }
    }

    // Only general Strategic Mode may use ungrounded fallback models. Professional Mode
    // relies on Gemini Search grounding until STRATOS has an independent retrieval layer.
    if (!analysis) {
      const providers = [];
      if (process.env.OPENROUTER_API_KEY) providers.push({
        name: "OpenRouter",
        run: async () => {
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY, "Content-Type": "application/json", "X-Title": "STRATOS" },
            signal: AbortSignal.timeout(10000),
            body: JSON.stringify({ model: "openrouter/free", messages: [{ role: "system", content: instructions }, { role: "user", content: userPrompt }], temperature: action === "expand" ? 0.75 : 0.65, max_tokens: 6000 })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data?.error?.message || ("OpenRouter returned HTTP " + response.status));
          return data?.choices?.[0]?.message?.content || "";
        }
      });
      if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN) providers.push({
        name: "Cloudflare Workers AI",
        run: async () => {
          const model = process.env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
          const response = await fetch("https://api.cloudflare.com/client/v4/accounts/" + encodeURIComponent(process.env.CLOUDFLARE_ACCOUNT_ID) + "/ai/run/" + encodeURI(model), {
            method: "POST",
            headers: { "Authorization": "Bearer " + process.env.CLOUDFLARE_API_TOKEN, "Content-Type": "application/json" },
            signal: AbortSignal.timeout(35000),
            body: JSON.stringify({ messages: [{ role: "system", content: instructions }, { role: "user", content: userPrompt }], temperature: action === "expand" ? 0.75 : 0.65, max_tokens: 8000 })
          });
          const data = await response.json();
          if (!response.ok || data?.success === false) throw new Error(data?.errors?.[0]?.message || ("Cloudflare returned HTTP " + response.status));
          return data?.result?.response || "";
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
        console.error("[STRATOS] All providers failed.", { attempts: providerAttempts, gemini: geminiError || "not attempted", fallbacks: fallbackErrors, total_ms: Date.now() - requestStartedAt });
        return res.status(503).json({ error: "STRATOS couldn’t complete this analysis. The AI services are taking longer than expected. Your scenario is still here—please try again." });
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
    return res.status(200).json({ analysis, sources, provider: providerUsed });
  } catch (error) {
    console.error("[STRATOS] Unexpected analysis error:", error?.message || error);
    return res.status(500).json({ error: "Something interrupted the analysis. Your scenario is still here—please try again." });
  }
};
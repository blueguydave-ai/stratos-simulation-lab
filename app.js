const scenarioInput=document.getElementById("scenario");
const runButton=document.getElementById("run-button");
const charCount=document.getElementById("char-count");
const statusBox=document.getElementById("status");
const resultsBox=document.getElementById("results");
let currentAnalysis=null;
let currentScope="focused";
let simulatorMode="strategic";
let expanding=false;


let lastFeedbackDiagnostics = null;
let lastFeedbackModule = "scenario";

function setFeedbackPending(label) {
  lastFeedbackModule = label === "Research Expert" ? "research" : "scenario";
  lastFeedbackDiagnostics = null;
  const status = document.getElementById("feedback-system-status");
  const detail = document.getElementById("feedback-system-detail");
  const lastRun = document.getElementById("feedback-last-run");
  const list = document.getElementById("feedback-provider-list");
  if (!status || !detail || !lastRun || !list) return;
  status.textContent = "Request in progress";
  detail.textContent = label + " is running. Provider results will appear here when the server responds.";
  lastRun.textContent = label + " · running";
  list.replaceChildren();
  ["Gemini", "Cloudflare Workers AI", "OpenRouter"].forEach(name => {
    const chip = document.createElement("span");
    chip.className = "feedback-provider pending";
    chip.textContent = name + " · awaiting result";
    list.append(chip);
  });
}

function updateFeedbackMonitor(diagnostics, label = "Scenario analysis") {
  lastFeedbackModule = label === "Research Expert" ? "research" : "scenario";
  lastFeedbackDiagnostics = diagnostics || null;
  const status = document.getElementById("feedback-system-status");
  const detail = document.getElementById("feedback-system-detail");
  const lastRun = document.getElementById("feedback-last-run");
  const list = document.getElementById("feedback-provider-list");
  if (!status || !detail || !lastRun || !list) return;
  const now = new Date().toLocaleTimeString();
  lastRun.textContent = label + " · " + now;
  if (!diagnostics) {
    status.textContent = "Request finished without diagnostic details";
    detail.textContent = "The server did not return provider diagnostics. Check the Vercel function logs for the underlying error.";
    list.replaceChildren();
    ["Gemini", "Cloudflare Workers AI", "OpenRouter"].forEach(name => {
      const chip = document.createElement("span");
      chip.className = "feedback-provider pending";
      chip.textContent = name + " · status unknown";
      list.append(chip);
    });
    return;
  }
  const attempts = Array.isArray(diagnostics.attempts) ? diagnostics.attempts : [];
  const successful = diagnostics.status === "success";
  status.textContent = successful
    ? "Completed · " + (diagnostics.provider || "AI provider")
    : "Failed · " + (diagnostics.provider || "all attempted providers");
  const seconds = Number.isFinite(diagnostics.total_ms) ? (diagnostics.total_ms / 1000).toFixed(1) + "s" : "time unavailable";
  detail.textContent = label + " took " + seconds + ". " +
    (successful ? (diagnostics.grounded ? "Gemini search grounding returned source links." : "No verified search-grounding links were returned.") :
      (diagnostics.error || "No provider returned a usable result. Review the provider attempts below."));
  list.replaceChildren();
  const names = ["Gemini", "Cloudflare Workers AI", "OpenRouter"];
  names.forEach(name => {
    const attempt = attempts.find(item => item.provider === name);
    const chip = document.createElement("span");
    const activeProvider = diagnostics.provider === name && successful;
    const knownResearchProvider = label === "Research Expert" && name === "Gemini" && successful;
    chip.className = "feedback-provider " + (attempt ? (attempt.ok ? "success" : "failed") : (activeProvider || knownResearchProvider ? "success" : "pending"));
    if (attempt) chip.textContent = name + " · " + (attempt.ok ? "success" : "failed") + " · " + (attempt.ms ? (attempt.ms / 1000).toFixed(1) + "s" : "—");
    else if (activeProvider || knownResearchProvider) chip.textContent = name + " · success";
    else chip.textContent = name + " · " + (diagnostics.status === "failed" ? "not reached" : "not used");
    list.append(chip);
  });
  if (diagnostics.error) detail.textContent += " Error: " + diagnostics.error;
}

const feedbackForm = document.getElementById("quality-feedback-form");
if (feedbackForm) feedbackForm.addEventListener("submit", async event => {
  event.preventDefault();
  const button = feedbackForm.querySelector("button[type='submit']");
  const message = document.getElementById("feedback-submit-status");
  const rating = document.getElementById("feedback-rating").value;
  if (!rating) { message.textContent = "Choose an overall quality rating first."; return; }
  button.disabled = true;
  message.textContent = "Sending feedback...";
  try {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: lastFeedbackModule,
        mode: typeof simulatorMode === "string" ? simulatorMode : "research",
        rating,
        issue: document.getElementById("feedback-issue").value,
        comment: document.getElementById("feedback-comment").value.trim(),
        diagnostics: lastFeedbackDiagnostics
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Feedback could not be sent.");
    message.textContent = payload.message || "Thank you. Feedback received.";
    document.getElementById("feedback-comment").value = "";
    document.getElementById("feedback-rating").value = "";
    document.getElementById("feedback-issue").value = "none";
  } catch (error) {
    message.textContent = error.message || "Feedback could not be sent. Please try again.";
  } finally {
    button.disabled = false;
  }
});

const strategicModeButton=document.getElementById("strategic-mode");
const professionModeButton=document.getElementById("profession-mode");
const professionContextFields=document.getElementById("profession-context-fields");
function setSimulatorMode(mode){
  simulatorMode=mode==="profession"?"profession":"strategic";
  const isProfession=simulatorMode==="profession";
  strategicModeButton.classList.toggle("is-active",!isProfession);
  professionModeButton.classList.toggle("is-active",isProfession);
  strategicModeButton.setAttribute("aria-pressed",String(!isProfession));
  professionModeButton.setAttribute("aria-pressed",String(isProfession));
  professionContextFields.hidden=!isProfession;
}
strategicModeButton.addEventListener("click",()=>setSimulatorMode("strategic"));
professionModeButton.addEventListener("click",()=>setSimulatorMode("profession"));

scenarioInput.addEventListener("input",()=>{charCount.textContent=scenarioInput.value.length.toLocaleString()+" / 8,000";});
document.querySelectorAll('input[name="scope"]').forEach(input=>input.addEventListener("change",()=>{currentScope=input.value;document.querySelectorAll(".mode-option").forEach(option=>option.classList.toggle("selected",option.querySelector("input").checked));}));

function showStatus(message,isError=false){statusBox.hidden=false;statusBox.className=isError?"status error":"status";statusBox.textContent=message;}
function make(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined&&text!==null)node.textContent=text;return node;}
function addFactorCard(parent,title,items){if(!Array.isArray(items)||!items.length)return;const card=make("article","factor");card.append(make("h4","",title));card.append(make("p","",items.map(item=>typeof item==="string"?item:(item.name||item.title||"Factor")+(item.why||item.role||item.why_it_matters?" — "+(item.why||item.role||item.why_it_matters):"")+(item.incentive_or_interest?" (interest: "+item.incentive_or_interest+")":"")+(item.reach?" ["+item.reach+" influence]":"")).join(" · ")));parent.append(card);}
function addDetail(parent,label,value){if(!value||(Array.isArray(value)&&!value.length))return;const p=make("p");p.append(make("b","",label+": "),document.createTextNode(Array.isArray(value)?value.join("; "):String(value)));parent.append(p);}
function renderOutcomes(outcomes,list){outcomes.forEach(outcome=>{const details=document.createElement("details");details.className="outcome";if(outcome.rank===1)details.open=true;const summary=document.createElement("summary");summary.append(make("span","rank",String(outcome.rank||list.children.length+1)));const main=document.createElement("span");main.append(make("span","outcome-title",outcome.title||"Possible outcome"));const meta=make("span","outcome-meta");meta.append(make("span","tag",outcome.category||"Mixed drivers"));main.append(meta);summary.append(main);summary.append(make("span","likelihood"+(String(outcome.likelihood||"").toLowerCase().includes("moderate")?" moderate":""),outcome.likelihood||"Plausible"));details.append(summary);const body=make("div","outcome-body");addDetail(body,"What happens",outcome.description);addDetail(body,"Why it happens",outcome.causal_chain);addDetail(body,"Conditions required",outcome.conditions);addDetail(body,"Main drivers",outcome.drivers);addDetail(body,"Early signs",outcome.early_signs);addDetail(body,"What could change it",outcome.changing_conditions);if(Array.isArray(outcome.counter_moves)&&outcome.counter_moves.length){const responseBox=make("div","counter-move-list");responseBox.append(make("h4","","Possible challenges and responses"));outcome.counter_moves.slice(0,4).forEach((move,index)=>{const item=make("article","counter-move-item");item.append(make("strong","",move.move||"Possible challenge"));if(move.response)item.append(make("p","","Response: "+move.response));if(move.evidence_needed)item.append(make("p","","Prepare: "+move.evidence_needed));if(move.watch_for)item.append(make("p","","Watch for: "+move.watch_for));responseBox.append(item);});body.append(responseBox);}if(outcome.blind_spot)body.append(make("div","blindspot","Potential blind spot: "+outcome.blind_spot));details.append(body);list.append(details);});}
function render(data,append=false){if(!append){resultsBox.replaceChildren();const head=make("div","results-head");head.append(make("div","results-kicker",currentScope==="expanded"?"EXPANDED CONTEXT ANALYSIS":"SMALL CONTEXT ANALYSIS"));head.append(make("h2","",data.title||"Your possible outcomes"));head.append(make("p","results-summary",data.overview||"Plausible ways this situation could unfold."));if(data.scope_boundary)head.append(make("p","disclaimer","Scope boundary: "+data.scope_boundary));resultsBox.append(head);
const factorSection=make("section","section-block");factorSection.append(make("h3","section-title","What shapes the situation"));const grid=make("div","factor-grid");addFactorCard(grid,"Influential variables",data.influential_variables);addFactorCard(grid,"Constants",data.constants);addFactorCard(grid,"Constraints",data.constraints);addFactorCard(grid,"Actors and groups",data.actors);addFactorCard(grid,"Other relevant components",data.components);addFactorCard(grid,"Important unknowns",data.unknowns);addFactorCard(grid,"Interactions to watch",data.interactions);factorSection.append(grid);resultsBox.append(factorSection);
if(data.professional_context){const pc=data.professional_context;const professional=make("section","section-block");professional.append(make("h3","section-title","Professional and local operating context"));const professionalGrid=make("div","factor-grid");addFactorCard(professionalGrid,"Professional workflow",pc.workflow_nuances);addFactorCard(professionalGrid,"Country-specific practice and rules",pc.local_practice_and_rules);addFactorCard(professionalGrid,"Role and stakeholder dynamics",pc.role_dynamics);addFactorCard(professionalGrid,"Professional risks",pc.professional_risks);addFactorCard(professionalGrid,"What needs local verification",pc.verification_gaps);professional.append(professionalGrid);if(Array.isArray(pc.source_links)&&pc.source_links.length){const refs=make("div","research-citations");pc.source_links.forEach(source=>{const link=document.createElement("a");link.href=source.url;link.target="_blank";link.rel="noopener noreferrer";link.textContent=source.title||source.url;refs.append(link);});professional.append(refs);}resultsBox.append(professional);}
const blind=make("section","section-block");blind.append(make("h3","section-title","Blind spots worth checking"));const blindGrid=make("div","factor-grid");(data.blind_spots||[]).forEach(item=>{const card=make("article","factor");card.append(make("h4","",item.title||"Overlooked factor"));card.append(make("p","",item.why_it_matters||item.description||""));blindGrid.append(card);});blind.append(blindGrid);resultsBox.append(blind);}
let metrics=resultsBox.querySelector(".metrics");if(!metrics){metrics=make("div","metrics");[["0","outcomes explored"],[String((data.key_drivers||[]).length),"key drivers identified"],[String((data.blind_spots||[]).length),"blind spots surfaced"]].forEach(([n,label])=>{const m=make("div","metric");m.append(make("strong","",n),make("span","",label));metrics.append(m);});resultsBox.insertBefore(metrics,resultsBox.querySelector(".section-block"));}
let section=resultsBox.querySelector(".outcome-section");if(!section){section=make("section","section-block outcome-section");section.append(make("h3","section-title","Possible outcomes"));section.append(make("div","outcome-list"));resultsBox.insertBefore(section,resultsBox.querySelector(".section-block"));}
const list=section.querySelector(".outcome-list");renderOutcomes(data.outcomes||[],list);metrics.querySelector(".metric strong").textContent=String(list.children.length);
if(!section.querySelector(".more-row")){const row=make("div","more-row");const button=make("button","more-button","Explore more possible outcomes");button.type="button";button.addEventListener("click",expandOutcomes);row.append(button);section.append(row);}
if(!append)resultsBox.append(make("p","disclaimer",data.caveat||"Likelihood labels are comparative judgments, not measured probabilities. These are scenarios to test, not guarantees."));}
async function expandOutcomes(){if(!currentAnalysis||expanding)return;expanding=true;const button=resultsBox.querySelector(".more-button");button.disabled=true;button.textContent="Exploring additional possibilities...";showStatus("Searching for additional distinct outcomes within the same context boundary...");setFeedbackPending("Scenario expansion");try{const response=await fetch("/api/outcomes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({scenario:scenarioInput.value.trim(),scope:currentScope,action:"expand",existing_outcomes:currentAnalysis.outcomes.map(item=>item.title),profession:simulatorMode==="profession"?(document.getElementById("scenario-profession")?.value||""):"",country:simulatorMode==="profession"?(document.getElementById("scenario-country")?.value.trim()||""):"",professional_mode:simulatorMode==="profession"})});const payload=await response.json().catch(()=>({}));updateFeedbackMonitor(payload.diagnostics,"Scenario expansion");if(!response.ok)throw new Error(payload.error||"Could not expand the outcome set.");const extra=payload.analysis;const seen=new Set(currentAnalysis.outcomes.map(item=>String(item.title||"").toLowerCase()));const fresh=(extra.outcomes||[]).filter(item=>!seen.has(String(item.title||"").toLowerCase()));if(!fresh.length)throw new Error("No meaningfully distinct additional outcomes were found at this scope. Try a new analysis with the expanded-context mode to widen the lens.");fresh.forEach((item,i)=>item.rank=currentAnalysis.outcomes.length+i+1);currentAnalysis.outcomes.push(...fresh);render({...currentAnalysis,outcomes:fresh},true);statusBox.hidden=true;button.textContent="Explore more possible outcomes";}catch(error){showStatus(error.message||"Unable to expand outcomes.",true);button.textContent="Try exploring more outcomes";}finally{expanding=false;button.disabled=false;}}
runButton.addEventListener("click",async()=>{const scenario=scenarioInput.value.trim();if(scenario.length<20){showStatus("Describe the situation in a little more detail so STRATOS has enough context to analyse it.",true);scenarioInput.focus();return;}runButton.disabled=true;runButton.querySelector("span:first-child").textContent="Exploring...";resultsBox.hidden=true;resultsBox.replaceChildren();currentAnalysis=null;showStatus(currentScope==="expanded"?"Widening the lens carefully to find relevant surrounding influences...":"Mapping the immediate situation and its plausible outcomes...");setFeedbackPending("Scenario analysis");try{const response=await fetch("/api/outcomes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({scenario,scope:currentScope,action:"initial",profession:simulatorMode==="profession"?(document.getElementById("scenario-profession")?.value||""):"",country:simulatorMode==="profession"?(document.getElementById("scenario-country")?.value.trim()||""):"",professional_mode:simulatorMode==="profession"})});const payload=await response.json().catch(()=>({}));updateFeedbackMonitor(payload.diagnostics,"Scenario analysis");if(!response.ok)throw new Error(payload.error||"STRATOS could not complete the analysis. Please try again.");if(!payload.analysis||!Array.isArray(payload.analysis.outcomes)||payload.analysis.outcomes.length<3)throw new Error("The analysis came back incomplete. Please run it again.");currentAnalysis=payload.analysis;if(currentAnalysis.professional_context)currentAnalysis.professional_context.source_links=payload.sources||[];render(currentAnalysis);statusBox.hidden=true;resultsBox.hidden=false;resultsBox.scrollIntoView({behavior:"smooth",block:"start"});}catch(error){showStatus(error.message||"Something went wrong. Please try again.",true);}finally{runButton.disabled=false;runButton.querySelector("span:first-child").textContent="Explore outcomes";}});



/* RESEARCH EXPERT — web-grounded investigation module. */
const outcomesTab = document.getElementById("outcomes-tab");
const researchTab = document.getElementById("research-tab");
const outcomesModule = document.getElementById("outcomes-module");
const researchModule = document.getElementById("research-module");
const researchQuestion = document.getElementById("research-question");
const researchContext = document.getElementById("research-context");
const researchButton = document.getElementById("research-run-button");
const researchStatus = document.getElementById("research-status");
const researchResults = document.getElementById("research-results");

function switchModule(which) {
  const showResearch = which === "research";
  outcomesModule.hidden = showResearch;
  researchModule.hidden = !showResearch;
  outcomesTab.classList.toggle("is-active", !showResearch);
  researchTab.classList.toggle("is-active", showResearch);
  outcomesTab.setAttribute("aria-pressed", String(!showResearch));
  researchTab.setAttribute("aria-pressed", String(showResearch));
  window.scrollTo({ top: document.querySelector(".module-switcher").offsetTop - 18, behavior: "smooth" });
}
outcomesTab.addEventListener("click", () => switchModule("outcomes"));
researchTab.addEventListener("click", () => switchModule("research"));

function researchNode(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined && value !== null) node.textContent = String(value);
  return node;
}
function researchSection(parent, title, eyebrow) {
  const section = researchNode("section", "research-section");
  if (eyebrow) section.append(researchNode("p", "research-section-eyebrow", eyebrow));
  section.append(researchNode("h3", "research-section-title", title));
  parent.append(section);
  return section;
}
function researchCard(parent, title, body, meta) {
  const card = researchNode("article", "research-card");
  card.append(researchNode("h4", "", title || "Research note"));
  if (meta) card.append(researchNode("p", "research-card-meta", meta));
  if (body) card.append(researchNode("p", "research-card-body", body));
  parent.append(card);
  return card;
}
function researchSourceLinks(parent, urls, sourceMap) {
  if (!Array.isArray(urls) || !urls.length) return;
  const wrap = researchNode("div", "research-citations");
  urls.forEach(url => {
    const source = sourceMap.get(url);
    if (!source) return;
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = source.title || new URL(source.url).hostname;
    link.title = source.url;
    wrap.append(link);
  });
  if (wrap.childElementCount) parent.append(wrap);
}
function researchList(items, formatter) {
  const list = document.createElement("ul");
  list.className = "research-bullet-list";
  (items || []).forEach(item => {
    const li = document.createElement("li");
    li.textContent = formatter ? formatter(item) : String(item);
    list.append(li);
  });
  return list;
}
function renderResearchReport(payload) {
  const report = payload.report || {};
  const sources = Array.isArray(payload.sources) ? payload.sources : [];
  const sourceMap = new Map(sources.map(source => [source.url, source]));
  researchResults.replaceChildren();

  const head = researchNode("header", "research-results-head");
  head.append(researchNode("p", "research-results-kicker", "STRATOS / RESEARCH DOSSIER"));
  head.append(researchNode("h2", "", report.title || "Research findings"));
  head.append(researchNode("p", "research-executive-summary", report.executive_summary || "The investigation is complete. Review the evidence and limitations below."));
  const confidence = researchNode("span", "research-confidence", "Confidence: " + (report.confidence || "Unrated"));
  head.append(confidence);
  if (report.confidence_reason) head.append(researchNode("p", "research-confidence-reason", report.confidence_reason));
  researchResults.append(head);

  const metrics = researchNode("div", "research-metrics");
  [
    [String(sources.length), "web sources surfaced"],
    [String((report.key_findings || []).length), "key findings"],
    [String((report.risks || []).length), "risks examined"],
    [String((report.blind_spot_audit || []).length), "blind spots audited"]
  ].forEach(([number, label]) => {
    const item = researchNode("div", "research-metric");
    item.append(researchNode("strong", "", number), researchNode("span", "", label));
    metrics.append(item);
  });
  researchResults.append(metrics);

  if (report.scope_and_method) {
    const method = researchSection(researchResults, "How the investigation was conducted", "METHOD");
    researchCard(method, "Scope and approach", report.scope_and_method);
  }

  const findings = report.key_findings || [];
  if (findings.length) {
    const section = researchSection(researchResults, "What the evidence says", "01 / KEY FINDINGS");
    const grid = researchNode("div", "research-card-grid");
    findings.forEach(item => {
      const card = researchNode("article", "research-card");
      const strength = researchNode("span", "research-strength " + String(item.evidence_strength || "limited").toLowerCase(), item.evidence_strength || "Evidence strength not rated");
      card.append(strength, researchNode("h4", "", item.title || "Finding"), researchNode("p", "research-card-body", item.detail || ""));
      if (item.significance) card.append(researchNode("p", "research-card-implication", item.significance));
      researchSourceLinks(card, item.source_urls, sourceMap);
      grid.append(card);
    });
    section.append(grid);
  }

  if ((report.evidence_points || []).length) {
    const section = researchSection(researchResults, "Claims and supporting evidence", "02 / EVIDENCE CHECK");
    const list = researchNode("div", "research-evidence-list");
    report.evidence_points.forEach(item => {
      const card = researchNode("article", "research-evidence-item");
      card.append(researchNode("h4", "", item.claim || "Evidence point"));
      card.append(researchNode("p", "", item.evidence || ""));
      if (item.caveat) card.append(researchNode("p", "research-caveat", "Qualification: " + item.caveat));
      researchSourceLinks(card, item.source_urls, sourceMap);
      list.append(card);
    });
    section.append(list);
  }

  if ((report.charts || []).length) {
    const section = researchSection(researchResults, "The numbers, made visible", "03 / DATA & CHARTS");
    (report.charts || []).forEach(chart => {
      const chartBox = researchNode("article", "research-chart");
      const chartHead = researchNode("div", "research-chart-head");
      chartHead.append(researchNode("h4", "", chart.title || "Evidence comparison"));
      if (chart.unit) chartHead.append(researchNode("span", "", chart.unit));
      chartBox.append(chartHead);
      if (chart.takeaway) chartBox.append(researchNode("p", "research-chart-takeaway", chart.takeaway));
      const values = chart.data || [];
      const max = Math.max(1, ...values.map(point => Math.abs(point.value)));
      const rows = researchNode("div", "research-chart-rows");
      values.forEach(point => {
        const row = researchNode("div", "research-chart-row");
        const label = researchNode("div", "research-chart-label");
        label.append(researchNode("span", "", point.label || "Data point"), researchNode("strong", "", Number(point.value).toLocaleString() + (chart.unit ? " " + chart.unit : "")));
        const track = researchNode("div", "research-chart-track");
        const fill = researchNode("div", "research-chart-fill");
        fill.style.width = Math.max(1, Math.min(100, Math.abs(point.value) / max * 100)) + "%";
        track.append(fill);
        row.append(label, track);
        researchSourceLinks(row, point.source_urls, sourceMap);
        rows.append(row);
      });
      chartBox.append(rows);
      if (chart.caveat) chartBox.append(researchNode("p", "research-caveat", chart.caveat));
      section.append(chartBox);
    });
  } else {
    const section = researchSection(researchResults, "No reliable chart data found", "03 / DATA CHECK");
    researchCard(section, "Why there is no chart", "The investigation did not find enough reliable, comparable numeric evidence to create a meaningful chart. No values have been invented to fill the gap.");
  }

  if ((report.landscape || []).length) {
    const section = researchSection(researchResults, "The wider landscape", "04 / SYSTEM & MARKET MAP");
    const grid = researchNode("div", "research-card-grid");
    report.landscape.forEach(item => {
      const card = researchNode("article", "research-card");
      card.append(researchNode("h4", "", item.dimension || "Landscape factor"));
      if (item.direction) card.append(researchNode("span", "research-direction", item.direction));
      card.append(researchNode("p", "research-card-body", item.current_state || ""));
      if (item.implication) card.append(researchNode("p", "research-card-implication", item.implication));
      researchSourceLinks(card, item.source_urls, sourceMap);
      grid.append(card);
    });
    section.append(grid);
  }

  if ((report.competitive_landscape || []).length) {
    const section = researchSection(researchResults, "Competitors, alternatives and substitutes", "05 / COMPETITIVE LANDSCAPE");
    const grid = researchNode("div", "research-card-grid");
    report.competitive_landscape.forEach(item => {
      const card = researchNode("article", "research-card");
      card.append(researchNode("h4", "", item.name || "Market player"));
      if (item.positioning) card.append(researchNode("p", "research-card-body", item.positioning));
      if (item.offer_or_model) card.append(researchNode("p", "research-card-meta", "Offer / model: " + item.offer_or_model));
      if (item.strengths && item.strengths.length) card.append(researchNode("p", "research-card-implication", "Strengths: " + item.strengths.join(" · ")));
      if (item.weaknesses_or_gaps && item.weaknesses_or_gaps.length) card.append(researchNode("p", "research-card-meta", "Weaknesses / gaps: " + item.weaknesses_or_gaps.join(" · ")));
      researchSourceLinks(card, item.source_urls, sourceMap);
      grid.append(card);
    });
    section.append(grid);
  }

  if ((report.market_segments || []).length) {
    const section = researchSection(researchResults, "Who is underserved, and why", "06 / CUSTOMER & MARKET SEGMENTS");
    const grid = researchNode("div", "research-card-grid");
    report.market_segments.forEach(item => {
      const card = researchNode("article", "research-card");
      card.append(researchNode("h4", "", item.segment || "Market segment"));
      if (item.need) card.append(researchNode("p", "research-card-body", "Need: " + item.need));
      if (item.unmet_need) card.append(researchNode("p", "research-card-implication", "Potential gap: " + item.unmet_need));
      if (item.barriers && item.barriers.length) card.append(researchNode("p", "research-card-meta", "Barriers: " + item.barriers.join(" · ")));
      researchSourceLinks(card, item.source_urls, sourceMap);
      grid.append(card);
    });
    section.append(grid);
  }

  if ((report.stakeholders || []).length) {
    const section = researchSection(researchResults, "Who influences the system", "07 / STAKEHOLDERS");
    const grid = researchNode("div", "research-card-grid");
    report.stakeholders.forEach(item => {
      const card = researchNode("article", "research-card");
      card.append(researchNode("h4", "", item.name || "Stakeholder"));
      if (item.influence) card.append(researchNode("span", "research-direction", item.influence + " influence"));
      card.append(researchNode("p", "research-card-body", item.role || ""));
      if (item.interest) card.append(researchNode("p", "research-card-meta", "Interest: " + item.interest));
      if (item.implication) card.append(researchNode("p", "research-card-implication", item.implication));
      grid.append(card);
    });
    section.append(grid);
  }

  if ((report.information_asymmetries || []).length) {
    const section = researchSection(researchResults, "Who knows what others don't", "08 / INFORMATION ASYMMETRIES");
    const list = researchNode("div", "research-evidence-list");
    report.information_asymmetries.forEach(item => {
      const card = researchNode("article", "research-evidence-item");
      card.append(researchNode("h4", "", item.actor || "Information holder"));
      if (item.information_advantage) card.append(researchNode("p", "", "Information advantage: " + item.information_advantage));
      if (item.public_evidence) card.append(researchNode("p", "", "Public traces: " + item.public_evidence));
      if (item.why_it_matters) card.append(researchNode("p", "research-card-implication", "Why it matters: " + item.why_it_matters));
      if (item.how_to_verify) card.append(researchNode("p", "research-card-meta", "How to verify: " + item.how_to_verify));
      researchSourceLinks(card, item.source_urls, sourceMap);
      list.append(card);
    });
    section.append(list);
  }

  if ((report.opportunities || []).length) {
    const section = researchSection(researchResults, "Where the opportunities are", "09 / OPPORTUNITIES");
    const grid = researchNode("div", "research-card-grid");
    report.opportunities.forEach(item => {
      const card = researchNode("article", "research-card");
      card.append(researchNode("h4", "", item.title || "Opportunity"));
      if (item.why_now) card.append(researchNode("p", "research-card-body", item.why_now));
      if (item.practical_move) card.append(researchNode("p", "research-card-implication", "Practical move: " + item.practical_move));
      if (item.effort || item.potential) card.append(researchNode("p", "research-card-meta", "Effort: " + (item.effort || "Unrated") + " · Potential: " + (item.potential || "Unrated")));
      researchSourceLinks(card, item.source_urls, sourceMap);
      grid.append(card);
    });
    section.append(grid);
  }

  if ((report.risks || []).length) {
    const section = researchSection(researchResults, "What could go wrong", "10 / RISK REGISTER");
    const grid = researchNode("div", "research-card-grid");
    report.risks.forEach(item => {
      const card = researchNode("article", "research-card research-risk-card");
      card.append(researchNode("h4", "", item.title || "Risk"));
      card.append(researchNode("span", "research-risk-level", "Likelihood: " + (item.likelihood || "Unclear") + " · Impact: " + (item.impact || "Unrated")));
      if (item.early_warning) card.append(researchNode("p", "research-card-body", "Watch for: " + item.early_warning));
      if (item.mitigation) card.append(researchNode("p", "research-card-implication", "Response: " + item.mitigation));
      researchSourceLinks(card, item.source_urls, sourceMap);
      grid.append(card);
    });
    section.append(grid);
  }

  if ((report.blind_spot_audit || []).length) {
    const section = researchSection(researchResults, "What a quick answer might miss", "11 / BLIND-SPOT AUDIT");
    const list = researchNode("div", "research-blindspot-list");
    report.blind_spot_audit.forEach(item => {
      const card = researchNode("article", "research-blindspot");
      card.append(researchNode("span", "research-priority", item.priority || "Review"));
      card.append(researchNode("h4", "", item.blind_spot || "Potential blind spot"));
      if (item.why_it_is_missed) card.append(researchNode("p", "research-card-body", "Why it gets missed: " + item.why_it_is_missed));
      if (item.consequence) card.append(researchNode("p", "research-card-implication", "Why it matters: " + item.consequence));
      if (item.how_to_check) card.append(researchNode("p", "research-card-meta", "How to check: " + item.how_to_check));
      list.append(card);
    });
    section.append(list);
  }

  if ((report.open_questions || []).length) {
    const section = researchSection(researchResults, "What remains unanswered", "12 / OPEN QUESTIONS");
    const list = researchNode("div", "research-evidence-list");
    report.open_questions.forEach(item => {
      const card = researchNode("article", "research-evidence-item");
      card.append(researchNode("h4", "", item.question || "Open question"));
      if (item.why_it_matters) card.append(researchNode("p", "", item.why_it_matters));
      if (item.best_next_source) card.append(researchNode("p", "research-card-meta", "Best next check: " + item.best_next_source));
      list.append(card);
    });
    section.append(list);
  }

  if ((report.recommendations || []).length) {
    const section = researchSection(researchResults, "What to do with the findings", "13 / RECOMMENDED ACTIONS");
    const list = researchNode("div", "research-action-list");
    report.recommendations.forEach(item => {
      const card = researchNode("article", "research-action");
      card.append(researchNode("span", "research-action-priority", item.priority || "Action"));
      card.append(researchNode("h4", "", item.action || "Recommended action"));
      if (item.rationale) card.append(researchNode("p", "research-card-body", item.rationale));
      if (item.trigger_to_revisit) card.append(researchNode("p", "research-card-meta", "Revisit if: " + item.trigger_to_revisit));
      list.append(card);
    });
    section.append(list);
  }

  if ((report.watchlist || []).length) {
    const section = researchSection(researchResults, "Signals worth watching", "14 / MONITORING");
    const grid = researchNode("div", "research-card-grid");
    report.watchlist.forEach(item => {
      const card = researchNode("article", "research-card");
      card.append(researchNode("h4", "", item.signal || "Signal"));
      if (item.why) card.append(researchNode("p", "research-card-body", item.why));
      if (item.direction_to_watch) card.append(researchNode("p", "research-card-implication", item.direction_to_watch));
      grid.append(card);
    });
    section.append(grid);
  }

  const limitations = report.limitations || [];
  const trail = Array.from(new Set([...(payload.search_queries || []), ...(report.search_queries || [])])).slice(0, 30);
  if (limitations.length || trail.length || report.scope_and_method) {
    const section = researchSection(researchResults, "Coverage, search trail and limitations", "15 / TRANSPARENCY");
    if (limitations.length) {
      const card = researchNode("article", "research-card research-transparency");
      card.append(researchNode("h4", "", "What could not be verified"));
      card.append(researchList(limitations));
      section.append(card);
    }
    if (trail.length) {
      const card = researchNode("article", "research-card research-transparency");
      card.append(researchNode("h4", "", "Search queries used"));
      const chips = researchNode("div", "research-query-list");
      trail.forEach(query => chips.append(researchNode("span", "research-query-chip", query)));
      card.append(chips);
      section.append(card);
    }
  }

  if (sources.length) {
    const section = researchSection(researchResults, "Sources consulted", "16 / SOURCE LIBRARY");
    const list = researchNode("div", "research-sources-grid");
    sources.forEach((source, index) => {
      const card = researchNode("a", "research-source");
      card.href = source.url;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.append(researchNode("span", "research-source-index", String(index + 1).padStart(2, "0")));
      card.append(researchNode("strong", "", source.title || source.url));
      let host = source.url;
      try { host = new URL(source.url).hostname.replace(/^www\./, ""); } catch (_) {}
      card.append(researchNode("small", "", host));
      list.append(card);
    });
    section.append(list);
  } else {
    const section = researchSection(researchResults, "Source verification unavailable", "13 / SOURCE LIBRARY");
    researchCard(section, "No source links were returned", "The search-grounding response did not include source URLs. Treat the report as unverified until the investigation can be repeated with accessible sources.");
  }

  const footer = researchNode("p", "research-report-disclaimer", "Research is a time-bounded investigation, not proof that every relevant source or blind spot has been found. Verify critical claims against the original sources before acting.");
  researchResults.append(footer);
  researchResults.hidden = false;
  activateScrollReveals(researchResults);
}

researchButton.addEventListener("click", async () => {
  const question = researchQuestion.value.trim();
  if (question.length < 12) {
    researchStatus.hidden = false;
    researchStatus.className = "research-status error";
    researchStatus.textContent = "Describe what you want to investigate in a little more detail.";
    researchQuestion.focus();
    return;
  }
  researchButton.disabled = true;
  researchButton.querySelector("span:first-child").textContent = "Researching...";
  researchResults.hidden = true;
  researchResults.replaceChildren();
  researchStatus.hidden = false;
  researchStatus.className = "research-status";
  researchStatus.textContent = "Breaking the question into research avenues, searching the web, cross-checking evidence and auditing blind spots. This may take a little while.";
  setFeedbackPending("Research Expert");
  try {
    const response = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        context: researchContext.value.trim(),
        focus: document.getElementById("research-focus").value,
        geography: document.getElementById("research-geography").value.trim(),
        timeframe: document.getElementById("research-timeframe").value,
        depth: document.getElementById("research-depth").value
      })
    });
    const payload = await response.json().catch(() => ({}));
    updateFeedbackMonitor(payload.diagnostics, "Research Expert");
    if (!response.ok) throw new Error(payload.error || "The research investigation could not be completed.");
    if (!payload.report || typeof payload.report !== "object") throw new Error("The research service returned an incomplete report.");
    renderResearchReport(payload);
    researchStatus.hidden = true;
    researchResults.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    researchStatus.hidden = false;
    researchStatus.className = "research-status error";
    researchStatus.textContent = error.message || "Something went wrong. Please try again.";
  } finally {
    researchButton.disabled = false;
    researchButton.querySelector("span:first-child").textContent = "Begin deep research";
  }
});

// Each panel/card reveals independently with a vertical-only motion; no depth blur or scale.
const revealTargets = ".input-panel, .guide-panel, #status, .results-head, .metrics, .section-title, .disclaimer, .factor, .outcome, .more-row, .research-results-head, .research-metric, .research-section, .research-card, .research-chart, .research-source, .research-blindspot, .research-action";
const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver(entries => {
      entries.forEach(entry => {
        // Keep observing each element. Remove the visible state after it leaves
        // the viewport so its entrance transition can replay on the next visit.
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
      });
    }, { threshold: 0.04, rootMargin: "0px 0px -4% 0px" })
  : null;

function activateScrollReveals(root = document) {
  root.querySelectorAll(revealTargets).forEach(element => {
    if (element.classList.contains("reveal-on-scroll")) return;
    element.classList.add("reveal-on-scroll");
    const siblings = element.parentElement ? Array.from(element.parentElement.children) : [];
    const siblingIndex = Math.max(0, siblings.indexOf(element));
    element.style.setProperty("--reveal-delay", (Math.min(siblingIndex, 5) * 105) + "ms");
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add("is-visible");
  });
}

activateScrollReveals();
if ("MutationObserver" in window) {
  const resultsMotionObserver = new MutationObserver(() => activateScrollReveals(resultsBox));
  resultsMotionObserver.observe(resultsBox, { childList: true, subtree: true });
  const researchMotionObserver = new MutationObserver(() => activateScrollReveals(researchResults));
  researchMotionObserver.observe(researchResults, { childList: true, subtree: true });
}


/* STRATOS ATMOSPHERE — lightweight WebGL/GLSL scene behind the interface.
   The shader renders only into the fixed backdrop layer, never onto UI panels. */
(function initStratosAtmosphere(){
  const backdrop=document.querySelector(".cinematic-backdrop");
  if(!backdrop || !window.WebGLRenderingContext) return;
  const canvas=document.createElement("canvas");
  canvas.className="atmosphere-webgl";
  canvas.setAttribute("aria-hidden","true");
  backdrop.insertBefore(canvas,backdrop.querySelector(".backdrop-vignette")||null);
  const gl=canvas.getContext("webgl",{alpha:true,antialias:false,premultipliedAlpha:false,powerPreference:"low-power"});
  if(!gl) { canvas.remove(); return; }

  const vertexSource=`
    attribute vec2 position;
    varying vec2 uv;
    void main(){ uv=position*.5+.5; gl_Position=vec4(position,0.,1.); }
  `;
  const fragmentSource=`
    precision mediump float;
    varying vec2 uv;
    uniform vec2 resolution;
    uniform float time;

    float hash(vec2 p){
      p=fract(p*vec2(123.34,456.21));
      p+=dot(p,p+45.32);
      return fract(p.x*p.y);
    }
    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      f=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
                 mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
    }
    float fbm(vec2 p){
      float v=0., a=.5;
      mat2 m=mat2(1.6,1.2,-1.2,1.6);
      for(int i=0;i<4;i++){v+=a*noise(p);p=m*p;a*=.5;}
      return v;
    }
    void main(){
      vec2 p=uv;
      float aspect=resolution.x/max(resolution.y,1.);
      vec2 q=vec2((p.x-.5)*aspect,p.y);
      float t=time*.018;

      // Broad, slow-moving smoke banks with soft, layered structure.
      float n1=fbm(vec2(q.x*1.45+t*.7,q.y*2.2-t*.18));
      float n2=fbm(vec2(q.x*2.2-t*.35,q.y*3.1+t*.12)+7.4);
      float cloud=smoothstep(.36,.68,n1*.62+n2*.38);
      float lowFog=smoothstep(.30,.72,fbm(vec2(q.x*1.1-t*.25,q.y*1.8+2.8)));
      float veil=cloud*.48+lowFog*.34;

      // Restrained shafts: broad and blurred, not graphic streaks.
      float beamAx=(q.x+.31+sin(t)*.045)*2.35;
      float beamA=exp(-(beamAx*beamAx))*smoothstep(.02,.86,p.y);
      float beamBx=(q.x-.38-cos(t*.8)*.035)*3.0;
      float beamB=exp(-(beamBx*beamBx))*smoothstep(.08,.9,p.y);
      float shafts=(beamA*.13+beamB*.075)*(0.4+n1*.6);

      // Tiny suspended particles, intentionally sparse and low contrast.
      vec2 cell=floor(p*vec2(38.*aspect,26.));
      float rnd=hash(cell);
      vec2 local=fract(p*vec2(38.*aspect,26.))-.5;
      float drift=time*(.012+fract(rnd*8.)*.018);
      local.y+=drift;
      float dust=(1.0-smoothstep(0.0,.035,length(local))) * step(.992,rnd);
      dust*=.12+.12*sin(time*.7+rnd*30.);

      vec3 smokeColor=vec3(.62,.68,.75);
      vec3 warmColor=vec3(.76,.64,.48);
      float warm= smoothstep(.15,.8,p.x)*smoothstep(.1,.8,p.y);
      vec3 color=mix(smokeColor,warmColor,warm*.28);
      float alpha=veil*.62+shafts+dust;
      // Fade at the perimeter so the photo remains dominant.
      float edge=smoothstep(0.,.18,p.x)*smoothstep(0.,.18,1.-p.x)
                *smoothstep(0.,.16,p.y)*smoothstep(0.,.16,1.-p.y);
      alpha*=edge;
      gl_FragColor=vec4(color,clamp(alpha,0.,.38));
    }
  `;
  function compile(type,source){
    const shader=gl.createShader(type);
    gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);return null;}
    return shader;
  }
  const vs=compile(gl.VERTEX_SHADER,vertexSource), fs=compile(gl.FRAGMENT_SHADER,fragmentSource);
  if(!vs||!fs){canvas.remove();return;}
  const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){canvas.remove();return;}
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,"position");
  gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const resolution=gl.getUniformLocation(program,"resolution");
  const timeUniform=gl.getUniformLocation(program,"time");
  let frame=0, start=performance.now(), last=0, visible=true;
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function resize(){
    const dpr=Math.min(window.devicePixelRatio||1,1.35);
    const w=Math.max(1,Math.floor(backdrop.clientWidth*dpr));
    const h=Math.max(1,Math.floor(backdrop.clientHeight*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
    gl.uniform2f(resolution,w,h);
  }
  function draw(now){
    frame=0;
    if(!visible)return;
    if(!reduced && now-last<40){frame=requestAnimationFrame(draw);return;}
    last=now;resize();
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(timeUniform,reduced?0:(now-start)/1000);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    if(!reduced)frame=requestAnimationFrame(draw);
  }
  function schedule(){if(!frame&&!reduced&&visible)frame=requestAnimationFrame(draw);else if(reduced&&!frame)draw(0);}
  document.addEventListener("visibilitychange",()=>{
    visible=!document.hidden;
    if(visible)schedule();else if(frame){cancelAnimationFrame(frame);frame=0;}
  });
  window.addEventListener("resize",schedule,{passive:true});
  schedule();
})();

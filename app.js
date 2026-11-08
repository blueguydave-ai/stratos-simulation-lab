/* STRATOS — readable, dependency-free application logic. */
(() => {
  "use strict";

  const STORAGE_KEY = "stratos-model-v1";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const uid = () => "v_" + Math.random().toString(36).slice(2, 10);
  const today = () => new Date().toISOString().slice(0, 10);

  const templates = [
    { id:"business", title:"Business & commerce", description:"Demand, offer, distribution, trust, margins, competition.", vars:[["Customer demand","Evidence of real buyer interest.",7,"positive"],["Offer clarity","How easily buyers understand the value.",6,"positive"],["Distribution access","Ability to reach likely buyers.",4,"positive"],["Trust","Belief that the offer and seller are credible.",5,"positive"],["Cash runway","Time available before funds run out.",5,"positive"],["Competition","Alternatives that can win the same buyer.",5,"negative"]] },
    { id:"brokerage", title:"Brokerage & intermediation", description:"Supply access, buyer access, matching, verification, transaction risk.", vars:[["Verified supply","Access to real, available suppliers.",5,"positive"],["Buyer demand","Qualified buyers with intent.",5,"positive"],["Match quality","Fit between buyer needs and supply.",5,"positive"],["Verification","Ability to validate claims and parties.",4,"positive"],["Transaction friction","Steps and delays before completion.",6,"negative"],["Reputation risk","Exposure to fraud or failed delivery.",5,"negative"]] },
    { id:"campus", title:"Campus environment", description:"Student needs, access, timing, peer effects, institutional constraints.", vars:[["Reachable student segment","A clearly defined group you can access.",5,"positive"],["Need intensity","How strongly the problem is felt.",6,"positive"],["Timing","Fit with academic and campus rhythms.",5,"positive"],["Peer distribution","Ability for information to travel through peers.",4,"positive"],["Permission constraints","Rules or access barriers.",5,"negative"],["Payment capacity","Ability and willingness to pay.",4,"positive"]] },
    { id:"b2b", title:"B2B & professional services", description:"Decision makers, procurement, proof, sales cycle, delivery capacity.", vars:[["Problem urgency","Cost of leaving the business problem unsolved.",6,"positive"],["Decision-maker access","Access to people who can approve a purchase.",4,"positive"],["Proof of value","Evidence the solution works.",4,"positive"],["Sales-cycle length","Time from first contact to signed deal.",7,"negative"],["Delivery capacity","Ability to fulfil the promise.",5,"positive"],["Procurement friction","Approvals, compliance, and purchasing steps.",6,"negative"]] },
    { id:"relationships", title:"Relationships & social navigation", description:"Communication, boundaries, trust, incentives, context. Avoid mind-reading.", vars:[["Communication clarity","How clearly needs and intentions are expressed.",5,"positive"],["Trust","Reliability demonstrated over time.",5,"positive"],["Boundary clarity","How well limits and expectations are understood.",5,"positive"],["Context pressure","External stress affecting interactions.",5,"mixed"],["Reciprocity","Balance of effort and consideration.",5,"positive"]] },
    { id:"power", title:"Influence & negotiation", description:"Alternatives, leverage, credibility, timing, information, legitimacy.", vars:[["Credible alternatives","Viable options if agreement is not reached.",5,"positive"],["Information quality","Understanding of interests and constraints.",5,"positive"],["Legitimacy","Whether the proposed outcome is defensible.",5,"positive"],["Time pressure","Deadline pressure on the parties.",5,"mixed"],["Dependence","How much one side relies on the other.",5,"mixed"],["Relationship cost","Potential damage from the process.",5,"negative"]] },
    { id:"product", title:"New or differentiated product", description:"Problem, novelty, usability, switching cost, adoption, repeat use.", vars:[["Problem frequency","How often the target problem occurs.",6,"positive"],["Current alternatives","How well existing solutions perform.",5,"negative"],["Distinctive advantage","Meaningful reason to switch.",4,"positive"],["Ease of adoption","Effort required to start using it.",5,"positive"],["Repeat-use potential","Likelihood of continued value.",5,"positive"],["Feedback access","Ability to observe real use.",4,"positive"]] },
    { id:"international", title:"International / cross-cultural", description:"Local validation, regulation, language, logistics, context-specific norms.", vars:[["Local demand evidence","Evidence from the actual target location.",4,"positive"],["Regulatory clarity","Understanding of applicable rules.",4,"positive"],["Cultural fit","Locally validated fit, not assumed traits.",4,"positive"],["Logistics reliability","Ability to deliver across distance.",4,"positive"],["Local partner quality","Reliability and reach of local partners.",4,"positive"],["Currency exposure","Risk from exchange-rate movement.",5,"negative"]] },
    { id:"custom", title:"Blank custom model", description:"Start with no assumptions and define your own variables.", vars:[] }
  ];

  const initialState = () => ({
    outcome:"", targetDate:"", currentPosition:"", notes:"",
    variables:[], links:[],
    scenarios:{
      baseline:{label:"Baseline",description:"Conditions remain close to your current estimates.",adjustments:{}},
      upside:{label:"Upside",description:"A plausible favourable combination of conditions.",adjustments:{}},
      downside:{label:"Downside",description:"A plausible adverse combination of conditions.",adjustments:{}}
    },
    experiments:[], evidence:[], updatedAt:null
  });

  let state = loadState();
  let activeScenario = "baseline";

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return initialState();
      const parsed = JSON.parse(raw);
      return { ...initialState(), ...parsed, scenarios:{...initialState().scenarios,...(parsed.scenarios||{})} };
    } catch (error) {
      console.warn("Could not load saved STRATOS model.", error);
      return initialState();
    }
  }

  function saveState() {
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      $("#save-status").textContent = "Saved in this browser";
    } catch (error) {
      $("#save-status").textContent = "Export recommended";
    }
    renderOverview();
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[char]));
  }
  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("show"), 2400);
  }
  function variableById(id) { return state.variables.find(variable => variable.id === id); }
  function directionLabel(direction) {
    return direction === "positive" ? "Supports outcome" : direction === "negative" ? "Works against outcome" : "Mixed / uncertain";
  }

  function showView(name) {
    $$(".view").forEach(view => view.classList.toggle("active", view.id === "view-" + name));
    $$(".nav-link").forEach(button => button.classList.toggle("active", button.dataset.view === name));
    const nav = $(`.nav-link[data-view="${name}"]`);
    $("#workspace-title").textContent = nav ? nav.textContent.trim() : name;
    if (name === "model") renderModel();
    if (name === "scenarios") renderScenarios();
    if (name === "stress") renderStress();
    if (name === "experiments") renderExperiments();
    if (name === "evidence") renderEvidence();
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function renderOverview() {
    $("#metric-variables").textContent = state.variables.length;
    $("#metric-evidence").textContent = state.evidence.length;
    $("#metric-experiments").textContent = state.experiments.filter(item => item.status !== "completed").length;
    $("#model-updated").textContent = state.updatedAt ? "Updated " + new Date(state.updatedAt).toLocaleString() : "Start with a working hypothesis";
    $("#template-grid").innerHTML = templates.slice(0,6).map(templateCard).join("");
    $("#method-templates").innerHTML = templates.map(templateCard).join("");
  }

  function templateCard(template) {
    return `<button class="template-card" data-template="${template.id}"><strong>${escapeHTML(template.title)}</strong><span>${escapeHTML(template.description)}</span></button>`;
  }

  function applyTemplate(id) {
    const template = templates.find(item => item.id === id);
    if (!template) return;
    if (state.variables.length && !confirm("Replace the current variables and relationships with this template? Your evidence and experiments will remain.")) return;
    state.variables = template.vars.map(([name,description,level,direction]) => ({
      id:uid(),name,description,level,importance:5,direction,confidence:"medium",notes:""
    }));
    state.links = [];
    if (id === "custom") state.variables = [];
    saveState();
    showView("model");
    toast(template.title + " loaded");
  }

  function renderModel() {
    $("#outcome-title").value = state.outcome;
    $("#target-date").value = state.targetDate;
    $("#current-position").value = state.currentPosition;
    $("#context-notes").value = state.notes;
    $("#variable-list").innerHTML = state.variables.length ? state.variables.map(variable => `
      <article class="variable-card">
        <div><div class="variable-name">${escapeHTML(variable.name)}</div><div class="variable-desc">${escapeHTML(variable.description || "No description added")}</div></div>
        <div><div class="level-track"><div class="level-fill" style="width:${Number(variable.level)*10}%"></div></div><div class="mini-meta">Current level: ${variable.level}/10</div></div>
        <div class="mini-meta"><b>${variable.importance}/10</b>Importance</div>
        <span class="tag">${escapeHTML(directionLabel(variable.direction))}</span>
        <div class="card-actions"><button class="icon-button" data-edit-variable="${variable.id}" title="Edit">✎</button><button class="icon-button" data-delete-variable="${variable.id}" title="Delete">×</button></div>
      </article>`).join("") : '<div class="empty-state">No variables yet. Add the forces that can change your outcome, or choose a context starter on the Overview page.</div>';
    $("#link-list").innerHTML = state.links.length ? state.links.map(link => {
      const from = variableById(link.from), to = variableById(link.to);
      return `<div class="link-row"><span>${escapeHTML(from?.name || "Missing variable")}</span><span class="link-arrow">${link.sign === "positive" ? "＋→" : "−→"} ${link.strength}/3</span><span>${escapeHTML(to?.name || "Missing variable")}<small class="record-meta"> ${escapeHTML(link.reason || "")}</small></span><button class="icon-button" data-delete-link="${link.id}">×</button></div>`;
    }).join("") : '<div class="empty-state">No relationships mapped. Add one when you have a reason to believe one factor influences another.</div>';
    populateVariableSelects();
  }

  function populateSelect(selector, includeBlank = false) {
    const select = $(selector);
    if (!select) return;
    const oldValue = select.value;
    select.innerHTML = (includeBlank ? '<option value="">Choose a variable</option>' : "") + state.variables.map(variable => `<option value="${variable.id}">${escapeHTML(variable.name)}</option>`).join("");
    if (state.variables.some(variable => variable.id === oldValue)) select.value = oldValue;
  }
  function populateVariableSelects() {
    ["#experiment-variable","#evidence-variable","#custom-stress-variable","#link-from","#link-to"].forEach(selector => populateSelect(selector, true));
  }

  function openVariableDialog(id) {
    const variable = id ? variableById(id) : null;
    $("#variable-form").reset();
    $("#variable-id").value = variable?.id || "";
    $("#variable-dialog-title").textContent = variable ? "Edit variable" : "Add variable";
    $("#variable-name").value = variable?.name || "";
    $("#variable-description").value = variable?.description || "";
    $("#variable-level").value = variable?.level ?? 5;
    $("#variable-importance").value = variable?.importance ?? 5;
    $("#variable-direction").value = variable?.direction || "positive";
    $("#variable-confidence").value = variable?.confidence || "medium";
    $("#variable-notes").value = variable?.notes || "";
    $("#level-output").textContent = $("#variable-level").value;
    $("#importance-output").textContent = $("#variable-importance").value;
    $("#variable-dialog").showModal();
  }

  function saveVariable(event) {
    event.preventDefault();
    const id = $("#variable-id").value;
    const variable = {
      id:id || uid(),
      name:$("#variable-name").value.trim(),
      description:$("#variable-description").value.trim(),
      level:Number($("#variable-level").value),
      importance:Number($("#variable-importance").value),
      direction:$("#variable-direction").value,
      confidence:$("#variable-confidence").value,
      notes:$("#variable-notes").value.trim()
    };
    if (!variable.name) return;
    if (id) state.variables = state.variables.map(item => item.id === id ? variable : item);
    else state.variables.push(variable);
    $("#variable-dialog").close();
    saveState(); renderModel(); toast("Variable saved");
  }

  function addRelationship() {
    if (state.variables.length < 2) return toast("Add at least two variables first");
    $("#link-form").reset();
    populateVariableSelects();
    $("#link-dialog").showModal();
  }
  function saveRelationship(event) {
    event.preventDefault();
    const from = $("#link-from").value, to = $("#link-to").value;
    if (!from || !to || from === to) return toast("Choose two different variables");
    state.links.push({id:uid(),from,to,sign:$("#link-sign").value,strength:Number($("#link-strength").value),reason:$("#link-reason").value.trim()});
    $("#link-dialog").close(); saveState(); renderModel(); toast("Relationship added");
  }

  function scenarioScore(key) {
    if (!state.variables.length) return {score:0,details:[]};
    const scenario = state.scenarios[key];
    let weighted = 0, totalWeight = 0;
    const details = state.variables.map(variable => {
      const adjustment = Number(scenario.adjustments[variable.id] || 0);
      const level = Math.max(0,Math.min(10,Number(variable.level) + adjustment));
      const polarity = variable.direction === "positive" ? 1 : variable.direction === "negative" ? -1 : 0;
      const confidenceFactor = variable.confidence === "high" ? 1 : variable.confidence === "low" ? .55 : .8;
      const contribution = (level - 5) * polarity * Number(variable.importance) * confidenceFactor;
      weighted += contribution; totalWeight += Number(variable.importance) * confidenceFactor;
      return {variable,adjustment,level,contribution};
    });
    const score = totalWeight ? Math.round(Math.max(0,Math.min(100,50 + (weighted / (totalWeight * 5)) * 50))) : 50;
    return {score,details};
  }

  function renderScenarios() {
    $$("#scenario-tabs button").forEach(button => button.classList.toggle("selected",button.dataset.scenario === activeScenario));
    const scenario = state.scenarios[activeScenario];
    const result = scenarioScore(activeScenario);
    $("#scenario-content").innerHTML = `<article class="scenario-card"><span class="eyebrow">${scenario.label.toUpperCase()} CONDITIONS</span><h3>${scenario.label} scenario</h3><p>${escapeHTML(scenario.description)}</p><div class="scenario-score">${result.score}<span class="score-caption"> / 100 heuristic alignment</span></div><div class="score-caption">A comparative prompt only — not a probability of success.</div><div class="scenario-adjustments">${state.variables.length ? state.variables.map(variable => {
      const value = Number(scenario.adjustments[variable.id] || 0);
      return `<div class="adjust-row"><label>${escapeHTML(variable.name)}</label><input type="range" min="-5" max="5" step="1" value="${value}" data-adjust="${variable.id}"><output>${value > 0 ? "+" : ""}${value}</output></div>`;
    }).join("") : '<div class="empty-state">Add variables to explore scenario adjustments.</div>'}</div></article>`;
    $("#scenario-comparison").innerHTML = ["upside","baseline","downside"].map(key => {
      const score = scenarioScore(key).score;
      return `<article class="comparison-card"><strong>${state.scenarios[key].label}</strong><div class="score">${score}/100</div><p>${escapeHTML(state.scenarios[key].description)}</p></article>`;
    }).join("");
  }

  const stressPresets = [
    {title:"Demand disappears",description:"What if the people you expect to buy stop responding?",test:v=>v.name.toLowerCase().match(/demand|customer|buyer|student|problem|need/)},
    {title:"Critical resource is lost",description:"What if your key supplier, partner, tool, or access point disappears?",test:v=>v.name.toLowerCase().match(/supply|partner|access|resource|capacity|distribution/)},
    {title:"Trust is damaged",description:"What if a failed promise, scam, or public complaint reduces confidence?",test:v=>v.name.toLowerCase().match(/trust|reputation|proof|verification|credibility/)},
    {title:"Costs or friction rise",description:"What if the process becomes more expensive or takes much longer?",test:v=>v.name.toLowerCase().match(/cost|cash|friction|time|procurement|margin|runway/)},
    {title:"A competitor moves first",description:"What if a credible alternative improves its offer or reaches buyers sooner?",test:v=>v.name.toLowerCase().match(/competition|alternative|distinctive|demand|distribution/)},
    {title:"Your key assumption is wrong",description:"What if the belief with the least evidence turns out to be false?",test:v=>v.confidence==="low"}
  ];
  function renderStress() {
    populateVariableSelects();
    $("#stress-grid").innerHTML = stressPresets.map((preset,index) => {
      const target = state.variables.find(preset.test);
      return `<article class="stress-card"><span class="eyebrow">STRESS TEST 0${index+1}</span><h3>${preset.title}</h3><p>${preset.description}</p><button class="button button-secondary" data-stress="${index}" ${target ? "" : "disabled"}>${target ? "Apply to " + escapeHTML(target.name) : "Add a matching variable first"}</button></article>`;
    }).join("");
  }
  function runStress(variableId,title,impact) {
    const variable = variableById(variableId);
    if (!variable) return "Add or select a variable first.";
    const before = scenarioScore("baseline").score;
    const old = variable.level;
    variable.level = Math.max(0,Math.min(10,old + impact));
    const after = scenarioScore("baseline").score;
    variable.level = old;
    return `This shock changes "${variable.name}" from ${old}/10 to ${Math.max(0,Math.min(10,old+impact))}/10. The heuristic alignment shifts from ${before} to ${after}. Consider a fallback for this dependency and test whether the impact estimate is realistic.`;
  }

  function addExperiment() {
    const assumption = $("#experiment-assumption").value.trim();
    if (!assumption) return toast("Enter an assumption to test");
    state.experiments.unshift({id:uid(),assumption,variableId:$("#experiment-variable").value,speed:$("#experiment-speed").value,cost:$("#experiment-cost").value,action:$("#experiment-action").value.trim(),signal:$("#experiment-signal").value.trim(),status:"open",createdAt:new Date().toISOString()});
    ["#experiment-assumption","#experiment-action","#experiment-signal"].forEach(selector => $(selector).value = "");
    saveState(); renderExperiments(); toast("Experiment added");
  }
  function renderExperiments() {
    populateVariableSelects();
    $("#experiment-list").innerHTML = state.experiments.length ? state.experiments.map(item => {
      const variable = variableById(item.variableId);
      return `<article class="record-card"><div class="record-top"><h3>${escapeHTML(item.assumption)}</h3><span class="tag">${item.status === "completed" ? "Completed" : "Open"}</span></div><div class="record-meta">${escapeHTML(variable?.name || "No variable")} · ${escapeHTML(item.speed)} · ${escapeHTML(item.cost)} effort · ${new Date(item.createdAt).toLocaleDateString()}</div><p><b>Test:</b> ${escapeHTML(item.action || "Not specified")}</p><p><b>Signal:</b> ${escapeHTML(item.signal || "Not specified")}</p><div class="record-actions"><button class="button button-secondary" data-complete-experiment="${item.id}">${item.status === "completed" ? "Reopen" : "Mark completed"}</button><button class="button button-quiet" data-delete-experiment="${item.id}">Delete</button></div></article>`;
    }).join("") : '<div class="empty-state">No experiments yet. Add one small test that could change a decision.</div>';
  }

  function addEvidence() {
    const observation = $("#evidence-observation").value.trim();
    if (!observation) return toast("Enter an observation");
    state.evidence.unshift({id:uid(),observation,variableId:$("#evidence-variable").value,source:$("#evidence-source").value.trim(),confidence:Number($("#evidence-confidence").value),interpretation:$("#evidence-interpretation").value.trim(),createdAt:new Date().toISOString()});
    ["#evidence-observation","#evidence-source","#evidence-interpretation"].forEach(selector => $(selector).value = "");
    saveState(); renderEvidence(); toast("Evidence recorded");
  }
  function renderEvidence() {
    populateVariableSelects();
    $("#evidence-list").innerHTML = state.evidence.length ? state.evidence.map(item => {
      const variable = variableById(item.variableId);
      return `<article class="record-card"><div class="record-top"><h3>${escapeHTML(item.observation)}</h3><span class="tag">${["","Low","Medium","High"][item.confidence]} confidence</span></div><div class="record-meta">${escapeHTML(variable?.name || "General observation")} · ${escapeHTML(item.source || "Source not recorded")} · ${new Date(item.createdAt).toLocaleString()}</div><p><b>Interpretation:</b> ${escapeHTML(item.interpretation || "Not added")}</p><div class="record-actions"><button class="button button-quiet" data-delete-evidence="${item.id}">Delete</button></div></article>`;
    }).join("") : '<div class="empty-state">No observations recorded. Add evidence as it arrives, including evidence that contradicts your assumptions.</div>';
  }

  function exportModel() {
    const blob = new Blob([JSON.stringify({app:"STRATOS",version:1,exportedAt:new Date().toISOString(),model:state},null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "stratos-model-" + today() + ".json"; anchor.click();
    URL.revokeObjectURL(url); toast("Model exported");
  }
  function importModel(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const model = parsed.model || parsed;
        if (!Array.isArray(model.variables) || !Array.isArray(model.links)) throw new Error("This file does not look like a STRATOS model.");
        state = {...initialState(),...model,scenarios:{...initialState().scenarios,...(model.scenarios||{})}};
        saveState(); renderOverview(); showView("overview"); toast("Model imported");
      } catch (error) { alert("Could not import model: " + error.message); }
    };
    reader.readAsText(file);
  }

  function bindEvents() {
    $$(".nav-link").forEach(button => button.addEventListener("click",() => showView(button.dataset.view)));
    $$("[data-goto]").forEach(button => button.addEventListener("click",() => showView(button.dataset.goto)));
    $("#quick-add").addEventListener("click",() => openVariableDialog());
    $("#add-variable").addEventListener("click",() => openVariableDialog());
    $("#variable-form").addEventListener("submit",saveVariable);
    $("#variable-level").addEventListener("input",event => $("#level-output").textContent = event.target.value);
    $("#variable-importance").addEventListener("input",event => $("#importance-output").textContent = event.target.value);
    $("#add-link").addEventListener("click",addRelationship);
    $("#link-form").addEventListener("submit",saveRelationship);
    ["#outcome-title","#target-date","#current-position","#context-notes"].forEach(selector => $(selector).addEventListener("change",event => {
      const key = {"#outcome-title":"outcome","#target-date":"targetDate","#current-position":"currentPosition","#context-notes":"notes"}[selector];
      state[key] = event.target.value; saveState();
    }));
    $("#variable-list").addEventListener("click",event => {
      const edit = event.target.closest("[data-edit-variable]");
      const del = event.target.closest("[data-delete-variable]");
      if (edit) openVariableDialog(edit.dataset.editVariable);
      if (del && confirm("Delete this variable and its relationships?")) {
        const id = del.dataset.deleteVariable;
        state.variables = state.variables.filter(item => item.id !== id);
        state.links = state.links.filter(link => link.from !== id && link.to !== id);
        Object.values(state.scenarios).forEach(scenario => delete scenario.adjustments[id]);
        saveState(); renderModel();
      }
    });
    $("#link-list").addEventListener("click",event => {
      const button = event.target.closest("[data-delete-link]");
      if (button) { state.links = state.links.filter(link => link.id !== button.dataset.deleteLink); saveState(); renderModel(); }
    });
    $("#template-grid").addEventListener("click",event => { const button = event.target.closest("[data-template]"); if (button) applyTemplate(button.dataset.template); });
    $("#method-templates").addEventListener("click",event => { const button = event.target.closest("[data-template]"); if (button) applyTemplate(button.dataset.template); });
    $("#scenario-tabs").addEventListener("click",event => { const button = event.target.closest("[data-scenario]"); if (button) { activeScenario = button.dataset.scenario; renderScenarios(); } });
    $("#scenario-content").addEventListener("input",event => {
      const input = event.target.closest("[data-adjust]");
      if (!input) return;
      state.scenarios[activeScenario].adjustments[input.dataset.adjust] = Number(input.value);
      input.nextElementSibling.textContent = Number(input.value) > 0 ? "+" + input.value : input.value;
      $("#scenario-comparison").innerHTML = ["upside","baseline","downside"].map(key => `<article class="comparison-card"><strong>${state.scenarios[key].label}</strong><div class="score">${scenarioScore(key).score}/100</div><p>${escapeHTML(state.scenarios[key].description)}</p></article>`).join("");
    });
    $("#scenario-content").addEventListener("change",event => { if (event.target.matches("[data-adjust]")) saveState(); });
    $("#reset-scenarios").addEventListener("click",() => { Object.values(state.scenarios).forEach(scenario => scenario.adjustments = {}); saveState(); renderScenarios(); });
    $("#stress-grid").addEventListener("click",event => {
      const button = event.target.closest("[data-stress]");
      if (!button) return;
      const preset = stressPresets[Number(button.dataset.stress)];
      const variable = state.variables.find(preset.test);
      toast(runStress(variable?.id,preset.title,-3));
    });
    $("#run-custom-stress").addEventListener("click",() => {
      const title = $("#custom-stress-title").value.trim();
      if (!title) return toast("Describe the stress condition");
      $("#custom-stress-result").textContent = runStress($("#custom-stress-variable").value,title,Number($("#custom-stress-impact").value));
    });
    $("#save-experiment").addEventListener("click",addExperiment);
    $("#experiment-list").addEventListener("click",event => {
      const complete = event.target.closest("[data-complete-experiment]");
      const del = event.target.closest("[data-delete-experiment]");
      if (complete) { const item = state.experiments.find(x => x.id === complete.dataset.completeExperiment); item.status = item.status === "completed" ? "open" : "completed"; saveState(); renderExperiments(); }
      if (del) { state.experiments = state.experiments.filter(x => x.id !== del.dataset.deleteExperiment); saveState(); renderExperiments(); }
    });
    $("#save-evidence").addEventListener("click",addEvidence);
    $("#evidence-list").addEventListener("click",event => {
      const del = event.target.closest("[data-delete-evidence]");
      if (del) { state.evidence = state.evidence.filter(x => x.id !== del.dataset.deleteEvidence); saveState(); renderEvidence(); }
    });
    $("#export-button").addEventListener("click",exportModel);
    $("#import-file").addEventListener("change",event => { if (event.target.files[0]) importModel(event.target.files[0]); event.target.value = ""; });
  }

  function init() {
    bindEvents();
    renderOverview();
    renderModel();
    $("#target-date").min = today();
  }
  document.addEventListener("DOMContentLoaded",init);
})();
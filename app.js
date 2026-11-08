const scenarioInput = document.getElementById("scenario");
const runButton = document.getElementById("run-button");
const charCount = document.getElementById("char-count");
const statusBox = document.getElementById("status");
const resultsBox = document.getElementById("results");

scenarioInput.addEventListener("input", () => {
  charCount.textContent = scenarioInput.value.length.toLocaleString() + " / 8,000";
});

function showStatus(message, isError = false) {
  statusBox.hidden = false;
  statusBox.className = isError ? "status error" : "status";
  statusBox.textContent = message;
}
function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}
function addFactorCard(parent, title, items) {
  if (!Array.isArray(items) || !items.length) return;
  const card = make("article", "factor");
  card.append(make("h4", "", title));
  const p = make("p", "", items.map(item => typeof item === "string" ? item : item.name + (item.why ? " — " + item.why : "")).join(" · "));
  card.append(p);
  parent.append(card);
}
function addDetail(parent, label, value) {
  if (!value) return;
  const p = make("p");
  const b = make("b", "", label + ": ");
  p.append(b, document.createTextNode(Array.isArray(value) ? value.join("; ") : String(value)));
  parent.append(p);
}
function render(data) {
  resultsBox.replaceChildren();
  resultsBox.hidden = false;

  const head = make("div", "results-head");
  head.append(make("div", "results-kicker", "SCENARIO ANALYSIS"));
  head.append(make("h2", "", data.title || "Your possible outcomes"));
  head.append(make("p", "results-summary", data.overview || "A set of plausible ways this situation could unfold."));
  resultsBox.append(head);

  const outcomes = Array.isArray(data.outcomes) ? data.outcomes : [];
  const metrics = make("div", "metrics");
  [[outcomes.length, "plausible outcomes mapped"], [Array.isArray(data.key_drivers) ? data.key_drivers.length : 0, "key drivers identified"], [Array.isArray(data.blind_spots) ? data.blind_spots.length : 0, "blind spots surfaced"]].forEach(([n, label]) => {
    const m = make("div", "metric"); m.append(make("strong", "", String(n))); m.append(make("span", "", label)); metrics.append(m);
  });
  resultsBox.append(metrics);

  const factorSection = make("section", "section-block");
  factorSection.append(make("h3", "section-title", "What shapes the situation"));
  const factorGrid = make("div", "factor-grid");
  addFactorCard(factorGrid, "Influential variables", data.influential_variables);
  addFactorCard(factorGrid, "Constants", data.constants);
  addFactorCard(factorGrid, "Constraints", data.constraints);
  addFactorCard(factorGrid, "Important unknowns", data.unknowns);
  addFactorCard(factorGrid, "Interactions to watch", data.interactions);
  factorSection.append(factorGrid);
  resultsBox.append(factorSection);

  const outcomeSection = make("section", "section-block");
  outcomeSection.append(make("h3", "section-title", "The 10 most plausible outcomes"));
  const list = make("div", "outcome-list");
  outcomes.forEach((outcome, index) => {
    const details = document.createElement("details");
    details.className = "outcome";
    if (index === 0) details.open = true;
    const summary = document.createElement("summary");
    summary.append(make("span", "rank", String(outcome.rank || index + 1)));
    const main = document.createElement("span");
    main.append(make("span", "outcome-title", outcome.title || "Possible outcome"));
    const meta = make("span", "outcome-meta");
    meta.append(make("span", "tag", outcome.category || "Mixed drivers"));
    main.append(meta);
    summary.append(main);
    const likelihood = make("span", "likelihood" + (String(outcome.likelihood || "").toLowerCase().includes("moderate") ? " moderate" : ""), outcome.likelihood || "Plausible");
    summary.append(likelihood);
    details.append(summary);

    const body = make("div", "outcome-body");
    addDetail(body, "What happens", outcome.description);
    addDetail(body, "Why it happens", outcome.causal_chain);
    addDetail(body, "Conditions required", outcome.conditions);
    addDetail(body, "Main drivers", outcome.drivers);
    addDetail(body, "Early signs", outcome.early_signs);
    addDetail(body, "What could change it", outcome.changing_conditions);
    if (outcome.blind_spot) body.append(make("div", "blindspot", "Potential blind spot: " + outcome.blind_spot));
    details.append(body);
    list.append(details);
  });
  outcomeSection.append(list);
  resultsBox.append(outcomeSection);

  const blind = make("section", "section-block");
  blind.append(make("h3", "section-title", "Blind spots worth checking"));
  const blindGrid = make("div", "factor-grid");
  (data.blind_spots || []).forEach(item => {
    const card = make("article", "factor");
    card.append(make("h4", "", item.title || "Overlooked factor"));
    card.append(make("p", "", item.why_it_matters || item.description || ""));
    blindGrid.append(card);
  });
  blind.append(blindGrid);
  resultsBox.append(blind);

  const disclaimer = make("p", "disclaimer", data.caveat || "Likelihood labels are comparative judgments, not measured probabilities. The scenarios are hypotheses to test against real-world evidence.");
  resultsBox.append(disclaimer);
}

runButton.addEventListener("click", async () => {
  const scenario = scenarioInput.value.trim();
  if (scenario.length < 20) {
    showStatus("Describe the situation in a little more detail so STRATOS has enough context to analyse it.", true);
    scenarioInput.focus();
    return;
  }
  runButton.disabled = true;
  runButton.querySelector("span:first-child").textContent = "Exploring...";
  resultsBox.hidden = true;
  resultsBox.replaceChildren();
  showStatus("Building a model of the situation, testing influential conditions and checking for overlooked outcomes...");
  try {
    const response = await fetch("/api/outcomes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "STRATOS could not complete the analysis. Please try again.");
    if (!payload.analysis || !Array.isArray(payload.analysis.outcomes)) throw new Error("The analysis came back in an unexpected format. Please run it again.");
    render(payload.analysis);
    statusBox.hidden = true;
    resultsBox.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    showStatus(error.message || "Something went wrong. Please try again.", true);
  } finally {
    runButton.disabled = false;
    runButton.querySelector("span:first-child").textContent = "Explore outcomes";
  }
});

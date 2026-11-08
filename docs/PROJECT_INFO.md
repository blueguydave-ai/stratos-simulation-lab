# STRATOS — Project Information & Handoff

Last updated: 2026-11-08 (markets and competition increment)
Repository: https://github.com/blueguydave-ai/stratos-simulation-lab
Live app: https://blueguydave-ai.github.io/stratos-simulation-lab/
Default branch: main

## What this project is
STRATOS (Strategic Simulation Lab) is a modular, human-centred situation modelling and strategy simulation workbench. It should support common and complex situations across business, markets, entrepreneurship, brokerage, negotiation, relationships, social dynamics, organizations, campus/institutional settings, international contexts and cultural differences.

It is a decision-support and scenario exploration tool, not a universal predictor or mind-reading system. It must clearly distinguish observed facts, sourced claims, estimates, assumptions and unknowns. It must represent uncertainty, within-group variation, counterevidence, constraints, delayed effects and unintended consequences.

## User's product requirements
- Build and commit actual readable source code; do not provide only conceptual plans or one-line encoded loaders.
- Keep scenarios nuanced, editable and context-sensitive.
- Model multiple actors with independent goals, incentives, resources, constraints, information and possible responses.
- Support local geography, institutions, markets, legal context, social norms and cultural variation without stereotyping populations.
- Model events, decisions, causal hypotheses, competing strategies, feedback loops, delayed effects and changing conditions.
- Make assumptions and uncertainty visible. Do not label heuristic scores as probabilities.
- Keep costs low and dependencies justified. The user is relatively new to web development and prefers direct, practical explanations.
- Keep this file updated whenever architecture, major files, deployment or next steps materially change.

## Current deployment and constraints
- Static GitHub Pages site; no backend, database, paid API or build pipeline currently required.
- Existing model data is stored in browser localStorage and can be exported/imported as JSON. Users should export backups.
- Do not add a server-only dependency to the deployed browser app.
- Current source is plain JavaScript, HTML and CSS. New modules are framework-free browser scripts loaded by index.html.
- No runtime or deployment success should be claimed without actually testing it in a browser.

## Current architecture
- `index.html`: loads core, validation, domain registry, simulation engine and app shell.
- `app.js`: current user interface, forms, local persistence, export/import and legacy scenario presentation.
- `styles.css`: interface styling.
- `src/core/model.js`: versioned canonical model contract, normalization, structural validation.
- `src/core/validation.js`: validation module boundary.
- `src/domains/registry.js`: initial general, business, brokerage, negotiation, relationships, institutional and cross-cultural packs.
- `src/engines/simulation.js`: deterministic seeded scenario engine, event sampling, explicit strategy effects, actor-response heuristics, communication/belief updates, directional trust, group action, power/dependency modifiers, institutional rules and environmental constraints, scheduled market snapshots with bounded price/competition/substitute/saturation/capacity heuristics, causal propagation and delayed causal effects.
- `docs/ARCHITECTURE.md`: layered architecture and dependency policy.
- `tests/core.test.html`: core contract checks.
- `tests/engine.test.html`: simulation engine contract checks.

## Current simulation engine behaviour
- Runs a bounded number of discrete time steps and causal propagation rounds.
- Supports branch overlays (baseline, favourable, adverse, custom).
- Applies explicitly entered strategy effects.
- Samples event occurrence using a seeded pseudo-random generator; a fixed seed makes a run repeatable.
- Applies explicitly entered actor response effects with a response chance. It does not infer actual human intentions.
- Supports causal-link delays through a `delay` field. Each delayed link is now scheduled once per step from the source state at that step, not once per propagation round.
- Returns a timeline, state snapshots, event outcomes, actor response outcomes, warnings and an indicative alignment score.
- The score and uncertainty band are heuristic, not probabilities or calibrated statistical intervals.
- This is a software contract/prototype, not empirically validated behavioural, economic or cultural simulation.

## Important limitations / known gaps
- Actor response policies now have editable behaviour labels, optional variable triggers, thresholds, response chances and recorded trigger outcomes. Goals, incentives, resources, constraints, information, attention, priority, risk tolerance and time pressure can be recorded, but explicit trigger/effect rules and five user-entered numeric decision drivers influence response propensity. Actors also hold initial beliefs, have editable information access lists, and update accessible beliefs toward observed model state according to learning rate and information confidence. Trigger conditions evaluate actor beliefs, not the objective state. These are transparent heuristics, not calibrated probabilities. Actors now have editable initial beliefs, observable-variable access lists and learning rates. Beliefs update gradually toward the model's current state only for accessible variables, and actor trigger conditions consult their own beliefs. This is a simple information-asymmetry mechanism, not a theory of cognition or calibrated learning. Actor-to-actor communication records support scheduled messages, target variables, claimed values, sender/recipient, perceived credibility and author-labelled accuracy (accurate, partial, misleading). Recipient beliefs update according to information access, learning rate, information confidence and message credibility. This is an explicit message-influence heuristic, not a validated persuasion model. Directional actor relationships now store editable trust, respect, familiarity and supporting notes. Message influence is adjusted by the recipient's directional trust/respect in the sender. Accurate messages modestly increase that directional trust; misleading messages reduce it. Trust changes are applied to a per-run relationship copy, preserving the saved starting assumptions. Trust changes are visible in run results. These are transparent heuristics, not empirically calibrated reputation dynamics. Groups and coalitions now have editable membership, support share, decision threshold, cohesion, coordination capacity, conformity pressure, optional state trigger, scheduled action and explicit variable effects. Collective action is sampled from a transparent coordination heuristic and effects are scaled by support share. Directional power/dependency records identify a holder, dependent actor, leverage source, strength, dependency, legitimacy and explicit mobilize/discourage/neutral effect. When the holder initiates the selected strategy, active relations apply a bounded ±0.12-per-link heuristic modifier to the dependent actor response propensity. These are user-defined scenario rules, not validated authority/compliance laws. Group membership/support and power relations are manually entered; there is no automatic network inference, faction formation, intra-group argument model, reputation propagation or empirical calibration.
- Causal links are user-entered hypotheses. The model does not establish causality.
- No calibrated distributions, real-time data, geographic database, legal database or cultural norms dataset are connected.
- No Monte Carlo ensemble, sensitivity experiment suite or model calibration yet.
- Existing app UI is still a monolithic `app.js`; migrate it incrementally only after preserving working features.
- The app's existing score must always be described as indicative, not predictive.

## Next implementation priorities
1. Verify browser deployment and run both test pages.
2. Expose simulation controls for fixed seed, event uncertainty, link delay and actor response chance.
3. Expand group dynamics: subgroup disagreement, coalition formation and dissolution, network centrality, collective learning and reputation propagation. Then calibrate against observed outcomes.
4. Add event conditions, triggers, recurrence and event dependencies.
5. Add scenario comparison across multiple seeds and uncertainty ranges (clearly labelled as sampled scenarios, not forecast probabilities).
6. Add a feedback/observation loop: predicted signal, actual observation, error, model update and next experiment.
7. Expand domain packs with domain-specific variables, actor roles, event types, validation prompts and tests.
8. Add evidence provenance fields (source URL/title, date, geography, sample, evidence type, licence, confidence, counterevidence, review date).
9. Only later consider TypeScript/Vite, Python/FastAPI, Mesa, SimPy, NetworkX, Postgres/PostGIS, retrieval or LLM adapters when implemented features justify them.

## How a new ChatGPT conversation should continue
1. Read this file first: `docs/PROJECT_INFO.md`.
2. Inspect the current `main` branch before editing; this document can become stale.
3. Preserve the static GitHub Pages deployment unless the user explicitly approves a hosting/backend change.
4. Fetch current file contents and blob SHAs before updating existing files.
5. Commit readable source files. Never replace the app with a single-line base64/gzip loader.
6. Make actual code changes, add tests and update this handoff file after each major increment.
7. Be explicit about what was committed, what was tested, and what remains unverified.

## Product principle
STRATOS must be able to represent what it does not know. It should help users think more clearly, test strategies cheaply and update from reality—not manufacture certainty.


### Institutions and environmental constraints
Added the Institutions & Environment workspace and an `institutions` model collection. Rules support regulation, procedure, informal norm, market barrier, geography/infrastructure, resource limit and other categories; actor targeting; start step; optional variable trigger; severity; enforcement/reach; facilitate/restrict/neutral response effect; explicit variable effects; and source/exception/uncertainty notes. Activated rules apply entered variable effects at their start step and can influence targeted actor response propensity from that step onward. The response modifier is a transparent bounded heuristic (severity × enforcement × 0.15), not a legal, cultural or empirical claim. Four engine contract tests were added; browser execution remains outstanding.


### Markets and competition
Added a `markets` collection and Markets & Competition workspace. Each record defines a market type, segment boundary, snapshot step, offer-price index, purchasing-power reference, price sensitivity, competitive intensity, substitute availability, saturation, supply capacity, linked demand and revenue variables, and evidence/context notes. The engine calculates separate price, competition, substitute, saturation, capacity, demand-potential, sales and revenue factors. It applies bounded changes to linked variables once at the configured step and reports the component factors in run output. These are editable scenario heuristics on a relative 0–10 scale, not live data, calibrated elasticity estimates, absolute market forecasts or a full supply-and-demand equilibrium. Seven engine contract tests were added; browser execution remains outstanding.

### Next recommended increment
Expand this market layer with editable customer segments, competitor offers and reactions, buyer decision journeys, price changes over time and market shocks. Keep each mechanism inspectable and calibrate only when suitable observations are available.

# STRATOS — Project Information & Handoff

Last updated: 2026-11-08 (Natural Language & Strategic Reasoning increment)
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

## Dependency-led user workflow (added 2026-11-08)\n- The first workspace is now **Your workflow**, a guided sequence that computes stage status from the current model and recommends the next useful action.\n- Sequence: situation → actors → variables/causal links → relevant context (optional) → events/uncertainty (optional) → strategies → evidence/feedback → model-quality review → scenario simulation.\n- Essential preparation progress tracks situation, actors, system map, strategies and evidence/completed feedback tests. Context and events are explicitly optional; users can jump to any workspace.\n- Completion indicators mean records exist, not that assumptions are true or the model is realistic. The workflow does not hard-lock later workspaces.\n\n## Current architecture
- `index.html`: loads core, validation, domain registry, simulation engine and app shell.
- `app.js`: current user interface, forms, local persistence, export/import and legacy scenario presentation.
- `styles.css`: interface styling.
- `src/core/model.js`: versioned canonical model contract, normalization, structural validation.
- `src/core/validation.js`: validation module boundary.
- `src/domains/registry.js`: initial general, business, brokerage, negotiation, relationships, institutional and cross-cultural packs.
- `src/engines/simulation.js`: deterministic seeded scenario engine, event sampling, explicit strategy effects, actor-response heuristics, communication/belief updates, directional trust, group action, power/dependency modifiers, institutional rules and environmental constraints, scheduled market snapshots with bounded price/competition/substitute/saturation/capacity heuristics, customer segment offer-fit and relative competitor attraction, explicit strategy-triggered competitor reaction rules, ordered buyer decision journeys with point-of-interest interest/ease/difficulty/access/cost/time/trust/availability friction factors, cumulative continuation index and linked conversion-variable effects, causal propagation and delayed causal effects.
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
Expand this layer with buyer decision journeys across more complex multi-actor purchasing committees, multi-step competitor responses, price changes over time and market shocks. Keep each mechanism inspectable and calibrate only when suitable observations are available.


### Customer segments and competitor offers
Added `segments` and `competitors` model collections and expanded the Markets workspace. Segment records link to a market and capture estimated size share, purchasing power, price sensitivity, own-offer price, needs fit, awareness, switching costs, an optional demand variable and evidence notes. Competitor offer records capture market, price, differentiation, reputation, capacity, scheduled reaction step, optional variable trigger, user-entered reaction chance and explicit reaction effects. The engine calculates a transparent own-offer attraction index against listed rival offers, relative share and bounded segment demand effect. Competitor reactions are only considered when a strategy is selected and explicit reaction rules are present. Eight engine contract tests were added. These mechanisms are scenario heuristics, not observed market share, inferred competitor intentions or calibrated buyer psychology. Browser execution remains outstanding.


### Buyer decision journeys and point-of-interest accessibility
Added `journeys` and `journeyPoints` collections and a Buyer Journeys workspace within Markets & Competition. Journey records link an optional segment, snapshot step, target action and conversion variable. Ordered points of interest represent discovery, consideration, trust, access, contact, approval, payment, delivery, onboarding, retention and referral. Each point separately captures customer interest, ease, difficulty, practical accessibility, access type (digital, physical/geographic, financial/payment, information/language, permission/institutional, social/referral, disability/accommodation or mixed), cost burden, time burden, trust required and available, availability, barriers, workarounds and evidence. The engine computes transparent per-touchpoint completion factors and a cumulative continuation index, with optional linked conversion-variable effect. This is a relative scenario heuristic, not a calibrated conversion probability. Six engine contract tests were added. Browser execution remains outstanding.


### Negotiation and multi-party purchasing
Added `negotiations` and `negotiationParties` collections and a Negotiation & multi-party decisions workspace within Markets. Negotiations define schedule, opening/target offer, bargaining rounds, concession rate, optional linked outcome variable and explicit success/failure effects. Participants are buyers, sellers, approvers, gatekeepers, advisers or other parties. Their authority, willingness, ability, bargaining power, reservation values, minimum thresholds, required status and walk-away threshold are separately editable. Engine output shows reservation overlap, required-party readiness, round-by-round offer movement, agreement status and applied effects. Numeric offer/reservation values share a user-defined scale; no currency conversion, hidden motives or calibrated agreement probability is inferred. Six engine checks added. Browser execution remains outstanding.


### Behavioural responses, objections and decision context
Actor editor now captures contextual loss sensitivity, status-quo preference, cognitive load, urgency, visible social-proof signal and skepticism. These contribute separate transparent modifiers to response propensity, with loss sensitivity interacting with perceived risk. Actors can also record objections, public position, privately reported belief, observable constraint and actual observed action as distinct fields. The engine reports these fields alongside the response outcome and does not assume an objection has been resolved. Six contract tests were added for directional effects, context separation, boundedness and reproducibility. These are provisional heuristics, not validated psychology or universal cultural rules. Browser execution remains outstanding.


### Decision delays, objection lifecycle and counteroffers
Added a `decisionInteractions` collection with actor, linked negotiation, action type, initial step, additional delay, objection and manually assessed objection status, response/evidence, optional offer value, explicit variable effects and notes. Supported actions include hesitation/defer, request evidence, raise objection, counteroffer, partial acceptance, withdraw and return. Delayed actions occur only at their scheduled step. Counteroffers update the linked negotiation opening offer; withdrawal suspends its scheduled negotiation and return reopens it. Objections are never automatically resolved. Five engine contract tests were added. Browser execution remains outstanding.


### Information networks, narrative framing and reputation signals
Communication records now support narrative label, framing, recorded persuasion approach, source visibility, ordered relay recipients, forwarding probability, relay delay and credibility decay. The engine simulates explicit relay chains, applies information-access restrictions at each hop, and records forwarded delivery depth and belief changes. Misleading messages may change beliefs without changing objective variable levels. Six engine tests were added for relay, no-forward conditions, credibility decay, access restrictions, belief/world separation and reproducibility. This does not automatically infer persuasion effectiveness or model a complete social network. Browser test execution remains outstanding.


### Reputation, status signals and audience-specific perceptions
Added a Reputation & audience perceptions editor to the Actors workspace. Reputation events support target actor, positive/negative signal, magnitude, source credibility, evidence status (verified/contested/unverified), audience scope (everyone/selected actors/group), schedule and source notes. The engine tracks run-local subject-observer reputation scores and applies a small bounded modifier to responses toward a selected strategy initiator. This is an explicit heuristic, not a universal law of social status or independent verification of claims. Four tests were defined; browser execution remains outstanding.


### Dynamic alliances and AI influence increment
Added `groupEvents` for recruitment, joining, exit/defection, switching coalitions, support-share changes, cohesion/coordination/conformity changes and dissolution. Group structures are cloned per run. Added `aiSystems` for human-operated tools, autonomous agents, recommendation/ranking systems, content generation, scoring/screening and robotics. Records capture operator, affected actors, activation step, adoption, contextual reliability, oversight, bias, failure modes, evidence/uncertainty notes and explicit variable effects. Effects are scaled by adoption, reliability and oversight; targeted actor response propensity receives a small role-sensitive AI modifier. This is not an empirical AI capability model. Five engine tests were added; browser execution remains outstanding.


### AI competition, collaboration and systemic disruption increment
Added `aiEvents` for AI-vs-AI competition, human–AI collaboration, automation/deployment races, algorithmic influence operations, outages, data/security incidents, gatekeeping and AI-mediated coordination. Each interaction records systems, timing, intensity, base success assumption, separate success/failure variable effects, governance, human impact and risks. Effects are explicitly authored and intensity-scaled; outcomes are scenario samples, not calibrated forecasts. Fixed group processing so active groups are evaluated on every subsequent simulation step and scheduled membership changes affect later group outcomes. Four additional engine checks defined. The engine test HTML had accumulated test definitions after its closing document tags; this was repaired by moving them back inside the executable script. The runner now contains 91 test definitions. Browser execution remains outstanding.


### Essential variable set
The Variables workspace now offers a curated starter set of 16 cross-domain variables: need/demand, awareness, access, trust, value/fit, cost/affordability, time/speed, resources/capacity, capability/skill, incentives/motivation, power/influence, competition/alternatives, risk/downside, information quality/uncertainty, rules/constraints and feedback speed. Users can add the set without duplicating existing variable names, then edit levels and evidence for their context. These are a practical baseline, not a universal exhaustive list; domain-specific variables should be added only when they materially change the decision.


### Guided input experience and decision summary
Added a Guided start workspace with four progressively detailed input levels: Intuitive, Basic, Advanced and Extreme detail. Users can switch levels without discarding typed input. The guided form saves a structured situation description and detail in the situation record, and converts participant names into editable actor records without inventing their goals or behaviour. The overview now offers a direct guided-start route. Simulation reports now begin with a concise decision summary: indicative alignment and uncertainty band, largest variable movements, recorded sensitivity drivers, explicit actor responses, engine warnings and a practical real-world validation prompt. The summary is derived from existing simulation output; it does not claim to infer opportunities or recommend a guaranteed winning action. Browser execution and mobile visual verification remain outstanding.


### Result presentation modes
Simulation results now support Text, Visual and Combined display modes. All modes read the same saved in-memory run object and switching presentation does not rerun or alter the simulation. Visuals are rendered with native HTML/CSS (no external chart dependency): an alignment range indicator, before/after variable-level bars, actor response propensity bars, and a step timeline. Text retains the existing detailed report and decision summary; Combined places the summary and visual evidence before the detailed mechanics. The actor propensity chart is explicitly labelled heuristic rather than a calibrated real-world probability. Browser/mobile rendering and accessibility verification remain outstanding.


### Stability repair and verification (2026-11-08)
Repaired malformed JavaScript in the main UI that prevented `app.js` from parsing: corrected the Actors view expression, Markets view concatenation, nested buyer-journey and negotiation participant fallback markup, and the communication form options array. Added explicit `delivered: true` to successful communication outcomes so reports and tests can distinguish successful delivery from blocked messages. Corrected institutional-rule scoping so active rules are selected by timing and trigger, then applied only to the actor targets declared by the rule; previously the initiator filter could suppress a rule before it reached its intended target. Rebalanced the loss-aversion heuristic so default reference risk creates no unexplained penalty, while elevated perceived risk can still be amplified by loss aversion. Updated engine tests to isolate each case from shared mutable state and align assertions with belief-based actor triggers, partial message influence, scheduled counteroffer snapshots and run-horizon warnings. Added a neutral-driver regression test. Verification performed in an isolated JavaScript harness: main app and engine syntax pass; all 92 engine contract tests pass; all 5 core/domain contract tests pass; mock-DOM smoke test rendered all 12 workspaces and exercised Text, Visual and Combined result modes after a simulation. This is not a real browser/device test; GitHub Pages deployment, actual browser interactions, accessibility and mobile layout still require verification.


## Guided simulation, validation and output-history increment (2026-11-08)
- Added `src/core/guidance.js`, a local rule-based advisor that inspects the actual model and task question. It recommends missing situation context, actors, variables, causal links, strategies, events, evidence and feedback tests, plus domain/task-specific market, buyer journey, negotiation, relationship, institutional, AI, brokerage and cross-cultural details.
- Added the **Guided simulation & suggestions** workspace. It includes a structural preparation checklist, a task/decision question, next-step recommendations, concrete details to add, and direct links to the relevant workspace. The readiness percentage measures record presence only; it is not a realism score or success probability.
- Guided start now stores the selected domain in `meta.domainPack`, keeps industry separate, maps the scope-boundary field to `situation.boundary`, and preserves guided answers. Import restores the guided draft state.
- Added saved simulation-run history with open/delete actions; the latest saved run is restored when the app reloads. Run controls now explain that actor-response rules are evaluated only when a strategy is selected, and the uncertainty checkbox label matches the engine's actual low/unknown-event inclusion behaviour.
- Simulation execution now checks structural model errors before calling the engine and displays a readable error instead of attempting to run malformed records. Model validation now handles null/malformed records safely and checks variable bounds and selected reference fields.
- Added `tests/guidance.test.html` and expanded core tests. Latest isolated test harness: core 7/7, simulation engine 92/92, guidance 10/10. JavaScript syntax checks pass for `app.js`, core model, guidance module and simulation engine.
- Verification boundary: these are isolated JavaScript contract/syntax tests executed against the repository source. They are not a real browser, iPhone, accessibility, visual-layout or end-to-end interaction test. Deployment must still be checked on the live hosting URL.

## System dynamics and strategic intelligence increment (2026-11-08)
- Added model schema v4 collections: `constraints`, `resources`, and `dependencies`. Older saved models normalize with empty arrays; their existing data remains intact.
- Added `src/engines/intelligence.js`, loaded after the deterministic simulation engine. It applies constraint windows/triggers, hard variable caps, severity-scaled soft effects, resource stock consumption/replenishment, depletion effects, and prerequisite checks over the simulation timeline, including trigger-aware constraint prerequisites. Enhanced state changes carry forward between steps.
- Added the **System dynamics & strategic intelligence** workspace with editable records for constraints, resources and prerequisites; diagnostics for leverage candidates, bottlenecks, missing considerations, feedback cycles, competing explanations, second-order paths and possible direct/indirect unintended effects.
- Added controlled one-input experiments (variable/resource/constraint toggle) and one-at-a-time variable sensitivity comparisons. These compare model outputs under entered assumptions; they are not causal proof or calibrated forecasts.
- The guided workflow now includes a required modelling stage for constraints, resources and dependencies.
- Added validation for malformed resource quantities, capacity inconsistencies, missing constraint references and dangling dependency references. Expanded core and engine tests.
- Added observed-versus-simulated calibration comparisons for entered variable observations, with source/date provenance and mean absolute error. Added feedback-loop detection, competing incoming-cause summaries, one-step indirect-effect warnings and resource recovery-time estimates based on net replenishment. Calibration is descriptive and not proof of predictive validity.
- Remaining work: inspect actual browser/mobile layout and interactions, verify the hosting deployment, and collect repeated held-out observations before making any predictive-validity claim. No empirical predictive validity is claimed.

- Latest contract verification in an isolated JavaScript harness: core 10/10, simulation/intelligence 115/115 and guided simulation 12/12. Main app, core, simulation and intelligence JavaScript syntax checks pass. These are not real browser/device or live-host tests.


## Natural Language & Strategic Reasoning increment (2026-11-08)
- Added `src/engines/reasoning.js`, a dependency-free local interpretation layer.
- Guided situation workspace offers Interpret description: candidate themes, blind spots, modelling suggestions and questions. No records are silently created; review remains required.
- Scenario Engine result details include STRATOS Reasoning: largest modelled movements, sensitivity drivers, applied actor rules, warnings and follow-up questions.
- This is transparent heuristic text interpretation, not a connected large language model. No user data is sent to a cloud model. A real generative AI integration requires a secure server-side proxy/provider configuration; embedding a private API key in this static browser app would expose it.
- Numeric simulation remains intact. Commentary is supplemental, not empirically validated forecasting.


## Optional generative AI backend (2026-11-08)
- Added a Netlify Functions endpoint at `netlify/functions/stratos-ai.mjs` using the OpenAI Responses API and a strict JSON Schema response.
- Added `src/engines/ai.js` as the browser adapter. Guided Start can request AI interpretation; saved simulation reports can request a critical AI review. Existing local heuristic interpretation remains available and is not replaced.
- AI output includes reasoning, hypotheses, risks, counterarguments, evidence requests, fast experiments, questions and suggested actions. It is rendered as commentary only; it never writes model records or changes simulation values.
- The backend reads `OPENAI_API_KEY` and optional `STRATOS_AI_MODEL` / `STRATOS_ACCESS_CODE` from Netlify Functions environment variables. Default model is `gpt-5.5`. No API key is shipped to the browser.
- The backend restricts browser origins to the Netlify deployment URLs, limits request size, applies a best-effort per-instance rate limit, and optionally checks a shared access code. The in-memory rate limit is not a durable abuse-prevention system; use provider spending limits/alerts and stronger authentication before making the endpoint broadly public.
- `netlify.toml` and `scripts/prepare-netlify.mjs` configure a dependency-free static build into `dist`, keeping function source outside the published directory.
- AI use sends the supplied situation/model/run content to OpenAI. Users should remove personal or sensitive details they do not want sent to the provider.
- Deployment is not yet confirmed. The GitHub project must be connected to Netlify, the environment variables configured in Netlify, and a successful production deploy completed before AI requests can work.

---

## 5,000-context template library (November 2026)

The optional Situation Templates workspace now exposes 5,000 unique, searchable context entries.

### Hierarchy and coverage
- 13 broad domains: Business & enterprise; Products & innovation; Markets & sales; Brokerage & intermediation; Negotiation & deals; Work & organizations; Education & campus; Relationships & social; Power & influence; Technology & AI; Public systems & society; Personal strategy; International / cross-cultural.
- 36 context families, including startup validation, small-business operations, B2B enterprise sales, B2C acquisition, platform/marketplace design, real-estate brokerage, recruitment, creative/music placement, campus dynamics, dating, family systems, coalition influence, AI adoption, public services, career transitions and cross-border entry.
- Each family is expanded into scenario combinations across five stages (early discovery, initial launch, growth/scaling, established operation, decline/disruption), five stakeholder structures, five operating environments and four dominant pressures.
- The generated catalog contains exactly 5,000 unique entries. It is a structured scenario-combination library, not 5,000 independently researched empirical case studies.

### UI
- Broad-domain filter, context-family filter, full-text search and exact-context selector.
- The selector shows up to 150 matches at once to keep the mobile interface manageable; search and filters can reach the complete catalog.
- Optional country/jurisdiction, region and locality fields.
- Replace or merge mode. Export the current model before replacing it if a backup is needed.
- All generated assumptions remain editable and should be checked before simulation.

### Model generation
Each context builds the complete STRATOS model structure, with starter actors, variables, causal hypotheses, institutions, markets, segments, competitors, journeys, negotiations, groups, constraints, resources, decisions, events, experiments and evidence prompts. Context-specific scenario dimensions are included in the situation, model metadata, extra variables, events and experiments.

### Important limitations
- Template entries are starting structures and hypotheses, not verified facts, forecasts, legal advice or calibrated probabilities.
- No country or culture is assumed. Legal and social context fields request local evidence; avoid treating a national population as homogeneous.
- Scenario combinations are generic scaffolds. Some stage/environment combinations may be irrelevant to a particular context and should be edited or removed.
- The library should continue to grow through deeper domain-specific specializations, not merely by increasing combinatorial counts.


## 200-million-combination template catalogue (2026-11-08)
- Preserves the 5,000 curated, structured starting templates across 13 broad domains and 36 context families.
- Adds six selectable refinement dimensions: scale/reach (5), interaction pattern (8), resource condition (5), uncertainty profile (5), primary objective (8), and feedback speed (5).
- The six dimensions produce 40,000 combinations per starting template (5 × 8 × 5 × 5 × 8 × 5). Across 5,000 starting templates, the theoretical catalogue contains exactly 200,000,000 combinations.
- Combinations are generated on demand. The browser does not download, store or iterate over 200 million objects. Search filters the compact 5,000-entry base catalogue; selected refinements are passed to the model builder and become editable model metadata, variables, an event and an experiment.
- This is a combinatorial design space, not 200 million independently authored, researched or empirically validated scenarios. The template library is a starting point; users must verify and refine assumptions.
- UI supports domain, context family and text search plus six refinement selectors. Results show up to 150 base contexts at a time; search/filter narrows the list.
- Validation still needed in a real browser: mobile layout, selector behaviour, apply/merge, model persistence, and end-to-end deployment.


### Template catalogue verification
- Added keyword aliases for practical discovery (for example procurement/vendor/RFP, property/landlord, music sync/licensing, student/hostel and visa/application).
- Search supports multiple terms and requires all query terms to match the context or its aliases. The base catalogue remains compact; the six refinement selectors generate the selected combination.
- Runtime checks confirmed 5,000 base entries, 40,000 refinements per base entry and 200,000,000 combinations. Sampled model builds include all six selected dimensions.
- All 5,000 generated base templates passed the current model validator (0 invalid). App JavaScript syntax check passed; model normalization passed.
- Not yet verified: live browser rendering, touch/mobile usability, full apply/merge workflow, localStorage persistence or the latest hosted deployment.

# STRATOS architecture — foundation increment

## Product rule
STRATOS is a modular simulation workbench, not a universal predictor. It represents a situation, actors, resources, constraints, variables, causal hypotheses, events, decisions, evidence and uncertainty. Domain and context packs extend the shared model.

## Deployment constraint
The current app is a static GitHub Pages site. This increment adds zero third-party dependencies and keeps the existing interface. It introduces framework-free contracts that can later be used by a TypeScript client or Python service. No backend is required yet.

## Layers
1. Experience — situation editor, actor/variable/event forms, scenario comparison and feedback lab.
2. Canonical model — versioned situation schema and stable record IDs.
3. Validation — structural errors separated from evidence and completeness warnings.
4. Domain packs — business, brokerage, negotiation, relationships, institutions and cross-cultural prompts/entities.
5. Simulation engines — deterministic seeded scenario runner, event sampling, conditional actor policies, transparent numeric decision drivers, actor-specific beliefs, information access and scheduled actor-to-actor communications and directional trust/respect relationships, explicit directional power/dependency relations that adjust responses to holder-led strategies, explicitly configured group/coalition action and support thresholds, causal propagation and once-per-step delayed links.
6. Evidence and context (next) — source, date, scope, sample, licence, confidence, counterevidence and review cadence.
7. External intelligence (later) — optional AI adapter and retrieval; never silently invent simulation outcomes.

## System dynamics and intelligence
- Constraints are first-class records, with hard/soft behaviour, schedule, trigger, caps and explicit effects.
- Resources are stocks with initial amount, capacity, consumption, replenishment and depletion consequences.
- Dependencies are explicit prerequisites; unmet hard prerequisites suppress the selected strategy's direct effects and are reported.
- The intelligence layer compares controlled interventions, computes one-at-a-time sensitivity, flags leverage/bottleneck candidates, feedback loops, competing incoming causes, second-order paths and direct/one-link unintended effects.
- Observed-vs-simulated calibration reports descriptive error for entered observations with provenance; it is not statistical validation.

## Canonical record principles
- Every situation is scoped by outcome, boundary and time horizon.
- Actors have their own goals, incentives, resources, constraints, information and plausible responses.
- Variables carry ranges, importance, direction, evidence status and confidence.
- Causal links record a mechanism and remain hypotheses until tested.
- Events have timing, conditions, likelihood/status and variable effects.
- Decisions state mechanism, cost, time-to-effect, reversibility, downside and expected responses.
- Evidence records preserve source and date; assumptions remain distinguishable from observations.
- Unknowns are first-class values, not silently replaced with confident guesses.

## Domain pack contract
A pack has a stable ID, name, description, domain entities and questions that prompt users to supply context. Packs must not impose population stereotypes. Cultural claims need a defined geography/subgroup, source, date, sample, variation and exceptions.

## Simulation integrity
The current v2 score is a heuristic alignment index, not a probability, forecast or calibrated confidence interval. The next engine increment will separate state transitions, event scheduling, actor decision policies, uncertainty sampling, output metrics, warnings and sensitivity analysis. Engines should be deterministic under a fixed seed where feasible and tested against known cases before being described as realistic.

## Dependency policy
Do not install Mesa, SimPy, PostgreSQL, Redis, vector databases or an LLM stack into this static app yet. Add a dependency only when an implemented feature requires it:
- TypeScript + Vite when modular frontend complexity justifies a build step.
- Zod (or equivalent) when runtime validation needs richer schema composition.
- Python + FastAPI when server-side simulation, shared accounts or external integrations are required.
- SimPy for process/event queues; Mesa for multi-agent models; NetworkX for graph analysis.
- PostgreSQL/PostGIS when shared persistence and spatial queries are real requirements.
- Retrieval/LLM components only after evidence records and domain contracts are stable.

## Current boundary
This increment adds a versioned core contract, validation and domain registry. It does not replace the v2 simulation algorithm or claim validated behavioural realism. The legacy UI remains available while the core is introduced incrementally.


## Power and dependency relations
Power relations are directed records between a strategy initiator (holder) and a dependent actor. They identify the user-entered source of leverage, leverage strength, dependency and perceived legitimacy. When the holder is the selected decision's actor, the relation can apply a bounded transparent modifier (maximum ±0.12 per relation) to the dependent actor's response propensity. Mobilizing and discouraging effects are explicit user choices. This is a scenario rule, not a general theory of authority or compliance; it does not infer coercion, consent, legal authority or actual control.


## Institutions and environmental constraints
Institutional rules are explicit, editable records with a category, scope, affected actor list, activation step, optional variable trigger, severity, enforcement/reach, response effect, variable effects, and source/uncertainty notes. At activation they apply only their user-entered variable effects; from their start step onward, active matching rules may adjust targeted actors' response propensity when a selected strategy is run. The response modifier is bounded by severity × enforcement × 0.15. This is a transparent scenario heuristic, not a legal determination, cultural generalization, or calibrated enforcement model. Rule records do not imply universal application: scope and actor targets must be entered deliberately.


## Markets and competition
Market records describe a bounded market or customer segment with type, segment boundary, snapshot step, offer-price index, purchasing-power reference, price sensitivity, competitive intensity, substitute availability, saturation, supply capacity, linked demand/revenue variables and evidence notes. At the scheduled step the engine computes transparent relative factors, caps served demand by capacity, and applies bounded index changes to linked variables. These are scenario heuristics on a 0–10 relative scale, not absolute demand, revenue, market size, equilibrium prices or forecasts. They do not yet model endogenous competitor pricing, segment migration, repeat purchases, inventory dynamics or market-clearing.


## Customer segments and competitor behaviour
Markets can be split into customer-segment records with market linkage, estimated market share, purchasing power, price sensitivity, offer needs-fit, awareness, switching friction, timing, linked demand variable and evidence notes. At a segment snapshot, the engine calculates a transparent own-offer attraction index and compares it with explicitly recorded competitor offers. Relative share and segment size scale a bounded demand-variable adjustment. Competitor records hold a market, price, differentiation, reputation, capacity and optional reaction rule. A competitor reaction is evaluated only when a strategy is selected, its scheduled step arrives, an optional trigger is met and explicit variable effects exist; a seeded draw uses the user-entered reaction chance. This does not infer competitor intent, discover actual rivals, model buyer-level utility, or establish empirical market shares.


## Buyer decision journeys and point-of-interest access
A journey record links an optional customer segment, scheduled snapshot, target action and conversion variable. Ordered journey-point records describe discovery, evaluation, trust, access, contact, approval, payment, delivery, onboarding, retention and referral touchpoints. Each point separates interest, ease, difficulty, practical access, access type, cost burden, time burden, trust required/available, availability, barriers and workarounds. The engine computes transparent bounded completion factors and multiplies them across sequential touchpoints to obtain a relative continuation index. This index is not a calibrated probability of conversion; multiplying assumed factors is a way to expose cumulative friction, not a claim that real customer decisions are independent. Ease and access are distinct: a simple step may still be unreachable because of financial, physical, digital, informational, permission, social or accommodation barriers. Evidence and uncertainty notes should accompany scores.


## Negotiation and multi-party purchasing
Negotiation records schedule an explicit bargaining snapshot with opening/target offers, bounded rounds, concession rate, linked outcome variable and explicit success/failure effects. Participant records distinguish buyer, seller, approver, gatekeeper, adviser and other roles. Authority, willingness, ability, bargaining power, reservation value, minimum thresholds, required status and walk-away threshold are separate editable inputs. The engine checks buyer maximum and seller minimum reservation values for overlap, verifies required participants meet their configured thresholds, calculates a transparent round-by-round offer movement and reports agreement conditions. It does not infer a hidden reservation price, psychological intent, legal authority or actual probability of agreement. All price-like values in a negotiation must use a common user-defined scale; the engine does not infer currency or units.


## Behavioural responses, objections and decision context
Actor records can separately capture stated objections, public position, privately reported belief (only where genuinely known), observable constraints and actual observed action. Numeric decision-context inputs include loss sensitivity, status-quo preference, cognitive load, urgency, visible social-proof signal and skepticism. These inputs affect response propensity through bounded, inspectable heuristics: loss sensitivity interacts with perceived risk; status-quo preference and cognitive load reduce propensity; urgency and visible social proof can increase it; skepticism reduces it. The engine does not infer a person's motives from identity, culture or role, does not automatically resolve objections, and does not treat stated intention as actual behaviour. Inputs are contextual hypotheses that require evidence and calibration; the modifiers are not validated psychological laws.


## Decision delays, objection lifecycle and counteroffers
Decision interaction records model explicit actor actions such as hesitation, evidence requests, objections, counteroffers, partial acceptance, withdrawal and return. Each action has an initial step plus an additional delay; it is applied only at its due step. A counteroffer can update the linked negotiation's opening offer before that step's negotiation snapshot. Withdrawal suspends the linked negotiation while return reopens it. Objection status is manually recorded (open, under review, addressed, accepted as a constraint or withdrawn); no objection is assumed resolved merely because a response exists. Explicit variable effects apply only when the interaction occurs. Actions scheduled beyond the run horizon are not shown as completed. These are user-authored scenario events, not inferred human behaviour.


## Information networks, narrative framing and reputation signals
Communication records can carry narrative labels, framing, a recorded persuasion approach, source visibility and an explicitly ordered relay chain. A recipient forwards only when the scenario's share probability succeeds; each relay has a configured delay and credibility multiplier. The engine records original versus forwarded deliveries, relay depth, belief change, source visibility and framing. Information-access restrictions apply at every hop. Message accuracy can affect beliefs without changing objective world variables; trust changes remain tied to explicitly modelled directed relationships. Tactics and frames are descriptive metadata, not universal claims about persuasion effectiveness. This is a bounded, user-authored information-flow chain, not an automated rumour generator or calibrated social network model.


## Reputation, status signals and audience-specific perceptions
Reputation events are user-entered records about an actor, with a scheduled disclosure step, positive or negative perceived signal, magnitude, source credibility, evidence status and audience scope (all actors, selected actors, or a group). The engine maintains separate run-local reputation scores for each subject-observer pair, beginning at a neutral 5/10. Verified, contested and unverified labels apply explicit provisional weights; they are evidence labels supplied by the modeller, not independent fact verification. When a strategy initiator has a reputation score in an observer's audience, a small bounded modifier may affect that observer's response propensity. Reputation does not change objective actor attributes or prove allegations true. Four contract tests cover audience scope, evidence-status weighting, immutability and scheduled timing.


## Dynamic alliances, factions and AI influence
Groups are cloned per run. Scheduled events can recruit, remove or switch members, alter support, cohesion, coordination or conformity, or dissolve a group. AI system records model human-operated tools, agents, recommendation/ranking systems, generators, screening and automation. Each records operator, target actors, activation step, adoption, contextual reliability, oversight, bias/failure notes and explicit variable effects. Effects are scaled by adoption, reliability and oversight; targeted actors receive a small role-sensitive response modifier. These are editable assumptions, not empirical claims about AI performance or universal effects.


## AI competition, collaboration and systemic disruption
`aiEvents` represents explicitly scheduled interactions such as AI-vs-AI competition, human–AI collaboration, automation races, algorithmic influence operations, outages, security incidents, gatekeeping and coordination. Each event names participating systems, timing, intensity, base success assumption, separate success/failure effects, governance and human-impact notes. The engine applies bounded intensity-scaled effects and records the sampled outcome. This is a scenario mechanism, not a claim that the engine predicts AI system capability, strategic intent, or real-world success rates. Active groups are evaluated at each step so scheduled membership and cohesion changes affect subsequent collective-action calculations.


## Guided simulation advisor and output history
The browser loads `src/core/guidance.js` as a dependency-free local module. It analyses the current situation, task question, domain pack and model collections, then returns transparent suggestions, context questions and a structural completeness checklist. The UI renders these recommendations as links into the existing workspaces; it does not generate or silently apply facts, actor intentions or numeric assumptions. Domain/task prompts include market and buyer journeys, brokerage, negotiation, relationships, institutions, AI systems and cross-cultural evidence requirements. The readiness percentage counts the presence of selected model components only; it is not a calibrated realism or outcome score.

Simulation runs can be saved in local browser storage and reopened or deleted from the Scenario Engine history. Before a run, the UI invokes core validation and blocks structurally invalid models. The engine remains deterministic for a fixed seed and retains its explicit heuristic limitations. Browser interaction, mobile layout and empirical predictive validity remain separate verification tasks.

## System dynamics and intelligence increment (2026-11-08)
- Canonical model schema v4 adds `constraints`, `resources` and `dependencies` collections while preserving normalization of older v3 models.
- `src/engines/intelligence.js` wraps the deterministic simulation engine and applies resource consumption/replenishment, constraint activation/effects/caps and dependency checks to each timeline step. Enhanced state deltas carry forward between steps; saved model assumptions are not mutated.
- Constraint records support hard/soft strength, severity, start/end windows, variable triggers, direct variable caps and explicit variable effects. Resource records support initial stock, capacity, dynamic capacity expansion, consumption, proportional or priority actor claims, replenishment, owner, linked variable, depletion effects and recovery estimates. Dependency records support variable/resource/actor/constraint prerequisites and strategy scope.
- Diagnostics expose connected-variable leverage candidates, resource/dependency bottleneck candidates, missing-dimension questions, multi-step feedback cycles, competing incoming causes, two-link causal paths and direct/one-link indirect strategy-effect conflicts with declared variable direction.
- Controlled experiments compare a baseline with a single variable, resource or constraint-toggle intervention. Sensitivity analysis perturbs variables one at a time with a fixed seed.
- These tools are model-conditional heuristics. They do not establish causal proof, calibrated probabilities, complete coverage or empirical predictive validity. Existing actor learning, feedback, event shocks, causal links and scenario branches remain in place.
- UI adds **System dynamics & strategic intelligence** and a prerequisite stage to **Your workflow**. Existing workspaces remain accessible.
- Verification added to core and engine contract tests; real browser/device, accessibility, live deployment and empirical calibration remain separate verification tasks.


## Optional generative reasoning service
The static browser app can call a same-site Netlify Function at `/.netlify/functions/stratos-ai`. The function holds the OpenAI API key in server-side environment variables, accepts bounded model/run JSON, calls the Responses API with a strict structured-output schema, and returns interpretation or run-review commentary. The client has no provider key and retains local heuristic fallback. The service is optional and does not mutate canonical model state or simulation results. Browser-origin allowlisting and best-effort in-memory throttling are basic safeguards, not a substitute for durable authentication, abuse controls, or provider spend limits. User-provided model content is sent to OpenAI when AI analysis is requested; avoid including sensitive personal data.

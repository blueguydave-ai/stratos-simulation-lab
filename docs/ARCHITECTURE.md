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

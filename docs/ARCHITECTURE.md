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
5. Simulation engines — deterministic seeded scenario runner, event sampling, conditional actor policies with transparent numeric decision drivers, causal propagation and once-per-step delayed links.
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

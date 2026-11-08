# STRATOS Project Guide

## Product principle

STRATOS is experiment-first. The user supplies the situation and the question or intervention they want to test. The system constructs the provisional world model and runs the simulation.

The user should not need to manually create actors, variables, relationships, groups, resources, constraints, processes, events or causal links before running a basic experiment.

## Primary workflow

1. **Describe the situation** — natural-language account of what is happening.
2. **State the experiment** — the question, change or decision to test.
3. **Run the simulation** — STRATOS builds a provisional world and simulates it over time.
4. **Read the results** — actions, reactions, reasons, causal developments, feedback, uncertainty and consequences.
5. **Inspect or correct** — advanced workspaces remain optional.

Desired outcome and time horizon are optional refinements. Templates are optional starting points, not prerequisites.

## Internal architecture

- `src/core/model.js`: canonical model schema, normalization and validation.
- `src/domains/registry.js`: domain/context packs.
- `src/core/guidance.js`: local interpretation and guidance.
- `src/data/templates.js`: optional template catalogue and full model prefill.
- `src/engines/world-model.js`: constructs a run-local world from the situation and experiment.
- `src/engines/simulation.js`: deterministic scenario mechanics, actor decisions, interactions, variable feedback and outcomes.
- `src/engines/intelligence.js`: enhanced simulation and system-dynamics analysis.
- `src/engines/reasoning.js`: plain-language interpretation of model and run results.
- `src/engines/ai.js`: optional Gemini client adapter.
- `api/stratos-ai.mjs`: Vercel server-side Gemini endpoint.
- `app.js`: interface, local persistence, experiment flow and optional advanced workspaces.
- `styles.css`: responsive glass interface.

## Model integrity

Every generated record must be distinguishable from user-provided facts. Unknown details remain uncertain; they must not silently become verified facts. Generated actors have limited information access. Run-local changes must not mutate the user's saved starting assumptions.

## Realism and limitations

The current simulation combines deterministic heuristics and generated provisional structures. It can create plausible interactions and trace causal consequences, but it is not an empirically validated digital twin or a calibrated predictor of human behaviour. Gemini analysis is optional and should be clearly distinguished from the simulation engine.

## Deployment

Vercel builds the static frontend using `npm run build` and serves the optional API route at `/api/stratos-ai`. Configure `GEMINI_API_KEY` server-side in Vercel. Do not expose credentials in frontend files.

## Verification status

The deterministic engine contract suite currently contains 124 checks. A passing engine suite does not establish browser, mobile, production deployment or predictive validity. Those require separate tests.

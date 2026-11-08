# STRATOS — Strategic Simulation Lab

A local-first strategic simulation workspace. Describe the situation and the experiment you want to test; STRATOS helps construct a provisional world model, simulate plausible interactions, compare scenarios, and identify useful real-world feedback experiments.

## Deployment

The project is configured for **Vercel**:
- Static frontend is built into `dist/` by `npm run build`.
- The optional Gemini endpoint runs from `api/stratos-ai.mjs`.
- Configure `GEMINI_API_KEY` and, optionally, `STRATOS_AI_MODEL` and `STRATOS_ACCESS_CODE` in Vercel environment variables.
- The Gemini key must remain server-side and must never be placed in browser code.

## Important limitations

- Simulated actions and outcomes are plausible scenario possibilities, not validated predictions of real people or events.
- Scores and model dynamics are heuristic unless independently calibrated against observed data.
- Context templates are editable starting structures, not verified representations of every industry, jurisdiction, institution or culture.
- AI analysis is optional and does not silently rewrite the canonical model.
- Export JSON backups to preserve work.

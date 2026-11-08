# STRATOS — Strategic Simulation Lab

A free, local-first strategic modelling workspace for exploring systems, assumptions, scenarios, failure modes, and cheap feedback experiments.

## Use
Model a system by adding variables, constraints, influences, and trends. Compare scenarios; stress-test assumptions; identify failure modes; and record low-cost experiments and evidence.

## Important limitations
- Scores are heuristic prompts for structured thinking, not validated probabilities or predictions.
- Context templates are starting points, not exhaustive representations of industries, countries, or cultures.
- Export JSON backups to preserve work.
- AI analysis is optional and does not alter model records or make the simulation a verified forecast.

## Hosting and optional AI
The recommended AI-enabled deployment is Netlify. The server-side Netlify Function connects STRATOS to Google Gemini; the Gemini key is stored only in Netlify environment variables, never in browser code or GitHub.

Follow [docs/NETLIFY_SETUP.md](docs/NETLIFY_SETUP.md) to deploy and configure `GEMINI_API_KEY`. Gemini API usage is separate from ChatGPT and may be subject to free-tier quotas, model availability and Google's data-use terms. Local modelling and heuristic interpretation remain available without an API key.

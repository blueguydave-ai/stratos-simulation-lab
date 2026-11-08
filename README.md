# STRATOS — Strategic Simulation Lab

A free, local-first strategic modelling workspace for exploring systems, assumptions, scenarios, failure modes, and cheap feedback experiments.

## Deploy on GitHub Pages
1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch **main** and folder **/(root)**, then save.
4. After publishing, the site will be available at:
   https://blueguydave-ai.github.io/stratos-simulation-lab/

## Use
Model a system by adding variables, constraints, influences, and trends. Compare optimistic, baseline, and pessimistic scenarios; stress-test assumptions; identify failure modes; and record low-cost experiments and evidence.

## Important limitations
- Scores are heuristic prompts for structured thinking, not validated probabilities or predictions.
- Context templates are starting points, not exhaustive representations of industries, countries, or cultures.
- Models live in browser memory in this version. Export JSON to preserve work before refreshing or closing the page.
- This version does not yet implement time-stepped causal simulation or calibrated probability distributions.

## Privacy and cost
The app is static and runs in your browser. It requires no paid backend, API key, or subscription.


## Netlify deployment

The app is configured for Netlify hosting, including the optional secure AI function. Follow [docs/NETLIFY_SETUP.md](docs/NETLIFY_SETUP.md) to connect the repository, configure the server-side OpenAI key and test AI analysis.

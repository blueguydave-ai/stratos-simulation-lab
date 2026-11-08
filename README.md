# STRATOS — Strategic Simulation Lab

STRATOS is an experiment-first strategic simulation workspace.

## How to use it

1. Describe what is happening.
2. State what you want to test.
3. Run the experiment.

STRATOS constructs a provisional world model around the experiment: relevant actors and groups, motivations, variables, relationships, processes, resources, constraints, information boundaries and possible events. It then simulates actions, reactions and feedback over time.

Templates are optional starting points. Advanced workspaces are optional tools for inspecting, correcting or extending the generated model. You do not need to manually populate the system before running a simulation.

## Deployment

The project is configured for Vercel:
- `npm run build` prepares the static frontend in `dist/`.
- `api/stratos-ai.mjs` is the optional server-side Gemini endpoint.
- Set `GEMINI_API_KEY` in Vercel environment variables. Optionally set `STRATOS_AI_MODEL` and `STRATOS_ACCESS_CODE`.
- Never put the Gemini API key in browser code or commit it to the repository.

## Limitations

- Generated actions and reactions are plausible scenario possibilities, not predictions of specific people.
- Generated motives, processes and constraints are assumptions unless supported by supplied evidence.
- Heuristic scores are not calibrated probabilities.
- Templates are editable starting structures, not verified case studies.
- AI analysis is optional and does not silently rewrite the model.
- Export JSON backups to preserve local work.

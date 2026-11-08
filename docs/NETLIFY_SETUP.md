# Deploy STRATOS on Netlify

This project now uses Netlify for both the static STRATOS interface and its optional server-side AI function. Keep the GitHub repository as the source of truth.

## 1. Import the GitHub project

1. Sign in to Netlify.
2. Choose **Add new project** / **Import an existing project**.
3. Connect GitHub and select `blueguydave-ai/stratos-simulation-lab`.
4. Choose the `main` branch.
5. Let Netlify read `netlify.toml`. It defines the build command, published `dist` folder and `netlify/functions` directory. Do not set the publish directory to the repository root.
6. Start the first deploy.

The build script copies only the public frontend files into `dist`. The function source remains outside the published site.

## 2. Add the AI provider key securely

After the first deploy:

1. Open the Netlify project.
2. Go to **Project configuration → Environment variables** (the exact menu wording may vary).
3. Add `OPENAI_API_KEY` with your OpenAI API key as its value.
4. Ensure its scope includes **Functions**.
5. Optionally add `STRATOS_AI_MODEL` with value `gpt-5.5`. If omitted, the function uses that default.
6. Optionally add `STRATOS_ACCESS_CODE` with a long private code. If configured, STRATOS asks for this code the first time the AI feature is used in that browser. It is a simple shared gate, not full user authentication.
7. Save the variables and trigger a new deploy. Netlify applies updated environment variables to functions on a new deployment.

**Never paste the OpenAI API key into the website, browser storage, GitHub files, or a public chat.** The key belongs only in Netlify's server-side environment variables.

## 3. Test the AI features

After the deploy succeeds:

1. Open the Netlify site URL.
2. Go to **Guided start**.
3. Enter a non-sensitive test situation.
4. Select **Ask STRATOS AI**. The first use may ask for the optional STRATOS access code.
5. Run a simulation, open its report, and select **Ask STRATOS AI to challenge this run**.

If the function says AI is not configured, check that `OPENAI_API_KEY` is saved with Functions scope and redeploy. If the access code is rejected, check that the browser has the current `STRATOS_ACCESS_CODE` value; clear the site's stored access code or use a private browser window to be prompted again.

## Costs and privacy

- Netlify hosting and function usage are subject to the limits and terms of your Netlify plan.
- OpenAI API usage is billed separately by OpenAI. The model choice and size of the supplied situation/run affect cost. Set an API spending limit or budget alert before extensive testing.
- When you explicitly request AI analysis, STRATOS sends the current situation/model and, for a run review, the selected simulation run to OpenAI. Do not include passwords, private identifiers, sensitive personal information or confidential third-party data.
- Local quick interpretation and numeric simulation continue to work without the AI provider configured.
- The function has an origin allowlist, request-size limit and best-effort in-memory rate limit. That rate limit is not durable across serverless instances. Do not treat the optional shared access code as a complete public-user authentication system.

## Hosting note

GitHub Pages is a static host and cannot run this Netlify Function. Use the Netlify site URL for the AI-enabled deployment. GitHub remains where the code is edited and versioned.

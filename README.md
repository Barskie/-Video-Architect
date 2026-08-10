<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Asset Strategist AI

## Run locally

Prerequisites: Node.js, the Vercel CLI, and a Gemini API key.

1. Install dependencies: `npm install`
2. Install the Vercel CLI: `npm install --global vercel`
3. Create `.env.local` and set `GEMINI_API_KEY`.
4. Run the frontend and serverless API together: `vercel dev`

The default model is `gemini-3.5-flash-lite`, selected for low-cost structured output. Set `GEMINI_MODEL` only if you have tested the cost and latency of another compatible model. Live Google Search grounding is off by default and can be enabled per analysis in the UI.

## Deploy to Vercel

1. Import this repository into Vercel.
2. Add `GEMINI_API_KEY` under Project Settings > Environment Variables.
3. Enable it for Production, Preview, and Development as needed.
4. Redeploy after adding or changing the variable.

The Gemini key is read only by `api/analyze.ts`; it is never included in the browser bundle.

## Production security and spend controls

- Restrict the Google API key to the Gemini API (`generativelanguage.googleapis.com`) and rotate any key that was ever exposed in browser code or Git history.
- In Vercel Firewall, add a rate-limit rule for `POST /api/analyze` (for example, 5 requests per minute per IP). The handler also has a small per-instance limiter, but a WAF rule is the distributed billing guardrail.
- Enable Vercel Deployment Protection or add real user authentication if this is a private tool. Origin checks reduce browser abuse but are not user authentication.
- Set billing budgets/alerts in Google Cloud or AI Studio and review usage regularly.
- Keep live trend research off unless current audio information is required; Google Search grounding is billed separately from model tokens.

Optional environment controls are documented in `.env.example`.

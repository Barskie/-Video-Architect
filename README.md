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

## Deploy to Vercel

1. Import this repository into Vercel.
2. Add `GEMINI_API_KEY` under Project Settings > Environment Variables.
3. Enable it for Production, Preview, and Development as needed.
4. Redeploy after adding or changing the variable.

The Gemini key is read only by `api/analyze.ts`; it is never included in the browser bundle.
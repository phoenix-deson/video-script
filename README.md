# ScriptForge

AI video script studio with a GitHub Pages frontend and a Vercel serverless DeepSeek API.

## Architecture

`GitHub Pages → Vercel Serverless Functions → DeepSeek API`

The browser never receives the DeepSeek API key. The key is stored only in Vercel Environment Variables.

## Deploy the API to Vercel

1. Sign in to Vercel and import this GitHub repository.
2. Deploy the project. Vercel automatically detects `api/generate.js` and `api/inspire.js` as serverless functions.
3. Open the Vercel project: **Settings → Environment Variables**.
4. Add:
   - Name: `DEEPSEEK_API_KEY`
   - Value: your DeepSeek API key
   - Environment: Production (and Preview if you want preview deployments to work)
5. Redeploy the project after adding or changing the variable.
6. Copy the Vercel deployment URL.
7. Open the GitHub Pages version of ScriptForge, click **Server**, paste the Vercel URL, and save it.

The frontend calls:

- `POST /api/generate` — professional script generation.
- `POST /api/inspire` — AI-generated creative ideas.

## AI inspiration

**Inspire me / 灵感一下** is a real DeepSeek request. It generates eight fresh concepts with titles, angles, hooks, formats, audiences and rationale instead of selecting from a fixed list.

## Security

Never put `DEEPSEEK_API_KEY` in `index.html`, browser JavaScript, GitHub Pages files, or localStorage. Only the Vercel serverless functions should access the secret.

The demo API currently allows cross-origin requests so a GitHub Pages frontend can call it. For a public production launch, add durable rate limiting, authentication, quotas and abuse protection.

## GitHub Pages

Keep `index.html` on GitHub Pages. The frontend does not need to be hosted on Vercel; it only needs the Vercel deployment URL configured through the **Server** dialog.

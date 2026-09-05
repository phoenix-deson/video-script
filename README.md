# ScriptForge

AI video script studio with a GitHub Pages frontend and a secure serverless DeepSeek API.

## Architecture

`GitHub Pages → Cloudflare Worker → DeepSeek API`

The browser never receives the DeepSeek API key. The Worker stores it as a runtime secret.

## One-time setup

1. Create a Cloudflare account and enable Workers.
2. In the GitHub repository, open **Settings → Secrets and variables → Actions**.
3. Add these repository secrets:
   - `DEEPSEEK_API_KEY` — your DeepSeek API key.
   - `CLOUDFLARE_API_TOKEN` — a Cloudflare API token allowed to deploy Workers and manage Worker secrets.
   - `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID.
4. Push `worker.js` or `wrangler.toml` to `main`, or run the **Deploy serverless API** workflow manually.
5. After deployment, Cloudflare will provide a Worker URL such as `https://video-script-api.<your-subdomain>.workers.dev`.
6. Open ScriptForge and use **Server / Configure API endpoint** to save that Worker URL.

The frontend automatically calls:

- `POST /api/generate` for full script generation.
- `POST /api/inspire` for AI-generated creative ideas.

## AI inspiration

**Inspire me** is now an actual DeepSeek request. It generates multiple original concepts, angles, hooks, formats and audiences instead of selecting from a hard-coded list.

## Security notes

Do not put `DEEPSEEK_API_KEY` in `index.html`, JavaScript, GitHub Pages files, or any browser-visible configuration. GitHub Actions secrets are used only during deployment; the deployed Worker keeps the DeepSeek key as a server-side secret.

The Worker also includes a lightweight per-IP request limit to reduce accidental abuse. For a public production launch, add durable rate limiting, authentication, quotas, analytics, and billing protection.

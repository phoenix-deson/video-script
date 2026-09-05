# ScriptForge

AI video script studio with a GitHub Pages frontend and a secure Vercel serverless DeepSeek API.

## Architecture

`GitHub Pages → Vercel Serverless Functions → DeepSeek API`

The browser never receives the DeepSeek API key. Vercel stores it as a server-side environment variable.

## One-time setup

1. Import this GitHub repository into Vercel.
2. In the Vercel project, open **Settings → Environment Variables**.
3. Add `DEEPSEEK_API_KEY` with your DeepSeek API key. Enable it for Production, Preview, and Development as needed.
4. Deploy the project. Vercel will expose `/api/generate` and `/api/inspire` automatically.
5. Copy your Vercel deployment URL, for example `https://video-script-xxx.vercel.app`.
6. Open ScriptForge and use **Server / Configure API endpoint**. Paste the Vercel URL without a trailing slash.

The frontend calls:

- `POST /api/generate` for full script generation.
- `POST /api/inspire` for AI-generated creative ideas.

## AI inspiration

**Inspire me** is a real DeepSeek request. It generates multiple original concepts, angles, hooks, formats, audiences and reasons-to-make instead of selecting from a hard-coded list.

## Security

Never put `DEEPSEEK_API_KEY` in `index.html`, GitHub Pages files, or browser-visible JavaScript. The key stays inside Vercel's server environment and is used only by the serverless functions.

For a public launch, add stronger rate limiting, authentication, quotas, abuse protection and usage monitoring.

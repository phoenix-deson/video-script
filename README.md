# ScriptForge

AI video script studio that runs directly in the browser.

UI restoration trigger.

## Architecture

`Browser → DeepSeek API`

There is no Vercel, Cloudflare Worker, GitHub Actions backend, or server-side API in this version. Your DeepSeek API key is entered through the **AI API** settings panel and stored locally in your browser only.

## How to use

1. Download or clone this repository.
2. Open `index.html` in your browser.
3. Click **AI API**.
4. Enter your API base URL, API key, and model.
5. Click **Save locally**.
6. Use **Generate professional script** or **Inspire me**.

The default settings are:

- API base URL: `https://api.deepseek.com`
- Model: `deepseek-chat`

You can also use another OpenAI-compatible API by changing the base URL and model.

## API key privacy

The API key is not included in the repository and there is no placeholder key committed to GitHub. The page stores the key in browser `localStorage` only when **Remember locally in this browser** is enabled. If that option is disabled, the key is kept only for the current browser session.

The key is sent directly from your browser to the configured AI API. It is not sent through this project's server because this project has no server component.

For a public GitHub Pages deployment, remember that browser-based API calls expose the key to the browser runtime and network requests. This local-only version is intended for personal use or for downloading and running yourself.

## Features

- Professional video script generation
- AI-generated creative inspiration
- Retention-first hooks and structure
- Production tables with scenes, visuals, spoken words and audio/text cues
- B-roll suggestions
- Titles, thumbnails, descriptions, hashtags and pinned comments
- English and Simplified Chinese interface/output
- Local script history
- Markdown copy and download

## Important

Never commit your real API key into `index.html`, JavaScript files, GitHub repository secrets that are intended to be exposed to the frontend, screenshots, or any other repository file.

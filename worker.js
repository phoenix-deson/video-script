const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8'
};

const MODEL = 'deepseek-chat';
const MAX_BODY_BYTES = 12000;
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;
const requestLog = new Map();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function rateLimited(ip) {
  const now = Date.now();
  const previous = requestLog.get(ip) || [];
  const active = previous.filter(t => now - t < WINDOW_MS);
  if (active.length >= MAX_REQUESTS_PER_WINDOW) {
    requestLog.set(ip, active);
    return true;
  }
  active.push(now);
  requestLog.set(ip, active);
  return false;
}

function languageName(language) {
  return language === 'zh' ? 'Simplified Chinese' : 'English';
}

function scriptSystem(language) {
  return language === 'zh'
    ? '你是一位世界级的视频编剧、短视频留存策略专家和内容导演。只使用简体中文。'
    : 'You are a world-class video showrunner, short-form copywriter and retention strategist. Use English only.';
}

function buildScriptPrompt(input) {
  const language = languageName(input.language);
  return `Create a professional, production-ready video script in ${language}. Never mix languages.

CREATIVE BRIEF
Topic: ${input.topic}
Format: ${input.format}
Platform: ${input.platform}
Duration: ${input.duration}
Audience: ${input.audience}
Tone: ${input.tone}
Primary goal: ${input.goal}
Hook intensity: ${input.intensity}
Caption-friendly lines: ${input.captions}
B-roll suggestions: ${input.broll}

OUTPUT
1. Concept and one-sentence promise.
2. Five distinct high-click title options. Avoid fake claims.
3. Three opening hooks for the first 1–3 seconds, including one pattern interrupt.
4. Retention map for 0–3s, 3–10s, middle, and final payoff.
5. Full production script as a Markdown table with: Time | Scene / Camera | Visual / B-roll | Spoken words | Audio / Text overlay.
6. Match spoken-word volume to the requested duration.
7. Use open loops, pattern interrupts and a satisfying payoff without excessive clickbait.
8. Add a natural CTA matched to the primary goal.
9. Three thumbnail concepts with short on-image text.
10. Video description and 8–12 relevant hashtags.
11. One pinned-comment prompt that encourages genuine discussion.
12. A short creator note explaining the retention structure.
13. Never invent statistics, quotes, studies, product claims or factual details. If uncertain, say so.
14. Return polished Markdown only.`;
}

function buildInspirePrompt(input) {
  const language = languageName(input.language);
  return `Generate 8 original video ideas in ${language} for a creator who wants strong click-through rate, retention and discussion. Return JSON only as an array of objects with these keys: title, angle, hook, format, audience, why_it_could_work. Make every idea meaningfully different. Avoid fabricated facts and avoid generic topics. Consider current creator patterns such as curiosity gaps, contrarian takes, experiments, before/after transformations, mistakes, comparisons, stories and practical challenges.`;
}

async function callDeepSeek(env, messages, temperature = 0.85, max_tokens = 8000) {
  if (!env.DEEPSEEK_API_KEY) throw new Error('Server is not configured with DEEPSEEK_API_KEY.');
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({ model: MODEL, messages, temperature, max_tokens, stream: false })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `DeepSeek request failed (${response.status})`);
  return data?.choices?.[0]?.message?.content || '';
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    const url = new URL(request.url);
    if (url.pathname !== '/api/generate' && url.pathname !== '/api/inspire') return json({ error: 'Not found' }, 404);
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (rateLimited(ip)) return json({ error: 'Too many requests. Please wait a minute and try again.' }, 429);

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) return json({ error: 'Request is too large.' }, 413);

    let input;
    try {
      input = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body.' }, 400);
    }

    try {
      if (url.pathname === '/api/inspire') {
        const language = input.language === 'zh' ? 'zh' : 'en';
        const text = await callDeepSeek(env, [
          { role: 'system', content: scriptSystem(language) },
          { role: 'user', content: buildInspirePrompt({ language }) }
        ], 1.05, 3000);
        let ideas;
        try {
          ideas = JSON.parse(text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim());
        } catch {
          ideas = [];
        }
        return json({ ideas, raw: text });
      }

      const required = ['topic', 'format', 'platform', 'duration', 'audience', 'tone', 'goal', 'intensity'];
      for (const field of required) {
        if (!input[field] || typeof input[field] !== 'string') return json({ error: `Missing field: ${field}` }, 400);
      }
      if (input.topic.length > 2000) return json({ error: 'Topic is too long.' }, 400);
      const language = input.language === 'zh' ? 'zh' : 'en';
      const text = await callDeepSeek(env, [
        { role: 'system', content: scriptSystem(language) },
        { role: 'user', content: buildScriptPrompt({ ...input, language }) }
      ]);
      return json({ text });
    } catch (error) {
      return json({ error: error.message || 'Server error.' }, 500);
    }
  }
};

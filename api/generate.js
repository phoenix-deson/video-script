const MODEL = 'deepseek-chat';
const MAX_BODY_BYTES = 12000;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}

function send(res, status, data) {
  res.status(status).json(data);
}

function languageName(language) {
  return language === 'zh' ? 'Simplified Chinese' : 'English';
}

function systemPrompt(language) {
  return language === 'zh'
    ? '你是一位世界级的视频编剧、短视频留存策略专家和内容导演。只使用简体中文。'
    : 'You are a world-class video showrunner, short-form copywriter and retention strategist. Use English only.';
}

function buildPrompt(input) {
  return `Create a professional, production-ready video script in ${languageName(input.language)}. Never mix languages.\n\nCREATIVE BRIEF\nTopic: ${input.topic}\nFormat: ${input.format}\nPlatform: ${input.platform}\nDuration: ${input.duration}\nAudience: ${input.audience}\nTone: ${input.tone}\nPrimary goal: ${input.goal}\nHook intensity: ${input.intensity}\nCaption-friendly lines: ${Boolean(input.captions)}\nB-roll suggestions: ${Boolean(input.broll)}\n\nOUTPUT\n1. Concept and one-sentence promise.\n2. Five distinct high-click title options. Avoid fake claims.\n3. Three opening hooks for the first 1–3 seconds, including one pattern interrupt.\n4. Retention map for 0–3s, 3–10s, middle, and final payoff.\n5. Full production script as a Markdown table with: Time | Scene / Camera | Visual / B-roll | Spoken words | Audio / Text overlay.\n6. Match spoken-word volume to the requested duration.\n7. Use open loops, pattern interrupts and a satisfying payoff without excessive clickbait.\n8. Add a natural CTA matched to the primary goal.\n9. Three thumbnail concepts with short on-image text.\n10. Video description and 8–12 relevant hashtags.\n11. One pinned-comment prompt that encourages genuine discussion.\n12. A short creator note explaining the retention structure.\n13. Never invent statistics, quotes, studies, product claims or factual details. If uncertain, say so.\n14. Return polished Markdown only.`;
}

async function callDeepSeek(env, messages, temperature = 0.85, max_tokens = 8000) {
  if (!env.DEEPSEEK_API_KEY) throw new Error('Server is not configured with DEEPSEEK_API_KEY.');
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({ model: MODEL, messages, temperature, max_tokens, stream: false })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `DeepSeek request failed (${response.status})`);
  return data?.choices?.[0]?.message?.content || '';
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' });
  if (Number(req.headers['content-length'] || 0) > MAX_BODY_BYTES) return send(res, 413, { error: 'Request is too large.' });

  try {
    const input = req.body || {};
    const required = ['topic', 'format', 'platform', 'duration', 'audience', 'tone', 'goal', 'intensity'];
    for (const field of required) {
      if (!input[field] || typeof input[field] !== 'string') return send(res, 400, { error: `Missing field: ${field}` });
    }
    if (input.topic.length > 2000) return send(res, 400, { error: 'Topic is too long.' });
    const language = input.language === 'zh' ? 'zh' : 'en';
    const text = await callDeepSeek(process.env, [
      { role: 'system', content: systemPrompt(language) },
      { role: 'user', content: buildPrompt({ ...input, language }) }
    ]);
    return send(res, 200, { text });
  } catch (error) {
    return send(res, 500, { error: error.message || 'Server error.' });
  }
}

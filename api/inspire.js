const MAX_BODY_BYTES = 4000;

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

async function callDeepSeek(language) {
  if (!process.env.DEEPSEEK_API_KEY) throw new Error('Server is not configured with DEEPSEEK_API_KEY.');
  const prompt = `Generate 8 original video ideas in ${languageName(language)} for a creator who wants strong click-through rate, retention and discussion. Return JSON only as an array of objects with these keys: title, angle, hook, format, audience, why_it_could_work. Make every idea meaningfully different. Avoid fabricated facts and generic topics. Explore curiosity gaps, contrarian takes, experiments, before/after transformations, mistakes, comparisons, stories and practical challenges. Make the concepts specific enough that a creator could immediately choose one and make a video.`;
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: language === 'zh' ? '你是一位顶级短视频创意总监。只使用简体中文。' : 'You are a top-tier short-form video creative director. Use English only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 1.05,
      max_tokens: 3000,
      stream: false
    })
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
    const language = req.body?.language === 'zh' ? 'zh' : 'en';
    const raw = await callDeepSeek(language);
    let ideas = [];
    try {
      ideas = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim());
    } catch {
      ideas = [];
    }
    return send(res, 200, { ideas, raw });
  } catch (error) {
    return send(res, 500, { error: error.message || 'Server error.' });
  }
}

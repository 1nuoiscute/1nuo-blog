const { kv } = require('@vercel/kv');

const ACTION_KEYS = [
  'stats:bingo1', 'stats:bingo2', 'stats:bingo3', 'stats:bingo4', 'stats:bingo5',
  'stats:draw', 'stats:tarot', 'stats:scl90', 'stats:sbti'
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'POST') {
      const { action } = req.body || {};
      if (!action) return res.status(400).json({ error: 'Missing action' });

      const fullKey = `stats:${action}`;
      const count = await kv.incr(fullKey);
      return res.json({ ok: true, action, count });
    }

    if (req.method === 'GET') {
      const stats = {};
      let total = 0;
      for (const key of ACTION_KEYS) {
        try {
          const val = await kv.get(key);
          const name = key.replace('stats:', '');
          stats[name] = val || 0;
          total += (stats[name]);
        } catch {
          stats[key] = 0;
        }
      }
      stats.total = total;
      return res.json(stats);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Stats API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

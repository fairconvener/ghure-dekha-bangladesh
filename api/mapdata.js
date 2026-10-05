import { list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'content-type, x-admin-key'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); res.setHeader('Access-Control-Max-Age', '86400'); return res.status(204).end(); }
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  const id = String(req.query.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
  if (!id) return res.status(400).json({ error: 'id required' });
  try {
    const r = await list({ prefix: `maps/${id}.json`, limit: 1 });
    const b = (r.blobs || []).find(x => x.pathname === `maps/${id}.json`);
    if (!b) return res.status(404).json({ error: 'not found' });
    const f = await fetch(b.url, { cache: 'no-store' }); if (!f.ok) return res.status(404).json({ error: 'not found' });
    const m = await f.json(); delete m.ua;
    return res.status(200).json(m);
  } catch (e) { return res.status(500).json({ error: 'unavailable' }); }
}

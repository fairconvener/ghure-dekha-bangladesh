import { rpc } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'content-type, x-admin-key'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); res.setHeader('Access-Control-Max-Age', '86400'); return res.status(204).end(); }
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  try { const s = await rpc('gdb_stats', { p_map: req.query && /^[a-z0-9-]{2,24}$/.test(String(req.query.map||'')) ? req.query.map : 'bd' }); return res.status(200).json(s || {}); }
  catch (e) { return res.status(200).json({ error: 'unavailable' }); }
}

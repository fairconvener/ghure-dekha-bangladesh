import { rpc } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'content-type, x-admin-key'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); res.setHeader('Access-Control-Max-Age', '86400'); return res.status(204).end(); }
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
  const map = req.query && /^[a-z0-9-]{2,24}$/.test(String(req.query.map||'')) ? req.query.map : 'bd';
  const days = Math.max(1, Math.min(400, parseInt(req.query && req.query.days, 10) || 30));
  try { const r = await rpc('gdb_leaderboard', { p_map: map, p_days: days }); return res.status(200).json(r || []); }
  catch (e) { return res.status(200).json([]); }
}

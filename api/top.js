import { rpc } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
  const map = req.query && ['world','upazila'].includes(req.query.map) ? req.query.map : 'bd';
  const days = Math.max(1, Math.min(400, parseInt(req.query && req.query.days, 10) || 30));
  try { const r = await rpc('gdb_leaderboard', { p_map: map, p_days: days }); return res.status(200).json(r || []); }
  catch (e) { return res.status(200).json([]); }
}

import { rpc } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  try { const s = await rpc('gdb_stats'); return res.status(200).json(s || {}); }
  catch (e) { return res.status(200).json({ error: 'unavailable' }); }
}

import { rpc } from './_db.js';

// Public, read-only aggregate for /trend: which districts appear in how many maps.
// Prefers gdb_trend (distinct maps, last-N-days view); falls back to gdb_stats (raw download/share events)
// until that SQL function exists, so the page works either way. Only aggregates leave this endpoint.
const num = v => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v))) ? null : Number(v);
const counts = o => {
  const out = {};
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) if (/^[a-z-]{2,30}$/.test(k) && Number.isFinite(Number(v))) out[k] = Number(v);
  return out;
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'content-type, x-admin-key'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); res.setHeader('Access-Control-Max-Age', '86400'); return res.status(204).end(); }
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
  const map = req.query && /^[a-z0-9-]{2,24}$/.test(String(req.query.map || '')) ? req.query.map : 'bd';
  const days = Math.max(1, Math.min(90, parseInt(req.query && req.query.days, 10) || 7));
  try {
    const t = await rpc('gdb_trend', { p_map: map, p_days: days });
    if (t && typeof t === 'object' && t.districts) {
      const r = t.recent && typeof t.recent === 'object' ? t.recent : null;
      return res.status(200).json({
        source: 'trend', map, maps: num(t.maps), events: num(t.events), empty_events: num(t.empty_events), avg: num(t.avg),
        districts: counts(t.districts),
        recent: r ? { days: num(r.days), maps: num(r.maps), avg: num(r.avg), districts: counts(r.districts) } : null,
        first_at: t.first_at || null, updated_at: t.updated_at || null,
      });
    }
  } catch (e) { /* gdb_trend not installed yet: fall back below */ }
  try {
    const s = await rpc('gdb_stats', { p_map: map });
    if (s && typeof s === 'object' && s.districts) {
      return res.status(200).json({ source: 'stats', map, maps: num(s.maps_total), events: num(s.maps_total), empty_events: null, avg: num(s.avg_count), districts: counts(s.districts), recent: null, first_at: null, updated_at: s.updated_at || null });
    }
  } catch (e) { /* fall through */ }
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ error: 'unavailable' });
}

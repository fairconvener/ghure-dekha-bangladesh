import { upload } from './_store.js';
import { randomBytes } from 'node:crypto';
import { rpc } from './_db.js';

export const config = { api: { bodyParser: { sizeLimit: '8mb' } } };

const MAX_IMG = 4.5 * 1024 * 1024;

function bad(res, msg) { return res.status(400).json({ error: msg }); }

function parseDataUrl(s, label) {
  if (typeof s !== 'string' || !s.startsWith('data:image/jpeg;base64,')) throw new Error(label + ' must be a JPEG data URL');
  const b64 = s.slice(s.indexOf(',') + 1);
  if (b64.length > MAX_IMG * 1.4) throw new Error(label + ' too large');
  const buf = Buffer.from(b64, 'base64');
  if (buf.length < 1000 || buf.length > MAX_IMG) throw new Error(label + ' size invalid');
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error(label + ' is not a JPEG');
  return buf;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'content-type, x-admin-key'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); res.setHeader('Access-Control-Max-Age', '86400'); return res.status(204).end(); }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return bad(res, 'invalid json'); } }
  if (!body || typeof body !== 'object') return bad(res, 'missing body');
  try {
    const poster = parseDataUrl(body.poster, 'poster');
    const card = parseDataUrl(body.card, 'card');
    const name = String(body.name || '').replace(/[\r\n\t<>]/g, ' ').trim().slice(0, 40);
    const map = /^[a-z0-9-]{2,24}$/.test(String(body.map || '')) ? body.map : 'bd';
    const count = Math.max(0, Math.min(map === 'world' ? 195 : map === 'upazila' ? 545 : map === 'bd' ? 64 : 5000, parseInt(body.count, 10) || 0));
    const txt = (v, n) => typeof v === 'string' ? v.replace(/[\r\n\t<>"]/g, ' ').trim().slice(0, n) : '';
    const mm = body.mm && typeof body.mm === 'object' ? { total: Math.max(1, Math.min(5000, parseInt(body.mm.total, 10) || 0)), unit: txt(body.mm.unit, 20), gen: txt(body.mm.gen, 24), place: txt(body.mm.place, 40), title: txt(body.mm.title, 40), home: /^\/[a-z0-9\/-]{0,40}$/.test(String(body.mm.home || '')) ? body.mm.home : '/' } : null;
    const districts = Array.isArray(body.districts) ? body.districts.filter(d => typeof d === 'string' && /^[a-z-]{2,30}$/.test(d)).slice(0, 600) : [];
    const theme = /^[a-z]{2,12}$/.test(String(body.theme || '')) ? body.theme : 'flag';
    const size = /^(post|square|story)$/.test(String(body.size || '')) ? body.size : 'post';
    let id = ''; while (id.length < 6) id = randomBytes(6).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    const [p, c] = await Promise.all([
      upload(`maps/${id}.jpg`, poster, 'image/jpeg'),
      upload(`maps/${id}-card.jpg`, card, 'image/jpeg'),
    ]);
    const meta = { id, map, mm, name, count, districts, theme, size, poster: p, card: c, createdAt: new Date().toISOString(), ua: String(req.headers['user-agent'] || '').slice(0, 200) };
    await upload(`maps/${id}.json`, JSON.stringify(meta), 'application/json');
    try { await rpc('gdb_log_event', { p_type: 'share', p_count: count, p_districts: districts, p_has_photo: !!body.has_photo, p_theme: theme, p_map_id: id, p_ua: meta.ua, p_map: (/^[a-z0-9-]{2,24}$/.test(String(body.evmap || '')) ? body.evmap : map), p_name: name || null }, { timeout: 4000 }); } catch (e) { /* stats are best-effort */ }
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    return res.status(200).json({ id, url: `${proto}://${host}/m/${id}`, poster: p, card: c });
  } catch (e) {
    return bad(res, e.message || 'upload failed');
  }
}

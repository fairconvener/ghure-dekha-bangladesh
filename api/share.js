import { put } from '@vercel/blob';
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
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'content-type'); return res.status(204).end(); }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return bad(res, 'invalid json'); } }
  if (!body || typeof body !== 'object') return bad(res, 'missing body');
  try {
    const poster = parseDataUrl(body.poster, 'poster');
    const card = parseDataUrl(body.card, 'card');
    const name = String(body.name || '').replace(/[\r\n\t<>]/g, ' ').trim().slice(0, 40);
    const count = Math.max(0, Math.min(64, parseInt(body.count, 10) || 0));
    const districts = Array.isArray(body.districts) ? body.districts.filter(d => typeof d === 'string' && /^[a-z-]{2,30}$/.test(d)).slice(0, 64) : [];
    const theme = /^[a-z]{2,12}$/.test(String(body.theme || '')) ? body.theme : 'flag';
    const size = /^(post|square|story)$/.test(String(body.size || '')) ? body.size : 'post';
    const id = randomBytes(6).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || randomBytes(4).toString('hex');
    const opts = { access: 'public', addRandomSuffix: false, cacheControlMaxAge: 31536000 };
    const [p, c] = await Promise.all([
      put(`maps/${id}.jpg`, poster, { ...opts, contentType: 'image/jpeg' }),
      put(`maps/${id}-card.jpg`, card, { ...opts, contentType: 'image/jpeg' }),
    ]);
    const meta = { id, name, count, districts, theme, size, poster: p.url, card: c.url, createdAt: new Date().toISOString(), ua: String(req.headers['user-agent'] || '').slice(0, 200) };
    await put(`maps/${id}.json`, JSON.stringify(meta), { ...opts, contentType: 'application/json' });
    try { await rpc('gdb_log_event', { p_type: 'share', p_count: count, p_districts: districts, p_has_photo: !!body.has_photo, p_theme: theme, p_map_id: id, p_ua: meta.ua }, { timeout: 4000 }); } catch (e) { /* stats are best-effort */ }
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    return res.status(200).json({ id, url: `${proto}://${host}/m/${id}`, poster: p.url, card: c.url });
  } catch (e) {
    return bad(res, e.message || 'upload failed');
  }
}

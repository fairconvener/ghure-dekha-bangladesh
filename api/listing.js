import { createHash, randomBytes } from 'node:crypto';
import { upload } from './_store.js';
import { rpc } from './_db.js';
import shopHandler from './_shop.js';

// Business list opt-in (/study-abroad, /business): when a business ticks "show our name and logo in the business list"
// and downloads its map, the page sends the name and the logo here. The logo goes to storage (photos/L<id>.jpg),
// the row to gdb.listings; the admin sees them at /admin under "প্রতিষ্ঠান" before anything is shown publicly.
// The same endpoint serves the local sellers of the district guides (api/_shop.js): every GET, and POSTs with an
// action (add / report / delete). Business-list posts have no action. (The Hobby plan allows 12 functions per deployment.)
export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

const MAX_LOGO = 1.5 * 1024 * 1024;
const clean = (v, n) => String(v == null ? '' : v).replace(/[\r\n\t<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

function ipHash(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '').split(',')[0].trim();
  if (!ip) return null;
  const day = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`gd-list|${day}|${ip}`).digest('hex').slice(0, 24);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'content-type'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); res.setHeader('Access-Control-Max-Age', '86400'); return res.status(204).end(); }
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  body = body || {};
  if (req.method === 'GET' || ['add', 'report', 'delete'].includes(body.action)) return shopHandler(req, res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const name = clean(body.name, 80);
  if (name.length < 2) return res.status(400).json({ error: 'name' });
  const page = String(body.page || '');
  if (!/^(study|biz-[a-z0-9-]{1,20})$/.test(page)) return res.status(400).json({ error: 'page' });
  const logo = String(body.logo || '');
  if (!logo.startsWith('data:image/jpeg;base64,')) return res.status(400).json({ error: 'logo' });
  const b64 = logo.slice(logo.indexOf(',') + 1);
  if (b64.length > MAX_LOGO * 1.4) return res.status(400).json({ error: 'logo' });
  const buf = Buffer.from(b64, 'base64');
  if (buf.length < 500 || buf.length > MAX_LOGO || buf[0] !== 0xff || buf[1] !== 0xd8) return res.status(400).json({ error: 'logo' });
  const places = Array.isArray(body.places) ? body.places.filter(p => typeof p === 'string' && /^[a-z-]{2,30}$/.test(p)).slice(0, 300) : [];
  const kind = /^[a-z]{2,16}$/.test(String(body.kind || '')) ? body.kind : null;
  const lang = body.lang === 'en' ? 'en' : 'bn';
  try {
    let id = ''; while (id.length < 8) id = randomBytes(9).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    const url = await upload(`photos/L${id}.jpg`, buf, 'image/jpeg');
    const r = await rpc('gdb_add_listing', {
      p_name: name, p_logo: url, p_page: page, p_places: places, p_kind: kind, p_lang: lang,
      p_ua: String(req.headers['user-agent'] || '').slice(0, 200), p_ip: ipHash(req),
    }, { timeout: 8000 });
    if (r && r.ok) return res.status(200).json({ ok: true });
    const err = (r && r.error) || 'db';
    return res.status(err === 'limit' ? 429 : 400).json({ error: err });
  } catch (e) {
    return res.status(500).json({ error: 'failed' });
  }
}

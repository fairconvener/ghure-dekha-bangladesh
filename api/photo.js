import { upload } from './_store.js';
import { randomBytes } from 'node:crypto';
import { rpc } from './_db.js';

export const config = { api: { bodyParser: { sizeLimit: '6mb' } } };
const clean = (v, n) => String(v == null ? '' : v).replace(/[\r\n\t<>]/g, ' ').trim().slice(0, n);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'content-type, x-admin-key'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); res.setHeader('Access-Control-Max-Age', '86400'); return res.status(204).end(); }
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
    const page = clean(req.query && req.query.page, 120); if (!page) return res.status(400).json({ error: 'page required' });
    try { const r = await rpc('gdb_photos', { p_page: page }); return res.status(200).json(r || []); } catch (e) { return res.status(200).json([]); }
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  body = body || {};
  const page = clean(body.page, 120), item = clean(body.item, 120) || null, name = clean(body.name, 60);
  const s = String(body.image || '');
  if (!page || !s.startsWith('data:image/jpeg;base64,')) return res.status(400).json({ error: 'ছবি পাওয়া যায়নি' });
  const buf = Buffer.from(s.slice(s.indexOf(',') + 1), 'base64');
  if (buf.length < 5000 || buf.length > 4 * 1024 * 1024 || buf[0] !== 0xff || buf[1] !== 0xd8) return res.status(400).json({ error: 'ছবিটা ঠিক নেই (JPEG, ৪ MB-এর কম)' });
  try {
    const id = randomBytes(8).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || randomBytes(5).toString('hex');
    const url = await upload(`photos/${id}.jpg`, buf, 'image/jpeg');
    const rid = await rpc('gdb_add_photo', { p_page: page, p_item: item, p_url: url, p_name: name || null, p_ua: String(req.headers['user-agent'] || '').slice(0, 200) });
    return res.status(200).json({ ok: true, id: rid, url });
  } catch (e) { return res.status(500).json({ error: 'আপলোড হয়নি, একটু পরে আবার চেষ্টা করুন' }); }
}

import { createHash, randomBytes } from 'node:crypto';
import { upload } from './_store.js';
import { rpc } from './_db.js';
import { notifyAdmins } from './_push.js';
import { DISTRICTS } from './_districts.js';

// Local sellers on the district guides ("জেলার পণ্য", /jela/<district> and /bazar).
// Anyone can add one and it is live at once; anyone can report one, and 3 different people's reports hide it;
// the person who added it can delete it from the same browser (a random token only that browser keeps);
// the admin sees everything at /admin ("🛍️ পণ্য") and gets a push notification on each new item and each report.
//   GET  /api/shop?d=<district>   live sellers of a district      GET /api/shop?latest=1   newest anywhere
//   GET  /api/shop?counts=1       live sellers per district
//   POST {action:'add', district, name, product, photo (JPEG data URL), fb, phone, owner, lang, page}
//   POST {action:'report', id, reason}       POST {action:'delete', id, owner}
export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

const MAX_PHOTO = 1.2 * 1024 * 1024;
const REASONS = { fake: 'ভুয়া বা প্রতারণা', bad: 'খারাপ ছবি বা লেখা', wrong: 'ভুল তথ্য', other: 'অন্য কারণ' };
const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const owner = t => /^[a-f0-9]{32}$/.test(String(t || '')) ? createHash('sha256').update('gd-shop-owner|' + t).digest('hex') : null;

function ipHash(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '').split(',')[0].trim();
  return ip ? createHash('sha256').update('gd-shop|' + ip).digest('hex').slice(0, 24) : null;
}

// a Facebook link: null when empty, undefined when it is not a Facebook page link
function fbUrl(v) {
  let s = String(v || '').trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s.replace(/^\/+/, '');
  let u; try { u = new URL(s); } catch { return undefined; }
  const host = u.hostname.toLowerCase();
  if (!/^(www\.|m\.|web\.)?(facebook\.com|fb\.com|fb\.me)$/.test(host)) return undefined;
  const path = (u.pathname + u.search).replace(/[\s<>"]/g, '').slice(0, 190);
  if (path.length < 2) return undefined;
  return 'https://' + host + path;
}

// a Bangladeshi mobile number as 01XXXXXXXXX: null when empty, undefined when it is not one
function phoneBd(v) {
  let s = String(v || '').replace(/\D/g, '');
  if (!s) return null;
  if (s.startsWith('880')) s = s.slice(2); else if (s.startsWith('88')) s = s.slice(2);
  if (/^1[3-9]\d{8}$/.test(s)) s = '0' + s;
  return /^01[3-9]\d{8}$/.test(s) ? s : undefined;
}

async function add(req, res, b) {
  const district = String(b.district || '');
  if (!DISTRICTS[district]) return res.status(400).json({ error: 'district' });
  const name = clean(b.name, 80), product = clean(b.product, 160);
  if (name.length < 2) return res.status(400).json({ error: 'name' });
  if (product.length < 2) return res.status(400).json({ error: 'product' });
  const fb = fbUrl(b.fb), phone = phoneBd(b.phone);
  if (fb === undefined) return res.status(400).json({ error: 'fb' });
  if (phone === undefined) return res.status(400).json({ error: 'phone' });
  if (!fb && !phone) return res.status(400).json({ error: 'contact' });
  const own = owner(b.owner);
  if (!own) return res.status(400).json({ error: 'owner' });
  let photo = null;
  if (b.photo) {
    const p = String(b.photo);
    if (!p.startsWith('data:image/jpeg;base64,')) return res.status(400).json({ error: 'photo' });
    const b64 = p.slice(p.indexOf(',') + 1);
    if (b64.length > MAX_PHOTO * 1.4) return res.status(400).json({ error: 'photo' });
    const buf = Buffer.from(b64, 'base64');
    if (buf.length < 500 || buf.length > MAX_PHOTO || buf[0] !== 0xff || buf[1] !== 0xd8) return res.status(400).json({ error: 'photo' });
    let id = ''; while (id.length < 8) id = randomBytes(9).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    photo = await upload(`photos/S${id}.jpg`, buf, 'image/jpeg');
  }
  const r = await rpc('gdb_add_shop', {
    p_district: district, p_name: name, p_product: product, p_photo: photo, p_fb: fb, p_phone: phone,
    p_lang: b.lang === 'en' ? 'en' : 'bn', p_page: clean(b.page, 60) || null, p_owner: own,
    p_ua: String(req.headers['user-agent'] || '').slice(0, 200), p_ip: ipHash(req),
  }, { timeout: 8000 });
  if (!r || !r.ok) { const err = (r && r.error) || 'db'; return res.status(err === 'limit' ? 429 : 400).json({ error: err }); }
  await notifyAdmins({ title: `🛍️ নতুন পণ্য: ${DISTRICTS[district][0]}`, body: `${name}: ${product}`, url: '/admin#shops', tag: 'shop-' + r.id });
  return res.status(200).json({ ok: true, id: r.id, item: { id: r.id, at: new Date().toISOString(), name, product, photo, fb, phone } });
}

async function report(req, res, b) {
  const id = parseInt(b.id, 10), reason = REASONS[b.reason] ? b.reason : 'other', ip = ipHash(req);
  if (!Number.isFinite(id) || !ip) return res.status(400).json({ error: 'bad' });
  const r = await rpc('gdb_report_shop', { p_id: id, p_reason: reason, p_ip: ip }, { timeout: 8000 });
  if (!r || !r.ok) { const err = (r && r.error) || 'db'; return res.status(err === 'limit' ? 429 : 400).json({ error: err }); }
  if (r.new) {
    const where = DISTRICTS[r.district] ? DISTRICTS[r.district][0] : r.district;
    await notifyAdmins(r.hidden
      ? { title: `⚑ ৩টি রিপোর্টে লুকানো হলো: ${r.name}`, body: `${where} · শেষ কারণ: ${REASONS[reason]}`, url: '/admin#shops', tag: 'report-' + id }
      : { title: `⚑ রিপোর্ট ${r.reports}/৩: ${r.name}`, body: `${where} · কারণ: ${REASONS[reason]}`, url: '/admin#shops', tag: 'report-' + id });
  }
  return res.status(200).json({ ok: true, hidden: !!r.hidden });
}

async function remove(req, res, b) {
  const id = parseInt(b.id, 10), own = owner(b.owner);
  if (!Number.isFinite(id) || !own) return res.status(400).json({ error: 'owner' });
  const r = await rpc('gdb_delete_own_shop', { p_id: id, p_owner: own }, { timeout: 8000 });
  if (!r || !r.ok) return res.status(403).json({ error: (r && r.error) || 'owner' });
  return res.status(200).json({ ok: true });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'content-type'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); res.setHeader('Access-Control-Max-Age', '86400'); return res.status(204).end(); }
  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'no-store');
      const q = req.query || {};
      if (q.d) {
        if (!DISTRICTS[q.d]) return res.status(400).json({ error: 'district' });
        return res.status(200).json(await rpc('gdb_shops', { p_district: q.d }) || []);
      }
      if (q.latest) return res.status(200).json(await rpc('gdb_shops_latest', { p_limit: 12 }) || []);
      if (q.counts) return res.status(200).json(await rpc('gdb_shop_counts', {}) || {});
      return res.status(400).json({ error: 'bad request' });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST' });
    res.setHeader('Cache-Control', 'no-store');
    let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = null; } }
    b = b || {};
    if (b.action === 'add') return await add(req, res, b);
    if (b.action === 'report') return await report(req, res, b);
    if (b.action === 'delete') return await remove(req, res, b);
    return res.status(400).json({ error: 'action' });
  } catch (e) {
    return res.status(500).json({ error: 'failed' });
  }
}

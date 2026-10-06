import { createHash } from 'node:crypto';
import { rpc } from './_db.js';
import { DEALS } from './_deals.js';

// On-site partner tour booking (/g/<op> package cards). Saves the request in gdb.bookings; the admin sees it at /admin.
const BN = '০১২৩৪৫৬৭৮৯';
const clean = (v, n) => String(v == null ? '' : v).replace(/[\r\t<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const ascii = s => String(s || '').replace(/[০-৯]/g, c => String(BN.indexOf(c)));

function phoneOf(v) {
  let p = ascii(v).replace(/[^0-9]/g, '');
  if (/^8801[3-9]\d{8}$/.test(p)) p = p.slice(2);
  return /^01[3-9]\d{8}$/.test(p) ? p : null;
}

function ipHash(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '').split(',')[0].trim();
  if (!ip) return null;
  const day = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`gd-book|${day}|${ip}`).digest('hex').slice(0, 24);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'content-type'); res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS'); res.setHeader('Access-Control-Max-Age', '86400'); return res.status(204).end(); }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  body = body || {};
  if (clean(body.website, 50)) return res.status(400).json({ error: 'bad request' }); // honeypot
  const id = clean(body.deal, 40), deal = Object.prototype.hasOwnProperty.call(DEALS, id) ? DEALS[id] : null;
  if (!deal) return res.status(400).json({ error: 'deal' });
  const name = clean(body.name, 80);
  if (name.length < 2) return res.status(400).json({ error: 'name' });
  const phone = phoneOf(body.phone);
  if (!phone) return res.status(400).json({ error: 'phone' });
  const seats = parseInt(ascii(body.seats), 10);
  if (!Number.isInteger(seats) || seats < 1 || seats > 20) return res.status(400).json({ error: 'seats' });
  try {
    const r = await rpc('gdb_book', {
      p_deal: id, p_op: deal.op, p_code: deal.code, p_title: deal.title, p_price: deal.price,
      p_seats: seats, p_name: name, p_phone: phone,
      p_when: clean(body.when, 120) || null, p_note: clean(body.note, 500) || null, p_page: clean(body.page, 160) || null,
      p_ua: String(req.headers['user-agent'] || '').slice(0, 200), p_ip: ipHash(req),
    }, { timeout: 8000 });
    if (r && r.ok) return res.status(200).json({ ok: true, id: r.id });
    const err = (r && r.error) || 'db';
    return res.status(err === 'limit' ? 429 : 400).json({ error: err });
  } catch (e) {
    return res.status(500).json({ error: 'db' });
  }
}

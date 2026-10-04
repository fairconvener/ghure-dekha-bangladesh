import { rpc } from './_db.js';

const clean = (v, n) => String(v == null ? '' : v).replace(/[\r\t<>]/g, ' ').trim().slice(0, n);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  body = body || {};
  const name = clean(body.name, 80), phone = clean(body.phone, 20).replace(/[^0-9+]/g, ''), address = clean(body.address, 400);
  if (name.length < 2 || !/^(\+?88)?01[3-9]\d{8}$/.test(phone) || address.length < 8) return res.status(400).json({ error: 'নাম, সঠিক মোবাইল নম্বর আর ঠিকানা দিন' });
  const map_id = /^[a-zA-Z0-9]{4,16}$/.test(String(body.map_id || '')) ? body.map_id : null;
  if (!map_id) return res.status(400).json({ error: 'ম্যাপ পাওয়া যায়নি, আগে ম্যাপটা শেয়ার/সেভ করুন' });
  const size = ['a4', '12x18', '18x24'].includes(body.size) ? body.size : 'a4';
  const frame = ['none', 'black', 'wood'].includes(body.frame) ? body.frame : 'none';
  const qty = Math.max(1, Math.min(20, parseInt(body.qty, 10) || 1));
  try {
    const id = await rpc('gdb_order', { p_map_id: map_id, p_map: body.map === 'world' ? 'world' : 'bd', p_size: size, p_frame: frame, p_qty: qty, p_name: name, p_phone: phone, p_address: address, p_note: clean(body.note, 500) || null, p_ua: String(req.headers['user-agent'] || '').slice(0, 200) });
    return res.status(200).json({ ok: true, id });
  } catch (e) { return res.status(500).json({ error: 'অর্ডার জমা হয়নি, একটু পরে আবার চেষ্টা করুন' }); }
}

import { timingSafeEqual } from 'node:crypto';
import { rpc } from './_db.js';
import { vapidPublic, notifyAdmins } from './_push.js';

function okKey(k) { const a = Buffer.from(String(k || '')), b = Buffer.from(String(process.env.ADMIN_KEY || '')); return b.length > 10 && a.length === b.length && timingSafeEqual(a, b); }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'content-type, x-admin-key'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); res.setHeader('Access-Control-Max-Age', '86400'); return res.status(204).end(); }
  res.setHeader('Cache-Control', 'no-store');
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};
  const key = req.headers['x-admin-key'] || body.key || (req.query && req.query.key);
  if (!okKey(key)) return res.status(401).json({ error: 'unauthorized' });
  const action = String(body.action || (req.query && req.query.action) || 'overview');
  const arg = body.arg != null ? String(body.arg).slice(0, 200) : (req.query && req.query.arg ? String(req.query.arg).slice(0, 200) : null);
  const id = body.id != null ? parseInt(body.id, 10) : null;
  // push notifications to this admin device (🛍️ পণ্য tab): the public key, the subscription, a count, a test message
  try {
    if (action === 'push_key') return res.status(200).json({ public: await vapidPublic() });
    if (action === 'push_sub') {
      const s = body.sub || {}; const k = s.keys || {};
      if (!/^https:\/\//.test(String(s.endpoint || '')) || !k.p256dh || !k.auth) return res.status(400).json({ error: 'sub' });
      const r = await rpc('gdb_push_admin', { p_key: key, p_action: 'add', p_data: { endpoint: String(s.endpoint).slice(0, 800), keys: { p256dh: String(k.p256dh).slice(0, 200), auth: String(k.auth).slice(0, 100) }, label: String(body.label || '').slice(0, 120) } }, { timeout: 8000 });
      return res.status(200).json(r || {});
    }
    if (action === 'push_count') return res.status(200).json(await rpc('gdb_push_admin', { p_key: key, p_action: 'count', p_data: null }) || {});
    if (action === 'push_test') return res.status(200).json({ sent: await notifyAdmins({ title: '🔔 নোটিফিকেশন চালু আছে', body: 'নতুন পণ্য যোগ হলে বা রিপোর্ট এলে এভাবে জানাবে।', url: '/admin#shops', tag: 'test' }) });
  } catch (e) { return res.status(500).json({ error: 'push failed' }); }
  if (!['overview', 'feedback', 'set_feedback', 'photos', 'set_photo', 'hide_name', 'bookings', 'set_booking', 'note_booking', 'listings', 'set_listing', 'shops', 'set_shop'].includes(action)) return res.status(400).json({ error: 'bad action' });
  try { const r = await rpc('gdb_admin', { p_key: key, p_action: action, p_arg: arg, p_id: Number.isFinite(id) ? id : null }, { timeout: 10000 }); return res.status(200).json(r || {}); }
  catch (e) { return res.status(500).json({ error: 'db error' }); }
}

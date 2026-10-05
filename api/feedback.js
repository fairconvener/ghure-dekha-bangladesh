import { rpc } from './_db.js';

const clean = (v, n) => String(v == null ? '' : v).replace(/[\r\t<>]/g, ' ').trim().slice(0, n);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'content-type, x-admin-key'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); res.setHeader('Access-Control-Max-Age', '86400'); return res.status(204).end(); }
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    const page = clean(req.query && req.query.page, 120);
    if (!page) return res.status(400).json({ error: 'page required' });
    try { const r = await rpc('gdb_feedback_counts', { p_page: page }); return res.status(200).json(r || {}); }
    catch (e) { return res.status(200).json({}); }
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  body = body || {};
  const page = clean(body.page, 120), item = clean(body.item, 120) || null, verdict = ['ok', 'wrong', 'add'].includes(body.verdict) ? body.verdict : null;
  const message = clean(body.message, 2000) || null, contact = clean(body.contact, 120) || null;
  if (!page || !verdict) return res.status(400).json({ error: 'bad feedback' });
  if (verdict !== 'ok' && !message) return res.status(400).json({ error: 'message required' });
  try { await rpc('gdb_feedback', { p_page: page, p_item: item, p_verdict: verdict, p_message: message, p_contact: contact, p_ua: String(req.headers['user-agent'] || '').slice(0, 200) }); }
  catch (e) { return res.status(200).json({ ok: false }); }
  return res.status(200).json({ ok: true });
}

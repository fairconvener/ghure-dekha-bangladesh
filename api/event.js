import { rpc, cleanEvent } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'content-type, x-admin-key'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); res.setHeader('Access-Control-Max-Age', '86400'); return res.status(204).end(); }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  const ev = cleanEvent(body || {});
  if (!ev) return res.status(400).json({ error: 'bad event' });
  try { await rpc('gdb_log_event', { ...ev, p_ua: String(req.headers['user-agent'] || '').slice(0, 200) }); }
  catch (e) { return res.status(200).json({ ok: false }); }
  return res.status(200).json({ ok: true });
}

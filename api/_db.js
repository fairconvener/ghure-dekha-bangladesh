const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_ANON_KEY;

export async function rpc(fn, args, { timeout = 6000 } = {}) {
  if (!URL_ || !KEY) throw new Error('db not configured');
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'content-type': 'application/json', apikey: KEY, authorization: `Bearer ${KEY}` },
      body: JSON.stringify(args || {}),
    });
    if (!r.ok) throw new Error(`rpc ${fn} ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const text = await r.text();
    return text ? JSON.parse(text) : null;
  } finally { clearTimeout(t); }
}

export function cleanEvent(body) {
  const type = ['visit', 'download', 'share'].includes(body && body.type) ? body.type : null;
  if (!type) return null;
  const count = Number.isInteger(body.count) ? Math.max(0, Math.min(64, body.count)) : null;
  const districts = Array.isArray(body.districts) ? body.districts.filter(d => typeof d === 'string' && /^[a-z-]{2,30}$/.test(d)).slice(0, 64) : null;
  return { p_type: type, p_count: count, p_districts: districts, p_has_photo: !!body.has_photo, p_theme: /^[a-z]{2,12}$/.test(String(body.theme || '')) ? body.theme : null, p_map_id: /^[a-zA-Z0-9]{4,16}$/.test(String(body.map_id || '')) ? body.map_id : null };
}

// Shared-map images and guide photos live in Supabase Storage (public bucket "ghure-dekha").
// Writes go through the gd-upload edge function, which checks GD_UPLOAD_KEY; reads are plain public URLs.
// (Until 6 Oct 2026 these were in Vercel Blob, whose free quota ran out.)
const URL_ = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_ANON_KEY;
const UP = process.env.GD_UPLOAD_KEY;

export const publicUrl = path => `${URL_}/storage/v1/object/public/ghure-dekha/${path}`;

export async function upload(path, body, type, { timeout = 25000 } = {}) {
  if (!URL_ || !KEY || !UP) throw new Error('storage not configured');
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(`${URL_}/functions/v1/gd-upload`, {
      method: 'POST', signal: ctrl.signal, body,
      headers: { authorization: `Bearer ${KEY}`, apikey: KEY, 'x-gd-key': UP, 'x-gd-path': path, 'content-type': type },
    });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || !j.url) throw new Error(`upload ${path} ${r.status} ${(j && j.error) || ''}`.trim());
    return j.url;
  } finally { clearTimeout(t); }
}

export async function getJson(path, { timeout = 8000 } = {}) {
  if (!URL_) return null;
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(publicUrl(path), { cache: 'no-store', signal: ctrl.signal });
    if (!r.ok) return null;
    return await r.json().catch(() => null);
  } catch (e) { return null; } finally { clearTimeout(t); }
}

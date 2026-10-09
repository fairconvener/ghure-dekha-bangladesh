import { rpc, cleanEvent } from './_db.js';

const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.nchc.org.tw/api/interpreter'
];

function validCoord(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= 20.0 && lat <= 27.0 && lon >= 87.5 && lon <= 93.0;
}

function nearbyQuery(lat, lon, radius) {
  const a = `(around:${radius},${lat.toFixed(6)},${lon.toFixed(6)})`;
  return `[out:json][timeout:18];(\n` +
    `nwr${a}["name"]["tourism"~"^(attraction|museum|viewpoint|gallery|zoo|theme_park)$"];\n` +
    `nwr${a}["name"]["historic"];\n` +
    `nwr${a}["name"]["natural"~"^(beach|waterfall|peak|cave_entrance|hot_spring)$"];\n` +
    `nwr${a}["name"]["leisure"~"^(park|nature_reserve)$"];\n` +
    `nwr${a}["name"]["man_made"="lighthouse"];\n` +
    `nwr${a}["name"]["amenity"="place_of_worship"]["wikidata"];\n` +
    `nwr${a}["name"]["amenity"="place_of_worship"]["wikipedia"];\n` +
    `);out center tags;`;
}

async function fetchOverpass(query) {
  let last;
  for (const endpoint of OVERPASS) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 19000);
    try {
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'user-agent': 'GhureDekhaBangladesh/1.0 (https://ghuredekhabangladesh.com)'
        },
        body: 'data=' + encodeURIComponent(query),
        signal: ctrl.signal
      });
      if (!r.ok) throw new Error(`overpass ${r.status}`);
      const data = await r.json();
      if (!data || !Array.isArray(data.elements)) throw new Error('bad overpass response');
      return data.elements;
    } catch (e) {
      last = e;
    } finally {
      clearTimeout(timer);
    }
  }
  throw last || new Error('overpass unavailable');
}

async function nearby(body, req, res) {
  const lat = Number(body.lat), lon = Number(body.lon);
  if (!validCoord(lat, lon)) return res.status(400).json({ error: 'bad coordinates' });

  // Search progressively so dense cities return fast, while remote areas can expand farther.
  const radii = [30000, 90000, 250000];
  let elements = [], radius = radii[0];
  try {
    for (const r of radii) {
      radius = r;
      elements = await fetchOverpass(nearbyQuery(lat, lon, r));
      if (elements.length >= 50) break;
    }
  } catch (e) {
    console.error('nearby lookup failed', e && e.message);
    return res.status(502).json({ error: 'nearby service unavailable' });
  }

  return res.status(200).json({ ok: true, radius, elements });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'content-type, x-admin-key'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); res.setHeader('Access-Control-Max-Age', '86400'); return res.status(204).end(); }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  body = body || {};

  if (body.action === 'nearby') return nearby(body, req, res);

  const ev = cleanEvent(body);
  if (!ev) return res.status(400).json({ error: 'bad event' });
  try { await rpc('gdb_log_event', { ...ev, p_ua: String(req.headers['user-agent'] || '').slice(0, 200) }); }
  catch (e) { return res.status(200).json({ ok: false }); }
  return res.status(200).json({ ok: true });
}

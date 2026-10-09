import { rpc, cleanEvent } from './_db.js';
import { DISTRICTS } from './_districts.js';

function validCoord(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= 20.0 && lat <= 27.0 && lon >= 87.5 && lon <= 93.0;
}

function header(req, name) {
  const value = req.headers[String(name).toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function decodeHeader(value) {
  if (!value) return '';
  try { return decodeURIComponent(String(value)); } catch { return String(value); }
}

function ipLocation(req) {
  const lat = Number(header(req, 'x-vercel-ip-latitude'));
  const lon = Number(header(req, 'x-vercel-ip-longitude'));
  const city = decodeHeader(header(req, 'x-vercel-ip-city'));
  const country = String(header(req, 'x-vercel-ip-country') || '').toUpperCase();
  const region = decodeHeader(header(req, 'x-vercel-ip-country-region'));
  return { lat, lon, city, country, region };
}

function norm(value) {
  return String(value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9\u0980-\u09ff]+/g, '');
}

const CITY_ALIASES = {
  dacca: 'dhaka', dhaka: 'dhaka', savar: 'dhaka', uttara: 'dhaka',
  tongi: 'gazipur', chittagong: 'chattogram', chattogram: 'chattogram',
  coxbazar: 'coxs-bazar', coxsbazar: 'coxs-bazar', bogra: 'bogura', bogura: 'bogura',
  barisal: 'barishal', barishal: 'barishal', jessore: 'jashore', jashore: 'jashore',
  comilla: 'cumilla', cumilla: 'cumilla', maulvibazar: 'moulvibazar', moulvibazar: 'moulvibazar'
};

const REGION_FALLBACK = {
  A: 'barishal', B: 'chattogram', C: 'dhaka', D: 'khulna',
  E: 'rajshahi', F: 'rangpur', G: 'sylhet', H: 'mymensingh'
};

function districtFromIp(loc) {
  const c = norm(loc.city);
  if (CITY_ALIASES[c]) return CITY_ALIASES[c];
  for (const [slug, names] of Object.entries(DISTRICTS)) {
    for (const name of names) {
      const n = norm(name);
      if (c && (c === n || (c.length > 4 && (c.includes(n) || n.includes(c))))) return slug;
    }
  }
  const region = String(loc.region || '').toUpperCase();
  return REGION_FALLBACK[region] || null;
}

async function nearby(req, res) {
  const loc = ipLocation(req);
  if (!validCoord(loc.lat, loc.lon)) return res.status(503).json({ error: 'ip location unavailable' });

  const primaryDistrict = districtFromIp(loc);
  if (!primaryDistrict) return res.status(503).json({ error: 'district unavailable' });

  try {
    await rpc('gdb_log_nearby', {
      p_lat: loc.lat,
      p_lon: loc.lon,
      p_accuracy: null,
      p_ua: String(header(req, 'user-agent') || '').slice(0, 200)
    });
  } catch (e) {
    console.warn('nearby location log failed', e && e.message);
  }

  return res.status(200).json({
    ok: true,
    primaryDistrict,
    location: {
      lat: loc.lat,
      lon: loc.lon,
      city: loc.city || null,
      region: loc.region || null,
      country: loc.country || null,
      source: 'ip'
    }
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Headers', 'content-type, x-admin-key');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  body = body || {};

  if (body.action === 'nearby') return nearby(req, res);

  const ev = cleanEvent(body);
  if (!ev) return res.status(400).json({ error: 'bad event' });
  try { await rpc('gdb_log_event', { ...ev, p_ua: String(req.headers['user-agent'] || '').slice(0, 200) }); }
  catch (e) { return res.status(200).json({ ok: false }); }
  return res.status(200).json({ ok: true });
}

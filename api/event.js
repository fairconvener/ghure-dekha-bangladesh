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
  return { lat, lon, city, country, region, source: 'ip' };
}

function norm(value) {
  return String(value || '').toLowerCase().replace(/&/g, 'and').replace(/district/g, '').replace(/[^a-z0-9\u0980-\u09ff]+/g, '');
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

function districtFromText(value) {
  const v = norm(value);
  if (!v) return null;
  if (CITY_ALIASES[v]) return CITY_ALIASES[v];
  for (const [slug, names] of Object.entries(DISTRICTS)) {
    const candidates = [slug, ...(names || [])].map(norm);
    if (candidates.some(n => n && (v === n || v.includes(n) || n.includes(v)))) return slug;
  }
  return null;
}

function districtFromIp(loc) {
  const direct = districtFromText(loc.city);
  if (direct) return direct;
  const region = String(loc.region || '').toUpperCase();
  return REGION_FALLBACK[region] || null;
}

function districtFromAddress(address) {
  if (!address) return null;
  const candidates = [
    address.county, address.state_district, address.city_district,
    address.city, address.town, address.municipality,
    address.suburb, address.neighbourhood, address.quarter, address.village
  ];
  for (const value of candidates) {
    const hit = districtFromText(value);
    if (hit) return hit;
  }
  return null;
}

function compactLabel(address, displayName) {
  if (!address) return displayName || '';
  const area = address.neighbourhood || address.suburb || address.quarter || address.city_district || address.village || address.town || '';
  const city = address.city || address.town || address.municipality || address.county || '';
  const state = address.state || address.state_district || '';
  const country = address.country || '';
  const parts = [];
  for (const value of [area, city, state, country]) {
    const s = String(value || '').trim();
    if (s && !parts.some(x => norm(x) === norm(s))) parts.push(s);
  }
  return parts.join(', ') || displayName || '';
}

async function reverseGeocode(lat, lon) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6500);
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=16&accept-language=bn,en&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
    const r = await fetch(url, {
      headers: {
        'user-agent': 'GhureDekhaBangladesh/1.0 (https://ghuredekhabangladesh.com)',
        'accept': 'application/json'
      },
      signal: ctrl.signal
    });
    if (!r.ok) return null;
    const data = await r.json();
    return {
      address: data && data.address ? data.address : null,
      label: compactLabel(data && data.address, data && data.display_name)
    };
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function logNearby(loc, req) {
  try {
    await rpc('gdb_log_nearby', {
      p_lat: loc.lat,
      p_lon: loc.lon,
      p_accuracy: Number.isFinite(loc.accuracy) ? Math.round(loc.accuracy) : null,
      p_ua: String(header(req, 'user-agent') || '').slice(0, 200)
    });
  } catch (e) {
    console.warn('nearby location log failed', e && e.message);
  }
}

async function nearby(req, res, body) {
  const ip = ipLocation(req);
  const requestedLat = Number(body && body.lat);
  const requestedLon = Number(body && body.lon);
  const requestedAccuracy = Number(body && body.accuracy);
  const useDevice = body && body.source === 'device' && validCoord(requestedLat, requestedLon);

  let loc;
  let primaryDistrict = null;

  if (useDevice) {
    loc = {
      lat: requestedLat,
      lon: requestedLon,
      accuracy: Number.isFinite(requestedAccuracy) ? Math.max(0, Math.min(100000, requestedAccuracy)) : null,
      source: 'device',
      city: null,
      region: null,
      country: 'BD',
      label: ''
    };

    const reverse = await reverseGeocode(loc.lat, loc.lon);
    if (reverse) {
      loc.label = reverse.label || '';
      primaryDistrict = districtFromAddress(reverse.address);
      if (reverse.address) {
        loc.city = reverse.address.city || reverse.address.town || reverse.address.municipality || reverse.address.county || null;
        loc.region = reverse.address.state || reverse.address.state_district || null;
        loc.country = reverse.address.country_code ? String(reverse.address.country_code).toUpperCase() : 'BD';
      }
    }

    // If reverse geocoding is temporarily unavailable, keep the exact device coordinates
    // and fall back only for choosing which district guide to load.
    if (!primaryDistrict) primaryDistrict = districtFromIp(ip);
  } else {
    loc = ip;
    if (!validCoord(loc.lat, loc.lon)) return res.status(503).json({ error: 'location unavailable' });
    primaryDistrict = districtFromIp(loc);
  }

  if (!validCoord(loc.lat, loc.lon)) return res.status(503).json({ error: 'location unavailable' });
  if (!primaryDistrict) return res.status(503).json({ error: 'district unavailable' });

  await logNearby(loc, req);

  return res.status(200).json({
    ok: true,
    primaryDistrict,
    location: {
      lat: loc.lat,
      lon: loc.lon,
      accuracy: Number.isFinite(loc.accuracy) ? loc.accuracy : null,
      city: loc.city || null,
      region: loc.region || null,
      country: loc.country || null,
      label: loc.label || null,
      source: loc.source || 'ip'
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

  if (body.action === 'nearby') return nearby(req, res, body);

  const ev = cleanEvent(body);
  if (!ev) return res.status(400).json({ error: 'bad event' });
  try { await rpc('gdb_log_event', { ...ev, p_ua: String(req.headers['user-agent'] || '').slice(0, 200) }); }
  catch (e) { return res.status(200).json({ ok: false }); }
  return res.status(200).json({ ok: true });
}

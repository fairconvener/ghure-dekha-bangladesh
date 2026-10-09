import { rpc, cleanEvent } from './_db.js';
import { DISTRICTS } from './_districts.js';

const SITE = 'https://ghuredekhabangladesh.com';

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
  dacca: 'dhaka', savar: 'dhaka', uttara: 'dhaka', tongi: 'gazipur',
  chittagong: 'chattogram', coxbazar: 'coxs-bazar', coxsbazar: 'coxs-bazar',
  bogra: 'bogura', barisal: 'barishal', jessore: 'jashore', comilla: 'cumilla',
  maulvibazar: 'moulvibazar', moulvibazar: 'moulvibazar'
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

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const r = x => x * Math.PI / 180;
  const dLat = r(lat2 - lat1), dLon = r(lon2 - lon1);
  const q = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q));
}

async function fetchGuide(slug) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const r = await fetch(`${SITE}/jela/${slug}`, {
      headers: { 'user-agent': 'GhureDekhaBangladesh-Nearby/1.0' },
      signal: ctrl.signal
    });
    if (!r.ok) throw new Error(`guide ${slug} ${r.status}`);
    return parseGuide(slug, await r.text());
  } finally {
    clearTimeout(timer);
  }
}

function parseGuide(slug, html) {
  let destination = null;
  const scripts = html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of scripts) {
    try {
      const parsed = JSON.parse(m[1]);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      destination = list.find(x => x && (x['@type'] === 'TouristDestination' || (Array.isArray(x['@type']) && x['@type'].includes('TouristDestination'))));
      if (destination) break;
    } catch (_) {}
  }
  if (!destination) throw new Error(`guide ${slug} has no TouristDestination data`);

  const geo = destination.geo || {};
  const lat = Number(geo.latitude), lon = Number(geo.longitude);
  const attractions = Array.isArray(destination.includesAttraction) ? destination.includesAttraction : [];

  const nearAt = html.indexOf('class="near"');
  const nearChunk = nearAt >= 0 ? html.slice(nearAt, nearAt + 5000) : '';
  const nearby = [];
  for (const m of nearChunk.matchAll(/href=["']\/jela\/([a-z0-9-]+)["']/gi)) {
    if (m[1] !== slug && !nearby.includes(m[1]) && DISTRICTS[m[1]]) nearby.push(m[1]);
    if (nearby.length >= 5) break;
  }

  return {
    slug,
    nameBn: destination.name || (DISTRICTS[slug] && DISTRICTS[slug][0]) || slug,
    nameEn: destination.alternateName || (DISTRICTS[slug] && DISTRICTS[slug][1]) || slug,
    lat, lon,
    nearby,
    attractions: attractions.map((a, index) => ({
      nameBn: a && a.name ? String(a.name) : '',
      nameEn: a && a.alternateName ? String(a.alternateName) : '',
      description: a && a.description ? String(a.description) : '',
      image: a && a.image ? String(a.image) : null,
      index
    })).filter(a => a.nameBn || a.nameEn)
  };
}

function makePlaces(guides, loc) {
  const places = [];
  for (const g of guides) {
    if (!Number.isFinite(g.lat) || !Number.isFinite(g.lon)) continue;
    const distanceKm = haversine(loc.lat, loc.lon, g.lat, g.lon);
    for (const a of g.attractions) {
      places.push({
        ...a,
        districtSlug: g.slug,
        districtBn: g.nameBn,
        districtEn: g.nameEn,
        distanceKm,
        guideUrl: `/jela/${g.slug}`
      });
    }
  }
  return places.sort((a, b) => a.distanceKm - b.distanceKm || a.index - b.index).slice(0, 50);
}

async function nearby(req, res) {
  const loc = ipLocation(req);
  if (!validCoord(loc.lat, loc.lon)) return res.status(503).json({ error: 'ip location unavailable' });

  const primarySlug = districtFromIp(loc);
  if (!primarySlug) return res.status(503).json({ error: 'district unavailable' });

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

  try {
    const primary = await fetchGuide(primarySlug);
    const seen = new Set([primarySlug]);
    const guides = [primary];

    const firstSlugs = primary.nearby.filter(s => !seen.has(s)).slice(0, 5);
    firstSlugs.forEach(s => seen.add(s));
    const first = (await Promise.allSettled(firstSlugs.map(fetchGuide)))
      .filter(x => x.status === 'fulfilled').map(x => x.value);
    guides.push(...first);

    let places = makePlaces(guides, loc);
    if (places.length < 50) {
      const secondSlugs = [];
      for (const g of guides) {
        for (const s of g.nearby) {
          if (!seen.has(s) && DISTRICTS[s]) {
            seen.add(s); secondSlugs.push(s);
            if (secondSlugs.length >= 6) break;
          }
        }
        if (secondSlugs.length >= 6) break;
      }
      const second = (await Promise.allSettled(secondSlugs.map(fetchGuide)))
        .filter(x => x.status === 'fulfilled').map(x => x.value);
      guides.push(...second);
      places = makePlaces(guides, loc);
    }

    const maxKm = places.length ? Math.max(...places.map(p => p.distanceKm)) : 0;
    return res.status(200).json({
      ok: true,
      places,
      radiusKm: Math.ceil(maxKm),
      primaryDistrict: primarySlug,
      source: 'site-guides',
      location: {
        lat: loc.lat,
        lon: loc.lon,
        city: loc.city || null,
        region: loc.region || null,
        country: loc.country || null,
        source: 'ip'
      }
    });
  } catch (e) {
    console.error('nearby own-data lookup failed', e && e.message);
    return res.status(502).json({ error: 'site guide data unavailable' });
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', 'content-type, x-admin-key'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); res.setHeader('Access-Control-Max-Age', '86400'); return res.status(204).end(); }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  body = body || {};

  if (body.action === 'nearby') return nearby(req, res);

  const ev = cleanEvent(body);
  if (!ev) return res.status(400).json({ error: 'bad event' });
  try { await rpc('gdb_log_event', { ...ev, p_ua: String(req.headers['user-agent'] || '').slice(0, 200) }); }
  catch (e) { return res.status(200).json({ ok: false }); }
  return res.status(200).json({ ok: true });
}

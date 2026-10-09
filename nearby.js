/* Nearby tourist places — browser-only geolocation + OpenStreetMap/Overpass.
 * Privacy: the visitor's coordinates are used only in this browser to query nearby public map data.
 * We do not send coordinates to our own API/Supabase/Meta Pixel.
 */
(function () {
  'use strict';

  const isEn = document.documentElement.lang === 'en';
  const MAX_RESULTS = 50;
  const RADII = [30000, 90000, 250000];
  const BD = { minLat: 20.3, maxLat: 26.75, minLon: 88.0, maxLon: 92.8 };
  const ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  const $ = (s) => document.querySelector(s);
  const els = {
    locate: $('#locateBtn'),
    retry: $('#retryBtn'),
    status: $('#nearbyStatus'),
    statusTitle: $('#statusTitle'),
    statusText: $('#statusText'),
    results: $('#results'),
    resultHead: $('#resultHead'),
    resultCount: $('#resultCount'),
    radiusNote: $('#radiusNote'),
    list: $('#placeList'),
    empty: $('#emptyState')
  };

  const T = isEn ? {
    asking: 'Allow location access',
    askingText: 'Your browser will ask for permission. Your location is used only to find nearby places and is not saved by us.',
    finding: 'Finding nearby places…',
    findingText: 'We are checking public OpenStreetMap data around your current location.',
    found: 'Nearby places found',
    denied: 'Location permission is off',
    deniedText: 'Allow location access for this site in your browser settings, then tap “Try again”.',
    unavailable: 'Could not get your location',
    unavailableText: 'Check that location services are turned on and try again.',
    network: 'Map data could not be loaded',
    networkText: 'The public map service may be busy. Please try again in a moment.',
    none: 'No mapped attractions were found nearby.',
    directions: 'Directions',
    source: 'Map source',
    away: 'away',
    approx: 'Approx.',
    searched: 'Searched within',
    upTo: 'Showing up to 50 nearest places',
    categories: {
      museum: 'Museum', viewpoint: 'Viewpoint', gallery: 'Gallery', zoo: 'Zoo', theme_park: 'Theme park',
      attraction: 'Attraction', historic: 'Historic place', beach: 'Beach', waterfall: 'Waterfall', peak: 'Hill / peak',
      cave_entrance: 'Cave', hot_spring: 'Hot spring', park: 'Park', nature_reserve: 'Nature reserve',
      lighthouse: 'Lighthouse', worship: 'Notable religious site', place: 'Place of interest'
    }
  } : {
    asking: 'লোকেশন অ্যাক্সেস দিন',
    askingText: 'আপনার ব্রাউজার লোকেশন ব্যবহারের অনুমতি চাইবে। এই লোকেশন শুধু কাছাকাছি জায়গা খুঁজতে ব্যবহার হবে—আমাদের কাছে সংরক্ষণ হবে না।',
    finding: 'কাছাকাছি জায়গা খোঁজা হচ্ছে…',
    findingText: 'আপনার বর্তমান লোকেশনের আশেপাশে OpenStreetMap-এর পাবলিক তথ্য দেখা হচ্ছে।',
    found: 'কাছাকাছি দর্শনীয় স্থান পাওয়া গেছে',
    denied: 'লোকেশন পারমিশন বন্ধ আছে',
    deniedText: 'ব্রাউজারের Site settings থেকে এই সাইটের Location Allow করে “আবার চেষ্টা করুন” চাপুন।',
    unavailable: 'আপনার লোকেশন পাওয়া যায়নি',
    unavailableText: 'ফোন/কম্পিউটারের Location service চালু আছে কি না দেখে আবার চেষ্টা করুন।',
    network: 'ম্যাপের তথ্য লোড করা যায়নি',
    networkText: 'পাবলিক ম্যাপ সার্ভিস ব্যস্ত থাকতে পারে। একটু পরে আবার চেষ্টা করুন।',
    none: 'কাছাকাছি ম্যাপে থাকা কোনো দর্শনীয় স্থান পাওয়া যায়নি।',
    directions: 'পথ দেখুন',
    source: 'ম্যাপ উৎস',
    away: 'দূরে',
    approx: 'প্রায়',
    searched: 'খোঁজা হয়েছে',
    upTo: 'সর্বোচ্চ ৫০টি কাছের জায়গা দেখানো হচ্ছে',
    categories: {
      museum: 'জাদুঘর', viewpoint: 'ভিউপয়েন্ট', gallery: 'গ্যালারি', zoo: 'চিড়িয়াখানা', theme_park: 'থিম পার্ক',
      attraction: 'দর্শনীয় স্থান', historic: 'ঐতিহাসিক স্থান', beach: 'সমুদ্র সৈকত', waterfall: 'ঝরনা', peak: 'পাহাড় / চূড়া',
      cave_entrance: 'গুহা', hot_spring: 'উষ্ণ প্রস্রবণ', park: 'পার্ক', nature_reserve: 'প্রকৃতি সংরক্ষণ এলাকা',
      lighthouse: 'বাতিঘর', worship: 'উল্লেখযোগ্য ধর্মীয় স্থান', place: 'দর্শনীয় স্থান'
    }
  };

  function bnNum(v) {
    if (isEn) return String(v);
    return String(v).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[+d]);
  }

  function showStatus(kind, title, text) {
    els.status.hidden = false;
    els.status.dataset.kind = kind || '';
    els.statusTitle.textContent = title;
    els.statusText.textContent = text;
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = (x) => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function distanceText(km) {
    if (km < 1) return `${bnNum(Math.max(50, Math.round(km * 1000 / 50) * 50))} ${isEn ? 'm' : 'মিটার'} ${T.away}`;
    const n = km < 10 ? km.toFixed(1) : Math.round(km).toString();
    return `${T.approx} ${bnNum(n)} ${isEn ? 'km' : 'কিমি'} ${T.away}`;
  }

  function category(tags) {
    const tourism = tags.tourism;
    const natural = tags.natural;
    const leisure = tags.leisure;
    if (tourism && T.categories[tourism]) return T.categories[tourism];
    if (tags.historic) return T.categories.historic;
    if (natural && T.categories[natural]) return T.categories[natural];
    if (leisure && T.categories[leisure]) return T.categories[leisure];
    if (tags.man_made === 'lighthouse') return T.categories.lighthouse;
    if (tags.amenity === 'place_of_worship') return T.categories.worship;
    return T.categories.place;
  }

  function areaLabel(tags) {
    const bits = [
      tags['addr:subdistrict'], tags['addr:city'], tags['addr:town'], tags['addr:village'],
      tags['addr:district'], tags['addr:state']
    ].filter(Boolean);
    return [...new Set(bits)].slice(0, 2).join(', ');
  }

  function buildQuery(lat, lon, radius) {
    const a = `(around:${radius},${lat.toFixed(6)},${lon.toFixed(6)})`;
    return `[out:json][timeout:22];(\n` +
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
    let lastErr;
    for (const endpoint of ENDPOINTS) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 26000);
      try {
        const r = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: 'data=' + encodeURIComponent(query),
          signal: ctrl.signal
        });
        if (!r.ok) throw new Error(`Overpass ${r.status}`);
        const data = await r.json();
        if (!data || !Array.isArray(data.elements)) throw new Error('Bad Overpass response');
        return data.elements;
      } catch (err) {
        lastErr = err;
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastErr || new Error('Overpass unavailable');
  }

  function normalize(elements, userLat, userLon) {
    const dedupe = new Map();
    for (const el of elements) {
      const tags = el.tags || {};
      const lat = Number(el.lat ?? (el.center && el.center.lat));
      const lon = Number(el.lon ?? (el.center && el.center.lon));
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !tags.name) continue;
      if (lat < BD.minLat || lat > BD.maxLat || lon < BD.minLon || lon > BD.maxLon) continue;
      const name = (isEn && (tags['name:en'] || tags.name)) || (!isEn && (tags['name:bn'] || tags.name)) || tags.name;
      const d = haversine(userLat, userLon, lat, lon);
      const key = `${String(name).trim().toLowerCase()}|${lat.toFixed(4)}|${lon.toFixed(4)}`;
      const item = { id: el.id, osmType: el.type, name: String(name).trim(), tags, lat, lon, distance: d };
      if (!dedupe.has(key) || d < dedupe.get(key).distance) dedupe.set(key, item);
    }
    return [...dedupe.values()].sort((a, b) => a.distance - b.distance);
  }

  function render(items, radius) {
    els.results.hidden = false;
    els.empty.hidden = !!items.length;
    els.list.replaceChildren();
    els.resultCount.textContent = isEn ? `${items.length} places` : `${bnNum(items.length)}টি জায়গা`;
    els.radiusNote.textContent = `${T.searched} ${bnNum(Math.round(radius / 1000))} ${isEn ? 'km' : 'কিমি'} · ${T.upTo}`;

    items.slice(0, MAX_RESULTS).forEach((p, i) => {
      const card = document.createElement('article');
      card.className = 'place-card';

      const num = document.createElement('span');
      num.className = 'place-num';
      num.textContent = bnNum(i + 1);

      const body = document.createElement('div');
      body.className = 'place-body';
      const h = document.createElement('h2');
      h.textContent = p.name;
      const meta = document.createElement('p');
      meta.className = 'place-meta';
      const area = areaLabel(p.tags);
      meta.textContent = `${distanceText(p.distance)} · ${category(p.tags)}${area ? ' · ' + area : ''}`;
      body.append(h, meta);

      const actions = document.createElement('div');
      actions.className = 'place-actions';
      const go = document.createElement('a');
      go.className = 'btn primary';
      go.target = '_blank';
      go.rel = 'noopener';
      go.href = `https://www.google.com/maps/dir/?api=1&destination=${p.lat.toFixed(6)},${p.lon.toFixed(6)}&travelmode=driving`;
      go.textContent = `🧭 ${T.directions}`;
      go.addEventListener('click', () => {
        try {
          window.gdTrack && window.gdTrack('NearbyDirections', {
            category: category(p.tags),
            distance_band: p.distance < 5 ? '0-5km' : p.distance < 20 ? '5-20km' : p.distance < 50 ? '20-50km' : '50km+'
          });
        } catch (_) {}
      });

      const src = document.createElement('a');
      src.className = 'btn quiet';
      src.target = '_blank';
      src.rel = 'noopener';
      src.href = `https://www.openstreetmap.org/${p.osmType}/${p.id}`;
      src.textContent = T.source;
      actions.append(go, src);

      card.append(num, body, actions);
      els.list.appendChild(card);
    });
  }

  async function findNearby(pos) {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    showStatus('loading', T.finding, T.findingText);
    els.results.hidden = true;

    let all = [];
    let usedRadius = RADII[0];
    try {
      for (const radius of RADII) {
        usedRadius = radius;
        const raw = await fetchOverpass(buildQuery(lat, lon, radius));
        all = normalize(raw, lat, lon);
        if (all.length >= MAX_RESULTS) break;
      }
      const shown = all.slice(0, MAX_RESULTS);
      showStatus('ok', T.found, shown.length ? (isEn ? `${shown.length} places are sorted by straight-line distance from you.` : `আপনার বর্তমান লোকেশন থেকে সরলরেখার দূরত্ব অনুযায়ী ${bnNum(shown.length)}টি জায়গা সাজানো হয়েছে।`) : T.none);
      render(shown, usedRadius);
      try { window.gdTrack && window.gdTrack('NearbySearch', { result_count: shown.length, radius_km: Math.round(usedRadius / 1000) }); } catch (_) {}
    } catch (err) {
      console.warn('Nearby search failed', err);
      showStatus('error', T.network, T.networkText);
      els.retry.hidden = false;
    } finally {
      els.locate.disabled = false;
    }
  }

  function geoError(err) {
    els.locate.disabled = false;
    els.retry.hidden = false;
    if (err && err.code === 1) showStatus('error', T.denied, T.deniedText);
    else showStatus('error', T.unavailable, T.unavailableText);
  }

  function start() {
    els.locate.disabled = true;
    els.retry.hidden = true;
    showStatus('loading', T.asking, T.askingText);
    if (!('geolocation' in navigator)) {
      geoError({ code: 2 });
      return;
    }
    navigator.geolocation.getCurrentPosition(findNearby, geoError, {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 300000
    });
  }

  els.locate.addEventListener('click', start);
  els.retry.addEventListener('click', start);
})();

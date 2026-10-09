/* Nearby tourist places — device location first, IP fallback, own district guides. */
(function () {
  'use strict';

  const isEn = document.documentElement.lang === 'en';
  const MAX_RESULTS = 50;
  const $ = s => document.querySelector(s);
  const els = {
    locate: $('#locateBtn'), retry: $('#retryBtn'), status: $('#nearbyStatus'),
    statusTitle: $('#statusTitle'), statusText: $('#statusText'), results: $('#results'),
    resultCount: $('#resultCount'), radiusNote: $('#radiusNote'), list: $('#placeList'),
    empty: $('#emptyState'), resultHead: $('#resultHead')
  };

  const T = isEn ? {
    finding:'Getting your current location…',
    findingText:'Allow location access to find the places closest to where you are now.',
    currentLocation:'Your current location', ipLocation:'IP location',
    deviceSource:'Device location', ipFallback:'Location permission was not available, so IP location is being used.',
    accuracy:'accuracy', locationUnavailable:'Could not determine your location',
    locationUnavailableText:'Please allow location access and try again.',
    network:'Nearby places could not be loaded', networkText:'Our district guide data could not be loaded. Please try again.',
    none:'No nearby places were found in our guides.', directions:'Directions', details:'Details',
    away:'away', approx:'Approx.', ownData:'From our 64 district guides', upTo:'Showing up to 50 nearby places',
    nearbyTitle:'Places to visit near you', howToGo:'How to go',
    sameDistrict:'Open the route from your current location to this place in Google Maps.',
    goDistrict:'Go towards {district}; use Directions for the live route to this place.'
  } : {
    finding:'আপনার বর্তমান লোকেশন নেওয়া হচ্ছে…',
    findingText:'আপনি এখন যেখানে আছেন তার কাছের জায়গা দেখাতে Location Allow করুন।',
    currentLocation:'আপনার বর্তমান লোকেশন', ipLocation:'আপনার IP লোকেশন',
    deviceSource:'ডিভাইস লোকেশন', ipFallback:'Location permission পাওয়া যায়নি, তাই IP লোকেশন ব্যবহার করা হয়েছে।',
    accuracy:'নির্ভুলতা', locationUnavailable:'আপনার লোকেশন পাওয়া যায়নি',
    locationUnavailableText:'Location Allow করে আবার চেষ্টা করুন।',
    network:'কাছাকাছি জায়গার তথ্য লোড করা যায়নি', networkText:'আমাদের জেলা গাইডের তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।',
    none:'আমাদের গাইডে কাছাকাছি কোনো দর্শনীয় স্থান পাওয়া যায়নি।', directions:'পথ দেখুন', details:'বিস্তারিত',
    away:'দূরে', approx:'প্রায়', ownData:'আমাদের ৬৪ জেলার গাইড থেকে', upTo:'সর্বোচ্চ ৫০টি কাছের জায়গা দেখানো হচ্ছে',
    nearbyTitle:'আপনার কাছাকাছি কোথায় ঘুরবেন', howToGo:'কীভাবে যাবেন',
    sameDistrict:'আপনার বর্তমান লোকেশন থেকে Google Maps-এ এই জায়গার লাইভ রুট খুলুন।',
    goDistrict:'{district} অভিমুখে যান; “পথ দেখুন” চাপলে এই জায়গার লাইভ রুট খুলবে।'
  };

  const REGION = {
    A: ['বরিশাল বিভাগ','Barishal Division'], B: ['চট্টগ্রাম বিভাগ','Chattogram Division'],
    C: ['ঢাকা বিভাগ','Dhaka Division'], D: ['খুলনা বিভাগ','Khulna Division'],
    E: ['রাজশাহী বিভাগ','Rajshahi Division'], F: ['রংপুর বিভাগ','Rangpur Division'],
    G: ['সিলেট বিভাগ','Sylhet Division'], H: ['ময়মনসিংহ বিভাগ','Mymensingh Division']
  };
  const COUNTRY = { BD: ['বাংলাদেশ','Bangladesh'] };

  function injectStyles() {
    if (document.getElementById('nearbyCardStyles')) return;
    const s = document.createElement('style');
    s.id = 'nearbyCardStyles';
    s.textContent = `
      .place-list{display:grid;gap:14px!important}
      .place-card{display:grid!important;grid-template-columns:156px minmax(0,1fr)!important;gap:0!important;align-items:stretch!important;padding:0!important;overflow:hidden;background:var(--surface);border:1px solid var(--line);border-radius:18px;box-shadow:0 5px 18px rgba(20,45,31,.05)}
      .place-photo{position:relative;min-height:150px;background:var(--surface-2);overflow:hidden}.place-photo img{width:100%;height:100%;min-height:150px;object-fit:cover;display:block}.place-photo .ph{height:100%;min-height:150px;display:grid;place-items:center;font-size:36px;color:var(--muted)}
      .place-num{position:absolute!important;top:10px;left:10px;z-index:2;width:32px!important;height:32px!important;background:rgba(255,255,255,.94)!important;color:#173528!important;box-shadow:0 2px 8px rgba(0,0,0,.12)}
      .place-content{padding:15px 16px;display:grid;gap:8px;align-content:start}.place-body h2{font-size:20px!important;margin:0;line-height:1.25}.place-meta{margin:3px 0 0!important}.place-desc{margin:0;color:var(--muted);font-size:14px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .place-route{margin:0;padding:9px 11px;border-radius:11px;background:var(--surface-2);font-size:14px;line-height:1.45;color:var(--ink);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.place-route b{color:var(--accent-ink)}
      .place-actions{justify-content:flex-start!important;margin-top:2px}.place-actions .btn{min-height:40px}
      @media(max-width:680px){.place-card{grid-template-columns:112px minmax(0,1fr)!important}.place-photo,.place-photo img,.place-photo .ph{min-height:142px}.place-content{padding:12px}.place-body h2{font-size:18px!important}.place-actions{grid-column:auto!important}.place-actions .btn{flex:1 1 120px!important}.place-desc{display:none}}
      @media(max-width:470px){.place-card{grid-template-columns:1fr!important}.place-photo,.place-photo img,.place-photo .ph{height:190px;min-height:190px}.place-actions{display:grid!important;grid-template-columns:1fr 1fr}.place-actions .btn{width:100%}}
    `;
    document.head.appendChild(s);
  }

  function tuneStaticCopy() {
    const finder = $('.finder p');
    if (finder) finder.textContent = isEn
      ? 'Allow device location to see up to 50 places closest to where you are now.'
      : 'Location Allow করলে আপনি এখন যেখানে আছেন সেখান থেকে সর্বোচ্চ ৫০টি কাছের দর্শনীয় স্থান দেখানো হবে।';
    const firstStep = document.querySelector('.steps .step p');
    if (firstStep) firstStep.textContent = isEn
      ? 'Your device location is used first; IP location is only a fallback.'
      : 'প্রথমে আপনার ডিভাইস লোকেশন নেওয়া হয়; না পাওয়া গেলে শুধু তখন IP লোকেশন ব্যবহার করা হয়।';
  }

  function bnNum(v) { return isEn ? String(v) : String(v).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[+d]); }
  function showStatus(kind, title, text) {
    els.status.hidden = false;
    els.status.dataset.kind = kind || '';
    els.statusTitle.textContent = title;
    els.statusText.textContent = text;
  }
  function regionLabel(region) { const k = String(region || '').toUpperCase(); return REGION[k] ? REGION[k][isEn ? 1 : 0] : (region || ''); }
  function countryLabel(country) { const k = String(country || '').toUpperCase(); return COUNTRY[k] ? COUNTRY[k][isEn ? 1 : 0] : (country || ''); }

  function getDevicePosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('geolocation unavailable'));
      navigator.geolocation.getCurrentPosition(
        pos => resolve({
          lat: Number(pos.coords.latitude),
          lon: Number(pos.coords.longitude),
          accuracy: Number(pos.coords.accuracy)
        }),
        reject,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      );
    });
  }

  function showCurrentLocation(loc, districtSlug) {
    const lat = Number(loc.lat), lon = Number(loc.lon);
    const coords = (Number.isFinite(lat) && Number.isFinite(lon)) ? `${lat.toFixed(6)}, ${lon.toFixed(6)}` : '';
    const accuracy = Number(loc.accuracy);
    const accText = Number.isFinite(accuracy) && loc.source === 'device'
      ? `${T.deviceSource} · ${T.accuracy} ${bnNum(Math.round(accuracy))} ${isEn ? 'm' : 'মিটার'}`
      : T.ipFallback;

    let place = String(loc.label || '').trim();
    if (!place) {
      const city = String(loc.city || '').trim();
      const division = regionLabel(loc.region);
      const country = countryLabel(loc.country);
      place = [city, division, country].filter(Boolean).join(', ') || districtSlug || (isEn ? 'Bangladesh' : 'বাংলাদেশ');
    }

    const title = loc.source === 'device' ? T.currentLocation : T.ipLocation;
    showStatus('ok', `📍 ${title}: ${place}`, [coords, accText].filter(Boolean).join(' · '));
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371, r = x => x * Math.PI / 180;
    const dLat = r(lat2 - lat1), dLon = r(lon2 - lon1);
    const q = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q));
  }

  function distanceText(km) {
    if (!Number.isFinite(km)) return '';
    if (km < 1) return `${T.approx} ${bnNum(Math.max(100, Math.round(km * 1000 / 100) * 100))} ${isEn ? 'm' : 'মিটার'} ${T.away}`;
    const n = km < 10 ? km.toFixed(1) : Math.round(km);
    return `${T.approx} ${bnNum(n)} ${isEn ? 'km' : 'কিমি'} ${T.away}`;
  }

  function cleanRouteText(text) {
    return String(text || '').replace(/\s+/g, ' ').replace(/^ঢাকা থেকে যাওয়া\s*/,'').replace(/^From Dhaka\s*/i,'').trim().slice(0, 220);
  }

  function fallbackAttractions(doc) {
    return [...doc.querySelectorAll('.spots .spot')].map((spot, index) => {
      const h = spot.querySelector('h3'); if (!h) return null;
      const small = h.querySelector('small');
      const nameEn = small ? String(small.textContent || '').trim() : '';
      const clone = h.cloneNode(true); clone.querySelectorAll('small').forEach(x => x.remove());
      const nameBn = String(clone.textContent || '').trim();
      const p = spot.querySelector('.body > p,.body p');
      const img = spot.querySelector('img');
      return { nameBn, nameEn, description: p ? String(p.textContent || '').trim() : '', image: img ? img.getAttribute('src') : null, index };
    }).filter(Boolean);
  }

  function parseGuide(slug, html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    let destination = null;
    for (const node of doc.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const parsed = JSON.parse(node.textContent || 'null');
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        destination = arr.find(x => x && (x['@type'] === 'TouristDestination' || (Array.isArray(x['@type']) && x['@type'].includes('TouristDestination'))));
        if (destination) break;
      } catch (_) {}
    }

    const geo = (destination && destination.geo) || {};
    const lat = Number(geo.latitude), lon = Number(geo.longitude);
    const attrs = destination && Array.isArray(destination.includesAttraction) ? destination.includesAttraction : [];
    let attractions = attrs.map((a, index) => ({
      nameBn: a && a.name ? String(a.name) : '',
      nameEn: a && a.alternateName ? String(a.alternateName) : '',
      description: a && a.description ? String(a.description) : '',
      image: a && a.image ? String(a.image) : null,
      index
    })).filter(a => a.nameBn || a.nameEn);
    if (!attractions.length) attractions = fallbackAttractions(doc);

    const nearby = [];
    for (const a of doc.querySelectorAll('.near a[href^="/jela/"]')) {
      const m = String(a.getAttribute('href') || '').match(/^\/jela\/([a-z0-9-]+)/i);
      if (m && m[1] !== slug && !nearby.includes(m[1])) nearby.push(m[1]);
      if (nearby.length >= 8) break;
    }

    const routeCard = [...doc.querySelectorAll('.info .card')].find(x => /ঢাকা থেকে যাওয়া|From Dhaka/i.test(x.textContent || ''));
    return {
      slug,
      nameBn: (destination && destination.name) || slug,
      nameEn: (destination && destination.alternateName) || slug,
      lat, lon, nearby, attractions,
      districtRoute: cleanRouteText(routeCard ? routeCard.textContent : ''),
      districtImage: destination && destination.image ? String(destination.image) : null
    };
  }

  async function fetchGuide(slug) {
    let r = await fetch(`/jela/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!r.ok) r = await fetch(`/jela/${encodeURIComponent(slug)}.html`, { cache: 'no-store' });
    if (!r.ok) throw new Error(`guide ${slug} ${r.status}`);
    const guide = parseGuide(slug, await r.text());
    if (!guide.attractions.length) throw new Error(`guide ${slug} has no attractions`);
    return guide;
  }

  function makePlaces(guides, loc) {
    const out = [];
    for (const g of guides) {
      const d = Number.isFinite(g.lat) && Number.isFinite(g.lon) ? haversine(loc.lat, loc.lon, g.lat, g.lon) : 0;
      for (const a of g.attractions) {
        out.push({
          ...a,
          districtSlug: g.slug,
          districtBn: g.nameBn,
          districtEn: g.nameEn,
          distanceKm: d,
          guideUrl: isEn ? `/en/jela/${g.slug}` : `/jela/${g.slug}`,
          districtRoute: g.districtRoute,
          districtImage: g.districtImage
        });
      }
    }
    return out.sort((a, b) => a.distanceKm - b.distanceKm || a.index - b.index).slice(0, MAX_RESULTS);
  }

  async function loadOwnPlaces(primarySlug, loc) {
    const primary = await fetchGuide(primarySlug);
    const guides = [primary];
    const seen = new Set([primarySlug]);

    const firstSlugs = primary.nearby.filter(s => !seen.has(s)).slice(0, 6);
    firstSlugs.forEach(s => seen.add(s));
    const first = await Promise.allSettled(firstSlugs.map(fetchGuide));
    for (const x of first) if (x.status === 'fulfilled') guides.push(x.value);

    let places = makePlaces(guides, loc);
    if (places.length < MAX_RESULTS) {
      const secondSlugs = [];
      for (const g of guides) {
        for (const s of g.nearby || []) {
          if (!seen.has(s)) {
            seen.add(s); secondSlugs.push(s);
            if (secondSlugs.length >= 8) break;
          }
        }
        if (secondSlugs.length >= 8) break;
      }
      const second = await Promise.allSettled(secondSlugs.map(fetchGuide));
      for (const x of second) if (x.status === 'fulfilled') guides.push(x.value);
      places = makePlaces(guides, loc);
    }
    return places;
  }

  function detailsUrl(p) {
    const name = isEn ? (p.nameEn || p.nameBn) : (p.nameBn || p.nameEn);
    return `${p.guideUrl}#:~:text=${encodeURIComponent(name)}`;
  }

  function routeHint(p, primarySlug) {
    const district = isEn ? (p.districtEn || p.districtBn) : (p.districtBn || p.districtEn);
    if (p.districtRoute) return p.districtRoute;
    if (p.districtSlug === primarySlug) return T.sameDistrict;
    return T.goDistrict.replace('{district}', district || '');
  }

  function render(items, primarySlug) {
    els.results.hidden = false;
    els.empty.hidden = !!items.length;
    els.list.replaceChildren();
    if (els.resultHead) els.resultHead.textContent = T.nearbyTitle;
    els.resultCount.textContent = isEn ? `${items.length} places` : `${bnNum(items.length)}টি জায়গা`;
    els.radiusNote.textContent = `${T.ownData} · ${T.upTo}`;

    items.forEach((p, i) => {
      const card = document.createElement('article'); card.className = 'place-card';
      const photo = document.createElement('div'); photo.className = 'place-photo';
      const num = document.createElement('span'); num.className = 'place-num'; num.textContent = bnNum(i + 1); photo.appendChild(num);
      const image = p.image || p.districtImage;
      if (image) {
        const img = document.createElement('img'); img.loading = 'lazy'; img.decoding = 'async'; img.alt = isEn ? (p.nameEn || p.nameBn) : (p.nameBn || p.nameEn); img.src = image; photo.appendChild(img);
      } else {
        const ph = document.createElement('div'); ph.className = 'ph'; ph.textContent = '📍'; photo.appendChild(ph);
      }

      const content = document.createElement('div'); content.className = 'place-content';
      const body = document.createElement('div'); body.className = 'place-body';
      const h = document.createElement('h2'); h.textContent = isEn ? (p.nameEn || p.nameBn) : (p.nameBn || p.nameEn);
      const meta = document.createElement('p'); meta.className = 'place-meta';
      const district = isEn ? (p.districtEn || p.districtBn) : (p.districtBn || p.districtEn);
      meta.textContent = `${distanceText(Number(p.distanceKm))}${district ? ' · ' + district : ''}`;
      body.append(h, meta); content.appendChild(body);

      if (p.description) {
        const desc = document.createElement('p'); desc.className = 'place-desc'; desc.textContent = p.description; content.appendChild(desc);
      }

      const route = document.createElement('p'); route.className = 'place-route';
      const rb = document.createElement('b'); rb.textContent = `${T.howToGo}: `; route.appendChild(rb); route.appendChild(document.createTextNode(routeHint(p, primarySlug))); content.appendChild(route);

      const actions = document.createElement('div'); actions.className = 'place-actions';
      const go = document.createElement('a'); go.className = 'btn primary'; go.target = '_blank'; go.rel = 'noopener';
      const q = [p.nameEn || p.nameBn, p.districtEn || p.districtBn, 'Bangladesh'].filter(Boolean).join(', ');
      go.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}&travelmode=driving`; go.textContent = `🧭 ${T.directions}`;
      const details = document.createElement('a'); details.className = 'btn quiet'; details.href = detailsUrl(p); details.textContent = `↗ ${T.details}`;
      actions.append(go, details); content.appendChild(actions);

      card.append(photo, content); els.list.appendChild(card);
    });
  }

  async function callNearby(position) {
    const payload = { action: 'nearby' };
    if (position) Object.assign(payload, { source: 'device', lat: position.lat, lon: position.lon, accuracy: position.accuracy });
    else payload.source = 'ip';

    const r = await fetch('/api/event', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload), cache: 'no-store'
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `nearby ${r.status}`);
    return data;
  }

  async function findNearby() {
    showStatus('loading', T.finding, T.findingText);
    els.results.hidden = true;

    try {
      let position = null;
      try { position = await getDevicePosition(); }
      catch (e) { console.info('Device location unavailable, using IP fallback', e && e.message); }

      const data = await callNearby(position);
      const loc = data.location || {};
      const lat = Number(loc.lat), lon = Number(loc.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !data.primaryDistrict) throw new Error('location unavailable');

      showCurrentLocation(loc, data.primaryDistrict);
      const shown = await loadOwnPlaces(data.primaryDistrict, { lat, lon });
      render(shown, data.primaryDistrict);
      if (!shown.length) {
        els.empty.hidden = false;
        els.empty.textContent = T.none;
      }
      try { window.gdTrack && window.gdTrack('NearbySearch', { result_count: shown.length, source: loc.source || 'unknown' }); } catch (_) {}
    } catch (err) {
      console.warn('Nearby search failed', err);
      showStatus('error', T.locationUnavailable, T.locationUnavailableText);
      els.retry.hidden = false;
    } finally {
      els.locate.disabled = false;
    }
  }

  function start() {
    els.locate.disabled = true;
    els.retry.hidden = true;
    findNearby();
  }

  injectStyles();
  tuneStaticCopy();
  els.locate.addEventListener('click', start);
  els.retry.addEventListener('click', start);
})();

/* Nearby tourist places — show IP-detected area first, then use Ghure Dekha Bangladesh's own district guides. */
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
    finding:'Finding your current area…',
    findingText:'Detecting your approximate area from your internet connection.',
    youAre:'You are now',
    approxLocation:'Approximate location from your IP',
    locationUnavailable:'Could not determine your area',
    locationUnavailableText:'Your approximate internet location could not be detected. Please try again.',
    network:'Nearby places could not be loaded',
    networkText:'Our district guide data could not be loaded. Please try again.',
    none:'No nearby places were found in our guides.',
    directions:'Directions', guide:'District guide', away:'away', approx:'Approx.',
    ownData:'From our 64 district guides', upTo:'Showing up to 50 nearby places',
    nearbyTitle:'Places to visit near you'
  } : {
    finding:'আপনি এখন কোথায় আছেন তা খোঁজা হচ্ছে…',
    findingText:'আপনার ইন্টারনেট সংযোগ থেকে আনুমানিক শহর/এলাকা শনাক্ত করা হচ্ছে।',
    youAre:'আপনি এখন',
    approxLocation:'IP অনুযায়ী আনুমানিক লোকেশন',
    locationUnavailable:'আপনার এলাকা বোঝা যায়নি',
    locationUnavailableText:'আপনার ইন্টারনেট লোকেশন থেকে এলাকা শনাক্ত করা যায়নি। আবার চেষ্টা করুন।',
    network:'কাছাকাছি জায়গার তথ্য লোড করা যায়নি',
    networkText:'আমাদের জেলা গাইডের তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।',
    none:'আমাদের গাইডে কাছাকাছি কোনো দর্শনীয় স্থান পাওয়া যায়নি।',
    directions:'পথ দেখুন', guide:'জেলা গাইড', away:'দূরে', approx:'আনুমানিক',
    ownData:'আমাদের ৬৪ জেলার গাইড থেকে', upTo:'সর্বোচ্চ ৫০টি কাছের জায়গা দেখানো হচ্ছে',
    nearbyTitle:'আপনার কাছাকাছি কোথায় ঘুরবেন'
  };

  const REGION = {
    A: ['বরিশাল বিভাগ','Barishal Division'],
    B: ['চট্টগ্রাম বিভাগ','Chattogram Division'],
    C: ['ঢাকা বিভাগ','Dhaka Division'],
    D: ['খুলনা বিভাগ','Khulna Division'],
    E: ['রাজশাহী বিভাগ','Rajshahi Division'],
    F: ['রংপুর বিভাগ','Rangpur Division'],
    G: ['সিলেট বিভাগ','Sylhet Division'],
    H: ['ময়মনসিংহ বিভাগ','Mymensingh Division']
  };

  function bnNum(v) {
    return isEn ? String(v) : String(v).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[+d]);
  }

  function showStatus(kind, title, text) {
    els.status.hidden = false;
    els.status.dataset.kind = kind || '';
    els.statusTitle.textContent = title;
    els.statusText.textContent = text;
  }

  function regionLabel(region) {
    const key = String(region || '').toUpperCase();
    return REGION[key] ? REGION[key][isEn ? 1 : 0] : (region || '');
  }

  function showCurrentLocation(loc, districtSlug) {
    const city = String(loc.city || '').trim();
    const division = regionLabel(loc.region);
    const place = [city, division].filter(Boolean).join(', ') || districtSlug || (isEn ? 'Bangladesh' : 'বাংলাদেশ');
    showStatus('ok', `📍 ${T.youAre}: ${place}`, T.approxLocation);
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

  function fallbackAttractions(doc) {
    return [...doc.querySelectorAll('.spots .spot')].map((spot, index) => {
      const h = spot.querySelector('h3');
      if (!h) return null;
      const small = h.querySelector('small');
      const nameEn = small ? String(small.textContent || '').trim() : '';
      const clone = h.cloneNode(true);
      clone.querySelectorAll('small').forEach(x => x.remove());
      const nameBn = String(clone.textContent || '').trim();
      const p = spot.querySelector('.body > p, .body p');
      const img = spot.querySelector('img');
      return {
        nameBn,
        nameEn,
        description: p ? String(p.textContent || '').trim() : '',
        image: img ? img.getAttribute('src') : null,
        index
      };
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

    return {
      slug,
      nameBn: (destination && destination.name) || slug,
      nameEn: (destination && destination.alternateName) || slug,
      lat, lon, nearby, attractions
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
      const d = Number.isFinite(g.lat) && Number.isFinite(g.lon)
        ? haversine(loc.lat, loc.lon, g.lat, g.lon)
        : 0;
      for (const a of g.attractions) {
        out.push({
          ...a,
          districtSlug: g.slug,
          districtBn: g.nameBn,
          districtEn: g.nameEn,
          distanceKm: d,
          guideUrl: isEn ? `/en/jela/${g.slug}` : `/jela/${g.slug}`
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
            seen.add(s);
            secondSlugs.push(s);
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

  function render(items) {
    els.results.hidden = false;
    els.empty.hidden = !!items.length;
    els.list.replaceChildren();
    if (els.resultHead) els.resultHead.textContent = T.nearbyTitle;
    els.resultCount.textContent = isEn ? `${items.length} places` : `${bnNum(items.length)}টি জায়গা`;
    els.radiusNote.textContent = `${T.ownData} · ${T.upTo}`;

    items.forEach((p, i) => {
      const card = document.createElement('article'); card.className = 'place-card';
      const num = document.createElement('span'); num.className = 'place-num'; num.textContent = bnNum(i + 1);
      const body = document.createElement('div'); body.className = 'place-body';
      const h = document.createElement('h2'); h.textContent = isEn ? (p.nameEn || p.nameBn) : (p.nameBn || p.nameEn);
      const meta = document.createElement('p'); meta.className = 'place-meta';
      const district = isEn ? (p.districtEn || p.districtBn) : (p.districtBn || p.districtEn);
      meta.textContent = `${distanceText(Number(p.distanceKm))}${district ? ' · ' + district : ''}`;
      body.append(h, meta);

      const actions = document.createElement('div'); actions.className = 'place-actions';
      const go = document.createElement('a'); go.className = 'btn primary'; go.target = '_blank'; go.rel = 'noopener';
      const q = [p.nameEn || p.nameBn, p.districtEn || p.districtBn, 'Bangladesh'].filter(Boolean).join(', ');
      go.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}&travelmode=driving`;
      go.textContent = `🧭 ${T.directions}`;
      const guide = document.createElement('a'); guide.className = 'btn quiet'; guide.href = p.guideUrl; guide.textContent = T.guide;
      actions.append(go, guide);
      card.append(num, body, actions);
      els.list.append(card);
    });
  }

  async function findNearby() {
    showStatus('loading', T.finding, T.findingText);
    els.results.hidden = true;
    try {
      const r = await fetch('/api/event', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({action:'nearby'}),
        cache:'no-store'
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 503) throw Object.assign(new Error('ip-location'), { kind:'location' });
        throw new Error('nearby ' + r.status);
      }

      const loc = data.location || {};
      const lat = Number(loc.lat), lon = Number(loc.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !data.primaryDistrict) {
        throw Object.assign(new Error('ip-location'), { kind:'location' });
      }

      // First show where the visitor is, then load nearby attractions below it.
      showCurrentLocation(loc, data.primaryDistrict);

      const shown = await loadOwnPlaces(data.primaryDistrict, { lat, lon });
      render(shown);
      if (!shown.length) {
        els.empty.hidden = false;
        els.empty.textContent = T.none;
      }
      try { window.gdTrack && window.gdTrack('NearbySearch', { result_count: shown.length, source:'site-guides' }); } catch (_) {}
    } catch (err) {
      console.warn('Nearby search failed', err);
      if (err && err.kind === 'location') showStatus('error', T.locationUnavailable, T.locationUnavailableText);
      else showStatus('error', T.network, T.networkText);
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

  els.locate.addEventListener('click', start);
  els.retry.addEventListener('click', start);
})();

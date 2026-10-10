/* Nearby tourist places — device location first, IP fallback, own district guides only. */
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
    finding: 'Getting your current location…',
    findingText: 'Allow location access to find places around where you are now.',
    currentLocation: 'Your current location',
    ipLocation: 'IP location',
    deviceSource: 'Device location',
    ipFallback: 'Location permission was unavailable, so IP location is being used.',
    accuracy: 'accuracy',
    locationUnavailable: 'Could not determine your location',
    locationUnavailableText: 'Please allow location access and try again.',
    network: 'Nearby places could not be loaded',
    networkText: 'Our district guide data could not be loaded. Please try again.',
    none: 'No nearby places were found in our guides.',
    directions: 'Directions', details: 'Details', howToGo: 'How to go',
    noPhoto: 'Photo not available', photoSoon: 'No verified photo yet',
    currentDistrict: 'Your district', nearbyDistrict: 'Nearby district',
    exactAway: 'away', approx: 'Approx.',
    upTo: 'Your district first, then nearby districts · up to 50 places',
    nearbyTitle: 'Places to visit near you',
    liveRoute: 'From {origin}, tap Directions. Google Maps will show the live route, distance and travel time.',
    noExactDistance: 'Exact place distance will appear when a verified place coordinate is available.'
  } : {
    finding: 'আপনার বর্তমান লোকেশন নেওয়া হচ্ছে…',
    findingText: 'আপনি এখন যেখানে আছেন তার কাছের জায়গা দেখাতে Location Allow করুন।',
    currentLocation: 'আপনার বর্তমান লোকেশন',
    ipLocation: 'আপনার IP লোকেশন',
    deviceSource: 'ডিভাইস লোকেশন',
    ipFallback: 'Location permission পাওয়া যায়নি, তাই IP লোকেশন ব্যবহার করা হয়েছে।',
    accuracy: 'নির্ভুলতা',
    locationUnavailable: 'আপনার লোকেশন পাওয়া যায়নি',
    locationUnavailableText: 'Location Allow করে আবার চেষ্টা করুন।',
    network: 'কাছাকাছি জায়গার তথ্য লোড করা যায়নি',
    networkText: 'আমাদের জেলা গাইডের তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।',
    none: 'আমাদের গাইডে কাছাকাছি কোনো দর্শনীয় স্থান পাওয়া যায়নি।',
    directions: 'পথ দেখুন', details: 'বিস্তারিত', howToGo: 'কীভাবে যাবেন',
    noPhoto: 'ছবি নেই', photoSoon: 'যাচাইকৃত ছবি এখনো নেই',
    currentDistrict: 'আপনার জেলা', nearbyDistrict: 'কাছের জেলা',
    exactAway: 'দূরে', approx: 'প্রায়',
    upTo: 'আপনার জেলা আগে, এরপর কাছের জেলা · সর্বোচ্চ ৫০টি জায়গা',
    nearbyTitle: 'আপনার কাছাকাছি কোথায় ঘুরবেন',
    liveRoute: '{origin} থেকে “পথ দেখুন” চাপুন। Google Maps লাইভ রুট, দূরত্ব ও যেতে কত সময় লাগবে দেখাবে।',
    noExactDistance: 'জায়গাটির যাচাইকৃত coordinate থাকলে সঠিক দূরত্বও এখানে দেখানো হবে।'
  };

  const REGION = {
    A: ['বরিশাল বিভাগ', 'Barishal Division'], B: ['চট্টগ্রাম বিভাগ', 'Chattogram Division'],
    C: ['ঢাকা বিভাগ', 'Dhaka Division'], D: ['খুলনা বিভাগ', 'Khulna Division'],
    E: ['রাজশাহী বিভাগ', 'Rajshahi Division'], F: ['রংপুর বিভাগ', 'Rangpur Division'],
    G: ['সিলেট বিভাগ', 'Sylhet Division'], H: ['ময়মনসিংহ বিভাগ', 'Mymensingh Division']
  };
  const COUNTRY = { BD: ['বাংলাদেশ', 'Bangladesh'] };

  let originLabel = isEn ? 'your current location' : 'বর্তমান অবস্থান';
  let primaryDistrict = '';

  function injectStyles() {
    if (document.getElementById('nearbyCardStyles')) return;
    const s = document.createElement('style');
    s.id = 'nearbyCardStyles';
    s.textContent = `
      .nearby-kicker{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:2px}
      .nearby-pill{display:inline-flex;align-items:center;gap:6px;padding:5px 9px;border-radius:999px;background:var(--surface-2);color:var(--muted);font-size:12px;font-weight:700;line-height:1}
      .nearby-pill.primary{background:var(--accent-soft);color:var(--accent-ink)}
      .place-list{display:grid;gap:16px!important}
      .place-card{display:grid!important;grid-template-columns:178px minmax(0,1fr)!important;gap:0!important;align-items:stretch!important;padding:0!important;overflow:hidden;background:var(--surface);border:1px solid var(--line);border-radius:20px;box-shadow:0 8px 28px rgba(20,45,31,.06);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
      .place-card:hover{transform:translateY(-2px);box-shadow:0 13px 34px rgba(20,45,31,.10);border-color:var(--line)}
      .place-photo{position:relative;min-height:176px;background:var(--surface-2);overflow:hidden}
      .place-photo img{width:100%;height:100%;min-height:176px;object-fit:cover;display:block}
      .place-photo .ph{height:100%;min-height:176px;display:grid;place-items:center;align-content:center;gap:8px;padding:18px;text-align:center;font-size:42px;color:var(--muted);background:radial-gradient(circle at 30% 20%,rgba(15,127,76,.10),transparent 34%),linear-gradient(145deg,var(--surface-2),var(--surface))}
      .place-photo .ph small{font-size:12px;font-weight:700;line-height:1.35;max-width:16ch}
      .place-num{position:absolute!important;top:12px;left:12px;z-index:2;width:36px!important;height:36px!important;border-radius:50%;display:grid!important;place-items:center;background:rgba(255,255,255,.95)!important;color:#173528!important;font-weight:800;box-shadow:0 3px 12px rgba(0,0,0,.14)}
      .place-content{min-width:0;padding:16px 17px;display:grid;gap:9px;align-content:start}
      .place-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
      .place-body{min-width:0}.place-body h2{font-size:21px!important;margin:0;line-height:1.22;letter-spacing:-.01em}.place-meta{margin:5px 0 0!important;color:var(--muted);font-size:13px;line-height:1.35}
      .place-desc{margin:0;color:var(--muted);font-size:14px;line-height:1.52;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .place-route{margin:0;padding:10px 12px;border-radius:12px;background:var(--surface-2);font-size:13px;line-height:1.45;color:var(--ink)}
      .place-route b{color:var(--accent-ink)}
      .place-actions{display:flex!important;gap:8px!important;justify-content:flex-start!important;flex-wrap:wrap!important;margin-top:1px}
      .place-actions .btn{min-height:40px;padding:9px 13px;font-size:14px}
      .place-actions .btn.primary{min-width:132px}
      .place-fact{display:grid;grid-template-columns:auto 1fr;gap:7px;align-items:start;font-size:12px;color:var(--muted)}
      @media(min-width:1180px){
        body main.wrap{max-width:1320px}
        .hero{max-width:920px}
        .finder,.status{max-width:none}
        .results-head{margin-top:8px;margin-bottom:16px}
        .results-head h2{font-size:30px!important}
        .place-list{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px!important}
        .place-card{grid-template-columns:190px minmax(0,1fr)!important;min-height:238px}
        .place-photo,.place-photo img,.place-photo .ph{min-height:238px;height:100%}
        .place-content{padding:18px 19px;gap:10px}
        .place-body h2{font-size:22px!important}
        .place-desc{-webkit-line-clamp:3;font-size:14.5px}
        .place-route{font-size:13.5px}
      }
      @media(min-width:1500px){
        body main.wrap{max-width:1420px}
        .place-card{grid-template-columns:205px minmax(0,1fr)!important}
      }
      @media(max-width:760px){
        .place-card{grid-template-columns:118px minmax(0,1fr)!important;border-radius:17px}
        .place-photo,.place-photo img,.place-photo .ph{min-height:150px}
        .place-content{padding:12px;gap:8px}
        .place-body h2{font-size:18px!important}
        .place-desc{display:none}
        .place-top{display:block}
        .nearby-kicker{margin-top:7px}
        .place-actions{grid-column:auto!important}
        .place-actions .btn{flex:1 1 118px!important}
        .place-route{font-size:13px}
      }
      @media(max-width:480px){
        .place-card{grid-template-columns:1fr!important}
        .place-photo,.place-photo img,.place-photo .ph{height:200px;min-height:200px}
        .place-content{padding:15px}
        .place-actions{display:grid!important;grid-template-columns:1fr 1fr}
        .place-actions .btn{width:100%;min-width:0}
      }
    `;
    document.head.appendChild(s);
  }

  function tuneStaticCopy() {
    const hero = $('.hero p');
    if (hero) hero.textContent = isEn
      ? 'Allow your device location to see places from your district and nearby districts. Directions opens a live Google Maps route.'
      : 'Location Allow করলে আপনার বর্তমান জেলা ও কাছের জেলার দর্শনীয় স্থানগুলো দেখানো হবে। “পথ দেখুন” চাপলে Google Maps-এ লাইভ রুট খুলবে।';
    const finder = $('.finder p');
    if (finder) finder.textContent = isEn
      ? 'Device location is used first; IP location is only a fallback.'
      : 'প্রথমে আপনার ডিভাইস লোকেশন নেওয়া হবে; না পাওয়া গেলে শুধু তখন IP লোকেশন ব্যবহার হবে।';
    const firstStep = document.querySelector('.steps .step p');
    if (firstStep) firstStep.textContent = isEn
      ? 'Your device location is used first; IP location is only a fallback.'
      : 'প্রথমে ডিভাইস লোকেশন নেওয়া হয়; না পাওয়া গেলে IP লোকেশন ব্যবহার করা হয়।';
  }

  function bnNum(v) {
    return isEn ? String(v) : String(v).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[+d]);
  }

  function cleanName(v) { return String(v || '').trim(); }
  function norm(v) { return cleanName(v).toLowerCase().replace(/[^a-z0-9\u0980-\u09ff]+/g, ''); }

  function showStatus(kind, title, text) {
    els.status.hidden = false;
    els.status.dataset.kind = kind || '';
    els.statusTitle.textContent = title;
    els.statusText.textContent = text || '';
  }

  function regionLabel(region) {
    const k = String(region || '').toUpperCase();
    return REGION[k] ? REGION[k][isEn ? 1 : 0] : cleanName(region);
  }

  function countryLabel(country) {
    const k = String(country || '').toUpperCase();
    return COUNTRY[k] ? COUNTRY[k][isEn ? 1 : 0] : cleanName(country);
  }

  function getDevicePosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('geolocation unavailable'));
      navigator.geolocation.getCurrentPosition(
        p => resolve({
          lat: Number(p.coords.latitude),
          lon: Number(p.coords.longitude),
          accuracy: Number(p.coords.accuracy)
        }),
        reject,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 15000 }
      );
    });
  }

  function showCurrentLocation(loc, districtSlug) {
    const lat = Number(loc.lat), lon = Number(loc.lon), accuracy = Number(loc.accuracy);
    const coords = Number.isFinite(lat) && Number.isFinite(lon) ? `${lat.toFixed(6)}, ${lon.toFixed(6)}` : '';
    let place = cleanName(loc.label);
    if (!place) {
      const city = cleanName(loc.city), division = regionLabel(loc.region), country = countryLabel(loc.country);
      place = [city, division, country].filter(Boolean).join(', ') || districtSlug || (isEn ? 'Bangladesh' : 'বাংলাদেশ');
    }
    originLabel = place.split(',')[0].trim() || originLabel;
    const sourceText = Number.isFinite(accuracy) && loc.source === 'device'
      ? `${T.deviceSource} · ${T.accuracy} ${bnNum(Math.round(accuracy))} ${isEn ? 'm' : 'মিটার'}`
      : T.ipFallback;
    showStatus(
      'ok',
      `📍 ${loc.source === 'device' ? T.currentLocation : T.ipLocation}: ${place}`,
      [coords, sourceText].filter(Boolean).join(' · ')
    );
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371, r = x => x * Math.PI / 180;
    const dLat = r(lat2 - lat1), dLon = r(lon2 - lon1);
    const q = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q));
  }

  function distanceText(km) {
    if (!Number.isFinite(km)) return '';
    if (km < 1) return `${T.approx} ${bnNum(Math.max(100, Math.round(km * 1000 / 100) * 100))} ${isEn ? 'm' : 'মিটার'} ${T.exactAway}`;
    const n = km < 10 ? km.toFixed(1) : Math.round(km);
    return `${T.approx} ${bnNum(n)} ${isEn ? 'km' : 'কিমি'} ${T.exactAway}`;
  }

  function nodeEmoji(spot) {
    const tag = cleanName(spot.querySelector('.tag')?.textContent);
    const figureText = cleanName(spot.querySelector('figure.pic.ph')?.childNodes?.[0]?.textContent);
    return figureText || (tag.match(/^\S+/) || [])[0] || '📍';
  }

  function spotRows(doc) {
    return [...doc.querySelectorAll('.spots .spot')].map((spot, index) => {
      const h = spot.querySelector('h3');
      if (!h) return null;
      const small = h.querySelector('small');
      const nameEn = small ? cleanName(small.textContent) : '';
      const clone = h.cloneNode(true);
      clone.querySelectorAll('small').forEach(x => x.remove());
      const nameBn = cleanName(clone.textContent);
      const p = spot.querySelector('.body > p,.body p');
      const img = spot.querySelector('figure.pic img');
      const tag = cleanName(spot.querySelector('.tag')?.textContent);
      return {
        nameBn, nameEn,
        description: p ? cleanName(p.textContent) : '',
        image: img ? img.getAttribute('src') : null,
        placeholder: nodeEmoji(spot),
        tag,
        index
      };
    }).filter(Boolean);
  }

  function attractionGeo(a) {
    const geo = a && a.geo;
    if (!geo) return { lat: NaN, lon: NaN };
    return { lat: Number(geo.latitude), lon: Number(geo.longitude) };
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

    const domSpots = spotRows(doc);
    const attrs = destination && Array.isArray(destination.includesAttraction) ? destination.includesAttraction : [];
    let attractions = [];

    if (attrs.length) {
      attractions = attrs.map((a, index) => {
        const nameBn = a && a.name ? cleanName(a.name) : '';
        const nameEn = a && a.alternateName ? cleanName(a.alternateName) : '';
        const dom = domSpots.find(s => norm(s.nameBn) === norm(nameBn) || (nameEn && norm(s.nameEn) === norm(nameEn))) || domSpots[index] || null;
        const geo = attractionGeo(a);
        return {
          nameBn: nameBn || (dom && dom.nameBn) || '',
          nameEn: nameEn || (dom && dom.nameEn) || '',
          description: (a && a.description ? cleanName(a.description) : '') || (dom && dom.description) || '',
          image: (dom && dom.image) || (a && a.image ? cleanName(a.image) : null),
          placeholder: (dom && dom.placeholder) || '📍',
          tag: (dom && dom.tag) || '',
          lat: geo.lat, lon: geo.lon,
          index
        };
      }).filter(a => a.nameBn || a.nameEn);
    } else {
      attractions = domSpots.map(s => ({ ...s, lat: NaN, lon: NaN }));
    }

    const nearby = [];
    for (const a of doc.querySelectorAll('.near a[href^="/jela/"]')) {
      const m = cleanName(a.getAttribute('href')).match(/^\/jela\/([a-z0-9-]+)/i);
      if (!m || m[1] === slug || nearby.some(x => x.slug === m[1])) continue;
      const small = cleanName(a.querySelector('small')?.textContent);
      const num = small.match(/[0-9০-৯]+/);
      let km = NaN;
      if (num) {
        const ascii = num[0].replace(/[০-৯]/g, d => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
        km = Number(ascii);
      }
      nearby.push({ slug: m[1], km });
      if (nearby.length >= 8) break;
    }

    return {
      slug,
      nameBn: (destination && destination.name) || slug,
      nameEn: (destination && destination.alternateName) || slug,
      attractions,
      nearby
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

  function textFragmentUrl(guideUrl, name) {
    const text = cleanName(name);
    return text ? `${guideUrl}#:~:text=${encodeURIComponent(text)}` : guideUrl;
  }

  function makePlaces(guides, loc, districtOrder) {
    const out = [];
    for (const g of guides) {
      const rankInfo = districtOrder.get(g.slug) || { rank: 999, km: NaN };
      for (const a of g.attractions) {
        let exactKm = NaN;
        if (Number.isFinite(a.lat) && Number.isFinite(a.lon)) {
          exactKm = haversine(Number(loc.lat), Number(loc.lon), a.lat, a.lon);
        }
        out.push({
          ...a,
          districtSlug: g.slug,
          districtBn: g.nameBn,
          districtEn: g.nameEn,
          districtRank: rankInfo.rank,
          districtKm: rankInfo.km,
          exactKm,
          guideUrl: isEn ? `/en/jela/${g.slug}` : `/jela/${g.slug}`
        });
      }
    }
    out.sort((a, b) => {
      const aExact = Number.isFinite(a.exactKm), bExact = Number.isFinite(b.exactKm);
      if (aExact && bExact) return a.exactKm - b.exactKm;
      if (a.districtRank !== b.districtRank) return a.districtRank - b.districtRank;
      if (aExact !== bExact) return aExact ? -1 : 1;
      return (a.index || 0) - (b.index || 0);
    });
    return out.slice(0, MAX_RESULTS);
  }

  function directionUrl(place) {
    const q = [place.nameEn || place.nameBn, place.districtEn || place.districtBn, 'Bangladesh'].filter(Boolean).join(', ');
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}&travelmode=driving`;
  }

  function makePlaceholder(p) {
    const ph = document.createElement('div');
    ph.className = 'ph';
    const icon = document.createElement('span');
    icon.textContent = p.placeholder || '📍';
    const small = document.createElement('small');
    small.textContent = T.photoSoon;
    ph.append(icon, small);
    return ph;
  }

  function render(places) {
    els.results.hidden = false;
    els.list.innerHTML = '';
    els.resultHead.textContent = T.nearbyTitle;
    els.resultCount.textContent = `${bnNum(places.length)} ${isEn ? 'places' : 'টি জায়গা'}`;
    els.radiusNote.textContent = T.upTo;
    els.empty.hidden = !!places.length;

    const usedImages = new Set();

    places.forEach((p, i) => {
      const card = document.createElement('article');
      card.className = 'place-card';

      const photo = document.createElement('div');
      photo.className = 'place-photo';
      const imageUrl = cleanName(p.image);
      const imageKey = imageUrl.replace(/^https?:\/\/[^/]+/i, '');
      const canUseImage = !!imageUrl && !usedImages.has(imageKey || imageUrl);
      if (canUseImage) {
        usedImages.add(imageKey || imageUrl);
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = p.nameBn || p.nameEn || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.onerror = () => {
          img.remove();
          if (!photo.querySelector('.ph')) photo.appendChild(makePlaceholder(p));
        };
        photo.appendChild(img);
      } else {
        photo.appendChild(makePlaceholder(p));
      }

      const num = document.createElement('span');
      num.className = 'place-num';
      num.textContent = bnNum(i + 1);
      photo.appendChild(num);

      const content = document.createElement('div');
      content.className = 'place-content';

      const top = document.createElement('div');
      top.className = 'place-top';
      const body = document.createElement('div');
      body.className = 'place-body';
      const h = document.createElement('h2');
      h.textContent = isEn ? (p.nameEn || p.nameBn) : (p.nameBn || p.nameEn);
      body.appendChild(h);

      const meta = document.createElement('p');
      meta.className = 'place-meta';
      const districtName = isEn ? (p.districtEn || p.districtBn) : (p.districtBn || p.districtEn);
      const exact = distanceText(p.exactKm);
      meta.textContent = [exact, districtName].filter(Boolean).join(' · ');
      body.appendChild(meta);
      top.appendChild(body);

      const kicker = document.createElement('div');
      kicker.className = 'nearby-kicker';
      const districtPill = document.createElement('span');
      districtPill.className = `nearby-pill${p.districtSlug === primaryDistrict ? ' primary' : ''}`;
      districtPill.textContent = p.districtSlug === primaryDistrict ? T.currentDistrict : T.nearbyDistrict;
      kicker.appendChild(districtPill);
      if (p.tag) {
        const typePill = document.createElement('span');
        typePill.className = 'nearby-pill';
        typePill.textContent = p.tag;
        kicker.appendChild(typePill);
      }
      top.appendChild(kicker);
      content.appendChild(top);

      if (p.description) {
        const desc = document.createElement('p');
        desc.className = 'place-desc';
        desc.textContent = p.description;
        content.appendChild(desc);
      }

      const route = document.createElement('p');
      route.className = 'place-route';
      const rb = document.createElement('b');
      rb.textContent = `${T.howToGo}: `;
      route.appendChild(rb);
      route.appendChild(document.createTextNode(T.liveRoute.replace('{origin}', originLabel)));
      content.appendChild(route);

      if (!Number.isFinite(p.exactKm)) {
        const fact = document.createElement('div');
        fact.className = 'place-fact';
        const icon = document.createElement('span');
        icon.textContent = 'ℹ️';
        const txt = document.createElement('span');
        txt.textContent = T.noExactDistance;
        fact.append(icon, txt);
        content.appendChild(fact);
      }

      const actions = document.createElement('div');
      actions.className = 'place-actions';
      const go = document.createElement('a');
      go.className = 'btn primary';
      go.href = directionUrl(p);
      go.target = '_blank';
      go.rel = 'noopener';
      go.textContent = `🧭 ${T.directions}`;

      const details = document.createElement('a');
      details.className = 'btn';
      details.href = textFragmentUrl(p.guideUrl, isEn ? (p.nameEn || p.nameBn) : (p.nameBn || p.nameEn));
      details.textContent = `↗ ${T.details}`;
      actions.append(go, details);
      content.appendChild(actions);

      card.append(photo, content);
      els.list.appendChild(card);
    });
  }

  async function requestNearbyLocation(device) {
    const payload = { action: 'nearby' };
    if (device && Number.isFinite(device.lat) && Number.isFinite(device.lon)) {
      payload.source = 'device';
      payload.lat = device.lat;
      payload.lon = device.lon;
      payload.accuracy = Number.isFinite(device.accuracy) ? device.accuracy : null;
    }
    const r = await fetch('/api/event', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error(`location ${r.status}`);
    const data = await r.json();
    if (!data || !data.ok || !data.primaryDistrict || !data.location) throw new Error('bad location response');
    return data;
  }

  async function start() {
    els.locate.disabled = true;
    els.retry.hidden = true;
    els.results.hidden = true;
    showStatus('loading', T.finding, T.findingText);

    try {
      let device = null;
      try { device = await getDevicePosition(); } catch (_) {}

      const data = await requestNearbyLocation(device);
      primaryDistrict = data.primaryDistrict;
      showCurrentLocation(data.location, primaryDistrict);

      const primary = await fetchGuide(primaryDistrict);
      const districtOrder = new Map();
      districtOrder.set(primaryDistrict, { rank: 0, km: 0 });
      primary.nearby.forEach((x, idx) => districtOrder.set(x.slug, { rank: idx + 1, km: x.km }));

      const slugs = [primaryDistrict, ...primary.nearby.map(x => x.slug)].slice(0, 8);
      const guides = [primary];
      const extra = await Promise.allSettled(slugs.slice(1).map(fetchGuide));
      extra.forEach(x => { if (x.status === 'fulfilled') guides.push(x.value); });

      const places = makePlaces(guides, data.location, districtOrder);
      render(places);

      if (typeof window.gdTrack === 'function') {
        window.gdTrack('NearbySearch', {
          source: data.location.source || 'unknown',
          result_count: places.length,
          district: primaryDistrict
        });
      }
    } catch (err) {
      console.error(err);
      showStatus('error', T.network, T.networkText);
      els.retry.hidden = false;
    } finally {
      els.locate.disabled = false;
    }
  }

  injectStyles();
  tuneStaticCopy();
  if (els.locate) els.locate.addEventListener('click', start);
  if (els.retry) els.retry.addEventListener('click', start);
})();

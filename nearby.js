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
    finding:'Getting your current location…',
    findingText:'Allow location access to find places around where you are now.',
    currentLocation:'Your current location', ipLocation:'IP location',
    deviceSource:'Device location', ipFallback:'Location permission was not available, so IP location is being used.',
    accuracy:'accuracy', locationUnavailable:'Could not determine your location',
    locationUnavailableText:'Please allow location access and try again.',
    network:'Nearby places could not be loaded',
    networkText:'Our district guide data could not be loaded. Please try again.',
    none:'No nearby places were found in our guides.', directions:'Directions', details:'Details',
    exactAway:'away', approx:'Approx.', ownData:'From our own district guides',
    upTo:'Showing up to 50 places from your district and nearby districts',
    nearbyTitle:'Places to visit near you', howToGo:'How to go', noPhoto:'Photo not available',
    liveRoute:'From {origin}, tap Directions — Google Maps will open a live route from your current location to this place.',
    districtOnly:'{district}', currentDistrict:'Current district'
  } : {
    finding:'আপনার বর্তমান লোকেশন নেওয়া হচ্ছে…',
    findingText:'আপনি এখন যেখানে আছেন তার কাছের জায়গা দেখাতে Location Allow করুন।',
    currentLocation:'আপনার বর্তমান লোকেশন', ipLocation:'আপনার IP লোকেশন',
    deviceSource:'ডিভাইস লোকেশন', ipFallback:'Location permission পাওয়া যায়নি, তাই IP লোকেশন ব্যবহার করা হয়েছে।',
    accuracy:'নির্ভুলতা', locationUnavailable:'আপনার লোকেশন পাওয়া যায়নি',
    locationUnavailableText:'Location Allow করে আবার চেষ্টা করুন।',
    network:'কাছাকাছি জায়গার তথ্য লোড করা যায়নি',
    networkText:'আমাদের জেলা গাইডের তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।',
    none:'আমাদের গাইডে কাছাকাছি কোনো দর্শনীয় স্থান পাওয়া যায়নি।', directions:'পথ দেখুন', details:'বিস্তারিত',
    exactAway:'দূরে', approx:'প্রায়', ownData:'আমাদের নিজস্ব জেলা গাইড থেকে',
    upTo:'আপনার জেলা ও কাছের জেলাগুলো থেকে সর্বোচ্চ ৫০টি জায়গা দেখানো হচ্ছে',
    nearbyTitle:'আপনার কাছাকাছি কোথায় ঘুরবেন', howToGo:'কীভাবে যাবেন', noPhoto:'ছবি নেই',
    liveRoute:'{origin} থেকে “পথ দেখুন” চাপুন—Google Maps আপনার বর্তমান অবস্থান থেকে এই জায়গার লাইভ রুট খুলবে।',
    districtOnly:'{district}', currentDistrict:'বর্তমান জেলা'
  };

  const REGION = {
    A:['বরিশাল বিভাগ','Barishal Division'], B:['চট্টগ্রাম বিভাগ','Chattogram Division'],
    C:['ঢাকা বিভাগ','Dhaka Division'], D:['খুলনা বিভাগ','Khulna Division'],
    E:['রাজশাহী বিভাগ','Rajshahi Division'], F:['রংপুর বিভাগ','Rangpur Division'],
    G:['সিলেট বিভাগ','Sylhet Division'], H:['ময়মনসিংহ বিভাগ','Mymensingh Division']
  };
  const COUNTRY = { BD:['বাংলাদেশ','Bangladesh'] };
  let originLabel = isEn ? 'your current location' : 'বর্তমান অবস্থান';
  let primaryDistrict = '';

  function injectStyles() {
    if (document.getElementById('nearbyCardStyles')) return;
    const s = document.createElement('style');
    s.id = 'nearbyCardStyles';
    s.textContent = `
      .place-list{display:grid;gap:14px!important}
      .place-card{display:grid!important;grid-template-columns:156px minmax(0,1fr)!important;gap:0!important;align-items:stretch!important;padding:0!important;overflow:hidden;background:var(--surface);border:1px solid var(--line);border-radius:18px;box-shadow:0 5px 18px rgba(20,45,31,.05)}
      .place-photo{position:relative;min-height:150px;background:var(--surface-2);overflow:hidden}.place-photo img{width:100%;height:100%;min-height:150px;object-fit:cover;display:block}
      .place-photo .ph{height:100%;min-height:150px;display:grid;place-items:center;align-content:center;gap:5px;font-size:38px;color:var(--muted);background:linear-gradient(145deg,var(--surface-2),var(--surface))}.place-photo .ph small{font-size:12px;font-weight:700}
      .place-num{position:absolute!important;top:10px;left:10px;z-index:2;width:34px!important;height:34px!important;background:rgba(255,255,255,.94)!important;color:#173528!important;box-shadow:0 2px 8px rgba(0,0,0,.12)}
      .place-content{padding:15px 16px;display:grid;gap:8px;align-content:start}.place-body h2{font-size:20px!important;margin:0;line-height:1.25}.place-meta{margin:3px 0 0!important}.place-desc{margin:0;color:var(--muted);font-size:14px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .place-route{margin:0;padding:9px 11px;border-radius:11px;background:var(--surface-2);font-size:14px;line-height:1.45;color:var(--ink)}.place-route b{color:var(--accent-ink)}
      .place-actions{justify-content:flex-start!important;margin-top:2px}.place-actions .btn{min-height:40px}
      @media(max-width:680px){.place-card{grid-template-columns:112px minmax(0,1fr)!important}.place-photo,.place-photo img,.place-photo .ph{min-height:142px}.place-content{padding:12px}.place-body h2{font-size:18px!important}.place-actions{grid-column:auto!important}.place-actions .btn{flex:1 1 120px!important}.place-desc{display:none}}
      @media(max-width:470px){.place-card{grid-template-columns:1fr!important}.place-photo,.place-photo img,.place-photo .ph{height:190px;min-height:190px}.place-actions{display:grid!important;grid-template-columns:1fr 1fr}.place-actions .btn{width:100%}}
    `;
    document.head.appendChild(s);
  }

  function tuneStaticCopy() {
    const hero = $('.hero p');
    if (hero) hero.textContent = isEn
      ? 'Allow your device location to see places from your district and nearby districts. Tap Directions to open a live Google Maps route.'
      : 'Location Allow করলে আপনার বর্তমান জেলা ও কাছের জেলার দর্শনীয় স্থানগুলো দেখানো হবে। “পথ দেখুন” চাপলে Google Maps-এ লাইভ রুট খুলবে।';
    const finder = $('.finder p');
    if (finder) finder.textContent = isEn
      ? 'Your device location is used first; IP is only a fallback.'
      : 'প্রথমে আপনার ডিভাইস লোকেশন নেওয়া হবে; না পাওয়া গেলে শুধু তখন IP লোকেশন ব্যবহার হবে।';
    const firstStep = document.querySelector('.steps .step p');
    if (firstStep) firstStep.textContent = isEn
      ? 'Your device location is used first; IP location is only a fallback.'
      : 'প্রথমে ডিভাইস লোকেশন নেওয়া হয়; না পাওয়া গেলে IP লোকেশন ব্যবহার করা হয়।';
  }

  function bnNum(v) { return isEn ? String(v) : String(v).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[+d]); }
  function showStatus(kind,title,text) {
    els.status.hidden = false; els.status.dataset.kind = kind || '';
    els.statusTitle.textContent = title; els.statusText.textContent = text;
  }
  function regionLabel(region) { const k=String(region||'').toUpperCase(); return REGION[k] ? REGION[k][isEn?1:0] : (region||''); }
  function countryLabel(country) { const k=String(country||'').toUpperCase(); return COUNTRY[k] ? COUNTRY[k][isEn?1:0] : (country||''); }
  function cleanName(s) { return String(s||'').trim(); }

  function getDevicePosition() {
    return new Promise((resolve,reject)=>{
      if (!navigator.geolocation) return reject(new Error('geolocation unavailable'));
      navigator.geolocation.getCurrentPosition(
        p=>resolve({lat:Number(p.coords.latitude),lon:Number(p.coords.longitude),accuracy:Number(p.coords.accuracy)}),
        reject,{enableHighAccuracy:true,timeout:15000,maximumAge:15000}
      );
    });
  }

  function showCurrentLocation(loc,districtSlug) {
    const lat=Number(loc.lat), lon=Number(loc.lon), accuracy=Number(loc.accuracy);
    const coords=(Number.isFinite(lat)&&Number.isFinite(lon)) ? `${lat.toFixed(6)}, ${lon.toFixed(6)}` : '';
    let place=cleanName(loc.label);
    if (!place) {
      const city=cleanName(loc.city), division=regionLabel(loc.region), country=countryLabel(loc.country);
      place=[city,division,country].filter(Boolean).join(', ') || districtSlug || (isEn?'Bangladesh':'বাংলাদেশ');
    }
    originLabel = place.split(',')[0].trim() || originLabel;
    const acc = Number.isFinite(accuracy) && loc.source==='device'
      ? `${T.deviceSource} · ${T.accuracy} ${bnNum(Math.round(accuracy))} ${isEn?'m':'মিটার'}`
      : T.ipFallback;
    showStatus('ok',`📍 ${loc.source==='device'?T.currentLocation:T.ipLocation}: ${place}`,[coords,acc].filter(Boolean).join(' · '));
  }

  function haversine(lat1,lon1,lat2,lon2) {
    const R=6371,r=x=>x*Math.PI/180,dLat=r(lat2-lat1),dLon=r(lon2-lon1);
    const q=Math.sin(dLat/2)**2+Math.cos(r(lat1))*Math.cos(r(lat2))*Math.sin(dLon/2)**2;
    return R*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));
  }
  function exactDistanceText(km) {
    if (!Number.isFinite(km)) return '';
    if (km<1) return `${T.approx} ${bnNum(Math.max(100,Math.round(km*1000/100)*100))} ${isEn?'m':'মিটার'} ${T.exactAway}`;
    const n=km<10?km.toFixed(1):Math.round(km);
    return `${T.approx} ${bnNum(n)} ${isEn?'km':'কিমি'} ${T.exactAway}`;
  }

  function spotRows(doc) {
    return [...doc.querySelectorAll('.spots .spot')].map((spot,index)=>{
      const h=spot.querySelector('h3'); if(!h) return null;
      const small=h.querySelector('small');
      const nameEn=small?cleanName(small.textContent):'';
      const clone=h.cloneNode(true); clone.querySelectorAll('small').forEach(x=>x.remove());
      const nameBn=cleanName(clone.textContent);
      const p=spot.querySelector('.body > p,.body p');
      const img=spot.querySelector('figure.pic img');
      const tag=cleanName(spot.querySelector('.tag')?.textContent);
      const ph=cleanName(spot.querySelector('figure.pic.ph')?.childNodes?.[0]?.textContent) || (tag.match(/^\S+/)||[])[0] || '📍';
      return {nameBn,nameEn,description:p?cleanName(p.textContent):'',image:img?img.getAttribute('src'):null,placeholder:ph,index};
    }).filter(Boolean);
  }

  function parseGuide(slug,html) {
    const doc=new DOMParser().parseFromString(html,'text/html');
    let destination=null;
    for(const node of doc.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const parsed=JSON.parse(node.textContent||'null'), arr=Array.isArray(parsed)?parsed:[parsed];
        destination=arr.find(x=>x&&(x['@type']==='TouristDestination'||(Array.isArray(x['@type'])&&x['@type'].includes('TouristDestination'))));
        if(destination) break;
      } catch(_) {}
    }
    const rows=spotRows(doc);
    const attrs=destination&&Array.isArray(destination.includesAttraction)?destination.includesAttraction:[];
    const max=Math.max(rows.length,attrs.length);
    const attractions=[];
    for(let i=0;i<max;i++) {
      const a=attrs[i]||{}, r=rows[i]||{};
      const ageo=a.geo||{};
      const alat=Number(ageo.latitude), alon=Number(ageo.longitude);
      const item={
        nameBn:cleanName(a.name)||r.nameBn||'', nameEn:cleanName(a.alternateName)||r.nameEn||'',
        description:cleanName(a.description)||r.description||'',
        image:cleanName(a.image)||r.image||null, placeholder:r.placeholder||'📍', index:i,
        lat:Number.isFinite(alat)?alat:null, lon:Number.isFinite(alon)?alon:null
      };
      if(item.nameBn||item.nameEn) attractions.push(item);
    }
    const geo=(destination&&destination.geo)||{};
    const lat=Number(geo.latitude), lon=Number(geo.longitude);
    const nearby=[];
    for(const a of doc.querySelectorAll('.near a[href^="/jela/"]')) {
      const m=String(a.getAttribute('href')||'').match(/^\/jela\/([a-z0-9-]+)/i);
      if(m&&m[1]!==slug&&!nearby.includes(m[1])) nearby.push(m[1]);
      if(nearby.length>=8) break;
    }
    return {
      slug, nameBn:(destination&&destination.name)||slug, nameEn:(destination&&destination.alternateName)||slug,
      lat,lon,nearby,attractions
    };
  }

  async function fetchGuide(slug) {
    let r=await fetch(`/jela/${encodeURIComponent(slug)}`,{cache:'no-store'});
    if(!r.ok) r=await fetch(`/jela/${encodeURIComponent(slug)}.html`,{cache:'no-store'});
    if(!r.ok) throw new Error(`guide ${slug} ${r.status}`);
    const g=parseGuide(slug,await r.text());
    if(!g.attractions.length) throw new Error(`guide ${slug} has no attractions`);
    return g;
  }

  function makePlaces(guides,loc) {
    const out=[];
    for(const g of guides) {
      const districtKm=Number.isFinite(g.lat)&&Number.isFinite(g.lon)?haversine(loc.lat,loc.lon,g.lat,g.lon):9999;
      for(const a of g.attractions) {
        const exact=Number.isFinite(a.lat)&&Number.isFinite(a.lon);
        const exactKm=exact?haversine(loc.lat,loc.lon,a.lat,a.lon):null;
        out.push({...a,districtSlug:g.slug,districtBn:g.nameBn,districtEn:g.nameEn,
          districtKm,exactKm,guideUrl:isEn?`/en/jela/${g.slug}`:`/jela/${g.slug}`});
      }
    }
    return out.sort((a,b)=>{
      const da=Number.isFinite(a.exactKm)?a.exactKm:a.districtKm;
      const db=Number.isFinite(b.exactKm)?b.exactKm:b.districtKm;
      return da-db || a.index-b.index;
    }).slice(0,MAX_RESULTS);
  }

  async function loadOwnPlaces(primarySlug,loc) {
    const primary=await fetchGuide(primarySlug);
    const guides=[primary], seen=new Set([primarySlug]);
    const wave1=primary.nearby.filter(s=>!seen.has(s)).slice(0,6); wave1.forEach(s=>seen.add(s));
    const first=await Promise.allSettled(wave1.map(fetchGuide));
    first.forEach(x=>{if(x.status==='fulfilled')guides.push(x.value);});
    let places=makePlaces(guides,loc);
    if(places.length<MAX_RESULTS) {
      const wave2=[];
      for(const g of guides) for(const s of g.nearby||[]) {
        if(!seen.has(s)){seen.add(s);wave2.push(s);if(wave2.length>=8)break;}
        if(wave2.length>=8)break;
      }
      const second=await Promise.allSettled(wave2.map(fetchGuide));
      second.forEach(x=>{if(x.status==='fulfilled')guides.push(x.value);});
      places=makePlaces(guides,loc);
    }
    return places;
  }

  function routeHint(p) {
    return T.liveRoute.replace('{origin}',originLabel);
  }

  function render(items) {
    els.results.hidden=false; els.empty.hidden=!!items.length; els.list.replaceChildren();
    if(els.resultHead) els.resultHead.textContent=T.nearbyTitle;
    els.resultCount.textContent=isEn?`${items.length} places`:`${bnNum(items.length)}টি জায়গা`;
    els.radiusNote.textContent=`${T.ownData} · ${T.upTo}`;

    items.forEach((p,i)=>{
      const district=isEn?(p.districtEn||p.districtBn):(p.districtBn||p.districtEn);
      const name=isEn?(p.nameEn||p.nameBn):(p.nameBn||p.nameEn);
      const card=document.createElement('article'); card.className='place-card';

      const photo=document.createElement('div'); photo.className='place-photo';
      const num=document.createElement('span'); num.className='place-num'; num.textContent=bnNum(i+1); photo.append(num);
      if(p.image) {
        const img=document.createElement('img'); img.src=p.image; img.alt=name; img.loading='lazy'; img.decoding='async';
        img.addEventListener('error',()=>{const ph=document.createElement('div');ph.className='ph';ph.innerHTML=`<span>${p.placeholder||'📍'}</span><small>${T.noPhoto}</small>`;img.replaceWith(ph);},{once:true});
        photo.append(img);
      } else {
        const ph=document.createElement('div'); ph.className='ph';
        const icon=document.createElement('span'); icon.textContent=p.placeholder||'📍';
        const sm=document.createElement('small'); sm.textContent=T.noPhoto; ph.append(icon,sm); photo.append(ph);
      }

      const content=document.createElement('div'); content.className='place-content';
      const body=document.createElement('div'); body.className='place-body';
      const h=document.createElement('h2'); h.textContent=name;
      const meta=document.createElement('p'); meta.className='place-meta';
      if(Number.isFinite(p.exactKm)) meta.textContent=`${exactDistanceText(p.exactKm)} · ${district}`;
      else meta.textContent=p.districtSlug===primaryDistrict ? `${district} · ${T.currentDistrict}` : district;
      body.append(h,meta); content.append(body);

      if(p.description) { const desc=document.createElement('p'); desc.className='place-desc'; desc.textContent=p.description; content.append(desc); }
      const route=document.createElement('p'); route.className='place-route';
      const rb=document.createElement('b'); rb.textContent=`${T.howToGo}: `; route.append(rb,document.createTextNode(routeHint(p))); content.append(route);

      const actions=document.createElement('div'); actions.className='place-actions';
      const go=document.createElement('a'); go.className='btn primary'; go.target='_blank'; go.rel='noopener';
      const q=[p.nameEn||p.nameBn,p.districtEn||p.districtBn,'Bangladesh'].filter(Boolean).join(', ');
      go.href=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}&travelmode=driving`;
      go.textContent=`🧭 ${T.directions}`;
      const details=document.createElement('a'); details.className='btn quiet';
      const frag=encodeURIComponent(isEn?(p.nameEn||p.nameBn):(p.nameBn||p.nameEn));
      details.href=`${p.guideUrl}#:~:text=${frag}`; details.textContent=`↗ ${T.details}`;
      actions.append(go,details); content.append(actions);
      card.append(photo,content); els.list.append(card);
    });
  }

  async function fetchNearbyApi(device) {
    const body=device ? {action:'nearby',source:'device',lat:device.lat,lon:device.lon,accuracy:device.accuracy} : {action:'nearby',source:'ip'};
    const r=await fetch('/api/event',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
    const data=await r.json().catch(()=>({}));
    if(!r.ok) throw Object.assign(new Error('location'),{kind:'location'});
    return data;
  }

  async function findNearby() {
    showStatus('loading',T.finding,T.findingText); els.results.hidden=true;
    try {
      let device=null;
      try { device=await getDevicePosition(); } catch(_) {}
      let data;
      try { data=await fetchNearbyApi(device); }
      catch(err) { if(device) data=await fetchNearbyApi(null); else throw err; }
      const loc=data.location||{}, lat=Number(loc.lat), lon=Number(loc.lon);
      if(!Number.isFinite(lat)||!Number.isFinite(lon)||!data.primaryDistrict) throw Object.assign(new Error('location'),{kind:'location'});
      primaryDistrict=data.primaryDistrict;
      showCurrentLocation(loc,primaryDistrict);
      const shown=await loadOwnPlaces(primaryDistrict,{lat,lon});
      render(shown);
      if(!shown.length){els.empty.hidden=false;els.empty.textContent=T.none;}
      try{window.gdTrack&&window.gdTrack('NearbySearch',{result_count:shown.length,source:loc.source||'unknown'});}catch(_){}
    } catch(err) {
      console.warn('Nearby search failed',err);
      showStatus('error',err&&err.kind==='location'?T.locationUnavailable:T.network,err&&err.kind==='location'?T.locationUnavailableText:T.networkText);
      els.retry.hidden=false;
    } finally { els.locate.disabled=false; }
  }

  function start(){els.locate.disabled=true;els.retry.hidden=true;findNearby();}
  injectStyles(); tuneStaticCopy();
  els.locate.addEventListener('click',start); els.retry.addEventListener('click',start);
})();

/* Nearby tourist places — IP-based location from Vercel + server-side OpenStreetMap/Overpass lookup. */
(function () {
  'use strict';
  const isEn = document.documentElement.lang === 'en';
  const MAX_RESULTS = 50;
  const BD = { minLat: 20.0, maxLat: 27.0, minLon: 87.5, maxLon: 93.0 };
  const $ = s => document.querySelector(s);
  const els = { locate:$('#locateBtn'), retry:$('#retryBtn'), status:$('#nearbyStatus'), statusTitle:$('#statusTitle'), statusText:$('#statusText'), results:$('#results'), resultCount:$('#resultCount'), radiusNote:$('#radiusNote'), list:$('#placeList'), empty:$('#emptyState') };

  const T = isEn ? {
    finding:'Finding nearby places…', findingText:'Checking attractions around your approximate internet location.', found:'Nearby places found', locationUnavailable:'Could not determine your area', locationUnavailableText:'Your approximate internet location could not be detected. Please try again.', network:'Nearby places could not be loaded', networkText:'We could not reach the place data service. Please try again.', none:'No mapped attractions were found nearby.', directions:'Directions', source:'Map source', away:'away', approx:'Approx.', searched:'Searched within', upTo:'Showing up to 50 nearest places', categories:{museum:'Museum',viewpoint:'Viewpoint',gallery:'Gallery',zoo:'Zoo',theme_park:'Theme park',attraction:'Attraction',historic:'Historic place',beach:'Beach',waterfall:'Waterfall',peak:'Hill / peak',cave_entrance:'Cave',hot_spring:'Hot spring',park:'Park',nature_reserve:'Nature reserve',lighthouse:'Lighthouse',worship:'Notable religious site',place:'Place of interest'}
  } : {
    finding:'কাছাকাছি জায়গা খোঁজা হচ্ছে…', findingText:'আপনার ইন্টারনেট লোকেশন অনুযায়ী আশেপাশের দর্শনীয় স্থান খোঁজা হচ্ছে।', found:'কাছাকাছি দর্শনীয় স্থান পাওয়া গেছে', locationUnavailable:'আপনার এলাকা বোঝা যায়নি', locationUnavailableText:'আপনার ইন্টারনেট লোকেশন থেকে এলাকা শনাক্ত করা যায়নি। আবার চেষ্টা করুন।', network:'কাছাকাছি জায়গার তথ্য লোড করা যায়নি', networkText:'দর্শনীয় স্থানের ডাটা সার্ভিসে সংযোগ করা যায়নি। আবার চেষ্টা করুন।', none:'কাছাকাছি কোনো দর্শনীয় স্থান পাওয়া যায়নি।', directions:'পথ দেখুন', source:'ম্যাপ উৎস', away:'দূরে', approx:'প্রায়', searched:'খোঁজা হয়েছে', upTo:'সর্বোচ্চ ৫০টি কাছের জায়গা দেখানো হচ্ছে', categories:{museum:'জাদুঘর',viewpoint:'ভিউপয়েন্ট',gallery:'গ্যালারি',zoo:'চিড়িয়াখানা',theme_park:'থিম পার্ক',attraction:'দর্শনীয় স্থান',historic:'ঐতিহাসিক স্থান',beach:'সমুদ্র সৈকত',waterfall:'ঝরনা',peak:'পাহাড় / চূড়া',cave_entrance:'গুহা',hot_spring:'উষ্ণ প্রস্রবণ',park:'পার্ক',nature_reserve:'প্রকৃতি সংরক্ষণ এলাকা',lighthouse:'বাতিঘর',worship:'উল্লেখযোগ্য ধর্মীয় স্থান',place:'দর্শনীয় স্থান'}
  };

  function bnNum(v){ return isEn ? String(v) : String(v).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[+d]); }
  function showStatus(kind,title,text){ els.status.hidden=false; els.status.dataset.kind=kind||''; els.statusTitle.textContent=title; els.statusText.textContent=text; }
  function haversine(a,b,c,d){ const R=6371,r=x=>x*Math.PI/180,dl=r(c-a),dn=r(d-b),q=Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dn/2)**2; return R*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q)); }
  function distanceText(km){ if(km<1)return `${bnNum(Math.max(50,Math.round(km*1000/50)*50))} ${isEn?'m':'মিটার'} ${T.away}`; const n=km<10?km.toFixed(1):Math.round(km); return `${T.approx} ${bnNum(n)} ${isEn?'km':'কিমি'} ${T.away}`; }
  function category(t){ if(t.tourism&&T.categories[t.tourism])return T.categories[t.tourism]; if(t.historic)return T.categories.historic; if(t.natural&&T.categories[t.natural])return T.categories[t.natural]; if(t.leisure&&T.categories[t.leisure])return T.categories[t.leisure]; if(t.man_made==='lighthouse')return T.categories.lighthouse; if(t.amenity==='place_of_worship')return T.categories.worship; return T.categories.place; }
  function areaLabel(t){ const x=[t['addr:subdistrict'],t['addr:city'],t['addr:town'],t['addr:village'],t['addr:district'],t['addr:state']].filter(Boolean); return [...new Set(x)].slice(0,2).join(', '); }
  function normalize(elements,ulat,ulon){ const out=new Map(); for(const el of elements||[]){ const t=el.tags||{}, lat=Number(el.lat??(el.center&&el.center.lat)), lon=Number(el.lon??(el.center&&el.center.lon)); if(!Number.isFinite(lat)||!Number.isFinite(lon)||!t.name)continue; if(lat<BD.minLat||lat>BD.maxLat||lon<BD.minLon||lon>BD.maxLon)continue; const name=(isEn&&(t['name:en']||t.name))||(!isEn&&(t['name:bn']||t.name))||t.name; const d=haversine(ulat,ulon,lat,lon), key=`${String(name).trim().toLowerCase()}|${lat.toFixed(4)}|${lon.toFixed(4)}`; const item={id:el.id,osmType:el.type,name:String(name).trim(),tags:t,lat,lon,distance:d}; if(!out.has(key)||d<out.get(key).distance)out.set(key,item); } return [...out.values()].sort((a,b)=>a.distance-b.distance); }

  function render(items,radius){ els.results.hidden=false; els.empty.hidden=!!items.length; els.list.replaceChildren(); els.resultCount.textContent=isEn?`${items.length} places`:`${bnNum(items.length)}টি জায়গা`; els.radiusNote.textContent=`${T.searched} ${bnNum(Math.round(radius/1000))} ${isEn?'km':'কিমি'} · ${T.upTo}`; items.slice(0,MAX_RESULTS).forEach((p,i)=>{ const card=document.createElement('article'); card.className='place-card'; const num=document.createElement('span'); num.className='place-num'; num.textContent=bnNum(i+1); const body=document.createElement('div'); body.className='place-body'; const h=document.createElement('h2'); h.textContent=p.name; const meta=document.createElement('p'); meta.className='place-meta'; const area=areaLabel(p.tags); meta.textContent=`${distanceText(p.distance)} · ${category(p.tags)}${area?' · '+area:''}`; body.append(h,meta); const actions=document.createElement('div'); actions.className='place-actions'; const go=document.createElement('a'); go.className='btn primary'; go.target='_blank'; go.rel='noopener'; go.href=`https://www.google.com/maps/dir/?api=1&destination=${p.lat.toFixed(6)},${p.lon.toFixed(6)}&travelmode=driving`; go.textContent=`🧭 ${T.directions}`; const src=document.createElement('a'); src.className='btn quiet'; src.target='_blank'; src.rel='noopener'; src.href=`https://www.openstreetmap.org/${p.osmType}/${p.id}`; src.textContent=T.source; actions.append(go,src); card.append(num,body,actions); els.list.append(card); }); }

  async function findNearby(){
    showStatus('loading',T.finding,T.findingText);
    els.results.hidden=true;
    try{
      const r=await fetch('/api/event',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'nearby'})});
      const data=await r.json().catch(()=>({}));
      if(!r.ok){
        if(r.status===503) throw Object.assign(new Error('ip-location'),{kind:'location'});
        throw new Error('nearby '+r.status);
      }
      const lat=Number(data.location&&data.location.lat), lon=Number(data.location&&data.location.lon);
      if(!Number.isFinite(lat)||!Number.isFinite(lon)) throw Object.assign(new Error('ip-location'),{kind:'location'});
      const shown=normalize(data.elements,lat,lon).slice(0,MAX_RESULTS);
      const city=data.location&&data.location.city;
      const where=city ? (isEn?` around ${city}`:` ${city} এলাকার`) : '';
      showStatus('ok',T.found,shown.length?(isEn?`${shown.length} places${where} are sorted by approximate distance.`:`আপনার${where} কাছাকাছি ${bnNum(shown.length)}টি জায়গা আনুমানিক দূরত্ব অনুযায়ী সাজানো হয়েছে।`):T.none);
      render(shown,data.radius||30000);
      try{window.gdTrack&&window.gdTrack('NearbySearch',{result_count:shown.length,radius_km:Math.round((data.radius||30000)/1000)});}catch(_){}
    }catch(err){
      console.warn('Nearby search failed',err);
      if(err&&err.kind==='location') showStatus('error',T.locationUnavailable,T.locationUnavailableText);
      else showStatus('error',T.network,T.networkText);
      els.retry.hidden=false;
    }finally{ els.locate.disabled=false; }
  }

  function start(){ els.locate.disabled=true; els.retry.hidden=true; findNearby(); }
  els.locate.addEventListener('click',start); els.retry.addEventListener('click',start);
})();

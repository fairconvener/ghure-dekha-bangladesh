/* ঘুরে দেখা বাংলাদেশ: হজ ও উমরার স্বপ্নের ম্যাপ (/umrah, /hajj).
   You, plus a spouse or your family (parents together or apart, sisters and brothers), on one of
   nine designs: our own drawn map (dotted route Dhaka -> Makkah -> Madinah, photos of both holy
   mosques) or a painted background with the people, title and wish laid over it.
   Everything is drawn on a canvas in poster units (1080 wide); exports render the same function at 2x.
   Photos never leave the device. Map data: /hajj-map.js (Natural Earth).
   English twin (/en/umrah, /en/hajj, built by build_hajj.py): the page is <html lang="en">; then every word the poster,
   the caption and the controls show comes from the English strings below (EN ? ... : Bangla); the Bangla page is unchanged. */
(function(){
'use strict';
const $ = s => document.querySelector(s);
const EN = document.documentElement.lang === 'en';
const BN = v => EN ? String(v).replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)) : String(v).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const F = (w, px) => `${Math.min(+w || 400, 700)} ${px}px "Hind Siliguri","Noto Sans Bengali",sans-serif`;
const SIZES = { post: { w: 1080, h: 1350 }, square: { w: 1080, h: 1080 }, story: { w: 1080, h: 1920 } };
const SITE_LABEL = /(^|\.)ghuredekha\.com$/i.test(location.hostname) ? 'ghuredekha.com' : 'ghuredekhabangladesh.com';
const HOSTED = /(^|\.)(ghuredekha\.com|ghuredekhabangladesh\.com)$/i.test(location.hostname);
/* .bn: the journey's name in the page's language */
const TRIPS = EN ? { umrah: { bn: 'Umrah', loc: 'Umrah', tag: '#Umrah' }, hajj: { bn: 'Hajj', loc: 'Hajj', tag: '#Hajj' } }
  : { umrah: { bn: 'উমরা', loc: 'উমরায়', tag: '#উমরা #Umrah' }, hajj: { bn: 'হজ', loc: 'হজে', tag: '#হজ #Hajj' } };
const OBJN = x => /[A-Za-z0-9).]$/.test(x) ? x + '-কে' : x + 'কে';
const joinO = L => L.length > 1 ? L.slice(0, -1).join(', ') + (EN ? ' and ' : ' ও ') + L[L.length - 1] : (L[0] || '');
const joinAar = L => L.length > 1 ? L.slice(0, -1).join(', ') + (EN ? ' and ' : ' আর ') + L[L.length - 1] : (L[0] || '');
/* English sentences: "my wife", "my future husband" (a typed name stays as it is); first letter small inside a sentence */
const who = x => /^(spouse|wife|husband|future wife|future husband)$/i.test(x) ? 'my ' + x.toLowerCase() : x;
const lc = x => x.charAt(0).toLowerCase() + x.slice(1);
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

/* ---------- family: parents together or apart, plus up to three sisters/brothers ---------- */
const FAM = { pmode: 'together', names: { parents: '', abbu: '', ammu: '' }, ph: { parents: null, abbu: null, ammu: null }, sibs: [] };
const PMODES = { together: 'একসাথে একটা ছবি', separate: 'আলাদা দুটো ছবি', ammu: 'শুধু আম্মু', abbu: 'শুধু আব্বু' };
const MAX_SIBS = 3;
const FL = EN ? { parents: 'Mum & Dad', abbu: 'Dad', ammu: 'Mum', bon: 'Sister', bhai: 'Brother' } : { parents: 'আব্বু-আম্মু', abbu: 'আব্বু', ammu: 'আম্মু', bon: 'বোন', bhai: 'ভাই' };
function fam(){
  const L = [], m = FAM.pmode;
  if(m === 'together') L.push({ id: 'parents', label: FAM.names.parents.trim() || FL.parents, ph: FAM.ph.parents });
  if(m === 'separate' || m === 'abbu') L.push({ id: 'abbu', label: FAM.names.abbu.trim() || FL.abbu, ph: FAM.ph.abbu });
  if(m === 'separate' || m === 'ammu') L.push({ id: 'ammu', label: FAM.names.ammu.trim() || FL.ammu, ph: FAM.ph.ammu });
  FAM.sibs.forEach((s, i) => L.push({ id: 'sib' + i, label: s.name.trim() || (s.kind === 'bon' ? FL.bon : FL.bhai), ph: s.photo }));
  return L;
}
/* for sentences: two unnamed sisters read as "দুই বোন", not "বোন, বোন" (English: "my sister", "my two sisters") */
function collapseEn(L){ const cnt = {}, seen = {}, out = [], PL = { Sister: 'sisters', Brother: 'brothers' };
  L.forEach(x => { cnt[x] = (cnt[x] || 0) + 1; });
  L.forEach(x => { if(PL[x]){ if(!seen[x]){ seen[x] = 1; out.push(cnt[x] > 1 ? `my ${['', '', 'two', 'three'][cnt[x]] || cnt[x]} ${PL[x]}` : 'my ' + x.toLowerCase()); } } else if(x === 'Mum & Dad') out.push('Mum', 'Dad'); else out.push(x); }); return out; }
function collapse(L){ if(EN) return collapseEn(L); const cnt = {}; L.forEach(x => { cnt[x] = (cnt[x] || 0) + 1; }); const seen = {}, out = [];
  L.forEach(x => { if((x === 'বোন' || x === 'ভাই') && cnt[x] > 1){ if(!seen[x]){ seen[x] = 1; out.push(`${['', '', 'দুই', 'তিন'][cnt[x]] || cnt[x]} ${x}`); } } else out.push(x); }); return out; }
const famHand = () => EN ? (FAM.sibs.length ? 'All the family together' : FAM.pmode === 'ammu' ? "Holding my mother's hand" : FAM.pmode === 'abbu' ? "Holding my father's hand" : "Holding my parents' hands")
  : FAM.sibs.length ? 'পরিবারের সবাই মিলে' : FAM.pmode === 'ammu' ? 'মায়ের হাত ধরে' : FAM.pmode === 'abbu' ? 'বাবার হাত ধরে' : 'মা-বাবার হাত ধরে';
/* English caption opening: "InshaAllah 2027:" with a year, "InshaAllah," without */
const ins = yr => yr ? `InshaAllah${yr}:` : 'InshaAllah,';

const RELS_EN = {
  future:  { two: true, name2: 'Future wife', ph2: 'e.g. Future wife / Future husband', quick: [['Future wife', '👰 Bride'], ['Future husband', '🤵 Groom']],
    title: T => `First journey after marriage: ${T}`, quote: () => 'May our new life begin at the House of Allah', tag: () => 'From Dhaka, together',
    cap: (t, a, b, yr, dflt) => [`🕋 ${ins(yr)} our first journey after marriage will be ${t.bn}.`, 'From Dhaka to Makkah and Madinah: our dream of going to the House of Allah together. May Allah accept it 🤲' + (dflt ? ' (Still looking for the one 😅)' : '')] },
  spouse:  { two: true, name2: 'Spouse', ph2: 'e.g. Wife / Husband, or a name', quick: [['Wife', '👰 Wife'], ['Husband', '🤵 Husband']],
    title: T => `Together for ${T}`, quote: () => 'The two of us at the House of Allah: this is our dream', tag: () => 'From Dhaka, together',
    cap: (t, a, b, yr) => [`🕋 ${ins(yr)} my dream is to perform ${t.bn} with ${who(b)}.`, 'From Dhaka to Makkah and Madinah, the two of us together at the House of Allah. May Allah accept it 🤲'] },
  parents: { two: true, name2: 'Mum & Dad',
    title: T => FAM.sibs.length ? `${T} with the whole family` : FAM.pmode === 'ammu' ? `${T} with my mother` : FAM.pmode === 'abbu' ? `${T} with my father` : `${T} with my parents`,
    quote: () => FAM.sibs.length ? 'To the House of Allah, all the family together: this is our dream' : `To the House of Allah, ${lc(famHand())}: this is my dream`,
    tag: () => FAM.pmode === 'ammu' ? 'From Dhaka, with my mother' : FAM.pmode === 'abbu' ? 'From Dhaka, with my father' : 'From Dhaka, with my parents',
    cap: (t, a, b, yr) => [`🕋 ${ins(yr)} my dream is to perform ${t.bn} with ${joinAar(collapse(fam().map(p => p.label)))}.`, `From Dhaka to Makkah and Madinah, ${lc(famHand())}, to the House of Allah. May Allah accept it 🤲`] },
  solo:    { two: false, name2: '',
    title: T => `My dream ${T}`, quote: () => 'To the House of Allah, at least once in my life', tag: () => 'From Dhaka',
    cap: (t, a, b, yr) => [`🕋 ${ins(yr)} the biggest dream of my life is ${t.bn}.`, 'From Dhaka to Makkah and Madinah, waiting to go to the House of Allah. May Allah accept it 🤲'] }
};
const RELS = EN ? RELS_EN : {
  future:  { two: true, name2: 'ভবিষ্যৎ বউ', ph2: 'যেমন: ভবিষ্যৎ বউ / ভবিষ্যৎ বর', quick: [['ভবিষ্যৎ বউ', '👰 বউ'], ['ভবিষ্যৎ বর', '🤵 বর']],
    title: T => `বিয়ের পর প্রথম সফর: ${T}`, quote: () => 'নতুন জীবনের শুরুটা হোক আল্লাহর ঘর থেকে', tag: () => 'ঢাকা থেকে, দুজনে',
    cap: (t, a, b, yr, dflt) => [`🕋 ইনশাআল্লাহ${yr}, বিয়ের পর আমাদের প্রথম সফর হবে ${t.bn}।`, 'ঢাকা থেকে মক্কা-মদিনা, একসাথে আল্লাহর ঘরে যাওয়ার স্বপ্ন। আল্লাহ কবুল করুন 🤲' + (dflt ? ' (মানুষটা এখনো খুঁজছি 😅)' : '')] },
  spouse:  { two: true, name2: 'জীবনসঙ্গী', ph2: 'যেমন: স্ত্রী / স্বামী, বা নাম', quick: [['স্ত্রী', '👰 স্ত্রী'], ['স্বামী', '🤵 স্বামী']],
    title: T => `দুজনে একসাথে ${T}`, quote: () => 'দুজনে মিলে আল্লাহর ঘরে, এই আমাদের স্বপ্ন', tag: () => 'ঢাকা থেকে, দুজনে',
    cap: (t, a, b, yr) => [`🕋 ইনশাআল্লাহ${yr}, ${OBJN(b)} নিয়ে ${t.loc} যাওয়ার স্বপ্ন।`, 'ঢাকা থেকে মক্কা-মদিনা, দুজনে মিলে আল্লাহর ঘরে। আল্লাহ কবুল করুন 🤲'] },
  parents: { two: true, name2: 'আব্বু-আম্মু',
    title: T => FAM.sibs.length ? `পরিবারের সবাইকে নিয়ে ${T}` : FAM.pmode === 'ammu' ? `মাকে নিয়ে ${T}` : FAM.pmode === 'abbu' ? `বাবাকে নিয়ে ${T}` : `মা-বাবাকে নিয়ে ${T}`,
    quote: () => FAM.sibs.length ? 'পরিবারের সবাই মিলে আল্লাহর ঘরে, এই আমাদের স্বপ্ন' : `${famHand()} আল্লাহর ঘরে, এই আমার স্বপ্ন`,
    tag: () => FAM.pmode === 'ammu' ? 'ঢাকা থেকে, মায়ের সাথে' : FAM.pmode === 'abbu' ? 'ঢাকা থেকে, বাবার সাথে' : 'ঢাকা থেকে, মা-বাবার সাথে',
    cap: (t, a, b, yr) => [`🕋 ইনশাআল্লাহ${yr}, ${OBJN(joinAar(collapse(fam().map(p => p.label))))} নিয়ে ${t.loc} যাওয়ার স্বপ্ন।`, `ঢাকা থেকে মক্কা-মদিনা, ${famHand()} আল্লাহর ঘরে। আল্লাহ কবুল করুন 🤲`] },
  solo:    { two: false, name2: '',
    title: T => `আমার স্বপ্নের ${T}`, quote: () => 'জীবনে একবার হলেও আল্লাহর ঘরে', tag: () => 'ঢাকা থেকে',
    cap: (t, a, b, yr) => [`🕋 ইনশাআল্লাহ${yr}, জীবনের সবচেয়ে বড় স্বপ্ন: ${t.bn}।`, 'ঢাকা থেকে মক্কা-মদিনা, আল্লাহর ঘরে যাওয়ার অপেক্ষা। আল্লাহ কবুল করুন 🤲'] }
};
/* ready-made pictures for a wife/husband-to-be (all AI-made, no real people) */
const AVATARS = [['hijab-back', 'হিজাব, পেছন থেকে', 'f'], ['hijab-1', 'হিজাব', 'f'], ['hijab-2', 'হিজাব ২', 'f'], ['hair', 'খোলা চুল', 'f'], ['saree', 'শাড়ি', 'f'], ['mosque', 'মসজিদের সামনে', 'f'],
  ['groom-art', 'পাঞ্জাবি, আঁকা', 'm'], ['groom-panjabi', 'পাঞ্জাবি', 'm'], ['groom-tupi', 'টুপি-পাঞ্জাবি', 'm'], ['groom-blazer', 'ব্লেজার', 'm']];
if(EN){ const AV_EN = { 'hijab-back': 'Hijab, seen from behind', 'hijab-1': 'Hijab', 'hijab-2': 'Hijab 2', hair: 'Hair down', saree: 'Saree', mosque: 'In front of a mosque',
  'groom-art': 'Panjabi, drawn', 'groom-panjabi': 'Panjabi', 'groom-tupi': 'Prayer cap and panjabi', 'groom-blazer': 'Blazer' }; AVATARS.forEach(a => { if(AV_EN[a[0]]) a[1] = AV_EN[a[0]]; }); }
const AV_G = Object.fromEntries(AVATARS.map(([k, , g]) => [`/img/avatars/${k}.jpg`, g]));
const okPhoto = v => typeof v === 'string' && (v.startsWith('data:image') || /^\/img\/avatars\/[a-z0-9-]+\.jpg$/.test(v));
const okData = v => typeof v === 'string' && v.startsWith('data:image');
const looksMale = nm => /(^|\s)বর$|ভবিষ্যৎ\s*বর|স্বামী|জামাই|husband|groom/i.test(nm || '');
const looksFemale = nm => !nm || (!looksMale(nm) && /বউ|বৌ|স্ত্রী|বেগম|wife|bride/i.test(nm));

/* poster designs: our drawn map, and eight painted backgrounds (head/mid/foot: is the text there on a dark or a light area) */
const DESIGNS = [
  { k: 'map', bn: 'ম্যাপ' },
  { k: 'navy', bn: 'রাতের আকাশ', head: 'dark', mid: 'dark', foot: 'dark', top: '#031F53', bot: '#031641', stars: true },
  { k: 'sky', bn: 'নীল আকাশ', head: 'dark', mid: 'light', foot: 'light', top: '#468FCC', bot: '#DEE6EC', ink: '#0E2E5C', stars: true },
  { k: 'cream', bn: 'ক্রিম', head: 'light', mid: 'light', foot: 'light', top: '#EFE7DB', bot: '#EDE1D2' },
  { k: 'green', bn: 'সবুজ রাত', head: 'dark', mid: 'dark', foot: 'dark', top: '#053B2C', bot: '#01281E', stars: true },
  { k: 'lantern', bn: 'ফানুস', head: 'light', mid: 'light', foot: 'light', top: '#F9F3EC', bot: '#F4EFE9' },
  { k: 'white', bn: 'সাদা-সোনালি', head: 'light', mid: 'light', foot: 'light', top: '#FCFBF7', bot: '#F9F6F0' },
  { k: 'cloud', bn: 'সোনালি মেঘ', head: 'light', mid: 'light', foot: 'light', top: '#F4E8D4', bot: '#E7D4BC' },
  { k: 'tower', bn: 'ক্লক টাওয়ার', head: 'light', mid: 'light', foot: 'light', top: '#FCF9F2', bot: '#FAF0D9' }
];
DESIGNS.forEach(d => { if(d.k !== 'map') d.src = `/img/hajj-bg/${d.k}.jpg`; d.thumb = `/img/hajj-bg/t/${d.k}.jpg`; });
if(EN){ const DN = { map: 'Map', navy: 'Night sky', sky: 'Blue sky', cream: 'Cream', green: 'Green night', lantern: 'Lanterns', white: 'White and gold', cloud: 'Golden clouds', tower: 'Clock tower' };
  DESIGNS.forEach(d => { if(DN[d.k]) d.bn = DN[d.k]; }); }
const DMAP = Object.fromEntries(DESIGNS.map(d => [d.k, d]));
const PAL = {
  dark: { title: '#FFFFFF', eye: '#F0CD78', names: '#F7EDD6', text: '#F7EDD6', gold: '#F0CD78', stroke: 'rgba(2,14,30,.78)', shadow: 'rgba(0,0,0,.55)', veil: '0,0,0' },
  light: { title: '#0B4A36', eye: '#9A6A12', names: '#4A3A1E', text: '#2E2412', gold: '#9A6A12', stroke: 'rgba(255,255,255,.94)', shadow: 'rgba(255,255,255,.85)', veil: '255,255,255' }
};
const pal = (D, part) => { const p = Object.assign({}, PAL[D[part] || 'dark']); if(D.ink && D[part] === 'light'){ p.text = D.ink; p.names = D.ink; p.title = D.ink; } return p; };

/* ---------- state (shared profile with the map pages: gd-profile, gd-photo, gd-photo2) ----------
   Wife/husband (future + spouse) share the map pages' second photo (gd-photo2); the family keeps
   its own photos (gd-hajj-pp for parents together, gd-hajj-abbu, gd-hajj-ammu, gd-hajj-sib0..2). */
const KEY = 'gd-hajj', PKEY = 'gd-hajj-pp';
const q = new URLSearchParams(location.search);
const FROM_MAP = !!RELS[q.get('rel')];
const N2 = { spouse: '' }, PH2 = { spouse: null };
const S = { trip: document.body.dataset.defaultTrip === 'hajj' ? 'hajj' : 'umrah', rel: 'future', name: '', photo: null, year: '', size: 'post', design: 'map' };
const isSp = () => S.rel === 'future' || S.rel === 'spouse';
Object.defineProperty(S, 'name2', { enumerable: true,
  get(){ return isSp() ? N2.spouse : S.rel === 'parents' ? FAM.names.parents : ''; },
  set(v){ v = String(v || '').slice(0, 40); if(isSp()) N2.spouse = v; else if(S.rel === 'parents') FAM.names.parents = v; } });
Object.defineProperty(S, 'photo2', { enumerable: true,
  get(){ return isSp() ? PH2.spouse : S.rel === 'parents' ? FAM.ph.parents : null; },
  set(v){ if(isSp()) PH2.spouse = okPhoto(v) ? v : null; else if(S.rel === 'parents') FAM.ph.parents = okData(v) ? v : null; } });
const ls = k => { try{ return localStorage.getItem(k); }catch(e){ return null; } };
let PREL = null, PN2 = '';
try{
  const pr = JSON.parse(ls('gd-profile') || 'null'); if(pr){ if(pr.name) S.name = String(pr.name).slice(0, 40);
    /* coming from a two-person map: honeymoon -> after marriage, couple -> spouse, family -> parents */
    const m = pr.duo && { honeymoon: 'future', couple: 'spouse', family: 'parents' }[pr.rel]; if(m){ PREL = m; if(typeof pr.name2 === 'string') PN2 = pr.name2.slice(0, 40); } }
  const gp = ls('gd-photo'); if(okPhoto(gp)) S.photo = gp;
  const gp2 = ls('gd-photo2'); if(okPhoto(gp2)) PH2.spouse = gp2;
  const pp = ls(PKEY); if(okData(pp)) FAM.ph.parents = pp;
  ['abbu', 'ammu'].forEach(k => { const v = ls('gd-hajj-' + k); if(okData(v)) FAM.ph[k] = v; });
  const h = JSON.parse(ls(KEY) || 'null');
  if(h){ if(RELS[h.rel]) S.rel = h.rel;
    if(h.n2 && typeof h.n2 === 'object'){ if(typeof h.n2.spouse === 'string') N2.spouse = h.n2.spouse.slice(0, 40); if(typeof h.n2.parents === 'string') FAM.names.parents = h.n2.parents.slice(0, 40); }
    const f = h.fam; if(f && typeof f === 'object'){ if(PMODES[f.pmode]) FAM.pmode = f.pmode; if(f.names) ['parents', 'abbu', 'ammu'].forEach(k => { if(typeof f.names[k] === 'string') FAM.names[k] = f.names[k].slice(0, 30); });
      if(Array.isArray(f.sibs)) f.sibs.slice(0, MAX_SIBS).forEach((s, i) => { if(s && (s.kind === 'bon' || s.kind === 'bhai')){ const v = ls('gd-hajj-sib' + i); FAM.sibs.push({ kind: s.kind, name: typeof s.name === 'string' ? s.name.slice(0, 30) : '', photo: okData(v) ? v : null }); } }); }
    if(typeof h.year === 'string') S.year = h.year.slice(0, 12); if(SIZES[h.size]) S.size = h.size; if(DMAP[h.design]) S.design = h.design; }
  else if(PREL) S.rel = PREL;
}catch(e){}
if(TRIPS[q.get('t')]) S.trip = q.get('t'); if(FROM_MAP) S.rel = q.get('rel'); if(DMAP[q.get('d')]) S.design = q.get('d');
if(PN2 && PREL){ if(PREL === 'parents'){ if(FROM_MAP || !FAM.names.parents) FAM.names.parents = PN2; } else if(FROM_MAP || !N2.spouse) N2.spouse = PN2; }
{ const QW = [['ভবিষ্যৎ বউ', 'Future wife'], ['ভবিষ্যৎ বর', 'Future husband'], ['স্ত্রী', 'Wife'], ['স্বামী', 'Husband']];
  const m = QW.find(([b, e]) => N2.spouse === (EN ? b : e)); if(m) N2.spouse = EN ? m[1] : m[0]; }
function put(k, v){ try{ if(v) localStorage.setItem(k, v); else localStorage.removeItem(k); }catch(e){} }
function save(){
  try{ localStorage.setItem(KEY, JSON.stringify({ rel: S.rel, n2: { spouse: N2.spouse }, year: S.year, size: S.size, design: S.design,
      fam: { pmode: FAM.pmode, names: FAM.names, sibs: FAM.sibs.map(s => ({ kind: s.kind, name: s.name })) } }));
    const pr = JSON.parse(ls('gd-profile') || 'null') || {}; pr.name = S.name; localStorage.setItem('gd-profile', JSON.stringify(pr)); }catch(e){}
  put('gd-photo', S.photo); put('gd-photo2', PH2.spouse); put(PKEY, FAM.ph.parents); put('gd-hajj-abbu', FAM.ph.abbu); put('gd-hajj-ammu', FAM.ph.ammu);
  for(let i = 0; i < MAX_SIBS; i++) put('gd-hajj-sib' + i, FAM.sibs[i] ? FAM.sibs[i].photo : null);
}

/* ---------- images ---------- */
const IMG = {};
function img(src){ let r = IMG[src]; if(r) return r; r = IMG[src] = { im: new Image(), ok: false }; r.p = new Promise(res => { r.im.onload = () => { r.ok = true; res(); paint(); }; r.im.onerror = () => res(); }); r.im.src = src; return r; }
const imgOk = src => { const r = src && img(src); return r && r.ok ? r.im : null; };
const MAKKAH = '/img/holy/makkah.jpg', MADINAH = '/img/holy/madinah.jpg', LOGO = '/favicon.svg', AV_DEF = '/img/avatars/hijab-back.jpg', AV_M = '/img/avatars/groom-art.jpg';
function photo1(){ return S.photo ? imgOk(S.photo) : null; }
function photo2(){ if(!isSp()) return null; if(S.photo2) return imgOk(S.photo2); const nm = S.name2.trim(); if(looksMale(nm)) return imgOk(AV_M); if(looksFemale(nm)) return imgOk(AV_DEF); return null; }
/* everyone on the poster, left to right: you first */
function people(){
  const R = RELS[S.rel], me = { im: photo1(), label: EN ? 'Me' : 'আমি' };
  if(!R.two) return [me];
  if(S.rel === 'parents') return [me, ...fam().map(p => ({ im: p.ph ? imgOk(p.ph) : null, label: p.label }))];
  return [me, { im: photo2(), label: S.name2.trim() || R.name2 }];
}
function ready(){
  const L = [LOGO, MAKKAH, MADINAH, S.photo, PH2.spouse, AV_DEF, AV_M, FAM.ph.parents, FAM.ph.abbu, FAM.ph.ammu, ...FAM.sibs.map(s => s.photo)];
  if(DMAP[S.design].src) L.push(DMAP[S.design].src);
  return Promise.all(L.filter(Boolean).map(s => img(s).p));
}

/* ---------- map ---------- */
let PATHS = null;
function paths(){ if(PATHS) return PATHS; PATHS = { land: [], sau: null, bgd: null }; for(const f of HJ_LAND){ const p = new Path2D(f.d); if(f.id === 'SAU') PATHS.sau = p; else if(f.id === 'BGD') PATHS.bgd = p; PATHS.land.push(p); } return PATHS; }
/* focus box in map units: from the Red Sea to Bangladesh, Turkey's south coast to the Arabian Sea */
const P = (lon, lat) => { const K = Math.cos(22 * Math.PI / 180), Sc = HJ_W / ((112 - 8) * K); return [(lon - 8) * K * Sc, (52 - lat) * Sc]; };

/* ---------- drawing helpers ---------- */
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
function fit(c, w, text, maxW, hi, lo){ let px = hi; c.font = F(w, px); while(px > lo && c.measureText(text).width > maxW){ px *= .96; c.font = F(w, px); } return px; }
function wrap2(c, text, maxW){ const words = text.split(/\s+/); let best = null; for(let k = 1; k < words.length; k++){ const a = words.slice(0, k).join(' '), b = words.slice(k).join(' '); const w = Math.max(c.measureText(a).width, c.measureText(b).width); if(!best || w < best.w) best = { a, b, w }; } return best ? [best.a, best.b] : [text]; }
function star8(c, x, y, r){ c.beginPath(); for(let i = 0; i < 16; i++){ const a = Math.PI / 8 * i - Math.PI / 2, rad = i % 2 ? r * .62 : r; c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); } c.closePath(); }
function hexA(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
function circlePhoto(c, im, x, y, r, u, ring, fx, fy, zoom){
  c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 18 * u; c.shadowOffsetY = 6 * u; c.beginPath(); c.arc(x, y, r + ring, 0, Math.PI * 2); const g = c.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, '#F6D98A'); g.addColorStop(1, '#C8952F'); c.fillStyle = g; c.fill(); c.restore();
  c.save(); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.clip();
  if(im){ const z = zoom || 1, sc = Math.max(2 * r / im.width, 2 * r / im.height) * z, iw = im.width * sc, ih = im.height * sc; const cx = (fx == null ? .5 : fx) * iw, cy = (fy == null ? .5 : fy) * ih; c.drawImage(im, x - cx, y - cy, iw, ih); }
  else { c.fillStyle = '#0D4A38'; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.fillStyle = 'rgba(246,217,138,.85)'; c.beginPath(); c.arc(x, y - r * .2, r * .3, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(x, y + r * .62, r * .56, r * .42, 0, Math.PI, 0); c.fill(); }
  c.restore();
}
function plane(c, x, y, s, ang, col){ c.save(); c.translate(x, y); c.rotate(ang + Math.PI / 2); c.scale(s / 100, s / 100); c.beginPath();
  c.moveTo(0, -46); c.bezierCurveTo(6, -46, 8, -38, 8, -30); c.lineTo(8, -12); c.lineTo(46, 10); c.lineTo(46, 20); c.lineTo(8, 8); c.lineTo(8, 30); c.lineTo(20, 40); c.lineTo(20, 47); c.lineTo(0, 41);
  c.lineTo(-20, 47); c.lineTo(-20, 40); c.lineTo(-8, 30); c.lineTo(-8, 8); c.lineTo(-46, 20); c.lineTo(-46, 10); c.lineTo(-8, -12); c.lineTo(-8, -30); c.bezierCurveTo(-8, -38, -6, -46, 0, -46); c.closePath(); c.fillStyle = col; c.fill(); c.restore(); }
function label(c, text, x, y, px, col, align, u, stroke){ c.font = F(700, px); c.textAlign = align || 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 6 * u; c.strokeStyle = stroke || 'rgba(4,30,22,.85)'; c.strokeText(text, x, y); c.fillStyle = col; c.fillText(text, x, y); }
/* our badge (same look as on every other poster) */
function badge(c, cx, cy, u, k, line2){
  k *= u; const D = 86 * k, ring = 5 * k, h = 64 * k, padL = 16 * k, padR = 30 * k, name = EN ? 'Ghure Dekha Bangladesh' : 'ঘুরে দেখা বাংলাদেশ';
  c.save(); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  const p1 = 29 * k; c.font = F(700, p1); const w1 = c.measureText(name).width; let p2 = 18.5 * k; c.font = F(600, p2); let w2 = c.measureText(line2).width; if(w2 > w1 * 1.25){ p2 *= w1 * 1.25 / w2; c.font = F(600, p2); w2 = c.measureText(line2).width; }
  const logo = imgOk(LOGO), tw = Math.max(w1, w2), Wt = (logo ? D : padR) + padL + tw + padR, x0 = cx - Wt / 2;
  const bx = logo ? x0 + D / 2 : x0, bw = Wt - (logo ? D / 2 : 0), by = cy - h / 2;
  c.save(); c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 16 * k; c.shadowOffsetY = 5 * k; const g = c.createLinearGradient(0, by, 0, by + h); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#F1F7F3'); rr(c, bx, by, bw, h, h / 2); c.fillStyle = g; c.fill(); c.restore();
  if(logo){ const mx = x0 + D / 2; c.save(); c.shadowColor = 'rgba(0,0,0,.32)'; c.shadowBlur = 14 * k; c.shadowOffsetY = 4 * k; c.beginPath(); c.arc(mx, cy, D / 2, 0, Math.PI * 2); c.fillStyle = '#FFFFFF'; c.fill(); c.restore(); c.save(); c.beginPath(); c.arc(mx, cy, D / 2 - ring, 0, Math.PI * 2); c.clip(); c.drawImage(logo, mx - D / 2 + ring, cy - D / 2 + ring, D - 2 * ring, D - 2 * ring); c.restore(); }
  const tx = logo ? x0 + D + padL : x0 + padR; c.fillStyle = '#0B6B40'; c.font = F(700, p1); c.fillText(name, tx, cy + 1 * k); c.fillStyle = '#3F5D4E'; c.font = F(600, p2); c.fillText(line2, tx, cy + 1 * k + p2 + 4 * k);
  c.restore();
}
/* eyebrow ("ইনশাআল্লাহ ২০২৭"), title (one or two lines), names; returns the y below the names */
function header(c, W, u, Z, y, cw, col, shadow, wrapAt){
  const R = RELS[S.rel], T = TRIPS[S.trip].bn, yr = S.year.trim() ? ' ' + BN(S.year.trim()) : '';
  c.save(); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  if(shadow){ c.shadowColor = shadow; c.shadowBlur = 14 * u; }
  c.font = F(600, Z.eye); const eyeT = `${EN ? 'InshaAllah' : 'ইনশাআল্লাহ'}${yr}`; const ew = c.measureText(eyeT).width; y += Z.eye;
  c.fillStyle = col.eye; c.fillText(eyeT, W / 2, y);
  c.strokeStyle = hexA(col.eye, .6); c.lineWidth = 2 * u; [-1, 1].forEach(sgn => { const x0 = W / 2 + sgn * (ew / 2 + 22 * u), x1 = x0 + sgn * 120 * u; c.beginPath(); c.moveTo(x0, y - Z.eye * .34); c.lineTo(x1, y - Z.eye * .34); c.stroke(); c.save(); c.translate(x0 + sgn * 6 * u, y - Z.eye * .34); c.rotate(Math.PI / 4); c.fillStyle = col.eye; c.fillRect(-4 * u, -4 * u, 8 * u, 8 * u); c.restore(); });
  const title = R.title(T); let tp = fit(c, 700, title, cw, Z.title, Z.title * .7); let lines = [title];
  if(tp < Z.title * (wrapAt || .8) && title.includes(' ')){ c.font = F(700, Z.title); lines = wrap2(c, title, cw); tp = Math.min(Z.title, ...lines.map(l => fit(c, 700, l, cw, Z.title, Z.tmin))); }
  c.font = F(700, tp); c.fillStyle = col.title; lines.forEach((l, i) => { y += (i ? tp * 1.12 : tp * 1.2); c.fillText(l, W / 2, y); });
  const a = S.name.trim() || (EN ? 'Me' : 'আমি');
  const names = !R.two ? S.name.trim() : S.rel === 'parents' ? joinO([a, ...collapse(fam().map(p => p.label))]) : EN ? `${a} & ${who(S.name2.trim() || R.name2)}` : `${a} ও ${S.name2.trim() || R.name2}`;
  if(names){ const np = fit(c, 600, names, cw, Z.names, Z.names * .62); c.font = F(600, np); c.fillStyle = col.names; y += np * 1.5; c.fillText(names, W / 2, y); }
  c.restore(); return y;
}
/* how big the people can be: N circles overlapping in a row inside `span` */
const STEP = N => N >= 4 ? 1.25 : 1.44;
const fitR = (N, span, max) => Math.min(max, span / (STEP(N) * (N - 1) + 2));
function drawPeople(c, list, cx, cy, r, u, o){
  const N = list.length, step = r * STEP(N), x0 = cx - step * (N - 1) / 2, ring = Math.max(3.5 * u, r * .062);
  list.forEach((p, i) => circlePhoto(c, p.im, x0 + i * step, cy, r, u, ring));
  if(N === 2){ c.save(); c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 8 * u; c.beginPath(); c.arc(cx, cy + r * .66, r * .25, 0, Math.PI * 2); c.fillStyle = '#FFFFFF'; c.fill(); c.restore();
    c.font = `${r * .27}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(S.rel === 'parents' ? '🤲' : '💍', cx, cy + r * .68); }
  if(N >= 3) list.forEach((p, i) => { const px = Math.min(o.labPx, fit(c, 700, p.label, step * .98, o.labPx, o.labPx * .62)); label(c, p.label, x0 + i * step, cy + r + px * 1.05 + ring, px, o.col, 'center', u, o.stroke); });
  else label(c, RELS[S.rel].tag(), cx, cy + r + o.labPx * 1.15 + ring, o.labPx, o.col, 'center', u, o.stroke);
  return { x0, step };
}
const fmtOf = (W, H) => { const r = H / W; return r > 1.6 ? 'story' : r < 1.1 ? 'square' : 'post'; };
const TALB = EN ? 'Labbaik Allahumma Labbaik' : 'লাব্বাইক আল্লাহুম্মা লাব্বাইক';  /* the talbiyah */
const PRE = EN ? '/en/' : '/';  /* this page's address on the poster and in the caption */

/* ---------- design 1: our drawn map ---------- */
function renderMap(c, W, H){
  const u = W / 1080, fmt = fmtOf(W, H);
  const R = RELS[S.rel];
  const Z = { post:   { top: 58, eye: 27, title: 74, tmin: 44, names: 33, pr: 96, hr: 104, quote: 31, talb: 25, gap: 18, bk: .9, bottom: 250 },
              square: { top: 40, eye: 24, title: 62, tmin: 38, names: 28, pr: 78, hr: 82, quote: 26, talb: 22, gap: 12, bk: .78, bottom: 200 },
              story:  { top: 170, eye: 32, title: 86, tmin: 50, names: 38, pr: 118, hr: 128, quote: 36, talb: 29, gap: 30, bk: 1.08, bottom: 380 } }[fmt];
  for(const k in Z) if(k !== 'bk') Z[k] *= u;
  const GOLD = '#F0CD78', CREAM = '#F7EDD6', CORAL = '#FF6B6B';
  /* background: deep green, a soft light behind the map, a faint star lattice */
  const g = c.createRadialGradient(W * .5, H * .48, 0, W * .5, H * .48, Math.max(W, H) * .78); g.addColorStop(0, '#13684E'); g.addColorStop(.55, '#0A4434'); g.addColorStop(1, '#04241B');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save(); c.globalAlpha = .07; c.strokeStyle = GOLD; c.lineWidth = 1.4 * u; const st = 132 * u;
  for(let y = st / 2; y < H + st; y += st) for(let x = (Math.round(y / st) % 2 ? st / 2 : 0); x < W + st; x += st){ star8(c, x, y, st * .3); c.stroke(); }
  c.restore();
  const P0 = 60 * u, cw = W - 2 * P0;
  let y = header(c, W, u, Z, Z.top, cw, { eye: GOLD, title: '#FFFFFF', names: CREAM });
  /* map region */
  const PEO = people(), N = PEO.length, labPx = 25 * u * (fmt === 'story' ? 1.15 : fmt === 'square' ? .9 : 1);
  const stack = fmt === 'story' && N >= 3, prS = stack ? fitR(N, W - 70 * u, Z.pr * .86) : 0, famH = stack ? 2 * prS + labPx * 2.8 : 0;
  const regEnd = H - Z.bottom, regTop = y + Z.gap * 1.2, regBot = regEnd - famH, regH = regBot - regTop;
  const [fx0, fy0] = P(28, 36), [fx1, fy1] = P(96, 7);
  const s = Math.min(W / (fx1 - fx0), regH / (fy1 - fy0)) * 1.04;
  let ox = W / 2 - (fx0 + fx1) / 2 * s; const oy = regTop + regH / 2 - (fy0 + fy1) / 2 * s;
  { const dx = HJ_CITY.dhaka.c[0], mx = HJ_CITY.madinah.c[0]; const right = ox + dx * s; if(right > W - 80 * u) ox -= right - (W - 80 * u); if(ox + mx * s < 120 * u) ox += 120 * u - (ox + mx * s); }
  const X = v => ox + v * s, Y = v => oy + v * s;
  const PT = paths();
  /* land on its own layer so it can fade out at the top and bottom of the region */
  const ml = document.createElement('canvas'); ml.width = W; ml.height = Math.ceil(regH); const m = ml.getContext('2d');
  m.translate(0, -regTop); m.save(); m.translate(ox, oy); m.scale(s, s);
  m.fillStyle = '#1B7357'; for(const p of PT.land) m.fill(p);
  m.lineJoin = 'round'; m.lineWidth = 1.1 * u / s; m.strokeStyle = 'rgba(255,255,255,.13)'; for(const p of PT.land) m.stroke(p);
  m.restore(); m.setTransform(1, 0, 0, 1, 0, 0);
  m.globalCompositeOperation = 'destination-in'; const fg = m.createLinearGradient(0, 0, 0, regH); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(.14, 'rgba(0,0,0,1)'); fg.addColorStop(.86, 'rgba(0,0,0,1)'); fg.addColorStop(1, 'rgba(0,0,0,0)'); m.fillStyle = fg; m.fillRect(0, 0, W, regH);
  c.drawImage(ml, 0, regTop);
  /* Saudi Arabia in gold, Bangladesh in red */
  c.save(); c.translate(ox, oy); c.scale(s, s);
  if(PT.sau){ c.save(); c.shadowColor = 'rgba(240,205,120,.55)'; c.shadowBlur = 26 * u; const gs = c.createLinearGradient(P(36, 30)[0], P(36, 30)[1], P(55, 17)[0], P(55, 17)[1]); gs.addColorStop(0, '#F6D98A'); gs.addColorStop(1, '#C8952F'); c.fillStyle = gs; c.fill(PT.sau); c.restore(); }
  if(PT.bgd){ c.save(); c.shadowColor = 'rgba(255,107,107,.7)'; c.shadowBlur = 22 * u; c.fillStyle = CORAL; c.fill(PT.bgd); c.restore(); }
  c.restore();
  const city = k => { const p = HJ_CITY[k].c; return { x: X(p[0]), y: Y(p[1]) }; };
  const dhaka = city('dhaka'), mk = city('makkah'), md = city('madinah');
  /* route: Dhaka -> Makkah (arc), Makkah -> Madinah */
  const ctrl = { x: (dhaka.x + mk.x) / 2, y: Math.min(dhaka.y, mk.y) - 200 * u * (fmt === 'square' ? .7 : 1) };
  c.save(); c.lineCap = 'round'; c.setLineDash([.1 * u, 13 * u]); c.lineWidth = 6.5 * u; c.strokeStyle = GOLD; c.shadowColor = 'rgba(240,205,120,.8)'; c.shadowBlur = 10 * u;
  c.beginPath(); c.moveTo(dhaka.x, dhaka.y); c.quadraticCurveTo(ctrl.x, ctrl.y, mk.x, mk.y); c.stroke();
  c.beginPath(); c.moveTo(mk.x, mk.y); c.quadraticCurveTo(mk.x - 40 * u, (mk.y + md.y) / 2, md.x, md.y); c.stroke(); c.restore();
  { const tt = .42, bx = (1 - tt) * (1 - tt) * dhaka.x + 2 * (1 - tt) * tt * ctrl.x + tt * tt * mk.x, by = (1 - tt) * (1 - tt) * dhaka.y + 2 * (1 - tt) * tt * ctrl.y + tt * tt * mk.y;
    const dx = 2 * (1 - tt) * (ctrl.x - dhaka.x) + 2 * tt * (mk.x - ctrl.x), dy = 2 * (1 - tt) * (ctrl.y - dhaka.y) + 2 * tt * (mk.y - ctrl.y);
    c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 8 * u; plane(c, bx, by, 58 * u * (fmt === 'story' ? 1.15 : 1), Math.atan2(dy, dx), '#FFFFFF'); c.restore(); }
  const dot = (p, col, ring) => { c.beginPath(); c.arc(p.x, p.y, 10 * u, 0, Math.PI * 2); c.fillStyle = col; c.fill(); c.lineWidth = 4 * u; c.strokeStyle = ring; c.stroke(); };
  dot(dhaka, '#FFFFFF', '#B3261E'); dot(mk, '#FFFFFF', '#0A4434'); dot(md, '#FFFFFF', '#0A4434');
  /* bottom row of the map: the two holy mosques on the left, the people on the right; dotted leaders up to their dots */
  const lay = hr => { const mdx = Math.max(34 * u + hr, Math.min(md.x - hr * .35, W * .5 - hr * 2.6)), mkx = mdx + hr * 2.32; return { hr, mdx, mkx, xL: mkx + hr + 26 * u, xR: W - 30 * u }; };
  let L = lay(Z.hr), pr = stack ? prS : fitR(N, L.xR - L.xL, Z.pr);
  if(!stack && N >= 3 && pr < Z.pr * .74){ L = lay(Z.hr * .8); pr = fitR(N, L.xR - L.xL, Z.pr); }
  const HR = L.hr, rowY = regBot - Math.max(HR, stack ? 0 : pr) - labPx * 2.2;
  const lead = (A, B) => { c.save(); c.setLineDash([3 * u, 6 * u]); c.lineWidth = 2.4 * u; c.strokeStyle = 'rgba(247,237,214,.8)'; c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke(); c.restore(); };
  const mdP = { x: L.mdx, y: rowY }, mkP = { x: L.mkx, y: rowY };
  lead(md, { x: mdP.x, y: mdP.y - HR }); lead(mk, { x: mkP.x, y: mkP.y - HR });
  circlePhoto(c, imgOk(MADINAH), mdP.x, mdP.y, HR, u, 6 * u, .58, .58, 1.12);
  circlePhoto(c, imgOk(MAKKAH), mkP.x, mkP.y, HR, u, 6 * u, .5, .6, 1.1);
  if(EN){ /* the longer English names shrink to the width of their photo */
    const hp = Math.min(fit(c, 700, 'Madinah al-Munawwarah', HR * 2.3, labPx, labPx * .7), fit(c, 700, 'Makkah al-Mukarramah', HR * 2.3, labPx, labPx * .7));
    label(c, 'Madinah al-Munawwarah', mdP.x, mdP.y + HR + labPx * 1.15, hp, CREAM, 'center', u);
    label(c, 'Makkah al-Mukarramah', mkP.x, mkP.y + HR + labPx * 1.15, hp, CREAM, 'center', u);
    label(c, 'Madinah', md.x + 17 * u, md.y - 9 * u, 25 * u, '#FFFFFF', 'left', u); label(c, 'Makkah', mk.x + 17 * u, mk.y + 11 * u, 25 * u, '#FFFFFF', 'left', u); }
  else {
  label(c, 'মদিনা মুনাওয়ারা', mdP.x, mdP.y + HR + labPx * 1.15, labPx, CREAM, 'center', u);
  label(c, 'মক্কা মুকাররমা', mkP.x, mkP.y + HR + labPx * 1.15, labPx, CREAM, 'center', u);
  label(c, 'মদিনা', md.x + 17 * u, md.y - 9 * u, 25 * u, '#FFFFFF', 'left', u); label(c, 'মক্কা', mk.x + 17 * u, mk.y + 11 * u, 25 * u, '#FFFFFF', 'left', u); }
  /* the people, starting from Dhaka */
  const step = pr * STEP(N), pw = step * (N - 1) + 2 * pr;
  const pcx = stack ? W / 2 : Math.min(W - 30 * u - pw / 2, Math.max(L.xL + pw / 2, dhaka.x - 30 * u)), pcy = stack ? regBot + prS + labPx * .6 : rowY;
  let near = 0; for(let i = 1; i < N; i++) if(Math.abs(pcx - step * (N - 1) / 2 + i * step - dhaka.x) < Math.abs(pcx - step * (N - 1) / 2 + near * step - dhaka.x)) near = i;
  lead(dhaka, { x: pcx - step * (N - 1) / 2 + near * step, y: pcy - pr });
  drawPeople(c, PEO, pcx, pcy, pr, u, { labPx: labPx * (N >= 3 ? .92 : 1), col: CREAM });
  label(c, EN ? 'Dhaka' : 'ঢাকা', dhaka.x + (dhaka.x > W - 150 * u ? -18 : 18) * u, dhaka.y - 14 * u, 25 * u, '#FFFFFF', dhaka.x > W - 150 * u ? 'right' : 'left', u);
  /* bottom: the wish, the talbiyah, our badge */
  let yb = regEnd + Z.gap * 1.6;
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  const quote = R.quote(); const qp = fit(c, 600, quote, cw, Z.quote, Z.quote * .7); c.font = F(600, qp); c.fillStyle = CREAM; yb += qp; c.fillText(quote, W / 2, yb);
  c.font = F(600, Z.talb); c.fillStyle = GOLD; yb += Z.talb * 1.9; c.fillText(TALB, W / 2, yb);
  const bk = Z.bk, bh = 86 * bk * u; badge(c, W / 2, H - bh / 2 - (fmt === 'story' ? 120 : 26) * u, u, bk, SITE_LABEL + PRE + S.trip);
}

/* ---------- designs 2-9: a painted background (square), the text and people laid over it ----------
   square: the painting fills the poster; post: painted sky continues above it; story: above and below. */
function renderPhoto(c, W, H, D){
  const u = W / 1080, fmt = fmtOf(W, H), R = RELS[S.rel];
  const Z = { post:   { top: 56, eye: 27, title: 72, tmin: 44, names: 32, pr: 112, quote: 30, talb: 24, bk: .9, badge: 58 },
              square: { top: 44, eye: 24, title: 60, tmin: 38, names: 28, pr: 98, quote: 26, talb: 21, bk: .78, badge: 46 },
              story:  { top: 260, eye: 32, title: 84, tmin: 50, names: 38, pr: 128, quote: 35, talb: 28, bk: 1.08, badge: 170 } }[fmt];
  for(const k in Z) if(k !== 'bk') Z[k] *= u;
  const isz = W, iy = fmt === 'square' ? 0 : fmt === 'post' ? H - W : 600 * u, ib = iy + isz;
  const head = pal(D, 'head'), mid = pal(D, 'mid'), foot = pal(D, 'foot');
  /* the painting, and the sky/ground carried past its edges */
  c.fillStyle = D.top; c.fillRect(0, 0, W, iy + 2 * u);
  if(ib < H){ c.fillStyle = D.bot; c.fillRect(0, ib - 2 * u, W, H - ib + 2 * u); }
  const bg = imgOk(D.src);
  if(bg){ c.save(); c.imageSmoothingQuality = 'high'; c.drawImage(bg, 0, iy, isz, isz); c.restore(); }
  else { const g = c.createLinearGradient(0, iy, 0, ib); g.addColorStop(0, D.top); g.addColorStop(1, D.bot); c.fillStyle = g; c.fillRect(0, iy, W, isz); }
  if(iy > 0){ const h = isz * .09, g = c.createLinearGradient(0, iy, 0, iy + h); g.addColorStop(0, D.top); g.addColorStop(1, hexA(D.top, 0)); c.fillStyle = g; c.fillRect(0, iy, W, h); }
  if(ib < H){ const h = isz * .08, g = c.createLinearGradient(0, ib - h, 0, ib); g.addColorStop(0, hexA(D.bot, 0)); g.addColorStop(1, D.bot); c.fillStyle = g; c.fillRect(0, ib - h, W, h); }
  if(iy > 0){ /* a few stars or a soft glow up in the carried sky, and two of the painting's gold star ornaments */
    c.save();
    if(D.stars){ let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647; for(let i = 0; i < Math.round(iy / u / 9); i++){ const x = rnd() * W, y = rnd() * iy, rad = (.8 + rnd() * 1.8) * u; c.globalAlpha = .25 + rnd() * .55; c.fillStyle = '#FFE9B0'; c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill(); } }
    else { const g = c.createRadialGradient(W * .5, iy * .55, 0, W * .5, iy * .55, W * .6); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, iy); }
    c.globalAlpha = .45; c.strokeStyle = '#D9B25C'; c.lineWidth = 2.2 * u; const sr = Math.min(70 * u, iy * .3);
    star8(c, 70 * u, Math.min(iy * .5, 120 * u), sr); c.stroke(); star8(c, W - 70 * u, Math.min(iy * .5, 120 * u), sr); c.stroke();
    c.restore(); }
  /* the bottom stack, worked out from the badge up */
  const bh = 86 * Z.bk * u, yBadge = H - bh / 2 - Z.badge, cw = W - 2 * 70 * u;
  const yTalb = yBadge - bh / 2 - 18 * u, quote = R.quote();
  c.font = F(600, Z.quote); const qp = fit(c, 600, quote, cw, Z.quote, Z.quote * .7), yQuote = yTalb - Z.talb * 1.75;
  /* soft veils so the words stay readable on any painting */
  const hv = c.createLinearGradient(0, 0, 0, Z.top + Z.title * 3.2 + Z.names * 1.6); hv.addColorStop(0, `rgba(${head.veil},${head.veil === '0,0,0' ? .42 : .55})`); hv.addColorStop(1, `rgba(${head.veil},0)`);
  c.fillStyle = hv; c.fillRect(0, 0, W, Z.top + Z.title * 3.2 + Z.names * 1.6);
  const fv0 = yQuote - qp * 2.4, fv = c.createLinearGradient(0, fv0, 0, H); fv.addColorStop(0, `rgba(${foot.veil},0)`); fv.addColorStop(.45, `rgba(${foot.veil},${foot.veil === '0,0,0' ? .38 : .55})`); fv.addColorStop(1, `rgba(${foot.veil},${foot.veil === '0,0,0' ? .5 : .7})`);
  c.fillStyle = fv; c.fillRect(0, fv0, W, H - fv0);
  /* header */
  header(c, W, u, Z, Z.top, W * (fmt === 'square' ? .56 : .8), head, head.shadow, fmt === 'square' ? .93 : .8);
  /* the people, between the Kaaba and Masjid an-Nabawi */
  const PEO = people(), N = PEO.length, labPx = 25 * u * (fmt === 'story' ? 1.15 : fmt === 'square' ? .9 : 1);
  const span = W * (N <= 2 ? .46 : .5), pr = fitR(N, span, Z.pr);
  const ring = Math.max(3.5 * u, pr * .062), below = (N >= 3 ? labPx * 1.05 : labPx * 1.15) + labPx * .7 + ring;
  const cy = Math.min(iy + isz * .655, yQuote - qp * 1.25 - below - pr);
  drawPeople(c, PEO, W / 2, cy, pr, u, { labPx: labPx * (N >= 3 ? .92 : 1), col: mid.text, stroke: mid.stroke });
  /* the wish, the talbiyah, our badge */
  c.save(); c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.shadowColor = foot.shadow; c.shadowBlur = 10 * u;
  c.font = F(600, qp); c.fillStyle = foot.text; c.fillText(quote, W / 2, yQuote);
  c.font = F(600, Z.talb); c.fillStyle = foot.gold; c.fillText(TALB, W / 2, yTalb);
  c.restore();
  badge(c, W / 2, yBadge, u, Z.bk, SITE_LABEL + PRE + S.trip);
}

function render(c, W, H){ const D = DMAP[S.design] || DMAP.map; if(D.k === 'map') renderMap(c, W, H); else renderPhoto(c, W, H, D); }

/* ---------- caption ---------- */
function caption(){
  const t = TRIPS[S.trip], R = RELS[S.rel]; const a = S.name.trim() || (EN ? 'Me' : 'আমি'), b = S.name2.trim() || R.name2; const yr = S.year.trim() ? ' ' + BN(S.year.trim()) : '';
  const L = R.cap(t, a, b, yr, S.rel === 'future' && (!S.name2.trim() || (EN ? /^future (wife|husband)$/i : /^ভবিষ্যৎ (বউ|বর)$/).test(S.name2.trim())));
  if(EN) return [...L, '', `Make your own dream ${t.bn} map with photos, free 👉 https://${SITE_LABEL}/en/${S.trip}`, '👍 Follow us on Facebook: https://www.facebook.com/profile.php?id=61594879211002', '', `${t.tag} #GhureDekhaBangladesh`].join('\n');
  return [...L, '', `আপনার স্বপ্নের ${t.bn}র ম্যাপ বানান, ছবি দিয়ে, ফ্রি 👉 https://${SITE_LABEL}/${S.trip}`, '👍 ফেসবুক পেজ: https://www.facebook.com/profile.php?id=61594879211002', '', `${t.tag} #ঘুরেদেখাবাংলাদেশ`].join('\n');
}

/* ---------- UI ---------- */
const cv = $('#hjPoster'), ctx = cv.getContext('2d');
let raf = 0; function paint(){ if(raf) return; raf = requestAnimationFrame(() => { raf = 0; const sz = SIZES[S.size]; if(cv.width !== sz.w || cv.height !== sz.h){ cv.width = sz.w; cv.height = sz.h; } render(ctx, sz.w, sz.h); }); }
const fontReady = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load(F(700, 40)), document.fonts.load(F(600, 40))]).catch(() => {}) : Promise.resolve();
const toastMsg = m => { if(window.toast) window.toast(m); };
const phHTML = v => v ? `<img src="${esc(v)}" alt="">` : '<span>🙂</span>';
function readPhoto(file, cb){ const url = URL.createObjectURL(file), im = new Image(); im.onload = () => { const M = 640, sc = Math.max(M / im.width, M / im.height), w = im.width * sc, h = im.height * sc; const c = document.createElement('canvas'); c.width = M; c.height = M; const x = c.getContext('2d'); x.drawImage(im, (M - w) / 2, (M - h) / 2, w, h); URL.revokeObjectURL(url); cb(c.toDataURL('image/jpeg', .86)); }; im.onerror = () => { URL.revokeObjectURL(url); toastMsg(EN ? "Couldn't read that photo. Please try another one." : 'ছবিটা পড়া যায়নি, অন্য ছবি দিন'); }; im.src = url; }

/* family slots (parents together / apart, sisters and brothers) */
const slotGet = id => id.startsWith('sib') ? FAM.sibs[+id.slice(3)] : { name: FAM.names[id], photo: FAM.ph[id] };
function slotSet(id, k, v){ if(id.startsWith('sib')){ const s = FAM.sibs[+id.slice(3)]; if(s) s[k] = v; } else if(k === 'name') FAM.names[id] = v; else FAM.ph[id] = v; }
const SLOT_PH = EN ? { parents: ['Mum & Dad', "Mum & Dad's"], abbu: ['Dad', "Dad's"], ammu: ['Mum', "Mum's"], bon: ['Sister', "Sister's"], bhai: ['Brother', "Brother's"] }
  : { parents: ['আব্বু-আম্মু', 'আব্বু-আম্মুর'], abbu: ['আব্বু', 'আব্বুর'], ammu: ['আম্মু', 'আম্মুর'], bon: ['বোন', 'বোনের'], bhai: ['ভাই', 'ভাইয়ের'] };
function slotEl(id, kind){
  const [ph, of] = SLOT_PH[kind || id], d = document.createElement('div');
  d.className = 'pslot'; d.dataset.slot = id;
  d.innerHTML = EN ? `<div class="ph"></div><div class="meta"><input type="text" maxlength="30" placeholder="${ph} (name or nickname)" aria-label="${of} name"><div class="row"><button class="btn small up" type="button">${of} photo</button><button class="btn small rm" type="button" hidden>Remove photo</button>${kind ? '<button class="btn small del" type="button">✕ Remove</button>' : ''}</div></div><input type="file" accept="image/*" hidden>`
    : `<div class="ph"></div><div class="meta"><input type="text" maxlength="30" placeholder="${ph} (নাম বা ডাক)" aria-label="${of} নাম"><div class="row"><button class="btn small up" type="button">${of} ছবি</button><button class="btn small rm" type="button" hidden>ছবি সরান</button>${kind ? '<button class="btn small del" type="button">✕ বাদ</button>' : ''}</div></div><input type="file" accept="image/*" hidden>`;
  const inp = d.querySelector('input[type=text]'), file = d.querySelector('input[type=file]');
  inp.addEventListener('input', () => { slotSet(id, 'name', inp.value.slice(0, 30)); sync(); });
  d.querySelector('.up').addEventListener('click', () => file.click());
  file.addEventListener('change', () => { const f = file.files && file.files[0]; if(f) readPhoto(f, v => { slotSet(id, 'photo', v); file.value = ''; img(v); sync(); }); });
  d.querySelector('.rm').addEventListener('click', () => { slotSet(id, 'photo', null); sync(); });
  if(kind) d.querySelector('.del').addEventListener('click', () => { FAM.sibs.splice(+id.slice(3), 1); sync(); });
  return d;
}
let famKey = '';
function famUI(){
  const key = FAM.pmode + '|' + FAM.sibs.map(s => s.kind).join(',');
  if(key !== famKey){ famKey = key;
    const par = $('#hjPar'); par.innerHTML = ''; (FAM.pmode === 'together' ? ['parents'] : FAM.pmode === 'separate' ? ['abbu', 'ammu'] : [FAM.pmode]).forEach(id => par.appendChild(slotEl(id)));
    const sb = $('#hjSibs'); sb.innerHTML = ''; FAM.sibs.forEach((s, i) => sb.appendChild(slotEl('sib' + i, s.kind))); }
  document.querySelectorAll('#hjFam .pslot').forEach(d => { const v = slotGet(d.dataset.slot); if(!v) return; d.querySelector('.ph').innerHTML = phHTML(v.photo); d.querySelector('.rm').hidden = !v.photo; const inp = d.querySelector('input[type=text]'); if(document.activeElement !== inp && inp.value !== (v.name || '')) inp.value = v.name || ''; });
  document.querySelectorAll('[data-pmode]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.pmode === FAM.pmode)));
  $('#hjAddBon').disabled = $('#hjAddBhai').disabled = FAM.sibs.length >= MAX_SIBS;
}
/* design strip under the poster, arrows on it, and swipe */
function designUI(){
  document.querySelectorAll('#hjDesigns [data-design]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.design === S.design)));
  const i = DESIGNS.findIndex(d => d.k === S.design); [-1, 1].forEach(dd => { const n = DESIGNS[(i + dd + DESIGNS.length) % DESIGNS.length]; if(n.src) img(n.src); });
}
function setDesign(k, scroll){ if(!DMAP[k]) return; S.design = k; if(DMAP[k].src) img(DMAP[k].src); sync();
  if(scroll){ const b = document.querySelector(`#hjDesigns [data-design="${k}"]`), strip = $('#hjDesigns'); if(b && strip) strip.scrollTo({ left: b.offsetLeft - strip.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' }); } }
const stepDesign = dd => { const i = DESIGNS.findIndex(d => d.k === S.design); setDesign(DESIGNS[(i + dd + DESIGNS.length) % DESIGNS.length].k, true); };

function sync(){
  const R = RELS[S.rel], sp = isSp();
  document.querySelectorAll('[data-trip]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.trip === S.trip)));
  document.querySelectorAll('[data-rel]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.rel === S.rel)));
  document.querySelectorAll('[data-size]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.size === S.size)));
  $('#hjTwo').hidden = !sp; $('#hjFam').hidden = S.rel !== 'parents';
  if(sp){ const male = looksMale(S.name2.trim());
    $('#hjName2').placeholder = R.ph2;
    $('#hjNote2').textContent = EN ? (male ? 'Without a photo, the drawing of a man in a panjabi is used; you can pick another one below' : 'Without a photo, the picture of a woman in hijab seen from behind is used; you can pick another one below')
      : male ? 'ছবি না দিলে পাঞ্জাবি পরা আঁকা ছবিটা বসবে, নিচ থেকে অন্যটাও বাছতে পারেন' : 'ছবি না দিলে পেছন ফেরা হিজাবের ছবিটা বসবে, নিচ থেকে অন্যটাও বাছতে পারেন';
    $('#hjAvGrp').classList.toggle('m-first', male);
    const qk = $('#hjQuick'); if(qk.dataset.rel !== S.rel){ qk.dataset.rel = S.rel; qk.innerHTML = R.quick.map(([v, l]) => `<button type="button" class="chip" data-q="${esc(v)}">${esc(l)}</button>`).join(''); }
    qk.querySelectorAll('[data-q]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.q === S.name2.trim())));
    $('#hjPh2').innerHTML = phHTML(S.photo2); $('#hjRm2').hidden = !S.photo2;
    document.querySelectorAll('#hjAvBox [data-av]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.av === S.photo2)));
    const n2 = $('#hjName2'); if(document.activeElement !== n2 && n2.value !== S.name2) n2.value = S.name2; }
  if(S.rel === 'parents') famUI();
  $('#hjPh1').innerHTML = phHTML(S.photo); $('#hjRm1').hidden = !S.photo;
  designUI();
  $('#hjCaption').value = caption();
  const wrap = $('#hjWrap'), sz = SIZES[S.size]; wrap.style.setProperty('--ar', (sz.w / sz.h).toFixed(4));
  document.title = EN ? `Dream ${TRIPS[S.trip].bn} map: from Dhaka to Makkah and Madinah | Ghure Dekha Bangladesh` : `${TRIPS[S.trip].bn}র স্বপ্নের ম্যাপ: ঢাকা থেকে মক্কা-মদিনা | ঘুরে দেখা বাংলাদেশ`;
  save(); paint();
}

document.querySelectorAll('[data-trip]').forEach(x => x.addEventListener('click', () => { S.trip = x.dataset.trip; sync(); }));
document.querySelectorAll('[data-rel]').forEach(x => x.addEventListener('click', () => { S.rel = x.dataset.rel; sync(); }));
document.querySelectorAll('[data-size]').forEach(x => x.addEventListener('click', () => { S.size = x.dataset.size; sync(); }));
document.querySelectorAll('[data-pmode]').forEach(x => x.addEventListener('click', () => { FAM.pmode = x.dataset.pmode; sync(); }));
[['#hjAddBon', 'bon'], ['#hjAddBhai', 'bhai']].forEach(([s, kind]) => $(s).addEventListener('click', () => { if(FAM.sibs.length < MAX_SIBS){ FAM.sibs.push({ kind, name: '', photo: null }); sync(); } }));
$('#hjQuick').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if(!b) return; const v = b.dataset.q; S.name2 = v; const g = AV_G[S.photo2]; if(g && g !== (looksMale(v) ? 'm' : 'f')) S.photo2 = null; $('#hjName2').value = v; sync(); });
$('#hjName').addEventListener('input', e => { S.name = e.target.value.slice(0, 40); sync(); });
$('#hjName2').addEventListener('input', e => { S.name2 = e.target.value.slice(0, 40); sync(); });
$('#hjYear').addEventListener('input', e => { S.year = e.target.value.slice(0, 12); sync(); });
$('#hjBtn1').addEventListener('click', () => $('#hjIn1').click()); $('#hjBtn2').addEventListener('click', () => $('#hjIn2').click());
$('#hjIn1').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if(f) readPhoto(f, d => { S.photo = d; e.target.value = ''; img(d); sync(); }); });
$('#hjIn2').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if(f) readPhoto(f, d => { S.photo2 = d; e.target.value = ''; img(d); sync(); }); });
$('#hjRm1').addEventListener('click', () => { S.photo = null; sync(); }); $('#hjRm2').addEventListener('click', () => { S.photo2 = null; sync(); });
(function(){ [['f', '#hjAvF'], ['m', '#hjAvM']].forEach(([g, sel]) => { const row = $(sel); AVATARS.filter(a => a[2] === g).forEach(([k, lb]) => { const x = document.createElement('button'); x.type = 'button'; x.dataset.av = `/img/avatars/${k}.jpg`; x.setAttribute('aria-label', lb); x.title = lb; x.innerHTML = `<img src="/img/avatars/${k}.jpg" alt="" width="52" height="52" loading="lazy">`; x.addEventListener('click', () => { S.photo2 = x.dataset.av; img(S.photo2); sync(); }); row.appendChild(x); }); }); })();
(function(){ const strip = $('#hjDesigns'); DESIGNS.forEach(d => { const b = document.createElement('button'); b.type = 'button'; b.dataset.design = d.k; b.setAttribute('aria-pressed', 'false'); b.innerHTML = `<img src="${d.thumb}" alt="" width="68" height="68" loading="lazy"><span>${d.bn}</span>`; b.addEventListener('click', () => setDesign(d.k, true)); strip.appendChild(b); }); })();
$('#hjPrev').addEventListener('click', () => stepDesign(-1)); $('#hjNext').addEventListener('click', () => stepDesign(1));
(function(){ const w = $('#hjWrap'); let x0 = null, y0 = 0; w.addEventListener('touchstart', e => { if(e.touches.length !== 1) return; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  w.addEventListener('touchend', e => { if(x0 == null) return; const t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null; if(Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) stepDesign(dx < 0 ? 1 : -1); }, { passive: true }); })();
$('#hjName').value = S.name; $('#hjName2').value = S.name2; $('#hjYear').value = S.year;

/* ---------- export ---------- */
function logEvent(type){ if(!HOSTED) return; try{ fetch('/api/event', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type, map: S.trip, count: people().length, districts: ['sa'], has_photo: !!S.photo, theme: S.rel }), keepalive: true }).catch(() => {}); }catch(e){} }
async function blob(){ await fontReady; await ready(); const sz = SIZES[S.size], k = 2, c = document.createElement('canvas'); c.width = sz.w * k; c.height = sz.h * k; render(c.getContext('2d'), c.width, c.height); return new Promise(r => c.toBlob(r, 'image/jpeg', .92)); }
const fname = () => `ghure-dekha-${S.trip}-${S.rel}-${S.design}.jpg`;
function download(b){ const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = fname(); document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000); }
const copy = text => (window.gdCopy ? window.gdCopy(text) : (navigator.clipboard ? navigator.clipboard.writeText(text).then(() => true, () => false) : Promise.resolve(false)));
$('#hjDl').addEventListener('click', async e => { const btn = e.currentTarget, prev = btn.textContent; btn.disabled = true; btn.textContent = EN ? 'Making...' : 'তৈরি হচ্ছে...'; try{ download(await blob()); logEvent('download'); toastMsg(EN ? 'Downloading the picture' : 'ছবি নামছে'); }catch(err){ toastMsg(EN ? "Couldn't make the picture. Please try again." : 'ছবি বানানো যায়নি, আবার চেষ্টা করুন'); } finally{ btn.disabled = false; btn.textContent = prev; } });
document.querySelectorAll('.hj-copy').forEach(btn => btn.addEventListener('click', () => { const label0 = btn.dataset.label || (btn.dataset.label = btn.textContent); copy($('#hjCaption').value).then(ok => { if(ok){ btn.textContent = EN ? '✓ Copied' : '✓ কপি হয়েছে'; setTimeout(() => { btn.textContent = label0; }, 2000); toastMsg(EN ? 'Caption copied. Paste it with the picture on Facebook.' : 'ক্যাপশন কপি হয়েছে, ফেসবুকে ছবির সাথে পেস্ট করুন'); } else { const ta = $('#hjCaption'); ta.scrollIntoView({ block: 'center' }); ta.focus(); ta.select(); toastMsg(EN ? 'Press and hold the text, choose Select All, then Copy.' : 'লেখাটা চেপে ধরে Select All, তারপর Copy চাপুন'); } }); }));
fontReady.then(() => { [MAKKAH, MADINAH, LOGO, AV_DEF, AV_M].forEach(img); sync(); });
sync(); logEvent('visit');
window.__hj = { S, FAM, render, sync, ready, caption, SIZES, DESIGNS, setDesign };
})();

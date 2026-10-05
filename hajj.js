/* ঘুরে দেখা বাংলাদেশ: হজ ও উমরার স্বপ্নের ম্যাপ (/umrah, /hajj).
   One or two people's photos, a dotted route from Dhaka to Makkah and Madinah, photos of both holy mosques.
   Everything is drawn on a canvas in poster units (1080 wide); exports render the same function at 2x.
   Photos never leave the device. Map data: /hajj-map.js (Natural Earth). */
(function(){
'use strict';
const $ = s => document.querySelector(s);
const BN = v => String(v).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const F = (w, px) => `${Math.min(+w || 400, 700)} ${px}px "Hind Siliguri","Noto Sans Bengali",sans-serif`;
const SIZES = { post: { w: 1080, h: 1350 }, square: { w: 1080, h: 1080 }, story: { w: 1080, h: 1920 } };
const SITE_LABEL = /(^|\.)ghuredekha\.com$/i.test(location.hostname) ? 'ghuredekha.com' : 'ghuredekhabangladesh.com';
const HOSTED = /(^|\.)(ghuredekha\.com|ghuredekhabangladesh\.com)$/i.test(location.hostname);
const TRIPS = { umrah: { bn: 'উমরা', loc: 'উমরায়', tag: '#উমরা #Umrah' }, hajj: { bn: 'হজ', loc: 'হজে', tag: '#হজ #Hajj' } };
const OBJN = x => /[A-Za-z0-9).]$/.test(x) ? x + '-কে' : x + 'কে';
const RELS = {
  future:  { chip: '💍 বিয়ের পর', two: true, name2: 'ভবিষ্যৎ বউ', ph2: 'যেমন: ভবিষ্যৎ বউ / ভবিষ্যৎ বর',
    title: T => `বিয়ের পর প্রথম সফর: ${T}`, quote: 'নতুন জীবনের শুরুটা হোক আল্লাহর ঘর থেকে',
    cap: (t, a, b, yr, dflt) => [`🕋 ইনশাআল্লাহ${yr}, বিয়ের পর আমাদের প্রথম সফর হবে ${t.bn}।`, 'ঢাকা থেকে মক্কা-মদিনা, একসাথে আল্লাহর ঘরে যাওয়ার স্বপ্ন। আল্লাহ কবুল করুন 🤲' + (dflt ? ' (মানুষটা এখনো খুঁজছি 😅)' : '')] },
  spouse:  { chip: '❤️ জীবনসঙ্গীর সাথে', two: true, name2: 'জীবনসঙ্গী', ph2: 'যেমন: স্ত্রী / স্বামী, বা নাম',
    title: T => `দুজনে একসাথে ${T}`, quote: 'দুজনে মিলে আল্লাহর ঘরে, এই আমাদের স্বপ্ন',
    cap: (t, a, b, yr) => [`🕋 ইনশাআল্লাহ${yr}, ${OBJN(b)} নিয়ে ${t.loc} যাওয়ার স্বপ্ন।`, 'ঢাকা থেকে মক্কা-মদিনা, দুজনে মিলে আল্লাহর ঘরে। আল্লাহ কবুল করুন 🤲'] },
  parents: { chip: '👪 মা-বাবাকে নিয়ে', two: true, name2: 'আম্মু-আব্বু', ph2: 'যেমন: আম্মু-আব্বু / আম্মু / আব্বু',
    title: T => `মা-বাবাকে নিয়ে ${T}`, quote: 'মা-বাবার হাত ধরে আল্লাহর ঘরে, এই আমার স্বপ্ন',
    cap: (t, a, b, yr) => [`🕋 ইনশাআল্লাহ${yr}, ${OBJN(b)} নিয়ে ${t.loc} যাওয়ার স্বপ্ন।`, 'ঢাকা থেকে মক্কা-মদিনা, মা-বাবার হাত ধরে আল্লাহর ঘরে। আল্লাহ কবুল করুন 🤲'] },
  solo:    { chip: '🙋 একা', two: false, name2: '', ph2: '',
    title: T => `আমার স্বপ্নের ${T}`, quote: 'জীবনে একবার হলেও আল্লাহর ঘরে',
    cap: (t, a, b, yr) => [`🕋 ইনশাআল্লাহ${yr}, জীবনের সবচেয়ে বড় স্বপ্ন: ${t.bn}।`, 'ঢাকা থেকে মক্কা-মদিনা, আল্লাহর ঘরে যাওয়ার অপেক্ষা। আল্লাহ কবুল করুন 🤲'] }
};
const AVATARS = [['hijab-back', 'হিজাব, পেছন থেকে'], ['hijab-1', 'হিজাব'], ['hijab-2', 'হিজাব ২'], ['hair', 'খোলা চুল'], ['mosque', 'মসজিদের সামনে']];
const okPhoto = v => typeof v === 'string' && (v.startsWith('data:image') || /^\/img\/avatars\/[a-z0-9-]+\.jpg$/.test(v));
const looksFemale = nm => !nm || /বউ|বৌ|স্ত্রী|বেগম|জীবনসঙ্গী|wife|bride/i.test(nm);

/* ---------- state (shared profile with the map pages: gd-profile, gd-photo, gd-photo2) ----------
   The second person depends on who you go with: wife/husband (future + spouse) share the map pages'
   second photo (gd-photo2); parents keep their own photo (gd-hajj-pp) so neither overwrites the other. */
const KEY = 'gd-hajj', PKEY = 'gd-hajj-pp';
const q = new URLSearchParams(location.search);
const FROM_MAP = !!RELS[q.get('rel')];
const GRP = r => r === 'parents' ? 'parents' : r === 'solo' ? null : 'spouse';
const N2 = { spouse: '', parents: '' }, PH2 = { spouse: null, parents: null };
const S = { trip: document.body.dataset.defaultTrip === 'hajj' ? 'hajj' : 'umrah', rel: 'future', name: '', photo: null, year: '', size: 'post' };
Object.defineProperty(S, 'name2', { enumerable: true, get(){ const g = GRP(S.rel); return g ? N2[g] : ''; }, set(v){ const g = GRP(S.rel); if(g) N2[g] = String(v || '').slice(0, 40); } });
Object.defineProperty(S, 'photo2', { enumerable: true, get(){ const g = GRP(S.rel); return g ? PH2[g] : null; }, set(v){ const g = GRP(S.rel); if(g) PH2[g] = okPhoto(v) ? v : null; } });
const ls = k => { try{ return localStorage.getItem(k); }catch(e){ return null; } };
let PREL = null, PN2 = '';
try{
  const pr = JSON.parse(ls('gd-profile') || 'null'); if(pr){ if(pr.name) S.name = String(pr.name).slice(0, 40);
    /* coming from a two-person map: honeymoon -> after marriage, couple -> spouse, family -> parents */
    const m = pr.duo && { honeymoon: 'future', couple: 'spouse', family: 'parents' }[pr.rel]; if(m){ PREL = m; if(typeof pr.name2 === 'string') PN2 = pr.name2.slice(0, 40); } }
  const gp = ls('gd-photo'); if(okPhoto(gp)) S.photo = gp;
  const gp2 = ls('gd-photo2'); if(okPhoto(gp2)) PH2.spouse = gp2;
  const pp = ls(PKEY); if(typeof pp === 'string' && pp.startsWith('data:image')) PH2.parents = pp;
  const h = JSON.parse(ls(KEY) || 'null');
  if(h){ if(RELS[h.rel]) S.rel = h.rel; if(h.n2 && typeof h.n2 === 'object') for(const g in N2) if(typeof h.n2[g] === 'string') N2[g] = h.n2[g].slice(0, 40);
    if(typeof h.year === 'string') S.year = h.year.slice(0, 12); if(SIZES[h.size]) S.size = h.size; }
  else if(PREL) S.rel = PREL;
}catch(e){}
if(TRIPS[q.get('t')]) S.trip = q.get('t'); if(FROM_MAP) S.rel = q.get('rel');
if(PN2 && PREL && (FROM_MAP || !N2[GRP(PREL)])) N2[GRP(PREL)] = PN2;
function save(){
  try{ localStorage.setItem(KEY, JSON.stringify({ rel: S.rel, n2: N2, year: S.year, size: S.size }));
    const pr = JSON.parse(ls('gd-profile') || 'null') || {}; pr.name = S.name; localStorage.setItem('gd-profile', JSON.stringify(pr));
    if(S.photo) localStorage.setItem('gd-photo', S.photo); else localStorage.removeItem('gd-photo');
    if(PH2.spouse) localStorage.setItem('gd-photo2', PH2.spouse); else localStorage.removeItem('gd-photo2');
    if(PH2.parents) localStorage.setItem(PKEY, PH2.parents); else localStorage.removeItem(PKEY); }catch(e){}
}

/* ---------- images ---------- */
const IMG = {};
function img(src){ let r = IMG[src]; if(r) return r; r = IMG[src] = { im: new Image(), ok: false }; r.p = new Promise(res => { r.im.onload = () => { r.ok = true; res(); paint(); }; r.im.onerror = () => res(); }); r.im.src = src; return r; }
const imgOk = src => { const r = src && img(src); return r && r.ok ? r.im : null; };
const MAKKAH = '/img/holy/makkah.jpg', MADINAH = '/img/holy/madinah.jpg', LOGO = '/favicon.svg', AV_DEF = '/img/avatars/hijab-back.jpg';
function photo1(){ return S.photo ? imgOk(S.photo) : null; }
function photo2(){ const R = RELS[S.rel]; if(!R.two) return null; if(S.photo2) return imgOk(S.photo2); if((S.rel === 'future' || S.rel === 'spouse') && looksFemale(S.name2.trim())) return imgOk(AV_DEF); return null; }
function ready(){ return Promise.all([MAKKAH, MADINAH, LOGO, S.photo, S.photo2 || AV_DEF].filter(Boolean).map(s => img(s).p)); }

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
function label(c, text, x, y, px, col, align, u){ c.font = F(700, px); c.textAlign = align || 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 6 * u; c.strokeStyle = 'rgba(4,30,22,.85)'; c.strokeText(text, x, y); c.fillStyle = col; c.fillText(text, x, y); }
/* our badge (same look as on every other poster) */
function badge(c, cx, cy, u, k, line2){
  k *= u; const D = 86 * k, ring = 5 * k, h = 64 * k, padL = 16 * k, padR = 30 * k, name = 'ঘুরে দেখা বাংলাদেশ';
  c.save(); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  const p1 = 29 * k; c.font = F(700, p1); const w1 = c.measureText(name).width; let p2 = 18.5 * k; c.font = F(600, p2); let w2 = c.measureText(line2).width; if(w2 > w1 * 1.25){ p2 *= w1 * 1.25 / w2; c.font = F(600, p2); w2 = c.measureText(line2).width; }
  const logo = imgOk(LOGO), tw = Math.max(w1, w2), Wt = (logo ? D : padR) + padL + tw + padR, x0 = cx - Wt / 2;
  const bx = logo ? x0 + D / 2 : x0, bw = Wt - (logo ? D / 2 : 0), by = cy - h / 2;
  c.save(); c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 16 * k; c.shadowOffsetY = 5 * k; const g = c.createLinearGradient(0, by, 0, by + h); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#F1F7F3'); rr(c, bx, by, bw, h, h / 2); c.fillStyle = g; c.fill(); c.restore();
  if(logo){ const mx = x0 + D / 2; c.save(); c.shadowColor = 'rgba(0,0,0,.32)'; c.shadowBlur = 14 * k; c.shadowOffsetY = 4 * k; c.beginPath(); c.arc(mx, cy, D / 2, 0, Math.PI * 2); c.fillStyle = '#FFFFFF'; c.fill(); c.restore(); c.save(); c.beginPath(); c.arc(mx, cy, D / 2 - ring, 0, Math.PI * 2); c.clip(); c.drawImage(logo, mx - D / 2 + ring, cy - D / 2 + ring, D - 2 * ring, D - 2 * ring); c.restore(); }
  const tx = logo ? x0 + D + padL : x0 + padR; c.fillStyle = '#0B6B40'; c.font = F(700, p1); c.fillText(name, tx, cy + 1 * k); c.fillStyle = '#3F5D4E'; c.font = F(600, p2); c.fillText(line2, tx, cy + 1 * k + p2 + 4 * k);
  c.restore();
}

/* ---------- the poster ---------- */
function render(c, W, H){
  const u = W / 1080, r = H / W, fmt = r > 1.6 ? 'story' : r < 1.1 ? 'square' : 'post';
  const t = TRIPS[S.trip], R = RELS[S.rel], T = t.bn;
  const Z = { post:   { top: 58, eye: 27, title: 74, tmin: 44, names: 33, pr: 96, hr: 104, quote: 31, talb: 25, gap: 18, bk: .9, bottom: 250 },
              square: { top: 40, eye: 24, title: 62, tmin: 38, names: 28, pr: 78, hr: 82, quote: 26, talb: 22, gap: 12, bk: .78, bottom: 200 },
              story:  { top: 170, eye: 32, title: 86, tmin: 50, names: 38, pr: 118, hr: 128, quote: 36, talb: 29, gap: 30, bk: 1.08, bottom: 380 } }[fmt];
  for(const k in Z) if(k !== 'bk') Z[k] *= u;
  const GOLD = '#F0CD78', CREAM = '#F7EDD6', CORAL = '#FF6B6B';
  /* background: deep green, a soft light behind the map, a faint star lattice */
  const g = c.createRadialGradient(W * .5, H * .48, 0, W * .5, H * .48, Math.max(W, H) * .78); g.addColorStop(0, '#13684E'); g.addColorStop(.55, '#0A4434'); g.addColorStop(1, '#04241B');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save(); c.globalAlpha = .07; c.strokeStyle = GOLD; c.lineWidth = 1.4 * u; const step = 132 * u;
  for(let y = step / 2; y < H + step; y += step) for(let x = (Math.round(y / step) % 2 ? step / 2 : 0); x < W + step; x += step){ star8(c, x, y, step * .3); c.stroke(); }
  c.restore();
  /* header */
  const P0 = 60 * u, cw = W - 2 * P0; let y = Z.top;
  const yr = S.year.trim() ? ' ' + BN(S.year.trim()) : '';
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.font = F(600, Z.eye); const eyeT = `ইনশাআল্লাহ${yr}`; const ew = c.measureText(eyeT).width; y += Z.eye;
  c.fillStyle = GOLD; c.fillText(eyeT, W / 2, y);
  c.strokeStyle = 'rgba(240,205,120,.6)'; c.lineWidth = 2 * u; [[-1], [1]].forEach(([sgn]) => { const x0 = W / 2 + sgn * (ew / 2 + 22 * u), x1 = x0 + sgn * 120 * u; c.beginPath(); c.moveTo(x0, y - Z.eye * .34); c.lineTo(x1, y - Z.eye * .34); c.stroke(); c.save(); c.translate(x0 + sgn * 6 * u, y - Z.eye * .34); c.rotate(Math.PI / 4); c.fillStyle = GOLD; c.fillRect(-4 * u, -4 * u, 8 * u, 8 * u); c.restore(); });
  const title = R.title(T); let tp = fit(c, 700, title, cw, Z.title, Z.title * .7); let lines = [title];
  if(tp < Z.title * .8 && title.includes(' ')){ c.font = F(700, Z.title); lines = wrap2(c, title, cw); tp = Math.min(Z.title, ...lines.map(l => fit(c, 700, l, cw, Z.title, Z.tmin))); }
  c.font = F(700, tp); c.fillStyle = '#FFFFFF'; lines.forEach((l, i) => { y += (i ? tp * 1.12 : tp * 1.2); c.fillText(l, W / 2, y); });
  const a = S.name.trim() || 'আমি', b = S.name2.trim() || R.name2;
  const names = R.two ? `${a} ও ${b}` : S.name.trim(); if(names){ const np = fit(c, 600, names, cw, Z.names, Z.names * .7); c.font = F(600, np); c.fillStyle = CREAM; y += np * 1.5; c.fillText(names, W / 2, y); }
  /* map region */
  const regTop = y + Z.gap * 1.2, regBot = H - Z.bottom, regH = regBot - regTop;
  const [fx0, fy0] = P(28, 36), [fx1, fy1] = P(96, 7);
  const s = Math.min(W / (fx1 - fx0), regH / (fy1 - fy0)) * 1.04;
  let ox = W / 2 - (fx0 + fx1) / 2 * s; const oy = regTop + regH / 2 - (fy0 + fy1) / 2 * s;
  { const dx = HJ_CITY.dhaka.c[0], mx = HJ_CITY.madinah.c[0]; const right = ox + dx * s, left = ox + mx * s; if(right > W - 80 * u) ox -= right - (W - 80 * u); if(ox + mx * s < 120 * u) ox += 120 * u - (ox + mx * s); }
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
  const HR = Z.hr, PR = Z.pr, two = R.two, labPx = 25 * u * (fmt === 'story' ? 1.15 : fmt === 'square' ? .9 : 1);
  const rowY = regBot - Math.max(HR, PR) - labPx * 2.2;
  const lead = (A, B) => { c.save(); c.setLineDash([3 * u, 6 * u]); c.lineWidth = 2.4 * u; c.strokeStyle = 'rgba(247,237,214,.8)'; c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke(); c.restore(); };
  const mdP = { x: Math.max(34 * u + HR, Math.min(md.x - HR * .35, W * .5 - HR * 2.6)), y: rowY };
  const mkP = { x: mdP.x + HR * 2.32, y: rowY };
  lead(md, { x: mdP.x, y: mdP.y - HR }); lead(mk, { x: mkP.x, y: mkP.y - HR });
  circlePhoto(c, imgOk(MADINAH), mdP.x, mdP.y, HR, u, 6 * u, .58, .58, 1.12);
  circlePhoto(c, imgOk(MAKKAH), mkP.x, mkP.y, HR, u, 6 * u, .5, .6, 1.1);
  label(c, 'মদিনা মুনাওয়ারা', mdP.x, mdP.y + HR + labPx * 1.15, labPx, CREAM, 'center', u);
  label(c, 'মক্কা মুকাররমা', mkP.x, mkP.y + HR + labPx * 1.15, labPx, CREAM, 'center', u);
  label(c, 'মদিনা', md.x + 17 * u, md.y - 9 * u, 25 * u, '#FFFFFF', 'left', u); label(c, 'মক্কা', mk.x + 17 * u, mk.y + 11 * u, 25 * u, '#FFFFFF', 'left', u);
  /* the people, starting from Dhaka */
  const pw = two ? PR * 3.44 : PR * 2;
  const pcx = Math.min(W - 34 * u - pw / 2, Math.max(mkP.x + HR + pw / 2 + 30 * u, dhaka.x - 30 * u)), pcy = rowY;
  lead(dhaka, { x: pcx + (two ? PR * .3 : 0), y: pcy - PR });
  if(two){ circlePhoto(c, photo1(), pcx - PR * .72, pcy, PR, u, 6 * u); circlePhoto(c, photo2(), pcx + PR * .72, pcy, PR, u, 6 * u);
    c.save(); c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 8 * u; c.beginPath(); c.arc(pcx, pcy + PR * .66, 24 * u, 0, Math.PI * 2); c.fillStyle = '#FFFFFF'; c.fill(); c.restore();
    c.font = `${26 * u}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(S.rel === 'parents' ? '🤲' : '💍', pcx, pcy + PR * .68); }
  else circlePhoto(c, photo1(), pcx, pcy, PR, u, 6 * u);
  const nmTag = R.two ? (S.rel === 'parents' ? 'ঢাকা থেকে, মা-বাবার সাথে' : 'ঢাকা থেকে, দুজনে') : 'ঢাকা থেকে';
  label(c, nmTag, pcx, pcy + PR + labPx * 1.15, labPx, CREAM, 'center', u);
  label(c, 'ঢাকা', dhaka.x + (dhaka.x > W - 150 * u ? -18 : 18) * u, dhaka.y - 14 * u, 25 * u, '#FFFFFF', dhaka.x > W - 150 * u ? 'right' : 'left', u);
  /* bottom: the wish, the talbiyah, our badge */
  let yb = regBot + Z.gap * 1.6;
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  const qp = fit(c, 600, R.quote, cw, Z.quote, Z.quote * .7); c.font = F(600, qp); c.fillStyle = CREAM; yb += qp; c.fillText(R.quote, W / 2, yb);
  c.font = F(600, Z.talb); c.fillStyle = GOLD; yb += Z.talb * 1.9; c.fillText('লাব্বাইক আল্লাহুম্মা লাব্বাইক', W / 2, yb);
  const bk = Z.bk, bh = 86 * bk * u; badge(c, W / 2, H - bh / 2 - (fmt === 'story' ? 120 : 26) * u, u, bk, SITE_LABEL + '/' + S.trip);
}

/* ---------- caption ---------- */
function caption(){
  const t = TRIPS[S.trip], R = RELS[S.rel]; const a = S.name.trim() || 'আমি', b = S.name2.trim() || R.name2; const yr = S.year.trim() ? ' ' + BN(S.year.trim()) : '';
  const L = R.cap(t, a, b, yr, S.rel === 'future' && (!S.name2.trim() || /^ভবিষ্যৎ (বউ|বর)$/.test(S.name2.trim())));
  return [...L, '', `আপনার স্বপ্নের ${t.bn}র ম্যাপ বানান, ছবি দিয়ে, ফ্রি 👉 https://${SITE_LABEL}/${S.trip}`, '', `${t.tag} #ঘুরেদেখাবাংলাদেশ`].join('\n');
}

/* ---------- UI ---------- */
const cv = $('#hjPoster'), ctx = cv.getContext('2d');
let raf = 0; function paint(){ if(raf) return; raf = requestAnimationFrame(() => { raf = 0; const sz = SIZES[S.size]; if(cv.width !== sz.w || cv.height !== sz.h){ cv.width = sz.w; cv.height = sz.h; } render(ctx, sz.w, sz.h); }); }
const fontReady = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load(F(700, 40)), document.fonts.load(F(600, 40))]).catch(() => {}) : Promise.resolve();
function sync(){
  const R = RELS[S.rel];
  document.querySelectorAll('[data-trip]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.trip === S.trip)));
  document.querySelectorAll('[data-rel]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.rel === S.rel)));
  document.querySelectorAll('[data-size]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.size === S.size)));
  $('#hjTwo').hidden = !R.two; $('#hjAvBox').hidden = S.rel === 'parents';
  $('#hjNote2').textContent = S.rel === 'parents' ? 'মা-বাবার ছবি দিন, একসাথে তোলা ছবি হলে সবচেয়ে ভালো' : 'ভবিষ্যৎ বউ বা স্ত্রীর ছবি না দিলে পেছন ফেরা হিজাবের ছবিটা বসবে'; $('#hjName2').placeholder = R.ph2; $('#hjName2Label').textContent = S.rel === 'parents' ? 'মা-বাবার নাম / ডাক' : 'দ্বিতীয় জনের নাম';
  const box1 = $('#hjPh1'), box2 = $('#hjPh2');
  box1.innerHTML = S.photo ? `<img src="${S.photo}" alt="">` : '<span>🙂</span>'; $('#hjRm1').hidden = !S.photo;
  box2.innerHTML = S.photo2 ? `<img src="${S.photo2}" alt="">` : '<span>🙂</span>'; $('#hjRm2').hidden = !S.photo2;
  document.querySelectorAll('#hjAv [data-av]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.av === S.photo2)));
  const n2 = $('#hjName2'); if(document.activeElement !== n2 && n2.value !== S.name2) n2.value = S.name2;
  $('#hjCaption').value = caption();
  const wrap = $('#hjWrap'); const sz = SIZES[S.size]; wrap.style.setProperty('--ar', (sz.w / sz.h).toFixed(4));
  document.title = `${TRIPS[S.trip].bn}র স্বপ্নের ম্যাপ: ঢাকা থেকে মক্কা-মদিনা | ঘুরে দেখা বাংলাদেশ`;
  save(); paint();
}
function readPhoto(file, cb){ const url = URL.createObjectURL(file), im = new Image(); im.onload = () => { const M = 640, sc = Math.max(M / im.width, M / im.height), w = im.width * sc, h = im.height * sc; const c = document.createElement('canvas'); c.width = M; c.height = M; const x = c.getContext('2d'); x.drawImage(im, (M - w) / 2, (M - h) / 2, w, h); URL.revokeObjectURL(url); cb(c.toDataURL('image/jpeg', .88)); }; im.onerror = () => { URL.revokeObjectURL(url); toastMsg('ছবিটা পড়া যায়নি, অন্য ছবি দিন'); }; im.src = url; }
const toastMsg = (m, ms) => { if(window.toast) window.toast(m); };
document.querySelectorAll('[data-trip]').forEach(x => x.addEventListener('click', () => { S.trip = x.dataset.trip; sync(); }));
document.querySelectorAll('[data-rel]').forEach(x => x.addEventListener('click', () => { S.rel = x.dataset.rel; sync(); }));
document.querySelectorAll('[data-size]').forEach(x => x.addEventListener('click', () => { S.size = x.dataset.size; sync(); }));
$('#hjName').addEventListener('input', e => { S.name = e.target.value.slice(0, 40); sync(); });
$('#hjName2').addEventListener('input', e => { S.name2 = e.target.value.slice(0, 40); sync(); });
$('#hjYear').addEventListener('input', e => { S.year = e.target.value.slice(0, 12); sync(); });
$('#hjBtn1').addEventListener('click', () => $('#hjIn1').click()); $('#hjBtn2').addEventListener('click', () => $('#hjIn2').click());
$('#hjIn1').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if(f) readPhoto(f, d => { S.photo = d; e.target.value = ''; img(d); sync(); }); });
$('#hjIn2').addEventListener('change', e => { const f = e.target.files && e.target.files[0]; if(f) readPhoto(f, d => { S.photo2 = d; e.target.value = ''; img(d); sync(); }); });
$('#hjRm1').addEventListener('click', () => { S.photo = null; sync(); }); $('#hjRm2').addEventListener('click', () => { S.photo2 = null; sync(); });
(function(){ const row = $('#hjAv'); AVATARS.forEach(([k, lb]) => { const x = document.createElement('button'); x.type = 'button'; x.dataset.av = `/img/avatars/${k}.jpg`; x.setAttribute('aria-label', lb); x.innerHTML = `<img src="/img/avatars/${k}.jpg" alt="" width="58" height="58" loading="lazy">`; x.addEventListener('click', () => { S.photo2 = x.dataset.av; img(S.photo2); sync(); }); row.appendChild(x); }); })();
$('#hjName').value = S.name; $('#hjName2').value = S.name2; $('#hjYear').value = S.year;

/* ---------- export / share ---------- */
function logEvent(type){ if(!HOSTED) return; try{ fetch('/api/event', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type, map: S.trip, count: RELS[S.rel].two ? 2 : 1, districts: ['sa'], has_photo: !!S.photo, theme: S.rel }), keepalive: true }).catch(() => {}); }catch(e){} }
async function blob(){ await fontReady; await ready(); const sz = SIZES[S.size], k = 2, c = document.createElement('canvas'); c.width = sz.w * k; c.height = sz.h * k; render(c.getContext('2d'), c.width, c.height); return new Promise(r => c.toBlob(r, 'image/jpeg', .92)); }
const fname = () => `ghure-dekha-${S.trip}-${S.rel}.jpg`;
function download(b){ const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = fname(); document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000); }
const copy = text => (window.gdCopy ? window.gdCopy(text) : (navigator.clipboard ? navigator.clipboard.writeText(text).then(() => true, () => false) : Promise.resolve(false)));
$('#hjDl').addEventListener('click', async e => { const btn = e.currentTarget, prev = btn.textContent; btn.disabled = true; btn.textContent = 'তৈরি হচ্ছে...'; try{ download(await blob()); logEvent('download'); toastMsg('ছবি নামছে'); }catch(err){ toastMsg('ছবি বানানো যায়নি, আবার চেষ্টা করুন'); } finally{ btn.disabled = false; btn.textContent = prev; } });
$('#hjCopy').addEventListener('click', e => { const btn = e.currentTarget; copy($('#hjCaption').value).then(ok => { if(ok){ btn.textContent = '✓ কপি হয়েছে'; setTimeout(() => { btn.textContent = 'ক্যাপশন কপি'; }, 2000); toastMsg('ক্যাপশন কপি হয়েছে'); } else { const ta = $('#hjCaption'); ta.focus(); ta.select(); toastMsg('লেখাটা চেপে ধরে Select All, তারপর Copy চাপুন'); } }); });
$('#hjShare').addEventListener('click', async e => {
  const btn = e.currentTarget, text = $('#hjCaption').value; const copied = copy(text);
  const prev = btn.textContent; btn.disabled = true; btn.textContent = 'তৈরি হচ্ছে...';
  try{ const b = await blob(); const file = new File([b], fname(), { type: 'image/jpeg' });
    if(navigator.canShare && navigator.canShare({ files: [file] })){ try{ await navigator.share({ files: [file], text }); logEvent('share'); toastMsg('ক্যাপশন কপি করা আছে, পোস্টে পেস্ট করে দিন'); }catch(err){ if(!(err && err.name === 'AbortError')) { download(b); } } }
    else { download(b); await copied; logEvent('share'); toastMsg('ছবি নামল, ক্যাপশন কপি হলো; ফেসবুকে নতুন পোস্টে ছবি দিয়ে পেস্ট করুন'); setTimeout(() => window.open('https://www.facebook.com/', '_blank', 'noopener'), 900); }
  }catch(err){ toastMsg('শেয়ার করা যায়নি, ডাউনলোড করে পোস্ট করুন'); } finally{ btn.disabled = false; btn.textContent = prev; }
});
fontReady.then(() => { [MAKKAH, MADINAH, LOGO].forEach(img); sync(); });
sync(); logEvent('visit');
window.__hj = { S, render, sync, ready, caption, SIZES };
})();

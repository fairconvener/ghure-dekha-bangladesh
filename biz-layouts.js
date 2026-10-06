/* ঘুরে দেখা বাংলাদেশ: extra poster designs for the business map makers
   (/business, /business/world, /study-abroad, /business/c/*).
   template2.html render() hands off to window.GDB_LAYOUTS[state.layout](c, W, H, opts, API)
   whenever a layout other than 'classic' is chosen. Everything here is drawn in poster units
   (1080 x 1350 post, 1080 x 1080 square, 1080 x 1920 story); the same function draws the live
   preview, the 2x downloads and the Facebook share image, so it always draws the whole poster. */
(function(){
'use strict';
const LAYOUTS = window.GDB_LAYOUTS = window.GDB_LAYOUTS || {};
/* language: the English pages (/en/..., <html lang="en">) draw English posters. useLang(A) is called at the start of every
   design's draw (drawing is synchronous), so the helpers below can read EN. PAGE_EN names the designs in the editor. */
const PAGE_EN = document.documentElement.lang === 'en';
let EN = false;
function useLang(A){ EN = !!(A && A.UIEN && (!A.isEN || A.isEN())); return EN; }
const enName = (A, d) => (A && A.nameOf) ? A.nameOf(d) : d.bn;
const titleCase = s => String(s).replace(/(^|\s)\S/g, x => x.toUpperCase());

/* ---------- small helpers ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SEG = (typeof Intl !== 'undefined' && Intl.Segmenter) ? new Intl.Segmenter('bn', {granularity:'grapheme'}) : null;
const graphemes = s => SEG ? Array.from(SEG.segment(s), x => x.segment) : Array.from(s);
function hex6(h){ h = String(h || '').replace('#', ''); if(h.length === 3) h = h.split('').map(c => c + c).join(''); return /^[0-9a-f]{6}$/i.test(h) ? h : '0F7F4C'; }
function rgbOf(hex){ const n = parseInt(hex6(hex), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function toHex(rgb){ return '#' + rgb.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
function mixHex(a, b, t){ const x = rgbOf(a), y = rgbOf(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); }
function alpha(hex, a){ const [r, g, b] = rgbOf(hex); return `rgba(${r},${g},${b},${a})`; }
function relLum(hex){ return rgbOf(hex).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0); }
function contrast(a, b){ const x = relLum(a), y = relLum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
/* nudge a colour toward `toward` until it reads on `bg` */
function readable(fg, bg, toward, min){ let c = fg, k = 0; while(contrast(c, bg) < min && k < 1){ k = Math.min(1, k + .08); c = mixHex(fg, toward, k); } return c; }
function rgb2hsl([r, g, b]){ r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if(mx !== mn){ const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
function hsl2hex(h, s, l){ h = ((h % 360) + 360) % 360; const a = s * Math.min(l, 1 - l); const f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return toHex([f(0) * 255, f(8) * 255, f(4) * 255]); }

/* ---------- palette: derived from the current theme so every theme (brand, flag, river, night...) works ---------- */
function palette(A){
  const S = A.state, T = A.THEMES;
  const t = T[S.theme] || T.brand || T.flag || Object.values(T)[0];
  const dark = relLum(t.paper) < .25;
  const brand = t.visited;
  const bg = dark ? t.paper : mixHex(t.paper, '#FFFFFF', .5);
  const bg2 = dark ? mixHex(t.paper, '#000000', .2) : t.paper;
  const land = dark ? mixHex(t.muted, t.paper, .72) : mixHex(t.muted, bg, .8);
  const [h, s, l] = rgb2hsl(rgbOf(brand));
  /* second shade for neighbouring countries: lighter and nudged toward cyan / teal */
  const brand2 = l > .58 ? hsl2hex(h - 14, Math.min(1, s * .95), l - .2) : hsl2hex(h - 14, Math.min(.9, s * .92 + .05), Math.min(.66, l + .18));
  const band = dark ? mixHex(t.paper, '#FFFFFF', .07) : mixHex(bg, '#FFFFFF', .82);
  const ink = t.ink, muted = t.muted;
  const deep = dark ? '#FFFFFF' : mixHex(ink, '#000000', .3);
  const wish = (A.WISH && A.WISH[S.theme]) || '#E9A825';
  return { t, dark, brand, brand2, bg, bg2, land, band, ink, muted, deep,
    brandText: readable(brand, bg, deep, 3.6), brandBand: readable(brand, band, deep, 4),
    wish, wishFill: mixHex(wish, bg, .58), line: dark ? t.paper : mixHex(bg, '#FFFFFF', .4) };
}

/* Bangla possessive: "এজেন্সি" -> "এজেন্সির", "প্রতিষ্ঠান" -> "প্রতিষ্ঠানের", Latin names -> "Name-এর" */
function genitive(name){
  const g = graphemes(name.trim()); const last = g.length ? g[g.length - 1] : ''; const ch = last.replace(/\u0981$/, '').slice(-1);
  if(/[\u0985-\u0994\u09BE-\u09C4\u09C7\u09C8\u09CB\u09CC\u09D7]/.test(ch)) return name + 'র';
  if(ch === '\u0982') return name.trim().slice(0, -1) + 'ঙের';
  if(/[\u0980-\u09FF]/.test(ch)) return name + 'ের';
  return name + '-এর';
}

/* ---------- copy: defaults per business kind (neutral wording, no claims about the firm) ---------- */
function copyForEN(A){
  const S = A.state, CFG = A.CFG, E = A.E || {}, k = S.kind;
  const world = CFG.map === 'world', bd = CFG.map === 'bd';
  const own = (S.name || '').trim(), nm = own || (bd ? 'Your business' : 'Your agency'), nmIn = own || (bd ? 'your business' : 'your agency'); /* nmIn: inside a sentence */
  const place = E.place || '', units = E.units || 'places', here = 'These ' + titleCase(units);
  const HOOK = world ? {
    student: 'Your dream campus\nanywhere in the world',
    partner: 'In countries around the world\nour partner campuses',
    visa:    'Wherever you want to go\nyour visa starts here',
    tour:    'This holiday\nsee a new country',
    office:  'One network\noffices in many countries',
    job:     'Take your skills\nto work around the world',
    service: 'Country after country\nour services'
  } : bd ? {
    branch:   'Across the country\nour branches and offices',
    tour:     'See the country\nwith us',
    visa:     'Whichever district you live in\nyour trip abroad starts here',
    student:  'From districts across the country\nto universities abroad',
    delivery: 'Wherever you are in the country\nwe reach your door',
    dealer:   'Across the country\nour dealer network',
    customer: 'Across the country\nour customer family',
    service:  'All over the country\nour services',
    seminar:  'District by district\nour seminars',
    event:    'District by district\nour events'
  } : {
    student: `On campuses in ${place}\nour students`,
    partner: `On campuses in ${place}\nour partners`,
    visa:    `Your visa for ${place}\nstarts here`,
    tour:    `On the roads of ${place}\ncome with us`,
    office:  `All over ${place}\nour offices`,
    job:     `All over ${place}\nour workers`,
    service: `All over ${place}\nour services`
  };
  const TAG = {
    student: bd ? `The ${units} our students come from` : `The ${units} where our students are`,
    partner: `The ${units} with our partner universities`,
    visa:    bd ? `The ${units} our clients come from` : `The ${units} we process visas for`,
    tour:    `The ${units} we run tours to`,
    office:  `The ${units} where we have offices`,
    job:     `The ${units} we send workers to`,
    service: `The ${units} we serve`,
    branch:  `The ${units} where we have branches`,
    delivery:`The ${units} we deliver to`,
    dealer:  `The ${units} where we have dealers`,
    customer:`The ${units} where we have customers`,
    seminar: `The ${units} where we have held seminars`,
    event:   `The ${units} where we have held events`
  };
  const BAND = {
    student: [`With ${nmIn}, find your`, 'Study Destination'],
    partner: [`With ${nmIn}, find your`, 'Study Destination'],
    visa:    [`With ${nmIn}, start your`, 'Visa Process'],
    tour:    [`With ${nmIn}, head to your`, 'Next Destination'],
    office:  [`Get in touch with ${nmIn}`, world ? 'Global Offices' : 'At Your Nearest Office'],
    job:     [`With ${nmIn}, find your`, 'Work Destination'],
    service: bd ? [`${nm} serves`, here] : [`With ${nmIn}, start your`, 'Next Step'],
    branch:  [`Get in touch with ${nmIn}`, 'At Your Nearest Branch'],
    delivery:[`${nm} delivers to`, here],
    dealer:  [`${nm} has dealers in`, here],
    customer:[`${nm} has customers in`, here],
    seminar: [`${nm} has held seminars in`, here],
    event:   [`${nm} has held events in`, here]
  };
  const hook = HOOK[k] || (world ? HOOK.student : bd ? HOOK.branch : HOOK.student);
  const tag = TAG[k] || `The ${units} where we are`;
  const band = BAND[k] || [`Get in touch with ${nmIn}`, 'Today'];
  const hashtag = '#' + (nm.split(/[^\p{L}\p{M}\p{N}]+/u).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') || 'YourAgency');
  return { hook, tagline: tag, bandA: band[0], bandB: band[1], hashtag, name: nm };
}
function copyFor(A){
  if(useLang(A)) return copyForEN(A);
  const S = A.state, CFG = A.CFG, U = A.U, k = S.kind;
  const world = CFG.map === 'world', bd = CFG.map === 'bd';
  const nm = (S.name || '').trim() || (bd ? 'আপনার প্রতিষ্ঠান' : 'আপনার এজেন্সি');
  const place = CFG.place || '';
  const HOOK = world ? {
    student: 'আপনার স্বপ্নের ক্যাম্পাস\nপৃথিবীর যে প্রান্তেই হোক',
    partner: 'বিশ্বের নানা দেশে\nআমাদের পার্টনার ক্যাম্পাস',
    visa:    'যে দেশেই যেতে চান\nভিসার প্রস্তুতি শুরু এখানে',
    tour:    'এবারের ছুটিতে\nচলুন নতুন দেশে',
    office:  'এক নেটওয়ার্ক\nনানা দেশে আমাদের অফিস',
    job:     'দক্ষতা নিয়ে\nকাজ হোক বিশ্বজুড়ে',
    service: 'দেশে দেশে\nআমাদের সার্ভিস'
  } : bd ? {
    branch:   'দেশজুড়ে আমাদের\nশাখা ও অফিস',
    tour:     'দেশটা ঘুরে দেখুন\nআমাদের সাথে',
    visa:     'যে জেলাতেই থাকুন\nবিদেশযাত্রার প্রস্তুতি এখানে',
    student:  'দেশের নানা জেলা থেকে\nবিদেশে উচ্চশিক্ষা',
    delivery: 'দেশের যেখানেই থাকুন\nপৌঁছে যাবে দরজায়',
    dealer:   'দেশজুড়ে আমাদের\nডিলার নেটওয়ার্ক',
    customer: 'দেশজুড়ে আমাদের\nকাস্টমার পরিবার',
    service:  'দেশের নানা প্রান্তে\nআমাদের সার্ভিস',
    seminar:  'জেলায় জেলায়\nআমাদের সেমিনার',
    event:    'জেলায় জেলায়\nআমাদের আয়োজন'
  } : {
    student: `${place} ক্যাম্পাসে\nআমাদের স্টুডেন্ট`,
    partner: `${place} ক্যাম্পাসে\nআমাদের পার্টনার`,
    visa:    `${place} ভিসা\nপ্রস্তুতি শুরু এখানে`,
    tour:    `${place} পথে পথে\nচলুন আমাদের সাথে`,
    office:  `${place} নানা প্রান্তে\nআমাদের অফিস`,
    job:     `${place} নানা প্রান্তে\nআমাদের কর্মী`,
    service: `${place} নানা প্রান্তে\nআমাদের সার্ভিস`
  };
  const TAG = {
    student: bd ? `যে ${U}গুলো থেকে আমাদের স্টুডেন্ট` : `যে ${U}গুলোতে আমাদের স্টুডেন্ট`,
    partner: `যে ${U}গুলোতে আমাদের পার্টনার ইউনিভার্সিটি`,
    visa:    bd ? `যে ${U}গুলো থেকে আমাদের ক্লায়েন্ট` : `যে ${U}গুলোর ভিসা প্রসেস করি`,
    tour:    `যে ${U}গুলোতে আমাদের ট্যুর`,
    office:  `যে ${U}গুলোতে আমাদের অফিস`,
    job:     `যে ${U}গুলোতে কর্মী পাঠাই`,
    service: `যে ${U}গুলোতে আমাদের সার্ভিস`,
    branch:  `যে ${U}গুলোতে আমাদের শাখা`,
    delivery:`যে ${U}গুলোতে ডেলিভারি দিই`,
    dealer:  `যে ${U}গুলোতে আমাদের ডিলার`,
    customer:`যে ${U}গুলোতে আমাদের কাস্টমার`,
    seminar: `যে ${U}গুলোতে সেমিনার করেছি`,
    event:   `যে ${U}গুলোতে ইভেন্ট করেছি`
  };
  const here = `এই ${U}গুলোতে`;
  const nmr = genitive(nm);
  const BAND = {
    student: [`${nmr} সঙ্গে খুঁজে নিন আপনার`, 'Study Destination'],
    partner: [`${nmr} সঙ্গে খুঁজে নিন আপনার`, 'Study Destination'],
    visa:    [`${nmr} সঙ্গে শুরু করুন আপনার`, 'Visa Process'],
    tour:    [`${nmr} সঙ্গে চলুন`, 'পরের গন্তব্যে'],
    office:  [`${nmr} সঙ্গে যোগাযোগ করুন`, world ? 'Global Offices' : 'নিকটস্থ অফিসে'],
    job:     [`${nmr} সঙ্গে খুঁজে নিন আপনার`, 'Work Destination'],
    service: bd ? [`${nmr} সার্ভিস পাবেন`, here] : [`${nmr} সঙ্গে শুরু করুন আপনার`, 'পরের ধাপ'],
    branch:  [`${nmr} সঙ্গে যোগাযোগ করুন`, 'নিকটস্থ শাখায়'],
    delivery:[`${nmr} ডেলিভারি পৌঁছায়`, here],
    dealer:  [`${nmr} ডিলার পাবেন`, here],
    customer:[`${nmr} কাস্টমার আছেন`, here],
    seminar: [`${nmr} সেমিনার হয়েছে`, here],
    event:   [`${nmr} আয়োজন হয়েছে`, here]
  };
  const hook = HOOK[k] || (world ? HOOK.student : bd ? HOOK.branch : HOOK.student);
  const tag = TAG[k] || `যে ${U}গুলোতে আমরা আছি`;
  const band = BAND[k] || [`${nmr} সঙ্গে যোগাযোগ করুন`, 'আজই'];
  const hashtag = '#' + (nm.replace(/[^\p{L}\p{M}\p{N}]+/gu, '') || 'আপনারএজেন্সি');
  return { hook, tagline: tag, bandA: band[0], bandB: band[1], hashtag, name: nm };
}

/* monogram for a firm without a logo: "Hoque Consultancy Ltd" -> HC, "IDP" -> IDP */
function initials(name){
  const STOP = /^(ltd\.?|limited|pvt\.?|private|inc\.?|llc|co\.?|&|and|the|of|bd|plc)$/i;
  const words = name.replace(/[()[\]{},.:;'"’|/\\-]+/g, ' ').split(/\s+/).filter(w => w && !STOP.test(w));
  if(!words.length) return '';
  /* Bangla names: one clean letter (joining two syllables can spell an unintended word) */
  if(/[\u0980-\u09FF]/.test(words[0][0])){ const m = words[0].match(/[\u0985-\u0994\u0995-\u09B9\u09CE\u09DC-\u09DF]/); return m ? m[0] : ''; }
  const first = w => graphemes(w)[0] || '';
  if(words.length === 1){ const w = words[0]; if(/^[A-Z0-9]{2,4}$/.test(w)) return w; return first(w).toUpperCase(); }
  const a = first(words[0]); let b = first(words[1]);
  for(let i = 2; i < words.length && a.toUpperCase() === b.toUpperCase(); i++) b = first(words[i]);
  return (a + b).toUpperCase();
}

/* ---------- geometry caches ---------- */
const BBOX = new WeakMap();
function bboxes(A){
  let m = BBOX.get(A.DISTRICTS); if(m) return m; m = {};
  for(const d of A.DISTRICTS){ const nums = (d.d || '').match(/-?\d+(?:\.\d+)?/g) || []; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for(let i = 0; i + 1 < nums.length; i += 2){ const x = +nums[i], y = +nums[i + 1]; if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; if(y > y1) y1 = y; }
    if(x0 > x1){ x0 = x1 = d.c[0]; y0 = y1 = d.c[1]; } m[d.id] = [x0, y0, x1, y1]; }
  BBOX.set(A.DISTRICTS, m); return m;
}
/* two shades so that neighbours rarely share one (greedy colouring over bounding-box contacts) */
let shadeKey = '', shadeVal = {};
function shades(A, ids){
  const key = ids.slice().sort().join(','); if(key === shadeKey) return shadeVal;
  const bb = bboxes(A), out = {}, m = 1.5;
  const order = ids.slice().sort((a, b) => ((A.byId[b] || {}).a || 0) - ((A.byId[a] || {}).a || 0));
  for(const id of order){ const b = bb[id]; if(!b){ out[id] = 0; continue; } let c0 = 0, c1 = 0;
    for(const j in out){ const o = bb[j]; if(o && b[0] - m < o[2] && b[2] + m > o[0] && b[1] - m < o[3] && b[3] + m > o[1]){ if(out[j]) c1++; else c0++; } }
    out[id] = c0 > c1 ? 1 : 0; }
  shadeKey = key; shadeVal = out; return out;
}
/* the logo's real content (ignoring white / transparent margins), measured once per image; decides the box shape */
const LOGO_BOX = new WeakMap();
function logoContent(img){
  let r = LOGO_BOX.get(img); if(r) return r;
  const N = 160, cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d', { willReadFrequently: true });
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, N, N); const sc = Math.min(N / img.width, N / img.height), w = img.width * sc, h = img.height * sc, ox = (N - w) / 2, oy = (N - h) / 2; x.drawImage(img, ox, oy, w, h);
  r = { sx: 0, sy: 0, sw: img.width, sh: img.height };
  try{ const d = x.getImageData(0, 0, N, N).data; let x0 = N, y0 = N, x1 = -1, y1 = -1;
    for(let yy = 0; yy < N; yy++) for(let xx = 0; xx < N; xx++){ const i = (yy * N + xx) * 4; if(d[i] < 236 || d[i + 1] < 236 || d[i + 2] < 236){ if(xx < x0) x0 = xx; if(xx > x1) x1 = xx; if(yy < y0) y0 = yy; if(yy > y1) y1 = yy; } }
    if(x1 >= 0){ x0 = Math.max(0, x0 - 1); y0 = Math.max(0, y0 - 1); x1 = Math.min(N - 1, x1 + 1); y1 = Math.min(N - 1, y1 + 1);
      const sx = clamp((x0 - ox) / sc, 0, img.width), sy = clamp((y0 - oy) / sc, 0, img.height); r = { sx, sy, sw: clamp((x1 + 1 - ox) / sc, 0, img.width) - sx, sh: clamp((y1 + 1 - oy) / sc, 0, img.height) - sy }; } }catch(e){}
  if(!(r.sw > 0 && r.sh > 0)) r = { sx: 0, sy: 0, sw: img.width, sh: img.height };
  LOGO_BOX.set(img, r); return r;
}
/* white box width for the logo: square, or wider (up to 1.9x) for wide wordmarks */
function logoBoxW(A, Ls){ const img = A.photoImg; if(!(img && img.width)) return Ls; const r = logoContent(img), a = r.sw / r.sh; return a > 1.15 ? Ls * clamp(a * .78, 1, 1.9) : Ls; }

let SC = null; function scratch(){ if(!SC){ const cv = document.createElement('canvas'); cv.width = cv.height = 2; SC = cv.getContext('2d'); } return SC; }

/* ---------- text helpers ---------- */
function fit(c, F, w, text, maxW, hi, lo){ let px = hi; c.font = F(w, px); while(px > lo && c.measureText(text).width > maxW){ px = Math.max(lo, px * .96); c.font = F(w, px); } return px; }
function ellipsize(c, text, maxW){ if(c.measureText(text).width <= maxW) return text; const g = graphemes(text); while(g.length > 1 && c.measureText(g.join('') + '…').width > maxW) g.pop(); return g.join('').trim() + '…'; }
function wrap(c, text, maxW){ const words = text.split(/\s+/).filter(Boolean); const lines = []; let cur = ''; for(const w of words){ const t = cur ? cur + ' ' + w : w; if(c.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; } } if(cur) lines.push(cur); return lines; }

/* headline: line 1 medium and smaller, line 2 big and bold. Shrinks to fit; when the big line would get small,
   it is split over two lines instead (as long as the block stays within maxH, e.g. beside the logo + counter). */
function layoutHeadline(c, F, text, maxW, hi, lo, u, maxH){
  const src = String(text || '').split(/\n/).map(s => s.trim()).filter(Boolean).slice(0, 2);
  if(!src.length) return { items: [], h: 0 };
  const two = src.length > 1;
  const small = b => Math.max(24 * u, b * .46);
  const mk = (lines, big) => lines.map(([t, sm]) => sm ? { t, w: 500, px: small(big), lh: 1.3 } : { t, w: 700, px: big, lh: 1.12 });
  const fits = it => it.every(x => { c.font = F(x.w, x.px); return c.measureText(x.t).width <= maxW; });
  const height = it => it.reduce((h, x, i) => h + (i === 0 ? x.px * .98 : x.px * x.lh), 0) + it[it.length - 1].px * .24; /* + descenders (ু, ্র...) */
  const best = lines => { let b = hi; while(b > lo && !fits(mk(lines, b))) b = Math.max(lo, b - 2 * u); return fits(mk(lines, b)) ? b : 0; };
  const A = src.map((t, i) => [t, two && i === 0]); const bA = best(A);
  let items = null;
  const words = src[two ? 1 : 0].split(/\s+/);
  if(words.length >= 2 && (!bA || bA < hi * .82)){
    c.font = F(700, 100); let k0 = 1, wBest = Infinity;
    for(let k = 1; k < words.length; k++){ const w = Math.max(c.measureText(words.slice(0, k).join(' ')).width, c.measureText(words.slice(k).join(' ')).width); if(w < wBest){ wBest = w; k0 = k; } }
    const Bl = [...(two ? [[src[0], true]] : []), [words.slice(0, k0).join(' '), false], [words.slice(k0).join(' '), false]];
    let bB = best(Bl);
    if(bB && maxH){ const h = height(mk(Bl, bB)); if(h > maxH) bB = Math.max(lo, bB * maxH / h); }
    if(bB && fits(mk(Bl, bB)) && bB > (bA || 0) * 1.2) items = mk(Bl, bB);
  }
  if(!items && bA) items = mk(A, bA);
  if(!items){ /* still too long at the smallest size: wrap and trim */
    items = []; for(const x of mk(A, lo)){ c.font = F(x.w, x.px); if(c.measureText(x.t).width <= maxW){ items.push(x); continue; } wrap(c, x.t, maxW).slice(0, 2).forEach(l => items.push(Object.assign({}, x, { t: ellipsize(c, l, maxW) }))); } }
  return { items, h: height(items), big: Math.max(...items.map(x => x.px)) };
}

/* pills that wrap into rows; the last row ends with "+N আরও" when not everything fits */
function pillRows(c, F, BN, px, items, maxW, gap, padX, maxRows){
  c.font = F(600, px); const rows = [[]]; let x = 0, shown = 0;
  for(const it of items){ const w = c.measureText(it.txt).width + 2 * padX + it.dot; if(x > 0 && x + w > maxW){ if(rows.length >= maxRows) break; rows.push([]); x = 0; } rows[rows.length - 1].push(Object.assign({ w }, it)); x += w + gap; shown++; }
  let rest = items.length - shown;
  const more = k => EN ? `+${BN(k)} more` : `+${BN(k)} আরও`;
  if(rest > 0){ const last = rows[rows.length - 1]; const lw = () => c.measureText(more(rest)).width + 2 * padX; let used = last.reduce((s, p) => s + p.w + gap, 0);
    while(last.length && used + lw() > maxW){ const p = last.pop(); used -= p.w + gap; rest++; } last.push({ more: true, txt: more(rest), w: lw(), dot: 0 }); }
  return rows;
}

/* ---------- label placement: inside the shape if it fits, else around it with a short leader ---------- */
function placeLabels(c, A, items, xf, bounds, u, fs, obstacles){
  const sc = scratch(), pad = 2.5 * u, placed = obstacles.slice(), out = [];
  const R = [0, 9, 20, 34, 52, 74].map(v => v * u);
  const D = [[0, -1], [0, 1], [1, 0], [-1, 0], [1, -1], [-1, -1], [1, 1], [-1, 1]];
  const free = r => r.x >= bounds.x0 && r.y >= bounds.y0 && r.x + r.w <= bounds.x1 && r.y + r.h <= bounds.y1 && !placed.some(p => r.x < p.x + p.w + pad && r.x + r.w + pad > p.x && r.y < p.y + p.h + pad && r.y + r.h + pad > p.y);
  const inside = (id, r) => { const P = A.PATHS[id]; if(!P) return false; const pts = [[r.x + 2 * u, r.y + 2 * u], [r.x + r.w - 2 * u, r.y + 2 * u], [r.x + 2 * u, r.y + r.h - 2 * u], [r.x + r.w - 2 * u, r.y + r.h - 2 * u], [r.x + r.w / 2, r.y + r.h / 2]]; return pts.every(([x, y]) => sc.isPointInPath(P, (x - xf.x) / xf.s, (y - xf.y) / xf.s)); };
  for(const it of items){
    c.font = A.F(it.w || 600, fs); const tw = c.measureText(it.text).width + 6 * u, th = fs * 1.22;
    let best = null;
    for(const r of R){
      if(r === 0){ if(it.tiny) continue; const b = { x: it.ax - tw / 2, y: it.ay - th / 2, w: tw, h: th, inside: true }; if(inside(it.id, b) && free(b)){ best = b; break; } continue; }
      for(const [dx, dy] of D){ if(r < 20 * u && dx && dy) continue;
        const k = dx && dy ? .72 : 1; const x = dx > 0 ? it.ax + r * k : dx < 0 ? it.ax - r * k - tw : it.ax - tw / 2; const y = dy > 0 ? it.ay + r * k : dy < 0 ? it.ay - r * k - th : it.ay - th / 2;
        const b = { x, y, w: tw, h: th, lead: r >= 20 * u }; if(free(b)){ best = b; break; } }
      if(best) break;
    }
    if(!best){ it.skipped = true; continue; }
    placed.push(best); out.push(Object.assign({}, it, { box: best }));
  }
  return out;
}

/* ---------- shared bits for every design ---------- */
const BADGE_K = { post: .96, square: .8, story: 1.12 };
function badgeRow(fmt, u){ return (86 * BADGE_K[fmt] + (fmt === 'square' ? 22 : 30)) * u; }
function drawBadge(c, A, cx, cy, u, fmt, o){
  if(A.badge) return A.badge(c, cx, cy, u, Object.assign({ k: BADGE_K[fmt] || .82, line2: A.SITE_LABEL + (A.CFG.path || '') }, o || {}));
  drawCredit(c, A, cx, cy, 18 * u, { muted: '#5E6E65' }); return null;
}
function homeOf(A){ return A.byId.bd || A.HOME || null; }
function counterSuffix(A){ const CFG = A.CFG; if(EN) return CFG.map === 'bd' ? '/' + A.TOTAL : A.EU(A.state.selected.size); if(CFG.map === 'bd') return '/' + A.BN(A.TOTAL); return 'টি ' + (A.UL || A.U); }
function groupsText(A, got){ const CFG = A.CFG, g = CFG.group || ''; if(EN){ const eg = (A.E && A.E.group) || 'region', N = (A.DIVISIONS || []).length; return CFG.map === 'bd' ? `${got} of ${N} ${eg}s` : `in ${got} ${eg}${got === 1 ? '' : 's'}`; } if(CFG.map === 'bd') return `${A.BN((A.DIVISIONS || []).length)}টির মধ্যে ${A.BN(got)}টি ${g}`; return `${A.BN(got)}টি ${g}${/া$/.test(g) ? 'য়' : 'ে'}`; }
function drawBase(c, A, fill, line, lw){ const B = A.BASE_PATHS; if(!B || !B.length) return; c.fillStyle = fill; for(const p of B) c.fill(p); if(line){ c.lineJoin = 'round'; c.lineWidth = lw; c.strokeStyle = line; for(const p of B) c.stroke(p); } }

/* ---------- the "headline" poster ---------- */
function headline(c, W, H, opts, A){
  opts = opts || {}; useLang(A);
  const S = A.state, CFG = A.CFG, F = A.F, rr = A.rr, BN = A.NUM || A.BN, U = A.U;
  const u = W / 1080, ratio = H / W, fmt = ratio > 1.6 ? 'story' : ratio < 1.1 ? 'square' : 'post';
  const Z = { post:   { P: 64, top: 64, logo: 150, num: 134, h2: 104, h2min: 54, gap: 26, bA: 31, bB: 78, tagPx: 23, cred: 18, row: 29, lab: 16, pill: 20 },
              square: { P: 52, top: 48, logo: 112, num: 104, h2: 84, h2min: 46, gap: 18, bA: 26, bB: 60, tagPx: 20, cred: 16, row: 25, lab: 15, pill: 18 },
              story:  { P: 72, top: 150, logo: 176, num: 164, h2: 118, h2min: 60, gap: 40, bA: 36, bB: 92, tagPx: 27, cred: 20, row: 33, lab: 18, pill: 25 } }[fmt];
  for(const k in Z) Z[k] *= u;
  const K = palette(A), C = copyFor(A);
  const P = Z.P, cw = W - 2 * P, world = CFG.map === 'world';
  const counts = S.counts || {}, cnt = id => +counts[id] || 0;
  const visited = A.DISTRICTS.filter(d => A.vis(d.id)).sort((a, b) => (cnt(b.id) - cnt(a.id)) || (b.a - a.a));
  const ids = visited.map(d => d.id);
  const n = S.selected.size, TOTAL = A.TOTAL, nw = S.wish.size;
  const nameOf = d => enName(A, d) + (cnt(d.id) ? ` ${BN(cnt(d.id))}+` : '');
  const groups = A.DIVISIONS || [];
  const useGroups = groups.length >= 2 && groups.length <= 12 && !!CFG.group && CFG.group !== 'তালিকা';
  const gotGroups = useGroups ? groups.filter(g => visited.some(d => d.div === g.id)).length : 0;
  const stats = EN ? (n ? `${n} ${A.EU(n)}` + (useGroups ? ` · ${groupsText(A, gotGroups)}` : '') : `Pick ${A.EU(2)} on the map`) : n ? `${BN(n)}টি ${U}` + (useGroups ? ` · ${groupsText(A, gotGroups)}` : '') : `ম্যাপে ${U} বেছে নিন`;
  const wishTxt = nw ? (EN ? `${nw} more ${A.EU(nw)} coming soon` : `শিগগিরই আরও ${BN(nw)}টি ${U}`) : '';

  /* ---------- measure: header ---------- */
  const Ls = Z.logo, Lw = logoBoxW(A, Ls), totStr = counterSuffix(A);
  c.font = F(700, Z.num); const numRef = c.measureText(EN ? String(TOTAL).replace(/./g, '8') : BN(TOTAL).replace(/./g, '৮')); const numCap = numRef.actualBoundingBoxAscent || Z.num * .72;
  c.font = F(600, Z.num * .34); const totW = c.measureText(totStr).width; const counterW = numRef.width + 8 * u + totW;
  const hookText = (S.hook || '').trim() || C.hook;
  const counterRow = fmt === 'story'; /* story: the counter gets its own row so the headline can run wider */
  const hlSt = layoutHeadline(c, F, hookText, cw - (counterRow ? Lw : Math.max(Lw, counterW)) - 34 * u, Z.h2, Z.h2min, u, counterRow ? Ls * 1.7 : Ls + 18 * u + numCap + 8 * u);
  const hlSd = counterRow ? hlSt : layoutHeadline(c, F, hookText, cw - Lw - 34 * u, Z.h2, Z.h2min, u, Ls + 34 * u);
  const headSt = counterRow ? Math.max(hlSt.h, Ls) + 30 * u + numCap : Math.max(hlSt.h, Ls + 18 * u + numCap);
  const headSd = Math.max(hlSd.h, Ls);
  /* ---------- measure: bottom band ---------- */
  const B = measureBand(c, A, W, u, Z, C, fmt);
  const bandTop = H - B.h;
  /* ---------- measure: progress bar + tagline row ---------- */
  const barH = (fmt === 'square' ? 7 : 9) * u, belowMap = 22 * u + barH + 30 * u + Z.row * 1.15, minBottom = 22 * u;

  /* ---------- stacked (map under the header) or side (counter column + map) ---------- */
  const wide = A.MAP_W / A.MAP_H > 1.6, Mx = wide ? 26 * u : P;
  const top = Z.top;
  const sSt = Math.max(.01, Math.min((W - 2 * Mx) / A.MAP_W, (bandTop - minBottom - (top + headSt + Z.gap) - belowMap) / A.MAP_H));
  const colW = clamp(cw * .36, 290 * u, 400 * u);
  const sSd = Math.max(.01, Math.min((cw - colW - 28 * u) / A.MAP_W, (bandTop - minBottom - (top + headSd + Z.gap) - belowMap) / A.MAP_H));
  const side = sSd > sSt * 1.04;
  const hl = side ? hlSd : hlSt, head = side ? headSd : headSt, s = side ? sSd : sSt;
  const mapW = A.MAP_W * s, mapH = A.MAP_H * s;
  const mx = side ? P + colW + 28 * u + ((cw - colW - 28 * u) - mapW) / 2 : (W - mapW) / 2;
  const regionTop = top + head + Z.gap;
  let free = bandTop - minBottom - regionTop - mapH - belowMap;

  /* ---------- labels: placed relative to the map's top edge, shifted down once the layout is final ---------- */
  const X = d => mx + d.c[0] * s, Y0 = d => d.c[1] * s;
  const home = (world && n && ids.length <= 25 && homeOf(A)) ? homeOf(A) : null; /* flight paths get too busy beyond ~25 */
  const obstacles = [];
  if(home) obstacles.push({ x: X(home) - 9 * u, y: Y0(home) - 9 * u, w: 18 * u, h: 18 * u });
  for(const d of A.DISTRICTS){ if(d.tiny && (A.vis(d.id) || A.wishv(d.id))) obstacles.push({ x: X(d) - 7 * u, y: Y0(d) - 7 * u, w: 14 * u, h: 14 * u }); }
  const sh = shades(A, ids);
  const fillOf = d => { if(A.vis(d.id)){ if(S.byDiv && A.DIV_COLORS && A.DIV_COLORS[d.div]) return A.DIV_COLORS[d.div]; return sh[d.id] ? K.brand2 : K.brand; } return A.wishv(d.id) ? K.wishFill : K.land; };
  const fs = Z.lab * (n > 28 ? .9 : 1);
  let placed = [], skipped = [];
  if(S.labelMode !== 'none'){
    const items = [];
    if(home && !A.vis('bd')) items.push({ id: 'bd', text: enName(A, home), ax: X(home), ay: Y0(home), tiny: true, w: 700, col: K.brandText });
    visited.forEach(d => items.push({ id: d.id, text: nameOf(d), ax: X(d), ay: Y0(d), tiny: !!d.tiny, w: 700, col: K.deep, v: true, d }));
    A.DISTRICTS.filter(d => !A.vis(d.id) && A.wishv(d.id)).sort((a, b) => b.a - a.a).forEach(d => items.push({ id: d.id, text: enName(A, d), ax: X(d), ay: Y0(d), tiny: !!d.tiny, w: 600, col: K.ink, d }));
    if(S.labelMode === 'all') A.DISTRICTS.filter(d => !A.vis(d.id) && !A.wishv(d.id)).sort((a, b) => b.a - a.a).forEach(d => items.push({ id: d.id, text: enName(A, d), ax: X(d), ay: Y0(d), tiny: !!d.tiny, w: 500, col: K.muted, d }));
    const bounds = { x0: Math.max(10 * u, mx - 14 * u, side ? P + colW + 6 * u : 0), y0: -16 * u, x1: Math.min(W - 10 * u, mx + mapW + 14 * u), y1: mapH + 12 * u };
    placed = placeLabels(c, A, items, { s, x: mx, y: 0 }, bounds, u, fs, obstacles);
    skipped = items.filter(it => it.skipped && it.v);
  }

  /* ---------- extras under the tagline row: country pills (post / story) or the names that did not fit ---------- */
  let pills = null, pillsH = 0, skipLine = false;
  const ph = Z.pill * 2.15, pg = 10 * u, padX = Z.pill * .8, pillTop = 30 * u;
  if(!side && n && fmt !== 'square' && (fmt === 'story' || n >= 4 || skipped.length)){
    const rowsFit = Math.floor((free - pillTop - 30 * u + pg) / (ph + pg));
    if(rowsFit >= 1){ pills = pillRows(c, F, BN, Z.pill, visited.map(d => ({ d, txt: nameOf(d), dot: Z.pill * .75 })), cw, pg, padX, Math.min(rowsFit, fmt === 'story' ? 6 : 3)); pillsH = pillTop + pills.length * (ph + pg) - pg; }
  }
  if(!pills && skipped.length && free > Z.row * 1.3){ skipLine = true; pillsH = Z.row * 1.3; }
  free -= pillsH;
  /* story: a card per continent / division when there is still room */
  let cards = null;
  if(fmt === 'story' && !side && useGroups && n){
    const cols = groups.length <= 6 ? 3 : 4, rowsN = Math.ceil(groups.length / cols), chH = 92 * u, cg = 12 * u, need = 32 * u + rowsN * (chH + cg) - cg;
    if(free - need > 8 * u){ cards = { cols, rowsN, chH, cg, top: 32 * u }; free -= need; }
  }
  const fr = Math.max(0, free);
  const my = regionTop + fr * (side ? .4 : .36);
  const gapMid = fr * (side ? 0 : .2);
  if(opts.recordXf) A.setXf({ s, x: mx, y: my });
  const Y = d => my + d.c[1] * s;

  /* ---------- background: airy tint with two soft glows ---------- */
  const g0 = c.createLinearGradient(0, 0, 0, H); g0.addColorStop(0, K.bg); g0.addColorStop(1, K.bg2);
  c.fillStyle = g0; c.fillRect(0, 0, W, H);
  const glow = (x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, alpha(col, a)); g.addColorStop(1, alpha(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); };
  glow(W * .92, H * .05, W * .55, K.brand2, K.dark ? .16 : .12); glow(W * .04, my + mapH * .6, W * .5, K.brand, K.dark ? .1 : .05);

  /* ---------- header: headline, logo, counter ---------- */
  let y = top;
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  hl.items.forEach((x, i) => { c.font = F(x.w, x.px); y += i === 0 ? x.px * .98 : x.px * x.lh; c.fillStyle = x.w === 700 ? K.deep : K.brandText; c.fillText(x.t, P, y - (i === 0 ? 0 : x.px * .04)); });
  drawLogo(c, A, W - P - Lw, top, Lw, Ls, K, u, opts, (S.name || '').trim());
  if(!side){ const by = counterRow ? top + Math.max(hl.h, Ls) + 30 * u + numCap : top + Ls + 18 * u + numCap; drawCounter(c, F, W - P, by, Z.num, BN(n), totStr, K, 'right', u); }

  /* ---------- map ---------- */
  c.save(); c.translate(mx, my); c.scale(s, s);
  if(CFG.shadow){ c.save(); c.shadowColor = alpha(K.deep, .16); c.shadowBlur = 28 * u; c.shadowOffsetY = 10 * u; c.fillStyle = K.land; c.fill(A.OUTLINE_PATH); c.restore(); }
  drawBase(c, A, K.land, K.line, (world ? .9 : 1.4) * u / s);
  for(const d of A.DISTRICTS){ c.fillStyle = fillOf(d); c.fill(A.PATHS[d.id]); }
  c.lineJoin = 'round'; c.lineWidth = (world ? .9 : 1.4) * u / s; c.strokeStyle = K.line; for(const d of A.DISTRICTS) c.stroke(A.PATHS[d.id]);
  c.save(); c.setLineDash([5 * u / s, 3.5 * u / s]); c.lineWidth = 1.6 * u / s; c.strokeStyle = K.wish; for(const d of A.DISTRICTS){ if(!A.vis(d.id) && A.wishv(d.id)) c.stroke(A.PATHS[d.id]); } c.restore();
  if(A.hover && opts.interactive && A.PATHS[A.hover]){ c.lineWidth = 3 * u / s; c.strokeStyle = K.deep; c.stroke(A.PATHS[A.hover]); }
  c.restore();

  /* flight paths from Bangladesh (world map) */
  if(home){
    const hx = X(home), hy = Y(home);
    c.save(); c.lineCap = 'round'; c.setLineDash([.1 * u, 5.5 * u]); c.lineWidth = 2.4 * u; c.strokeStyle = alpha(K.brandText, K.dark ? .65 : .5);
    for(const d of visited){ if(d.id === 'bd') continue; const tx = X(d), ty = Y(d); const dx = tx - hx, dy = ty - hy, L = Math.hypot(dx, dy); if(L < 18 * u) continue; const bend = Math.min(.3, 60 * u / L + .1) * L; let nx = -dy / L, ny = dx / L; if(ny > 0){ nx = -nx; ny = -ny; } c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(hx + dx / 2 + nx * bend, hy + dy / 2 + ny * bend, tx, ty); c.stroke(); }
    c.restore();
    c.beginPath(); c.arc(hx, hy, 15 * u, 0, Math.PI * 2); c.fillStyle = alpha(K.brand, .18); c.fill();
    c.beginPath(); c.arc(hx, hy, 7 * u, 0, Math.PI * 2); c.fillStyle = K.brandText; c.fill(); c.lineWidth = 2.5 * u; c.strokeStyle = '#FFFFFF'; c.stroke();
  }
  /* tiny units (islands, city states) as dots */
  for(const d of A.DISTRICTS){ if(!d.tiny) continue; const v = A.vis(d.id), wv = !v && A.wishv(d.id), hov = A.hover === d.id && opts.interactive; if(!v && !wv && S.labelMode !== 'all' && !hov) continue; const cx = X(d), cy = Y(d);
    c.beginPath(); c.arc(cx, cy, (v || wv ? 6.5 : 3.5) * u, 0, Math.PI * 2); c.fillStyle = v ? fillOf(d) : wv ? K.wishFill : K.land; c.fill(); c.lineWidth = 2 * u; c.strokeStyle = wv ? K.wish : '#FFFFFF'; c.stroke(); if(hov){ c.lineWidth = 3 * u; c.strokeStyle = K.deep; c.stroke(); } }
  /* labels: leaders first, then text (white inside a dark fill, halo outside) */
  for(const p of placed){ if(!p.box.lead) continue; const b = p.box; const ay = p.ay + my; const qx = clamp(p.ax, b.x, b.x + b.w), qy = clamp(ay, b.y + my, b.y + my + b.h); c.beginPath(); c.moveTo(p.ax, ay); c.lineTo(qx, qy); c.lineWidth = 1.3 * u; c.strokeStyle = alpha(K.deep, .42); c.stroke(); if(!p.tiny){ c.beginPath(); c.arc(p.ax, ay, 2.6 * u, 0, Math.PI * 2); c.fillStyle = K.deep; c.fill(); } }
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  for(const p of placed){ const b = p.box; c.font = F(p.w, fs); const tx = b.x + b.w / 2, ty = b.y + my + b.h / 2 + fs * .06;
    if(b.inside && p.d){ const f = fillOf(p.d); c.fillStyle = contrast('#FFFFFF', f) >= 2.8 ? '#FFFFFF' : K.deep; c.fillText(p.text, tx, ty); continue; }
    c.lineWidth = 4.2 * u; c.strokeStyle = alpha(K.bg, .92); c.strokeText(p.text, tx, ty); c.fillStyle = p.col; c.fillText(p.text, tx, ty); }

  /* ---------- side column: counter, caption, group list or names ---------- */
  if(side){
    const x0 = P; let yy = my + numCap;
    drawCounter(c, F, x0, yy, Z.num, BN(n), totStr, K, 'left', u);
    const K0 = A.KINDS && A.KINDS[S.kind]; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.font = F(600, Z.row * .82); c.fillStyle = K.ink;
    const cap = n && K0 && K0.foot ? K0.foot(n) : EN ? `Pick ${A.EU(2)} on the map` : `ম্যাপে ${U} বেছে নিন`;
    yy += Z.row * 1.45; wrap(c, cap, colW).slice(0, 2).forEach((l, i) => { if(i) yy += Z.row * 1.05; c.fillText(l, x0, yy); });
    if(useGroups && n){ yy += Z.row * .95; c.font = F(500, Z.row * .7); c.fillStyle = K.muted; c.fillText(groupsText(A, gotGroups), x0, yy); }
    const listBottom = my + mapH; yy += Z.row * 1.1;
    if(useGroups && S.showDiv !== false){
      const rows = groups.map(g => { const all = A.DISTRICTS.filter(d => d.div === g.id); return { g, tot: all.length, got: all.filter(d => A.vis(d.id)).length }; }).sort((a, b) => (b.got / b.tot - a.got / a.tot) || (b.got - a.got));
      const rh = clamp((listBottom - yy) / rows.length, 30 * u, 46 * u);
      for(const r of rows){ if(yy + rh > listBottom + 4 * u) break; const by = yy + rh * .52; c.font = F(r.got ? 600 : 500, Z.row * .7); c.fillStyle = r.got ? K.ink : K.muted; c.textAlign = 'left'; c.fillText(ellipsize(c, enName(A, r.g), colW * .62), x0, by); c.textAlign = 'right'; c.font = F(700, Z.row * .7); c.fillStyle = r.got ? K.brandText : K.muted; c.fillText(`${BN(r.got)}/${BN(r.tot)}`, x0 + colW, by);
        const bh = 5 * u, bby = by + 9 * u; rr(c, x0, bby, colW, bh, bh / 2); c.fillStyle = K.land; c.fill(); if(r.got){ rr(c, x0, bby, Math.max(bh, colW * r.got / r.tot), bh, bh / 2); c.fillStyle = K.brand; c.fill(); } yy += rh; }
      c.textAlign = 'left';
    } else if(n){
      const rh = 34 * u; let i = 0; c.textAlign = 'left';
      for(; i < visited.length; i++){ if(yy + rh * (i < visited.length - 1 ? 2 : 1) > listBottom + 4 * u) break; const d = visited[i], by = yy + rh * .6; c.beginPath(); c.arc(x0 + 6 * u, by - 6 * u, 5 * u, 0, Math.PI * 2); c.fillStyle = fillOf(d); c.fill(); c.fillStyle = K.ink; c.font = F(600, Z.row * .72); c.fillText(ellipsize(c, nameOf(d), colW - 22 * u), x0 + 20 * u, by); yy += rh; }
      if(i < visited.length){ c.font = F(600, Z.row * .68); c.fillStyle = K.muted; c.fillText(EN ? `+${visited.length - i} more` : `+${BN(visited.length - i)} আরও`, x0 + 20 * u, yy + rh * .6); }
    }
  }

  /* ---------- progress bar + tagline row ---------- */
  let yb = my + mapH + 22 * u;
  rr(c, P, yb, cw, barH, barH / 2); c.fillStyle = K.land; c.fill();
  if(n){ const fw = Math.max(barH, cw * Math.min(1, n / TOTAL)); const gb = c.createLinearGradient(P, 0, P + fw, 0); gb.addColorStop(0, K.brand); gb.addColorStop(1, K.brand2); rr(c, P, yb, fw, barH, barH / 2); c.fillStyle = gb; c.fill();
    c.beginPath(); c.arc(P + fw - barH / 2, yb + barH / 2, barH * .95, 0, Math.PI * 2); c.fillStyle = K.brandText; c.fill(); c.lineWidth = 2.5 * u; c.strokeStyle = '#FFFFFF'; c.stroke(); }
  yb += barH + 30 * u + Z.row * .85;
  const tagline = (S.tagline || '').trim() || C.tagline;
  const right = side ? wishTxt : (wishTxt ? `${stats} · ${wishTxt}` : stats);
  c.textBaseline = 'alphabetic';
  const rpx = right ? fit(c, F, 500, right, cw * .6, Z.row * .8, Z.row * .6) : 0; c.font = F(500, rpx || 10); const rw = right ? c.measureText(right).width : 0;
  const leftMax = cw - (rw ? rw + 26 * u : 0);
  fit(c, F, 700, tagline, leftMax, Z.row, Z.row * .72); c.fillStyle = K.deep; c.textAlign = 'left'; c.fillText(ellipsize(c, tagline, leftMax), P, yb);
  if(right){ c.font = F(500, rpx); c.fillStyle = K.muted; c.textAlign = 'right'; c.fillText(right, W - P, yb); }

  /* ---------- extras ---------- */
  let cardsY = yb + Z.row * .3 + gapMid + (cards ? cards.top : 0);
  if(pills){
    let py = yb + Z.row * .3 + gapMid + pillTop; c.textBaseline = 'middle'; c.textAlign = 'left';
    for(const row of pills){ let px = P; for(const p of row){ rr(c, px, py, p.w, ph, ph / 2);
        if(p.more){ c.fillStyle = K.land; c.fill(); c.fillStyle = K.ink; c.font = F(600, Z.pill); c.fillText(p.txt, px + padX, py + ph / 2 + 1 * u); }
        else { c.fillStyle = K.dark ? mixHex(K.brand, K.bg, .7) : mixHex(K.brand, '#FFFFFF', .88); c.fill(); c.beginPath(); c.arc(px + padX + p.dot * .3, py + ph / 2, Z.pill * .24, 0, Math.PI * 2); c.fillStyle = fillOf(p.d); c.fill(); c.fillStyle = K.brandText; c.font = F(600, Z.pill); c.fillText(p.txt, px + padX + p.dot, py + ph / 2 + 1 * u); }
        px += p.w + pg; }
      py += ph + pg; }
    if(cards) cardsY = py - pg + cards.top;
  } else if(skipLine){
    const nm = skipped.map(x => x.text); c.font = F(500, Z.row * .66); c.fillStyle = K.muted; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    const also = EN ? 'Also on the map: ' : 'ম্যাপে আরও: ';
    let k = nm.length, line = also + nm.join(', ');
    while(c.measureText(line).width > cw && k > 1){ k--; line = `${also}${nm.slice(0, k).join(', ')} +${BN(nm.length - k)}`; }
    c.fillText(line, P, yb + Z.row * 1.15 + gapMid);
  }

  if(cards){
    const cwc = (cw - (cards.cols - 1) * cards.cg) / cards.cols;
    groups.forEach((g, i) => { const all = A.DISTRICTS.filter(d => d.div === g.id), got = all.filter(d => A.vis(d.id)).length; const x = P + (i % cards.cols) * (cwc + cards.cg), y2 = cardsY + Math.floor(i / cards.cols) * (cards.chH + cards.cg);
      c.save(); c.shadowColor = alpha(K.deep, K.dark ? .25 : .06); c.shadowBlur = 18 * u; c.shadowOffsetY = 4 * u; rr(c, x, y2, cwc, cards.chH, 20 * u); c.fillStyle = K.band; c.fill(); c.restore();
      c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.font = F(600, 22 * u); c.fillStyle = got ? K.ink : K.muted; c.fillText(ellipsize(c, enName(A, g), cwc - 36 * u), x + 18 * u, y2 + 33 * u);
      c.font = F(700, 40 * u); c.fillStyle = got ? K.brandText : K.muted; c.fillText(BN(got), x + 18 * u, y2 + 74 * u); const gw = c.measureText(BN(got)).width; c.font = F(600, 19 * u); c.fillStyle = K.muted; c.fillText(CFG.map === 'bd' ? '/' + BN(all.length) : EN ? A.EU(got) : `টি ${U}`, x + 24 * u + gw, y2 + 74 * u);
      const bw = cwc * .34, bx = x + cwc - 18 * u - bw, byy = y2 + 64 * u; rr(c, bx, byy, bw, 7 * u, 3.5 * u); c.fillStyle = K.land; c.fill(); if(got){ rr(c, bx, byy, Math.max(7 * u, bw * got / all.length), 7 * u, 3.5 * u); c.fillStyle = K.brand; c.fill(); } });
  }

  /* ---------- bottom band: call to action with the firm's name + hashtag, then our credit ---------- */
  drawBand(c, A, W, H, u, Z, K, C, fmt, B);
}

function drawCounter(c, F, x, baseline, px, num, tot, K, align, u){
  c.textBaseline = 'alphabetic'; c.font = F(700, px); const nw = c.measureText(num).width; c.font = F(600, px * .34); const tw = c.measureText(tot).width;
  const x0 = align === 'right' ? x - tw - 8 * u - nw : x;
  c.textAlign = 'left'; c.font = F(700, px); c.fillStyle = K.brandText; c.fillText(num, x0, baseline);
  c.font = F(600, px * .34); c.fillStyle = K.muted; c.fillText(tot, x0 + nw + 8 * u, baseline);
}

function drawLogo(c, A, x, y, bw, s, K, u, opts, name){
  const img = A.photoImg, r = s * .18;
  if(img && img.width){
    const ct = logoContent(img);
    c.save(); c.shadowColor = alpha(K.deep, .14); c.shadowBlur = s * .14; c.shadowOffsetY = s * .05; c.fillStyle = '#FFFFFF'; A.rr(c, x, y, bw, s, r); c.fill(); c.restore();
    c.save(); A.rr(c, x, y, bw, s, r); c.clip(); const pad = s * .11; const sc = Math.min((bw - 2 * pad) / ct.sw, (s - 2 * pad) / ct.sh); const iw = ct.sw * sc, ih = ct.sh * sc; c.drawImage(img, ct.sx, ct.sy, ct.sw, ct.sh, x + (bw - iw) / 2, y + (s - ih) / 2, iw, ih); c.restore();
    c.save(); A.rr(c, x + .75 * u, y + .75 * u, bw - 1.5 * u, s - 1.5 * u, r); c.lineWidth = 1.5 * u; c.strokeStyle = alpha(K.deep, .08); c.stroke(); c.restore();
    return;
  }
  if(name){
    const ini = initials(name); if(!ini) return;
    c.save(); c.shadowColor = alpha(K.brand, .35); c.shadowBlur = s * .16; c.shadowOffsetY = s * .06; const g = c.createLinearGradient(x, y, x + s, y + s); g.addColorStop(0, K.brand2); g.addColorStop(1, K.brand); c.fillStyle = g; A.rr(c, x, y, s, s, r); c.fill(); c.restore();
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; const px = fit(c, A.F, 700, ini, s * .74, s * (ini.length > 2 ? .34 : .42), s * .2); c.font = A.F(700, px); c.fillText(ini, x + s / 2, y + s / 2 + px * .06);
    return;
  }
  if(opts.interactive){ /* preview only: a hint where the logo goes */
    c.save(); A.rr(c, x, y, s, s, r); c.fillStyle = alpha('#FFFFFF', K.dark ? .06 : .6); c.fill(); c.setLineDash([7 * u, 6 * u]); c.lineWidth = 2.5 * u; c.strokeStyle = alpha(K.muted, .6); c.stroke(); c.restore();
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = K.muted; c.font = A.F(500, s * .36); c.fillText('+', x + s / 2, y + s * .4); c.font = A.F(600, s * .14); c.fillText(EN ? 'Your logo' : 'আপনার লোগো', x + s / 2, y + s * .68);
  }
}

/* band metrics first (the band's height decides how much room the map gets) */
function measureBand(c, A, W, u, Z, C, fmt){
  const F = A.F, cw = W - 2 * Z.P;
  const aPx = fit(c, F, 600, C.bandA, cw, Z.bA, Z.bA * .62); c.font = F(600, aPx); const lineA = ellipsize(c, C.bandA, cw);
  let hPx = Z.tagPx; c.font = F(500, hPx); let hW = c.measureText(C.hashtag).width;
  if(hW > cw * .45){ hPx = fit(c, F, 500, C.hashtag, cw * .45, Z.tagPx, Z.tagPx * .72); c.font = F(500, hPx); hW = c.measureText(C.hashtag).width; }
  let hashtag = C.hashtag; if(hW > cw * .45){ hashtag = ellipsize(c, C.hashtag, cw * .45); hW = c.measureText(hashtag).width; }
  c.font = F(700, Z.bB); const bW = c.measureText(C.bandB).width;
  let bPx = Z.bB, ownRow = false;
  if(bW + 30 * u + hW > cw){ const want = (cw - 30 * u - hW) / bW * Z.bB; if(want >= Z.bB * .7) bPx = want; else { ownRow = true; bPx = fit(c, F, 700, C.bandB, cw, Z.bB, Z.bB * .6); } }
  const padT = (fmt === 'story' ? 46 : fmt === 'square' ? 26 : 34) * u, padB = (fmt === 'story' ? 34 : fmt === 'square' ? 20 : 28) * u;
  const credRow = badgeRow(fmt, u), lift = fmt === 'story' ? 34 * u : 0;
  const h = padT + aPx * .92 + bPx * 1.08 + bPx * .24 + (ownRow ? hPx * 1.7 : 0) + padB + credRow + lift;
  return { h, aPx, lineA, hPx, hashtag, bPx, ownRow, padT, credRow, lift };
}

function drawBand(c, A, W, H, u, Z, K, C, fmt, B){
  const F = A.F, P = Z.P, cw = W - 2 * P;
  const y0 = H - B.h;
  c.save(); c.shadowColor = alpha(K.deep, K.dark ? .3 : .07); c.shadowBlur = 30 * u; c.shadowOffsetY = -6 * u; c.fillStyle = K.band; c.fillRect(0, y0, W, B.h + 2); c.restore();
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  let yy = y0 + B.padT + B.aPx * .92; c.font = F(600, B.aPx); c.fillStyle = K.brandBand; c.fillText(B.lineA, P, yy);
  yy += B.bPx * 1.08; c.font = F(700, B.bPx); c.fillStyle = K.brandBand; c.fillText(C.bandB, P, yy);
  c.font = F(500, B.hPx); c.fillStyle = K.muted; c.textAlign = 'right';
  c.fillText(B.hashtag, W - P, B.ownRow ? yy + B.bPx * .24 + B.hPx * 1.4 : yy);
  /* our badge, always present */
  const lineY = H - B.credRow - B.lift;
  c.fillStyle = alpha(K.muted, .16); c.fillRect(P, lineY, cw, Math.max(1, 1.2 * u));
  drawBadge(c, A, W / 2, lineY + B.credRow / 2 + 2 * u, u, fmt);
}

function drawCredit(c, A, cx, cy, px, K){
  const F = A.F; const t1 = EN ? 'Ghure Dekha Bangladesh' : 'ঘুরে দেখা বাংলাদেশ', t2 = A.SITE_LABEL + (A.CFG.path || '');
  c.font = F(700, px); const w1 = c.measureText(t1).width; c.font = F(500, px); const sep = '  ·  '; const ws = c.measureText(sep).width, w2 = c.measureText(t2).width;
  const ld = A.LOGO_OK ? px * 1.5 : 0, lg = A.LOGO_OK ? px * .5 : 0; let x = cx - (ld + lg + w1 + ws + w2) / 2;
  c.save(); c.globalAlpha = .85;
  if(A.LOGO_OK){ c.drawImage(A.LOGO, x, cy - ld / 2, ld, ld); x += ld + lg; }
  c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = K.muted;
  c.font = F(700, px); c.fillText(t1, x, cy + px * .08); x += w1;
  c.font = F(500, px); c.fillText(sep + t2, x, cy + px * .08);
  c.restore();
}

LAYOUTS.headline = headline;
/* building blocks for the other designs (/biz-formats.js) */
LAYOUTS._kit = { clamp, graphemes, hex6, rgbOf, toHex, mixHex, alpha, relLum, contrast, readable, rgb2hsl, hsl2hex, palette, genitive, copyFor, initials,
  bboxes, shades, logoContent, logoBoxW, fit, ellipsize, wrap, layoutHeadline, pillRows, placeLabels, drawCounter, drawLogo, drawBadge, badgeRow, BADGE_K,
  homeOf, counterSuffix, groupsText, drawBase, scratch, useLang, en: () => EN, enName, PAGE_EN };
/* the editor panel shows these as placeholders */
headline.defaults = A => copyFor(A);
headline.label = PAGE_EN ? 'Headline' : 'হেডলাইন';
})();

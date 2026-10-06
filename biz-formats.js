/* ঘুরে দেখা বাংলাদেশ: more poster designs for the business / study-abroad map makers.
   Same inputs as the "headline" design (name, logo, hook, tagline, countries, counts, colour); only the look changes,
   so a user can swipe through the designs and keep their text. Built on the kit that /biz-layouts.js exports.
   Every design draws the whole poster in poster units (1080 x 1350 post, 1080 x 1080 square, 1080 x 1920 story). */
(function(){
'use strict';
const LAYOUTS = window.GDB_LAYOUTS = window.GDB_LAYOUTS || {};
const KIT = LAYOUTS._kit; if(!KIT) return;
const { clamp, mixHex, alpha, contrast, palette, copyFor, fit, ellipsize, wrap, layoutHeadline, pillRows, placeLabels,
        drawLogo, drawCounter, drawBadge, badgeRow, homeOf, counterSuffix, groupsText, drawBase, logoBoxW, shades, useLang, enName, PAGE_EN } = KIT;

/* ---------- flags: PNG copies of /flags/*.svg so every browser can draw them on a canvas ---------- */
const FL = {}; let rt = 0;
function rerender(){ clearTimeout(rt); rt = setTimeout(() => { const G = window.__gdb; if(G && G.requestRender) G.requestRender(); }, 40); }
function flag(id){ let f = FL[id]; if(f) return f; f = FL[id] = { img: new Image(), ok: false };
  f.p = new Promise(res => { f.img.onload = () => { f.ok = true; res(); rerender(); }; f.img.onerror = () => res(); });
  f.img.src = '/flags-png/' + id + '.png'; return f; }
const flagImg = id => { const f = flag(id); return f.ok ? f.img : null; };
function flagsReady(A){ return Promise.all(A.DISTRICTS.filter(d => A.vis(d.id)).map(d => flag(d.id).p)); }

/* ---------- small helpers ---------- */
function rng(seed){ return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function fmtOf(W, H){ const r = H / W; return r > 1.6 ? 'story' : r < 1.1 ? 'square' : 'post'; }
function setup(W, H, A){
  useLang(A); const S = A.state, CFG = A.CFG, u = W / 1080, fmt = fmtOf(W, H), K = palette(A), C = copyFor(A);
  const counts = S.counts || {}, cnt = id => +counts[id] || 0;
  const visited = A.DISTRICTS.filter(d => A.vis(d.id)).sort((a, b) => (cnt(b.id) - cnt(a.id)) || (b.a - a.a));
  return { W, H, S, CFG, u, fmt, K, C, cnt, visited, n: S.selected.size, world: CFG.map === 'world', F: A.F, BN: A.NUM || A.BN, U: A.U, EN: KIT.en(), nameOf: d => enName(A, d),
    hook: (S.hook || '').trim() || C.hook, tagline: (S.tagline || '').trim() || C.tagline, name: (S.name || '').trim() };
}
const label = (b, d) => b.nameOf(d) + (b.cnt(d.id) ? ` ${b.BN(b.cnt(d.id))}+` : '');
const hasLogo = (A, b, opts) => !!(A.photoImg && A.photoImg.width) || !!b.name || !!opts.interactive;
function fitMap(A, x, y, w, h){ const s = Math.max(.01, Math.min(w / A.MAP_W, h / A.MAP_H)); return { s, x: x + (w - A.MAP_W * s) / 2, y: y + (h - A.MAP_H * s) / 2, w: A.MAP_W * s, h: A.MAP_H * s }; }
function shadow(c, col, blur, oy, B){ c.shadowColor = col; c.shadowBlur = blur * B; c.shadowOffsetX = 0; c.shadowOffsetY = (oy || 0) * B; }
/* hook lines, aligned left / centre / right; returns the y under the block */
function drawHook(c, F, hl, x, y, align, colSmall, colBig){
  c.textAlign = align; c.textBaseline = 'alphabetic';
  hl.items.forEach((it, i) => { c.font = F(it.w, it.px); y += i === 0 ? it.px * .98 : it.px * it.lh; c.fillStyle = it.w === 700 ? colBig : colSmall; c.fillText(it.t, x, y - (i === 0 ? 0 : it.px * .04)); });
  return y;
}
/* big number + small suffix, as one centred / aligned group */
function counterGroup(c, F, x, baseline, px, num, suf, colNum, colSuf, align, u){
  c.textBaseline = 'alphabetic'; c.font = F(700, px); const nw = c.measureText(num).width; c.font = F(600, px * .3); const sw = c.measureText(suf).width; const gap = 10 * u;
  const tw = nw + gap + sw, x0 = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x;
  c.textAlign = 'left'; c.font = F(700, px); c.fillStyle = colNum; c.fillText(num, x0, baseline);
  c.font = F(600, px * .3); c.fillStyle = colSuf; c.fillText(suf, x0 + nw + gap, baseline);
  return tw;
}
/* the map itself: plain land, unselected units, selected units (optionally glowing), wish outlines, hover */
function drawMap(c, A, m, u, B, opts, st){
  c.save(); c.translate(m.x, m.y); c.scale(m.s, m.s);
  const lw = st.lw * u / m.s;
  drawBase(c, A, st.land, st.line, lw);
  for(const d of A.DISTRICTS){ if(A.vis(d.id)) continue; c.fillStyle = A.wishv(d.id) ? st.wishFill : st.land; c.fill(A.PATHS[d.id]); }
  c.lineJoin = 'round'; c.lineWidth = lw; c.strokeStyle = st.line; for(const d of A.DISTRICTS){ if(!A.vis(d.id)) c.stroke(A.PATHS[d.id]); }
  if(st.glow){ c.save(); shadow(c, st.glow, st.glowBlur * u, 0, B); for(const d of A.DISTRICTS){ if(A.vis(d.id)){ c.fillStyle = st.fill(d); c.fill(A.PATHS[d.id]); } } c.restore(); }
  for(const d of A.DISTRICTS){ if(A.vis(d.id)){ c.fillStyle = st.fill(d); c.fill(A.PATHS[d.id]); } }
  c.lineWidth = (st.selLw || st.lw) * u / m.s; c.strokeStyle = st.selLine || st.line; for(const d of A.DISTRICTS){ if(A.vis(d.id)) c.stroke(A.PATHS[d.id]); }
  c.save(); c.setLineDash([5 * u / m.s, 3.5 * u / m.s]); c.lineWidth = 1.6 * u / m.s; c.strokeStyle = st.wish; for(const d of A.DISTRICTS){ if(!A.vis(d.id) && A.wishv(d.id)) c.stroke(A.PATHS[d.id]); } c.restore();
  if(A.hover && opts.interactive && A.PATHS[A.hover]){ c.lineWidth = 3 * u / m.s; c.strokeStyle = st.hover; c.stroke(A.PATHS[A.hover]); }
  c.restore();
  /* islands and city states as dots */
  for(const d of A.DISTRICTS){ if(!d.tiny) continue; const v = A.vis(d.id), wv = !v && A.wishv(d.id), hov = A.hover === d.id && opts.interactive; if(!v && !wv && !hov) continue;
    const x = m.x + d.c[0] * m.s, y = m.y + d.c[1] * m.s; c.beginPath(); c.arc(x, y, (v || wv ? 6.5 : 4) * u, 0, Math.PI * 2); c.fillStyle = v ? st.fill(d) : wv ? st.wishFill : st.land; c.fill(); c.lineWidth = 2 * u; c.strokeStyle = wv ? st.wish : st.dotRing; c.stroke(); if(hov){ c.lineWidth = 3 * u; c.strokeStyle = st.hover; c.stroke(); } }
}
/* curved routes from Bangladesh */
function drawRoutes(c, A, m, u, B, visited, st){
  const home = homeOf(A); if(!home || !visited.length) return null;
  const hx = m.x + home.c[0] * m.s, hy = m.y + home.c[1] * m.s;
  c.save(); c.lineCap = 'round';
  if(st.dash) c.setLineDash(st.dash.map(v => v * u));
  if(st.glow) shadow(c, st.glow, st.glowBlur * u, 0, B);
  for(const d of visited){ if(d.id === 'bd') continue; const tx = m.x + d.c[0] * m.s, ty = m.y + d.c[1] * m.s; const dx = tx - hx, dy = ty - hy, Lh = Math.hypot(dx, dy); if(Lh < 16 * u) continue;
    const bend = Math.min(.32, 60 * u / Lh + .1) * Lh; let nx = -dy / Lh, ny = dx / Lh; if(ny > 0){ nx = -nx; ny = -ny; }
    const g = c.createLinearGradient(hx, hy, tx, ty); g.addColorStop(0, st.from); g.addColorStop(1, st.to); c.strokeStyle = g; c.lineWidth = st.lw * u;
    c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(hx + dx / 2 + nx * bend, hy + dy / 2 + ny * bend, tx, ty); c.stroke(); }
  c.restore();
  return { x: hx, y: hy, home };
}
function homeDot(c, x, y, u, inner, ring, halo){
  c.beginPath(); c.arc(x, y, 16 * u, 0, Math.PI * 2); c.fillStyle = halo; c.fill();
  c.beginPath(); c.arc(x, y, 7.5 * u, 0, Math.PI * 2); c.fillStyle = inner; c.fill(); c.lineWidth = 2.6 * u; c.strokeStyle = ring; c.stroke();
}
/* names on the map (visited units first); returns the units that did not fit */
function mapLabels(c, A, b, m, fs, colIn, colOut, halo, extra){
  const items = [];
  (extra || []).forEach(x => items.push(x));
  b.visited.forEach(d => items.push({ id: d.id, text: label(b, d), ax: m.x + d.c[0] * m.s, ay: d.c[1] * m.s, tiny: !!d.tiny, w: 700, col: colOut, v: true, d }));
  const bounds = { x0: Math.max(10 * b.u, m.x - 14 * b.u), y0: -16 * b.u, x1: Math.min(b.W - 10 * b.u, m.x + m.w + 14 * b.u), y1: m.h + 12 * b.u };
  const obstacles = [];
  const home = homeOf(A); if(home && b.world) obstacles.push({ x: m.x + home.c[0] * m.s - 9 * b.u, y: home.c[1] * m.s - 9 * b.u, w: 18 * b.u, h: 18 * b.u });
  const placed = placeLabels(c, A, items, { s: m.s, x: m.x, y: 0 }, bounds, b.u, fs, obstacles);
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  for(const p of placed){ if(!p.box.lead) continue; const bx = p.box; const ay = p.ay + m.y; const qx = clamp(p.ax, bx.x, bx.x + bx.w), qy = clamp(ay, bx.y + m.y, bx.y + m.y + bx.h); c.beginPath(); c.moveTo(p.ax, ay); c.lineTo(qx, qy); c.lineWidth = 1.3 * b.u; c.strokeStyle = alpha(colOut, .45); c.stroke(); }
  for(const p of placed){ const bx = p.box; c.font = b.F(p.w, fs); const tx = bx.x + bx.w / 2, ty = bx.y + m.y + bx.h / 2 + fs * .06;
    if(bx.inside && p.v){ c.fillStyle = colIn(p.d); c.fillText(p.text, tx, ty); continue; }
    c.lineWidth = 4.2 * b.u; c.strokeStyle = halo; c.strokeText(p.text, tx, ty); c.fillStyle = p.col || colOut; c.fillText(p.text, tx, ty); }
  return items.filter(it => it.skipped && it.v);
}
/* a round flag (cover-cropped) with a white ring */
function roundFlag(c, id, x, y, r, u, B, ring, sh){
  const img = flagImg(id);
  c.save(); if(sh) shadow(c, 'rgba(10,20,40,.28)', 10 * u, 3 * u, B); c.beginPath(); c.arc(x, y, r + ring, 0, Math.PI * 2); c.fillStyle = '#FFFFFF'; c.fill(); c.restore();
  c.save(); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.clip();
  if(img){ const ih = 2 * r, iw = ih * img.width / img.height; c.drawImage(img, x - iw / 2, y - r, iw, ih); } else { c.fillStyle = '#DDE3EA'; c.fillRect(x - r, y - r, 2 * r, 2 * r); }
  c.restore();
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.lineWidth = Math.max(1, .8 * u); c.strokeStyle = 'rgba(0,0,0,.12)'; c.stroke();
}
/* a rectangular flag with rounded corners */
function rectFlag(c, id, x, y, w, h, r, u){
  const img = flagImg(id);
  c.save(); KIT_rr(c, x, y, w, h, r); c.clip();
  if(img){ const sc = Math.max(w / img.width, h / img.height), iw = img.width * sc, ih = img.height * sc; c.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); } else { c.fillStyle = '#DDE3EA'; c.fillRect(x, y, w, h); }
  c.restore(); KIT_rr(c, x + .5 * u, y + .5 * u, w - u, h - u, r); c.lineWidth = Math.max(1, .9 * u); c.strokeStyle = 'rgba(0,0,0,.14)'; c.stroke();
}
let KIT_rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
/* graduation cap icon */
function drawCap(c, x, y, s, col, col2){
  c.save(); c.lineJoin = 'round';
  c.beginPath(); c.moveTo(x - s * .3, y + s * .06); c.lineTo(x - s * .3, y + s * .3); c.quadraticCurveTo(x, y + s * .46, x + s * .3, y + s * .3); c.lineTo(x + s * .3, y + s * .06); c.closePath(); c.fillStyle = col2; c.fill();
  c.beginPath(); c.moveTo(x, y - s * .3); c.lineTo(x + s * .54, y - s * .04); c.lineTo(x, y + s * .22); c.lineTo(x - s * .54, y - s * .04); c.closePath(); c.fillStyle = col; c.fill();
  c.beginPath(); c.moveTo(x, y - s * .04); c.lineTo(x + s * .44, y + s * .06); c.lineTo(x + s * .44, y + s * .36); c.lineWidth = s * .045; c.strokeStyle = col; c.stroke();
  c.beginPath(); c.arc(x + s * .44, y + s * .4, s * .055, 0, Math.PI * 2); c.fillStyle = col; c.fill();
  c.restore();
}
/* plane icon (for visa, tour, job and other non-study maps) */
function drawPlane(c, x, y, s, col){
  c.save(); c.translate(x, y); c.rotate(-Math.PI / 4); c.scale(s / 100, s / 100); c.beginPath();
  c.moveTo(0, -46); c.bezierCurveTo(6, -46, 8, -38, 8, -30); c.lineTo(8, -12); c.lineTo(46, 10); c.lineTo(46, 20); c.lineTo(8, 8); c.lineTo(8, 30); c.lineTo(20, 40); c.lineTo(20, 47); c.lineTo(0, 41);
  c.lineTo(-20, 47); c.lineTo(-20, 40); c.lineTo(-8, 30); c.lineTo(-8, 8); c.lineTo(-46, 20); c.lineTo(-46, 10); c.lineTo(-8, -12); c.lineTo(-8, -30); c.bezierCurveTo(-8, -38, -6, -46, 0, -46); c.closePath();
  c.fillStyle = col; c.fill(); c.restore();
}
/* four-point sparkle */
function sparkle(c, x, y, r, col){ c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.closePath(); c.fillStyle = col; c.fill(); }
/* CTA + hashtag in one centred block (used by the dream and campus designs) */
function ctaBlock(c, b, x, y, maxW, pa, pb, colA, colB, colH, center){
  const F = b.F, C = b.C; c.textBaseline = 'alphabetic'; c.textAlign = center ? 'center' : 'left';
  const aPx = fit(c, F, 600, C.bandA, maxW, pa, pa * .62); c.font = F(600, aPx); y += aPx * .95; c.fillStyle = colA; c.fillText(ellipsize(c, C.bandA, maxW), x, y);
  const bPx = fit(c, F, 700, C.bandB, maxW, pb, pb * .6); c.font = F(700, bPx); y += bPx * 1.05; c.fillStyle = colB; c.fillText(C.bandB, x, y);
  const hPx = fit(c, F, 500, C.hashtag, maxW, pa * .82, pa * .6); c.font = F(500, hPx); y += hPx * 1.55; c.fillStyle = colH; c.fillText(ellipsize(c, C.hashtag, maxW), x, y);
  return y + hPx * .35;
}
function ctaHeight(c, b, maxW, pa, pb){ const F = b.F, C = b.C; const aPx = fit(c, F, 600, C.bandA, maxW, pa, pa * .62), bPx = fit(c, F, 700, C.bandB, maxW, pb, pb * .6), hPx = fit(c, F, 500, C.hashtag, maxW, pa * .82, pa * .6); return aPx * .95 + bPx * 1.05 + hPx * 1.9; }

/* =====================================================================================
   1. বড় স্বপ্ন: night sky, gold countries, glowing routes (premium, centred)
   ===================================================================================== */
function dream(c, W, H, opts, A){
  opts = opts || {}; const B = opts.base || 1; const b = setup(W, H, A); const { u, fmt, F, BN, n } = b;
  const Z = { post:   { P: 64, top: 62, logo: 108, h2: 92, h2min: 50, num: 128, row: 29, bA: 27, bB: 64, gap: 24, lab: 16 },
              square: { P: 52, top: 40, logo: 84, h2: 72, h2min: 42, num: 98, row: 24, bA: 22, bB: 50, gap: 14, lab: 14 },
              story:  { P: 72, top: 150, logo: 136, h2: 108, h2min: 58, num: 168, row: 34, bA: 32, bB: 78, gap: 38, lab: 19 } }[fmt];
  for(const k in Z) Z[k] *= u;
  const P = Z.P, cw = W - 2 * P;
  const GOLD = '#F5C95A', GOLD2 = '#E09A2E', SOFT = '#C3CCEB', LAND = '#1D2C5C', LINE = '#2D3F78', INK = '#FFFFFF';
  const KD = { dark: true, deep: '#0B1636', brand: GOLD2, brand2: GOLD, muted: SOFT };
  /* background: deep night with a glow behind the map */
  const g = c.createRadialGradient(W * .5, H * .44, 0, W * .5, H * .44, Math.max(W, H) * .8); g.addColorStop(0, '#1A2D63'); g.addColorStop(.5, '#0C1738'); g.addColorStop(1, '#050918');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const R = rng(11 + Math.round(W + H)); for(let i = 0; i < 230; i++){ const x = R() * W, y = R() * H, r = (R() * R() * 2.1 + .45) * u, a = .14 + R() * .55; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`; c.fill(); }
  for(let i = 0; i < 9; i++){ const x = R() * W, y = R() * H * .9, r = (6 + R() * 9) * u; sparkle(c, x, y, r, `rgba(255,236,190,${(.35 + R() * .4).toFixed(3)})`); }

  /* measure the vertical stack */
  const showLogo = hasLogo(A, b, opts), Ls = Z.logo, Lw = logoBoxW(A, Ls);
  const hl = layoutHeadline(c, F, b.hook, cw, Z.h2, Z.h2min, u, Z.h2 * 2.6);
  const ctaH = ctaHeight(c, b, cw, Z.bA, Z.bB), badgeH = badgeRow(fmt, u);
  const countH = Z.num * .78, tagH = Z.row * 1.6;
  const fixed = Z.top + (showLogo ? Ls + Z.gap : 0) + hl.h + Z.gap * 1.3 + Z.gap + countH + tagH + Z.gap * 1.2 + ctaH + badgeH + 8 * u;
  const mapBox = Math.max(60 * u, H - fixed);
  const m0 = fitMap(A, 24 * u, 0, W - 48 * u, mapBox);
  const spare = Math.max(0, mapBox - m0.h);
  let y = Z.top + spare * .12;
  if(showLogo){ drawLogo(c, A, (W - Lw) / 2, y, Lw, Ls, KD, u, opts, b.name); y += Ls + Z.gap; }
  y = drawHook(c, F, hl, W / 2, y, 'center', GOLD, INK);
  y += Z.gap * 1.3 + spare * .3;
  const m = { s: m0.s, x: m0.x, y, w: m0.w, h: m0.h };
  if(opts.recordXf) A.setXf({ s: m.s, x: m.x, y: m.y });

  /* map: gold countries glowing over a night-blue world */
  const gm = c.createLinearGradient(m.x, m.y, m.x + m.w, m.y + m.h); gm.addColorStop(0, GOLD); gm.addColorStop(1, GOLD2);
  drawMap(c, A, m, u, B, opts, { land: LAND, line: LINE, lw: .8, fill: () => gm, glow: 'rgba(245,201,90,.65)', glowBlur: 16, selLine: 'rgba(255,240,200,.6)', selLw: .7,
    wish: GOLD, wishFill: mixHex(LAND, GOLD, .22), hover: '#FFFFFF', dotRing: '#0B1636' });
  const rt0 = b.world && n && n <= 30 ? drawRoutes(c, A, m, u, B, b.visited, { from: 'rgba(255,236,190,.15)', to: 'rgba(245,201,90,.95)', lw: 2.4, glow: 'rgba(245,201,90,.7)', glowBlur: 8 }) : null;
  if(rt0) homeDot(c, rt0.x, rt0.y, u, '#FFFFFF', GOLD, 'rgba(245,201,90,.25)');
  const homeLbl = rt0 && !A.vis('bd') ? [{ id: 'bd', text: b.nameOf(rt0.home), ax: rt0.x, ay: rt0.y - m.y, tiny: true, w: 700, col: GOLD }] : [];
  if(A.state.labelMode !== 'none') mapLabels(c, A, b, m, Z.lab * (n > 24 ? .9 : 1), () => '#3A2A05', '#FFFFFF', 'rgba(8,14,36,.9)', homeLbl);

  /* count + tagline */
  y = m.y + m.h + Z.gap + spare * .2 + countH;
  counterGroup(c, F, W / 2, y, Z.num, BN(n), counterSuffix(A), GOLD, INK, 'center', u);
  c.textAlign = 'center'; c.font = F(600, fit(c, F, 600, b.tagline, cw, Z.row, Z.row * .7)); c.fillStyle = SOFT; y += tagH * .8; c.fillText(ellipsize(c, b.tagline, cw), W / 2, y);
  /* call to action + badge */
  y += Z.gap * 1.2 + spare * .25 - Z.row * .2;
  const gb = c.createLinearGradient(0, y, 0, y + Z.bB * 1.6); gb.addColorStop(0, '#FFE39A'); gb.addColorStop(1, GOLD2);
  ctaBlock(c, b, W / 2, y, cw, Z.bA, Z.bB, SOFT, gb, alpha(SOFT, .8), true);
  drawBadge(c, A, W / 2, H - badgeH / 2 - (fmt === 'story' ? 30 * u : 4 * u), u, fmt);
}
dream.label = PAGE_EN ? 'Big dream' : 'বড় স্বপ্ন'; dream.sub = PAGE_EN ? 'Golden countries on a night sky' : 'রাতের আকাশে সোনালি দেশ';
dream.defaults = A => copyFor(A);

/* =====================================================================================
   2. পৃথিবী জুড়ে: flags pinned on their countries, routes from Bangladesh, brand-colour footer
   ===================================================================================== */
function relaxPins(pins, r, gap, bounds){
  for(let it = 0; it < 180; it++){
    for(let i = 0; i < pins.length; i++) for(let j = i + 1; j < pins.length; j++){
      const a = pins[i], q = pins[j]; let dx = q.x - a.x, dy = q.y - a.y, d = Math.hypot(dx, dy); const min = 2 * r + gap;
      if(d >= min) continue; if(d < .01){ dx = (j - i) % 2 ? 1 : -1; dy = .4; d = Math.hypot(dx, dy); }
      const push = (min - d) / 2, ux = dx / d, uy = dy / d; a.x -= ux * push; a.y -= uy * push; q.x += ux * push; q.y += uy * push;
    }
    for(const p of pins){ p.x += (p.x0 - p.x) * .05; p.y += (p.y0 - p.y) * .05; p.x = clamp(p.x, bounds.x0 + r, bounds.x1 - r); p.y = clamp(p.y, bounds.y0 + r, bounds.y1 - r); }
  }
  return pins;
}
function globe(c, W, H, opts, A){
  opts = opts || {}; const B = opts.base || 1; const b = setup(W, H, A); const { u, fmt, F, BN, n, K } = b;
  const Z = { post:   { P: 60, top: 60, logo: 124, num: 108, h2: 88, h2min: 48, row: 27, gap: 20, pill: 19, bA: 26, bB: 60, lab: 15 },
              square: { P: 50, top: 44, logo: 96, num: 86, h2: 70, h2min: 40, row: 23, gap: 12, pill: 17, bA: 22, bB: 48, lab: 13 },
              story:  { P: 70, top: 140, logo: 150, num: 140, h2: 104, h2min: 56, row: 32, gap: 32, pill: 24, bA: 31, bB: 74, lab: 18 } }[fmt];
  for(const k in Z) Z[k] *= u;
  const P = Z.P, cw = W - 2 * P;
  /* background */
  const g0 = c.createLinearGradient(0, 0, 0, H); g0.addColorStop(0, K.bg); g0.addColorStop(1, K.bg2); c.fillStyle = g0; c.fillRect(0, 0, W, H);
  const glow = (x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, alpha(col, a)); g.addColorStop(1, alpha(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); };
  glow(W * .85, H * .1, W * .6, K.brand2, K.dark ? .16 : .12); glow(W * .1, H * .55, W * .55, K.brand, K.dark ? .1 : .06);
  /* header: hook left, logo + counter right */
  const showLogo = hasLogo(A, b, opts), Ls = Z.logo, Lw = showLogo ? logoBoxW(A, Ls) : 0;
  c.font = F(700, Z.num); const numCap = Z.num * .72; c.font = F(600, Z.num * .3); const sufW = c.measureText(counterSuffix(A)).width; c.font = F(700, Z.num); const cntW = c.measureText(BN(Math.max(n, 10))).width + 10 * u + sufW;
  const rightW = Math.max(Lw, cntW);
  const hl = layoutHeadline(c, F, b.hook, cw - rightW - 30 * u, Z.h2, Z.h2min, u, (showLogo ? Ls + 18 * u : 0) + numCap + 20 * u);
  const headH = Math.max(hl.h, (showLogo ? Ls + 18 * u : 0) + numCap);
  /* footer band */
  const badgeH = badgeRow(fmt, u);
  const bandPadT = (fmt === 'story' ? 40 : fmt === 'square' ? 22 : 30) * u;
  const C = b.C;
  const aPx = fit(c, F, 600, C.bandA, cw, Z.bA, Z.bA * .62); c.font = F(500, Z.row * .82); const hashW = Math.min(cw * .42, c.measureText(C.hashtag).width);
  const bPx = fit(c, F, 700, C.bandB, cw - hashW - 24 * u, Z.bB, Z.bB * .58);
  const bandH = bandPadT + aPx * .95 + bPx * 1.1 + 18 * u + badgeH + (fmt === 'story' ? 26 * u : 0);
  const bandTop = H - bandH;
  /* pills under the map */
  const ph = Z.pill * 2.2, pg = 10 * u, padX = Z.pill * .8;
  const pills = n ? pillRows(c, F, BN, Z.pill, b.visited.map(d => ({ d, txt: label(b, d), dot: Z.pill * 1.45 })), cw, pg, padX, fmt === 'story' ? 4 : fmt === 'square' ? 1 : 2) : [];
  const pillsH = pills.length ? pills.length * (ph + pg) - pg : 0;
  const tagH = Z.row * 1.4;
  /* map gets the rest */
  const top = Z.top, regionTop = top + headH + Z.gap;
  const below = Z.gap * .8 + tagH + (pillsH ? Z.gap * .6 + pillsH : 0) + Z.gap;
  const mapBox = Math.max(60 * u, bandTop - regionTop - below);
  const m0 = fitMap(A, 18 * u, 0, W - 36 * u, mapBox), spare = Math.max(0, mapBox - m0.h);
  const m = { s: m0.s, x: m0.x, y: regionTop + spare * .42 + 6 * u, w: m0.w, h: m0.h };
  if(opts.recordXf) A.setXf({ s: m.s, x: m.x, y: m.y });

  /* header */
  drawHook(c, F, hl, P, top, 'left', K.brandText, K.deep);
  if(showLogo) drawLogo(c, A, W - P - Lw, top, Lw, Ls, K, u, opts, b.name);
  drawCounter(c, F, W - P, top + (showLogo ? Ls + 18 * u : 0) + numCap, Z.num, BN(n), counterSuffix(A), K, 'right', u);

  /* map */
  const sh = shades(A, b.visited.map(d => d.id));
  const fillOf = d => (A.state.byDiv && A.DIV_COLORS && A.DIV_COLORS[d.div]) ? A.DIV_COLORS[d.div] : (sh[d.id] ? K.brand2 : K.brand);
  drawMap(c, A, m, u, B, opts, { land: K.land, line: K.line, lw: .9, fill: fillOf, wish: K.wish, wishFill: K.wishFill, hover: K.deep, dotRing: '#FFFFFF' });
  const rt0 = (b.world && n) ? drawRoutes(c, A, m, u, B, b.visited, { from: alpha(K.brandText, .2), to: alpha(K.brandText, .85), lw: 2.4 }) : null;
  if(rt0) homeDot(c, rt0.x, rt0.y, u, K.brandText, '#FFFFFF', alpha(K.brand, .2));
  /* flag pins (world maps): the biggest / highest-count countries first, up to 24 */
  if(b.world && n){
    const list = b.visited.slice(0, 24), r = (list.length <= 6 ? 30 : list.length <= 12 ? 25 : list.length <= 18 ? 21 : 18) * u * (fmt === 'story' ? 1.12 : fmt === 'square' ? .88 : 1);
    const pins = list.map(d => { const ax = m.x + d.c[0] * m.s, ay = m.y + d.c[1] * m.s; return { d, ax, ay, x: ax, y: ay - r - 14 * u, x0: ax, y0: ay - r - 14 * u }; });
    relaxPins(pins, r, 7 * u, { x0: m.x - 10 * u, x1: m.x + m.w + 10 * u, y0: m.y - r - 30 * u, y1: m.y + m.h + 10 * u });
    for(const p of pins){ c.beginPath(); c.arc(p.ax, p.ay, 4.2 * u, 0, Math.PI * 2); c.fillStyle = K.deep; c.fill(); c.lineWidth = 1.8 * u; c.strokeStyle = '#FFFFFF'; c.stroke(); }
    for(const p of pins){ const dx = p.ax - p.x, dy = p.ay - p.y, d = Math.hypot(dx, dy); if(d <= r + 2 * u) continue; c.beginPath(); c.moveTo(p.x + dx / d * (r + 2 * u), p.y + dy / d * (r + 2 * u)); c.lineTo(p.ax, p.ay); c.lineWidth = 2 * u; c.strokeStyle = alpha(K.deep, .55); c.stroke(); }
    pins.sort((a, q) => a.y - q.y).forEach(p => roundFlag(c, p.d.id, p.x, p.y, r, u, B, 3.6 * u, true));
  } else if(A.state.labelMode !== 'none'){ mapLabels(c, A, b, m, Z.lab, d => contrast('#FFFFFF', fillOf(d)) >= 2.8 ? '#FFFFFF' : K.deep, K.deep, alpha(K.bg, .92)); }

  /* tagline row + pills */
  let y = m.y + m.h + Z.gap * .8 + Z.row + spare * .28;
  const gtxt = (A.DIVISIONS || []).length >= 2 ? ` · ${groupsText(A, (A.DIVISIONS || []).filter(gq => b.visited.some(d => d.div === gq.id)).length)}` : '';
  const stats = b.EN ? (n ? `${n} ${A.EU(n)}` + gtxt : `Pick ${A.EU(2)} on the map`) : n ? `${BN(n)}টি ${b.U}` + gtxt : `ম্যাপে ${b.U} বেছে নিন`;
  c.textBaseline = 'alphabetic'; const rpx = fit(c, F, 500, stats, cw * .5, Z.row * .8, Z.row * .6); c.font = F(500, rpx); const rw = c.measureText(stats).width;
  fit(c, F, 700, b.tagline, cw - rw - 26 * u, Z.row, Z.row * .7); c.fillStyle = K.deep; c.textAlign = 'left'; c.fillText(ellipsize(c, b.tagline, cw - rw - 26 * u), P, y);
  c.font = F(500, rpx); c.fillStyle = K.muted; c.textAlign = 'right'; c.fillText(stats, W - P, y);
  if(pills.length){ let py = y + Z.gap * .6 + Z.row * .3; c.textBaseline = 'middle'; c.textAlign = 'left';
    for(const row of pills){ let px = P; for(const p of row){ KIT_rr(c, px, py, p.w, ph, ph / 2);
        if(p.more){ c.fillStyle = K.land; c.fill(); c.fillStyle = K.ink; c.font = F(600, Z.pill); c.fillText(p.txt, px + padX, py + ph / 2 + 1 * u); }
        else { c.fillStyle = K.dark ? mixHex(K.brand, K.bg, .7) : '#FFFFFF'; c.save(); shadow(c, alpha(K.deep, .1), 8 * u, 2 * u, B); c.fill(); c.restore();
          if(b.world) roundFlag(c, p.d.id, px + padX + Z.pill * .45, py + ph / 2, Z.pill * .62, u, B, 0, false); else { c.beginPath(); c.arc(px + padX + Z.pill * .3, py + ph / 2, Z.pill * .26, 0, Math.PI * 2); c.fillStyle = fillOf(p.d); c.fill(); }
          c.fillStyle = K.deep; c.font = F(600, Z.pill); c.fillText(p.txt, px + padX + p.dot, py + ph / 2 + 1 * u); }
        px += p.w + pg; }
      py += ph + pg; } }

  /* brand-colour footer with the call to action, then our badge (light) */
  const gf = c.createLinearGradient(0, bandTop, W, H); gf.addColorStop(0, K.brand); gf.addColorStop(1, mixHex(K.brand, '#000000', .28));
  c.fillStyle = gf; c.fillRect(0, bandTop, W, bandH);
  const onBrand = contrast('#FFFFFF', K.brand) >= 2.6 ? '#FFFFFF' : '#0B1636';
  let yy = bandTop + bandPadT + aPx * .95; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.font = F(600, aPx); c.fillStyle = alpha(onBrand, .82); c.fillText(ellipsize(c, C.bandA, cw), P, yy);
  yy += bPx * 1.1; c.font = F(700, bPx); c.fillStyle = onBrand; c.fillText(C.bandB, P, yy);
  c.font = F(500, Z.row * .82); c.fillStyle = alpha(onBrand, .78); c.textAlign = 'right'; c.fillText(ellipsize(c, C.hashtag, hashW), W - P, yy);
  drawBadge(c, A, W / 2, H - badgeH / 2 - (fmt === 'story' ? 26 * u : 4 * u), u, fmt, { style: 'light' });
}
globe.label = PAGE_EN ? 'Around the world' : 'পৃথিবী জুড়ে'; globe.sub = PAGE_EN ? 'Flags and routes, country by country' : 'দেশে দেশে পতাকা আর রুট';
globe.defaults = A => copyFor(A);
globe.ready = A => flagsReady(A);
globe.available = A => A.CFG.map === 'world';

/* =====================================================================================
   3. স্বপ্নের ক্যাম্পাস: letterhead, cap icon, map, flag cards of each destination
   ===================================================================================== */
function campus(c, W, H, opts, A){
  opts = opts || {}; const B = opts.base || 1; const b = setup(W, H, A); const { u, fmt, F, BN, n, K } = b;
  const Z = { post:   { P: 60, top: 54, logo: 96, h2: 84, h2min: 46, row: 27, gap: 22, card: 84, cols: 3, rows: 3, nm: 25, bA: 25, bB: 56, lab: 15, cap: 66 },
              square: { P: 50, top: 40, logo: 78, h2: 66, h2min: 38, row: 23, gap: 12, card: 70, cols: 4, rows: 2, nm: 21, bA: 21, bB: 44, lab: 13, cap: 52 },
              story:  { P: 70, top: 130, logo: 118, h2: 100, h2min: 54, row: 32, gap: 32, card: 100, cols: 3, rows: 4, nm: 29, bA: 30, bB: 70, lab: 18, cap: 84 } }[fmt];
  for(const k in Z) if(k !== 'cols' && k !== 'rows') Z[k] *= u;
  const P = Z.P, cw = W - 2 * P;
  /* warm paper background with a soft brand glow */
  const paper = K.dark ? K.bg : mixHex(K.bg, '#FFF8EC', .55), paper2 = K.dark ? K.bg2 : mixHex(K.bg2, '#F6EBD8', .5);
  const g0 = c.createLinearGradient(0, 0, 0, H); g0.addColorStop(0, paper); g0.addColorStop(1, paper2); c.fillStyle = g0; c.fillRect(0, 0, W, H);
  const gl = c.createRadialGradient(W / 2, H * .3, 0, W / 2, H * .3, W * .7); gl.addColorStop(0, alpha(K.brand, K.dark ? .14 : .08)); gl.addColorStop(1, alpha(K.brand, 0)); c.fillStyle = gl; c.fillRect(0, 0, W, H);
  const card = K.dark ? mixHex(K.bg, '#FFFFFF', .08) : '#FFFFFF';
  /* letterhead: logo + firm name + tagline */
  const showLogo = hasLogo(A, b, opts), Ls = Z.logo, Lw = showLogo ? logoBoxW(A, Ls) : 0;
  let y = Z.top;
  if(showLogo || b.name){
    if(showLogo) drawLogo(c, A, P, y, Lw, Ls, K, u, opts, b.name);
    const tx = P + (showLogo ? Lw + 22 * u : 0), tw = W - P - tx;
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    const nm = b.name || b.C.name; const npx = fit(c, F, 700, nm, tw, Z.row * 1.35, Z.row * .8); c.font = F(700, npx); c.fillStyle = K.deep; c.fillText(ellipsize(c, nm, tw), tx, y + Ls * .5 - 2 * u);
    const tpx = fit(c, F, 500, b.tagline, tw, Z.row * .85, Z.row * .62); c.font = F(500, tpx); c.fillStyle = K.muted; c.fillText(ellipsize(c, b.tagline, tw), tx, y + Ls * .5 + tpx * 1.35);
    y += Ls + Z.gap * 1.1;
    c.fillStyle = alpha(K.muted, .2); c.fillRect(P, y - Z.gap * .55, cw, Math.max(1, 1.2 * u));
  }
  /* cap + hook, centred */
  const capS = Z.cap; const hl = layoutHeadline(c, F, b.hook, cw, Z.h2, Z.h2min, u, Z.h2 * 2.5);
  /* cards */
  const list = b.visited; const cols = Z.cols; const maxCards = cols * Z.rows;
  const shown = list.length > maxCards ? list.slice(0, maxCards - 1) : list; const more = list.length - shown.length;
  const cardsN = shown.length + (more ? 1 : 0), rowsN = Math.ceil(cardsN / cols), cg = 12 * u, chh = Z.card;
  const cardsH = rowsN ? rowsN * (chh + cg) - cg : 0;
  /* footer */
  const badgeH = badgeRow(fmt, u), ctaH = ctaHeight(c, b, cw, Z.bA, Z.bB);
  const fixed = y + capS * .9 + Z.gap * .4 + hl.h + Z.gap * 1.5 + Z.gap + (cardsH ? cardsH + Z.gap : 0) + ctaH + badgeH + Z.gap * .5;
  const mapBox = Math.max(60 * u, H - fixed);
  const m0 = fitMap(A, P, 0, cw, mapBox), spare = Math.max(0, mapBox - m0.h);
  y += spare * .12;
  /* cap in a soft circle */
  const cx = W / 2, cyc = y + capS * .45; c.beginPath(); c.arc(cx, cyc, capS * .52, 0, Math.PI * 2); c.fillStyle = alpha(K.brand, K.dark ? .3 : .12); c.fill();
  if(/^(student|partner)$/.test(A.state.kind || 'student')) drawCap(c, cx, cyc - capS * .05, capS * .74, K.brandText, mixHex(K.brandText, K.deep, .35)); else drawPlane(c, cx, cyc, capS * .62, K.brandText);
  y += capS * .9 + Z.gap * .4;
  y = drawHook(c, F, hl, W / 2, y, 'center', K.brandText, K.deep);
  y += Z.gap * 1.5 + spare * .25;
  const m = { s: m0.s, x: m0.x, y, w: m0.w, h: m0.h };
  if(opts.recordXf) A.setXf({ s: m.s, x: m.x, y: m.y });
  const sh = shades(A, list.map(d => d.id));
  const fillOf = d => (A.state.byDiv && A.DIV_COLORS && A.DIV_COLORS[d.div]) ? A.DIV_COLORS[d.div] : (sh[d.id] ? K.brand2 : K.brand);
  drawMap(c, A, m, u, B, opts, { land: K.land, line: K.line, lw: .8, fill: fillOf, wish: K.wish, wishFill: K.wishFill, hover: K.deep, dotRing: '#FFFFFF' });
  const rt0 = (b.world && n && n <= 30) ? drawRoutes(c, A, m, u, B, list, { from: alpha(K.brandText, .15), to: alpha(K.brandText, .7), lw: 2, dash: [.1, 5] }) : null;
  if(rt0) homeDot(c, rt0.x, rt0.y, u, K.brandText, '#FFFFFF', alpha(K.brand, .18));
  if(!b.world && A.state.labelMode !== 'none') mapLabels(c, A, b, m, Z.lab, d => contrast('#FFFFFF', fillOf(d)) >= 2.8 ? '#FFFFFF' : K.deep, K.deep, alpha(paper, .92));
  y = m.y + m.h + Z.gap + spare * .25;
  /* destination cards */
  if(cardsN){
    const cwc = (cw - (cols - 1) * cg) / cols, fw = chh * .62 * 4 / 3 > cwc * .38 ? cwc * .38 : chh * .62 * 4 / 3, fh = fw * .75;
    for(let i = 0; i < cardsN; i++){
      const x = P + (i % cols) * (cwc + cg), yc = y + Math.floor(i / cols) * (chh + cg);
      c.save(); shadow(c, alpha(K.deep, K.dark ? .3 : .08), 14 * u, 4 * u, B); KIT_rr(c, x, yc, cwc, chh, 16 * u); c.fillStyle = card; c.fill(); c.restore();
      if(i === shown.length){ c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = F(700, Z.nm); c.fillStyle = K.brandText; c.fillText(b.EN ? `+${more} more` : `+${BN(more)} আরও`, x + cwc / 2, yc + chh / 2 + 1 * u); continue; }
      const d = shown[i], fx = x + 14 * u, fy = yc + (chh - fh) / 2;
      if(b.world) rectFlag(c, d.id, fx, fy, fw, fh, 7 * u, u); else { KIT_rr(c, fx, fy, fh, fh, fh / 2); c.fillStyle = fillOf(d); c.fill(); }
      const tx = fx + (b.world ? fw : fh) + 14 * u, tw = x + cwc - 12 * u - tx;
      c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      const c1 = b.cnt(d.id) ? `${BN(b.cnt(d.id))}+` : '';
      const dn = b.nameOf(d), npx = fit(c, F, 700, dn, tw, Z.nm, Z.nm * .66); c.font = F(700, npx); c.fillStyle = K.deep; c.fillText(ellipsize(c, dn, tw), tx, yc + chh * (c1 ? .46 : .56));
      if(c1){ c.font = F(700, Z.nm * .78); c.fillStyle = K.brandText; c.fillText(c1, tx, yc + chh * .8); }
    }
    y += cardsH + Z.gap;
  }
  /* call to action + badge */
  y = Math.max(y, H - badgeH - ctaH - Z.gap * .5);
  ctaBlock(c, b, W / 2, y, cw, Z.bA, Z.bB, K.muted, K.brandText, alpha(K.muted, .85), true);
  drawBadge(c, A, W / 2, H - badgeH / 2 - (fmt === 'story' ? 26 * u : 4 * u), u, fmt);
}
campus.label = PAGE_EN ? 'Dream campus' : 'স্বপ্নের ক্যাম্পাস'; campus.sub = PAGE_EN ? 'Destination cards with flags' : 'পতাকাসহ গন্তব্যের কার্ড';
campus.defaults = A => copyFor(A);
campus.ready = A => flagsReady(A);
campus.available = A => A.CFG.map === 'world';

/* =====================================================================================
   4. কম লেখা: logo + name, a big number, a big map; nothing else
   ===================================================================================== */
function minimal(c, W, H, opts, A){
  opts = opts || {}; const B = opts.base || 1; const b = setup(W, H, A); const { u, fmt, F, BN, n, K } = b;
  const Z = { post:   { P: 64, top: 64, logo: 104, nm: 44, num: 300, row: 30, gap: 30, lab: 16 },
              square: { P: 54, top: 48, logo: 84, nm: 36, num: 190, row: 25, gap: 16, lab: 14 },
              story:  { P: 72, top: 150, logo: 132, nm: 54, num: 380, row: 36, gap: 46, lab: 19 } }[fmt];
  for(const k in Z) Z[k] *= u;
  const P = Z.P, cw = W - 2 * P;
  const bg = K.dark ? K.bg : mixHex(K.bg, '#FFFFFF', .72);
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  /* header: logo + name left, hashtag right */
  const showLogo = hasLogo(A, b, opts), Ls = Z.logo, Lw = showLogo ? logoBoxW(A, Ls) : 0, top = Z.top;
  if(showLogo) drawLogo(c, A, P, top, Lw, Ls, K, u, opts, b.name);
  c.font = F(500, Z.row * .8); const hw = Math.min(cw * .34, c.measureText(b.C.hashtag).width);
  const nm = b.name || (showLogo ? '' : b.C.name), hh = showLogo ? Ls : Z.nm * 1.3;
  if(nm){ const tx = P + (showLogo ? Lw + 22 * u : 0), tw = W - P - hw - 30 * u - tx; const npx = fit(c, F, 700, nm, tw, Z.nm, Z.nm * .55); c.font = F(700, npx); c.fillStyle = K.deep; c.textAlign = 'left'; c.textBaseline = 'middle';
    const lines = c.measureText(nm).width > tw ? wrap(c, nm, tw).slice(0, 2) : [nm]; const lh = npx * 1.15; lines.forEach((l, i) => c.fillText(ellipsize(c, l, tw), tx, top + hh / 2 + (i - (lines.length - 1) / 2) * lh)); }
  c.textAlign = 'right'; c.textBaseline = 'middle'; c.font = F(500, Z.row * .8); c.fillStyle = K.muted; c.fillText(ellipsize(c, b.C.hashtag, hw), W - P, top + hh / 2);
  const badgeH = badgeRow(fmt, u), bottom = H - badgeH - Z.gap * .3;
  const wide = A.MAP_W / A.MAP_H > 1.3;
  const sh = shades(A, b.visited.map(d => d.id));
  const fillOf = d => (A.state.byDiv && A.DIV_COLORS && A.DIV_COLORS[d.div]) ? A.DIV_COLORS[d.div] : (sh[d.id] ? K.brand2 : K.brand);
  const suf = counterSuffix(A);
  let m;
  if(wide){
    /* giant number, tagline, then the map */
    const numPx = Z.num, capH = numPx * .74;
    const tagPx = fit(c, F, 600, b.tagline, cw, Z.row * 1.05, Z.row * .7);
    const blockTop = top + hh + Z.gap;
    const avail = bottom - blockTop;
    const m0 = fitMap(A, 20 * u, 0, W - 40 * u, Math.max(60 * u, avail - capH - tagPx * 1.9 - Z.gap * 1.6));
    const spare = Math.max(0, avail - (capH + tagPx * 1.9 + Z.gap * 1.6 + m0.h));
    let y = blockTop + spare * .35 + capH;
    counterGroup(c, F, W / 2, y, numPx, BN(n), suf, K.brandText, K.muted, 'center', u);
    y += tagPx * 1.6; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.font = F(600, tagPx); c.fillStyle = K.deep; c.fillText(ellipsize(c, b.tagline, cw), W / 2, y);
    y += Z.gap * 1.6 + spare * .3;
    m = { s: m0.s, x: m0.x, y, w: m0.w, h: m0.h };
  } else {
    /* tall map: number top-right of the map area, map as large as possible */
    const regionTop = top + hh + Z.gap;
    const m0 = fitMap(A, 20 * u, regionTop, W - 40 * u, Math.max(60 * u, bottom - regionTop - Z.row * 1.8));
    m = { s: m0.s, x: m0.x, y: m0.y, w: m0.w, h: m0.h };
    const numPx = Z.num * .62; counterGroup(c, F, W - P, regionTop + numPx * .74, numPx, BN(n), suf, K.brandText, K.muted, 'right', u);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic'; const tagPx = fit(c, F, 600, b.tagline, cw, Z.row, Z.row * .7); c.font = F(600, tagPx); c.fillStyle = K.deep; c.fillText(ellipsize(c, b.tagline, cw), P, bottom - Z.row * .4);
  }
  if(opts.recordXf) A.setXf({ s: m.s, x: m.x, y: m.y });
  drawMap(c, A, m, u, B, opts, { land: K.land, line: K.dark ? K.bg : '#FFFFFF', lw: 1, fill: fillOf, glow: alpha(K.brand, .35), glowBlur: 18, wish: K.wish, wishFill: K.wishFill, hover: K.deep, dotRing: '#FFFFFF' });
  if(A.state.labelMode !== 'none') mapLabels(c, A, b, m, Z.lab * (n > 24 ? .9 : 1), d => contrast('#FFFFFF', fillOf(d)) >= 2.8 ? '#FFFFFF' : K.deep, K.deep, alpha(bg, .92));
  drawBadge(c, A, W / 2, H - badgeH / 2 - (fmt === 'story' ? 30 * u : 4 * u), u, fmt);
}
minimal.label = PAGE_EN ? 'Minimal' : 'কম লেখা'; minimal.sub = PAGE_EN ? 'Logo, number and a big map' : 'লোগো, সংখ্যা আর বড় ম্যাপ';
minimal.defaults = A => copyFor(A);

LAYOUTS.dream = dream; LAYOUTS.globe = globe; LAYOUTS.campus = campus; LAYOUTS.minimal = minimal;
/* the order the designs are offered in (swipe / arrows / chips) */
LAYOUTS._order = ['headline', 'dream', 'globe', 'campus', 'minimal', 'classic'];
/* warm the flags of the current selection so the first render already has them */
try{ const G = window.__gdb; if(G && G.state) G.state.selected.forEach(id => flag(id)); }catch(e){}
})();

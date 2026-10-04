import { list } from '@vercel/blob';

const BN = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  const id = String(req.query.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const site = `${proto}://${host}`;
  if (!id) { res.statusCode = 302; res.setHeader('Location', '/'); return res.end(); }
  let meta = null;
  try {
    const r = await list({ prefix: `maps/${id}.json`, limit: 1 });
    const b = (r.blobs || []).find(x => x.pathname === `maps/${id}.json`);
    if (b) { const f = await fetch(b.url, { cache: 'no-store' }); if (f.ok) meta = await f.json(); }
  } catch (e) { meta = null; }
  if (!meta) {
    res.statusCode = 404; res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(`<!doctype html><html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ম্যাপ পাওয়া যায়নি</title><meta http-equiv="refresh" content="3;url=/"></head><body style="font-family:sans-serif;text-align:center;padding:60px 16px"><h2>এই ম্যাপটা পাওয়া যায়নি</h2><p><a href="/">নিজের ম্যাপ বানান</a></p></body></html>`);
  }
  const world = meta.map === 'world', upz = meta.map === 'upazila';
  const TOTAL = world ? 195 : upz ? 545 : 64, UNIT = world ? 'দেশ' : upz ? 'উপজেলা' : 'জেলা', GEN = world ? 'দেশের' : upz ? 'উপজেলার' : 'জেলার', PLACE = world ? 'পৃথিবীর' : 'বাংলাদেশের', HOME = world ? '/world' : upz ? '/upazila' : '/';
  const n = meta.count || 0, pct = Math.round(n / TOTAL * 100);
  const name = meta.name || '';
  const title = name ? `${name} ${PLACE} ${BN(TOTAL)} ${GEN} মধ্যে ${BN(n)}টি ${UNIT} ঘুরেছেন!` : `${PLACE} ${BN(TOTAL)} ${GEN} মধ্যে ${BN(n)}টি ${UNIT} ঘোরা হয়েছে!`;
  const desc = `${PLACE} ${BN(pct)}% ঘোরা হয়ে গেছে। আপনার কয়টা ${UNIT} হলো? ২ মিনিটে নিজের ভ্রমণ ম্যাপ বানান, ফ্রি।`;
  const url = `${site}/m/${id}`;
  const share = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const html = `<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} - ঘুরে দেখা বাংলাদেশ</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ঘুরে দেখা বাংলাদেশ">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${meta.card}">
<meta property="og:image:secure_url" content="${meta.card}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="bn_BD">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${meta.card}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@700;800&family=Hind+Siliguri:wght@400;600;700&display=swap">
<style>
:root{--bg:#F2F5F1;--surface:#fff;--ink:#15231C;--muted:#5E6E65;--line:#D6DED8;--accent:#0F7F4C;--accent-ink:#0B5F39;--red:#D6262E}
@media (prefers-color-scheme:dark){:root{--bg:#0F1613;--surface:#182019;--ink:#ECF2EE;--muted:#9CAAA2;--line:#2B382F;--accent:#3AC986;--accent-ink:#8FE6BC;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:"Hind Siliguri",system-ui,sans-serif;line-height:1.55}
.top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line);background:var(--surface)}
.brand{display:flex;align-items:center;gap:8px;font-family:"Anek Bangla",sans-serif;font-weight:800;font-size:18px;text-decoration:none;color:var(--ink)}
.brand svg{width:26px;height:26px}
.wrap{max-width:620px;margin:0 auto;padding:22px 16px 60px}
h1{font-family:"Anek Bangla",sans-serif;font-size:clamp(24px,5vw,34px);line-height:1.25;margin:0 0 6px;text-wrap:balance}
.sub{color:var(--muted);margin:0 0 18px;font-size:16px}
.poster{display:block;width:100%;height:auto;border-radius:18px;box-shadow:0 18px 50px rgba(21,35,28,.18)}
.cta{display:grid;gap:10px;margin-top:22px}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:15px 20px;border-radius:14px;font-weight:700;font-size:17px;text-decoration:none;border:1px solid var(--line);background:var(--surface);color:var(--ink);font-family:"Anek Bangla",sans-serif}
.btn.primary{background:var(--accent);border-color:var(--accent);color:#fff}
.stat{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0 0}
.stat span{background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-size:14px;font-weight:600}
footer{text-align:center;color:var(--muted);font-size:13px;padding:0 16px 30px}
</style>
</head>
<body>
<header class="top"><a class="brand" href="/"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="#0F7F4C"/><circle cx="14" cy="16" r="8" fill="#D6262E"/></svg>ঘুরে দেখা বাংলাদেশ</a><a class="btn primary" style="padding:8px 14px;font-size:15px" href="${HOME}">নিজের ম্যাপ বানান</a></header>
<main class="wrap">
<h1>${esc(title)}</h1>
<p class="sub">${esc(desc)}</p>
<img class="poster" src="${meta.poster}" alt="${esc(name || 'ভ্রমণ')} ম্যাপ" width="1080" height="${meta.size === 'story' ? 1920 : meta.size === 'square' ? 1080 : 1350}">
<div class="stat"><span>${BN(n)} / ${BN(TOTAL)} ${UNIT}</span><span>${BN(pct)}% ${world ? 'পৃথিবী' : 'বাংলাদেশ'}</span><span>বাকি ${BN(TOTAL - n)} ${UNIT}</span></div>
<div class="cta">
<a class="btn primary" href="${HOME}">আপনিও নিজের ম্যাপ বানান - ফ্রি</a>
<a class="btn" href="${share}" target="_blank" rel="noopener">এই ম্যাপটা ফেসবুকে শেয়ার করুন</a>
</div>
</main>
<footer>ঘুরে দেখা বাংলাদেশ · একটি Fair Convener উদ্যোগ · তৈরি করেছেন <a href="https://www.facebook.com/Galib.Dhaka" rel="noopener" style="color:inherit">Mahmud Galib</a></footer>
</body>
</html>`;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  res.end(html);
}

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
<header class="top"><a class="brand" href="/"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="32" fill="#0F7F4C"/><circle cx="32" cy="32" r="24" fill="#D6262E"/><g transform="translate(17.05,14.00) scale(0.02990)"><path d="M381 1051 365 1052 362 1087 371 1101 384 1099 379 1079ZM396 1023 406 1064 426 1076 440 1093 445 1081 453 1068 466 1067 475 1074 487 1066 492 1053 520 1038 539 1009 562 990 558 959 544 938 530 929 528 900 522 890 522 864 534 851 520 837 532 807 550 783 534 754 556 755 558 836 574 860 587 870 587 882 602 908 611 911 646 939 664 961 684 941 696 920 691 905 698 890 725 887 747 903 790 954 800 992 812 1025 820 1027 823 1060 833 1094 821 1137 822 1175 843 1190 863 1225 863 1249 894 1290 902 1311 913 1310 911 1277 891 1249 900 1238 895 1217 923 1194 935 1180 947 1206 974 1202 982 1233 1000 1224 987 1180 981 1128 987 1090 974 1032 981 1021 969 965 961 904 950 887 947 862 928 845 931 816 924 805 922 775 932 774 916 725 911 696 900 662 876 660 861 680 833 674 840 716 817 737 796 761 809 814 786 833 766 844 751 822 730 772 702 777 687 721 666 688 668 659 677 659 686 638 684 619 697 601 709 604 716 589 711 576 756 583 767 576 769 560 793 566 790 543 825 560 831 537 826 521 837 510 863 513 878 500 888 482 897 439 904 428 893 388 923 401 942 397 943 383 929 374 930 360 884 342 862 327 804 327 765 341 735 338 685 323 645 324 599 334 558 328 515 336 490 326 445 320 383 289 396 229 386 206 385 170 395 158 367 103 352 93 339 99 344 123 332 134 312 141 284 137 265 125 258 111 244 108 230 48 209 36 194 54 225 80 202 83 186 73 149 59 135 37 121 33 105 13 84 0 79 26 105 32 112 57 95 61 77 73 76 87 40 103 42 123 20 157 24 180 34 189 58 189 97 216 94 231 116 250 140 260 160 249 175 257 177 284 197 301 194 332 174 323 130 322 122 329 100 320 93 327 93 363 82 377 55 394 47 378 29 388 34 400 0 445 20 473 42 494 67 511 88 512 121 528 144 528 154 542 152 620 137 631 120 630 115 667 121 689 149 713 157 729 157 746 142 762 147 773 167 774 194 784 175 841 197 876 187 888 198 902 191 912 206 964 202 988 222 1019 215 1041 225 1051 237 1044 240 1057 245 1057 250 1062 265 1026 287 1037 308 1010 320 1049 336 1022 352 1033 368 1033 387 1049ZM541 901 535 918 563 937 566 1000 554 1022 549 1056 567 1063 594 1034 605 963 587 946 583 926 570 912 561 883 545 878ZM549 876 553 862 534 858 525 868 536 880ZM546 1021 525 1046 530 1072 551 1038ZM748 972 756 954 733 922 725 941 738 970ZM707 893 696 901 716 918 722 906ZM288 1093 280 1108 294 1127 307 1112 301 1099ZM300 1027 288 1037 297 1053 309 1043ZM665 977 650 969 650 1007 636 1038 648 1045 671 1024 676 987ZM547 1067 530 1080 544 1090ZM485 1074 475 1075 465 1067 454 1068 445 1082 444 1092 438 1098 442 1104 459 1110 476 1100ZM524 1066 520 1051 497 1068 486 1091 497 1098 520 1082ZM245 1058 236 1072 248 1081 251 1085 248 1089 246 1103 258 1105 266 1085 250 1078 249 1072 257 1066 247 1063ZM237 1057 222 1081 226 1106 237 1110 245 1101 245 1092 248 1083 238 1083 233 1075ZM261 1045 252 1061 258 1065 258 1069 252 1073 269 1086 271 1063Z" fill="#F7F2E6" stroke="#0F7F4C" stroke-width="18" stroke-linejoin="round"/></g></svg>ঘুরে দেখা বাংলাদেশ</a><a class="btn primary" style="padding:8px 14px;font-size:15px" href="${HOME}">নিজের ম্যাপ বানান</a></header>
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
<footer>ঘুরে দেখা বাংলাদেশ · তৈরি করেছেন <a href="https://www.facebook.com/Galib.Dhaka" rel="noopener" style="color:inherit">Mahmud Galib</a></footer>
</body>
</html>`;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  res.end(html);
}

/* ঘুরে দেখা বাংলাদেশ - জেলার পণ্য (local sellers). Used on every district guide (/jela/<id>, /en/jela/<id>) and on /bazar.
   Anyone can add a seller and it shows at once; anyone can report one (3 different people hide it); the person who added it
   can delete it from the same browser. Data: /api/listing (api/_shop.js). The words follow the page's <html lang> (English on /en pages).
   <section data-bazar="list" data-d="<district>" data-eg="<famous thing>">  one district's sellers + the add form
   <section data-bazar="hub">  the newest sellers anywhere + the add form with a district list (window.GD_DIST)
   [data-bz-count="<district>"]  filled with that district's number of sellers */
(function () {
'use strict';
const EN = /^en\b/i.test(document.documentElement.lang || '');
const NUM = EN ? (n => String(n)) : (n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]));
const T = EN ? {
  loading: 'Loading...', empty: 'No one has added anything yet. If you sell this district\'s products online, be the first.', emptyHub: 'Nothing added yet.',
  fail: 'Could not load the list; try again in a moment.', add: '➕ Add your product', district: 'Which district\'s product', pick: 'Pick a district',
  name: 'Shop or page name', phName: 'e.g. Bogura Doi Ghor', product: 'What do you sell', phProduct: 'e.g. {x}, home delivery across the country',
  photo: 'Product photo (optional)', fb: 'Facebook page link', phFb: 'facebook.com/your-page', phone: 'WhatsApp or mobile number', phPhone: '01XXXXXXXXX',
  contactHint: 'A Facebook page or a number: at least one.', liveNote: 'It shows to everyone as soon as you add it. Fake or offensive entries are removed after reports.',
  submit: '✅ Add it', sending: 'Adding...', cancel: 'Cancel', added: 'Added; everyone can see it now',
  err: { district: 'Pick a district', name: 'Type a name (at least 2 letters)', product: 'Say what you sell', fb: 'That Facebook link does not look right',
         phone: 'That mobile number does not look right (01XXXXXXXXX)', contact: 'Give a Facebook page or a mobile number', photo: 'Could not use that photo; try another',
         limit: 'Many entries came from here today; please try again tomorrow', other: 'Could not add it; please try again in a moment' },
  fbBtn: '📘 Facebook page', waBtn: '💬 WhatsApp', callBtn: '📞 Call', report: '⚑ Report', reasons: { fake: 'Fake or a scam', bad: 'Offensive photo or text', wrong: 'Wrong details' },
  reported: 'Thanks, we got your report', reportedHidden: 'Thanks; after several reports it has been removed', already: 'You have already reported this',
  own: 'You added this', del: '🗑️ Delete', delQ: 'Delete this?', deleted: 'Deleted', more: 'sellers',
  wa: 'Hello, I saw your page on Ghure Dekha Bangladesh and would like to know about your products.', guide: 'guide'
} : {
  loading: 'লোড হচ্ছে...', empty: 'এখনো কেউ যোগ করেননি। এই জেলার পণ্য অনলাইনে বিক্রি করলে প্রথম হোন।', emptyHub: 'এখনো কেউ যোগ করেননি।',
  fail: 'তালিকা আনা যায়নি, একটু পরে আবার দেখুন।', add: '➕ আপনার পণ্য যোগ করুন', district: 'কোন জেলার পণ্য', pick: 'জেলা বেছে নিন',
  name: 'দোকান বা পেজের নাম', phName: 'যেমন: বগুড়া দই ঘর', product: 'কী বিক্রি করেন', phProduct: 'যেমন: {x}, সারা দেশে হোম ডেলিভারি',
  photo: 'পণ্যের ছবি (না দিলেও চলবে)', fb: 'ফেসবুক পেজের লিংক', phFb: 'facebook.com/আপনার-পেজ', phone: 'হোয়াটসঅ্যাপ বা মোবাইল নম্বর', phPhone: '01XXXXXXXXX',
  contactHint: 'ফেসবুক পেজ বা নম্বর, অন্তত একটা দিন।', liveNote: 'যোগ করলে সাথে সাথে সবাই দেখবে। ভুয়া বা আপত্তিকর কিছু দিলে রিপোর্টে সরে যাবে।',
  submit: '✅ যোগ করুন', sending: 'যোগ হচ্ছে...', cancel: 'বাতিল', added: 'যোগ হয়েছে, এখন সবাই দেখতে পাবে',
  err: { district: 'জেলা বেছে নিন', name: 'নাম লিখুন (অন্তত ২ অক্ষর)', product: 'কী বিক্রি করেন লিখুন', fb: 'ফেসবুক পেজের লিংকটা ঠিক নেই',
         phone: 'মোবাইল নম্বরটা ঠিক নেই (01XXXXXXXXX)', contact: 'ফেসবুক পেজ বা মোবাইল নম্বর, অন্তত একটা দিন', photo: 'ছবিটা নেওয়া গেল না, অন্য ছবি দিন',
         limit: 'আজ এখান থেকে অনেকগুলো যোগ হয়েছে, কাল আবার চেষ্টা করুন', other: 'যোগ করা গেল না, একটু পরে আবার চেষ্টা করুন' },
  fbBtn: '📘 ফেসবুক পেজ', waBtn: '💬 হোয়াটসঅ্যাপ', callBtn: '📞 কল', report: '⚑ রিপোর্ট', reasons: { fake: 'ভুয়া বা প্রতারণা', bad: 'খারাপ ছবি বা লেখা', wrong: 'ভুল তথ্য' },
  reported: 'রিপোর্ট পেয়েছি, ধন্যবাদ', reportedHidden: 'রিপোর্ট পেয়েছি; কয়েকজনের রিপোর্টে এটা সরানো হলো', already: 'আগেই রিপোর্ট করেছেন',
  own: 'আপনার যোগ করা', del: '🗑️ মুছুন', delQ: 'এটা মুছে ফেলবেন?', deleted: 'মুছে ফেলা হলো', more: 'বিক্রেতা',
  wa: 'আসসালামু আলাইকুম, ঘুরে দেখা বাংলাদেশে আপনার পেজ দেখলাম। আপনার পণ্য নিয়ে জানতে চাই।', guide: 'গাইড'
};
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const OWN = 'gd-shop-own', REP = 'gd-shop-rep';
const DIST = {}; (window.GD_DIST || []).forEach(d => { DIST[d.id] = d; });
const dname = id => DIST[id] ? (EN ? DIST[id].en : DIST[id].bn) : '';
const say = m => { if (window.toast) window.toast(m); };
const day = s => { try { return new Date(s).toLocaleDateString(EN ? 'en-GB' : 'bn-BD', { day: 'numeric', month: 'short', timeZone: 'Asia/Dhaka' }); } catch (e) { return ''; } };
const api = (q, opt) => fetch('/api/listing' + q, Object.assign({ cache: 'no-store' }, opt || {})).then(r => r.json().then(j => ({ ok: r.ok, j })));
const post = body => api('', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

function card(s, withDistrict) {
  const own = store.get(OWN)[s.id], ph = s.phone ? '88' + s.phone : '';
  const acts = [s.fb ? `<a class="btn small" href="${esc(s.fb)}" target="_blank" rel="nofollow ugc noopener">${T.fbBtn}</a>` : '',
    ph ? `<a class="btn small" href="https://wa.me/${ph}?text=${encodeURIComponent(T.wa)}" target="_blank" rel="nofollow noopener">${T.waBtn}</a>` : '',
    ph ? `<a class="btn small" href="tel:+${ph}">${T.callBtn}</a>` : ''].join('');
  const tag = withDistrict && s.district ? `<a class="bz-tag" href="${EN ? '/en' : ''}/jela/${esc(s.district)}#bazar">${esc(dname(s.district) || s.district)}</a>` : '';
  const pic = s.photo ? `<a href="${esc(s.photo)}" target="_blank" rel="noopener"><img class="bz-ph" src="${esc(s.photo)}" alt="${esc(s.name)}" loading="lazy"></a>` : '<span class="bz-ph no" aria-hidden="true">🛍️</span>';
  return `<article class="bz-card" data-id="${+s.id}">${pic}<div class="bz-b">${tag}<h3>${esc(s.name)}</h3><p>${esc(s.product)}</p><div class="bz-act">${acts}</div>`
    + `<div class="bz-meta"><span>${esc(day(s.at))}</span><button type="button" class="bz-rep">${T.report}</button>`
    + (own ? `<span class="bz-own">${T.own}</span><button type="button" class="bz-del">${T.del}</button>` : '')
    + `</div><div class="bz-why" hidden>${Object.keys(T.reasons).map(k => `<button type="button" data-r="${k}">${T.reasons[k]}</button>`).join('')}</div></div></article>`;
}

function wire(box) {
  box.querySelectorAll('.bz-card').forEach(c => {
    if (c.dataset.w) return; c.dataset.w = '1';
    const img = c.querySelector('img.bz-ph');
    if (img) img.addEventListener('error', () => { const a = img.closest('a'); const ph = document.createElement('span'); ph.className = 'bz-ph no'; ph.setAttribute('aria-hidden', 'true'); ph.textContent = '🛍️'; (a || img).replaceWith(ph); });
    const id = +c.dataset.id, why = c.querySelector('.bz-why');
    c.querySelector('.bz-rep').addEventListener('click', () => { if (store.get(REP)[id]) { say(T.already); return; } why.hidden = !why.hidden; });
    why.querySelectorAll('[data-r]').forEach(b => b.addEventListener('click', async () => {
      why.hidden = true;
      try {
        const { ok, j } = await post({ action: 'report', id, reason: b.dataset.r });
        if (!ok) throw new Error(j && j.error);
        const r = store.get(REP); r[id] = 1; store.set(REP, r);
        if (j.hidden) { c.remove(); say(T.reportedHidden); } else say(T.reported);
      } catch (e) { say(T.err.other); }
    }));
    const del = c.querySelector('.bz-del');
    if (del) del.addEventListener('click', async () => {
      if (!confirm(T.delQ)) return;
      const own = store.get(OWN);
      try {
        const { ok } = await post({ action: 'delete', id, owner: own[id] });
        if (!ok) throw new Error('delete');
        delete own[id]; store.set(OWN, own); c.remove(); say(T.deleted);
      } catch (e) { say(T.err.other); }
    });
  });
}

function show(box, list, opt) {
  if (!list.length) { box.innerHTML = `<p class="muted bz-empty">${opt.hub ? T.emptyHub : T.empty}</p>`; return; }
  box.innerHTML = list.map(s => card(s, opt.hub)).join('');
  wire(box);
}

function toJpeg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const M = 900, sc = Math.min(1, M / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(im.width * sc)); c.height = Math.max(1, Math.round(im.height * sc));
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      let q = 0.85, d = c.toDataURL('image/jpeg', q);
      while (d.length > 1500000 && q > 0.4) { q -= 0.15; d = c.toDataURL('image/jpeg', q); }
      resolve(d);
    };
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('photo')); };
    im.src = url;
  });
}

function form(sec, onAdded) {
  const holder = sec.querySelector('.bz-form'), fixed = sec.dataset.d || '', eg = sec.dataset.eg || (EN ? 'Bogura\'s doi' : 'বগুড়ার দই');
  const opts = (window.GD_DIST || []).slice().sort((a, b) => (EN ? a.en.localeCompare(b.en) : a.bn.localeCompare(b.bn, 'bn')))
    .map(d => `<option value="${esc(d.id)}">${esc(EN ? d.en : d.bn)}</option>`).join('');
  holder.innerHTML = (fixed ? '' : `<label>${T.district}<select name="district" required><option value="">${T.pick}</option>${opts}</select></label>`)
    + `<label>${T.name}<input name="name" maxlength="80" autocomplete="organization" placeholder="${esc(T.phName)}"></label>`
    + `<label>${T.product}<input name="product" maxlength="160" placeholder="${esc(T.phProduct.replace('{x}', eg))}"></label>`
    + `<label>${T.fb}<input name="fb" inputmode="url" autocomplete="url" placeholder="${esc(T.phFb)}"></label>`
    + `<label>${T.phone}<input name="phone" inputmode="tel" autocomplete="tel" placeholder="${T.phPhone}"><small>${T.contactHint}</small></label>`
    + `<label>${T.photo}<input name="photo" type="file" accept="image/*"></label>`
    + `<p class="bz-note" style="margin:0">${T.liveNote}</p>`
    + `<div class="row"><button class="btn primary" type="button" data-go>${T.submit}</button><button class="btn" type="button" data-x>${T.cancel}</button></div>`;
  holder.hidden = false;
  const f = n => holder.querySelector(`[name="${n}"]`);
  holder.querySelector('[data-x]').addEventListener('click', () => { holder.hidden = true; holder.innerHTML = ''; });
  holder.querySelector('[data-go]').addEventListener('click', async e => {
    const btn = e.currentTarget, district = fixed || (f('district') && f('district').value);
    if (!district) { say(T.err.district); return; }
    const own = store.get(OWN), tok = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
    const body = { action: 'add', district, name: f('name').value, product: f('product').value, fb: f('fb').value, phone: f('phone').value,
                   owner: tok, lang: EN ? 'en' : 'bn', page: location.pathname };
    if (body.name.trim().length < 2) { say(T.err.name); return; }
    if (body.product.trim().length < 2) { say(T.err.product); return; }
    if (!body.fb.trim() && !body.phone.trim()) { say(T.err.contact); return; }
    btn.disabled = true; const label = btn.textContent; btn.textContent = T.sending;
    try {
      const file = f('photo').files && f('photo').files[0];
      if (file) { try { body.photo = await toJpeg(file); } catch (x) { say(T.err.photo); return; } }
      const { ok, j } = await post(body);
      if (!ok || !j || !j.ok) { say(T.err[(j && j.error) || 'other'] || T.err.other); return; }
      own[j.id] = tok; store.set(OWN, own);
      holder.hidden = true; holder.innerHTML = ''; say(T.added);
      onAdded(Object.assign({ district }, j.item));
    } catch (x) { say(T.err.other); }
    finally { btn.disabled = false; btn.textContent = label; }
  });
  const first = holder.querySelector('select, input'); if (first) first.focus();
}

async function init(sec) {
  const hub = sec.dataset.bazar === 'hub', box = sec.querySelector('.bz-list');
  let list = [];
  const render = () => show(box, list, { hub });
  try {
    const { ok, j } = await api(hub ? '?latest=1' : '?d=' + encodeURIComponent(sec.dataset.d));
    if (!ok || !Array.isArray(j)) throw new Error('list');
    list = j; render();
  } catch (e) { box.innerHTML = `<p class="muted">${T.fail}</p>`; }
  const open = sec.querySelector('[data-bz-open]');
  if (open) open.addEventListener('click', () => form(sec, item => { list = [item].concat(list); render(); bump(item.district); box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }));
  if (location.hash === '#bazar-add' && open) open.click();
}

function bump(id) { const el = document.querySelector(`[data-bz-count="${id}"]`); if (el) { const n = (+el.dataset.n || 0) + 1; el.dataset.n = n; el.textContent = NUM(n) + ' ' + T.more; el.hidden = false; } }

async function counts() {
  const els = document.querySelectorAll('[data-bz-count]'); if (!els.length) return;
  try {
    const { ok, j } = await api('?counts=1'); if (!ok || !j) return;
    els.forEach(el => { const n = +j[el.dataset.bzCount] || 0; el.dataset.n = n; if (n) { el.textContent = NUM(n) + ' ' + T.more; el.hidden = false; } });
  } catch (e) {}
}

document.querySelectorAll('[data-bazar]').forEach(init);
counts();
})();

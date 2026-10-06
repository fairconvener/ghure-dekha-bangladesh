/* ঘুরে দেখা বাংলাদেশ - তথ্য যাচাই উইজেট। <div class="verify" data-page="..." data-item="..."></div> যেখানে বসাবেন, সেখানেই "ঠিক আছে / ভুল আছে" বোতাম আসবে।
   The words follow the page's <html lang>: Bangla, or English on the /en pages (Latin digits there).
   Photos belong to the place, not the language: a photo sent from an English page (data-page "en/jela/x") is filed under "jela/x". */
(function(){
'use strict';
const EN = /^en\b/i.test(document.documentElement.lang || '');
const BN = EN ? (n => String(n)) : (n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]));
const T = EN ? {
  title: 'Tell us what is right', sub: 'Write what looks wrong or out of date, and what is right. We will check it and update the page.',
  msg: 'For example: the fare to Jaflong is now Tk 300, and there is no water in winter...', contact: 'Your name or mobile (optional, for a credit)',
  cancel: 'Cancel', send: 'Send', photoMsg: 'Where and when you took it (optional)', photoName: 'Your name (shown in the photo credit)',
  addTitle: 'Add a new place or detail', uploading: 'Uploading...',
  photoOk: 'Got your photo, thank you! Once we have checked it, it will appear on the page with your name.', photoFail: 'The upload did not work; please try again a little later',
  more: 'Please write a little more', thanks: 'Thank you! We will check it and update the page.', fail: 'It could not be sent; please try again a little later',
  q: 'Is this right?', ok: 'Right', wrongTitle: 'Wrong or out of date: tell us what is right', wrong: 'Wrong or out of date',
  addHint: 'Add new information', add: '➕ Add info', photoHint: 'Add a photo you took of this place', photo: '📷 Add photo',
  thanksN: c => `Thanks · ${c}`, photoTitle: 'Send the photo', photoBad: 'That photo could not be read', count: n => `${n} ${Number(n) === 1 ? 'person' : 'people'} ✓`
} : {
  title: 'সঠিক তথ্যটা জানান', sub: 'যা ভুল বা পুরোনো মনে হচ্ছে, আর সঠিকটা কী, লিখে দিন। আমরা যাচাই করে আপডেট করব।',
  msg: 'যেমন: জাফলংয়ের ভাড়া এখন ৩০০ টাকা, আর শীতে পানি থাকে না...', contact: 'আপনার নাম বা মোবাইল (ঐচ্ছিক, ক্রেডিট দিতে চাইলে)',
  cancel: 'বাতিল', send: 'পাঠান', photoMsg: 'ছবিটা কোথায়, কবে তোলা (ঐচ্ছিক)', photoName: 'আপনার নাম (ছবির ক্রেডিটে দেখাবে)',
  addTitle: 'নতুন জায়গা বা তথ্য যোগ করুন', uploading: 'আপলোড হচ্ছে...',
  photoOk: 'ছবি পেয়েছি, ধন্যবাদ! যাচাইয়ের পর পেজে উঠবে, আপনার নামসহ।', photoFail: 'আপলোড হয়নি, একটু পরে আবার চেষ্টা করুন',
  more: 'একটু বিস্তারিত লিখুন', thanks: 'ধন্যবাদ! আমরা যাচাই করে আপডেট করব।', fail: 'পাঠানো যায়নি, একটু পরে আবার চেষ্টা করুন',
  q: 'তথ্য সঠিক?', ok: 'ঠিক আছে', wrongTitle: 'ভুল বা পুরোনো, সঠিকটা জানান', wrong: 'ভুল বা পুরোনো',
  addHint: 'নতুন তথ্য যোগ করুন', add: '➕ নতুন তথ্য', photoHint: 'এই জায়গার আপনার তোলা ছবি দিন', photo: '📷 ছবি দিন',
  thanksN: c => `ধন্যবাদ · ${BN(c)}`, photoTitle: 'ছবিটা পাঠান', photoBad: 'ছবিটি পড়া যায়নি', count: n => `${BN(n)} জন ✓`
};
const HOSTED = /^https?:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const css = `
.verify{display:inline-flex;flex-wrap:wrap;align-items:center;gap:4px;font-size:11px;color:var(--muted,#5E6E65);margin-top:6px;line-height:1}
.verify .vq{font-weight:600;margin-right:2px}
.verify button{font:inherit;font-size:13px;line-height:1;padding:0;width:26px;height:22px;border-radius:7px;border:1px solid var(--line,#D6DED8);background:var(--surface,#fff);color:inherit;cursor:pointer;display:inline-grid;place-items:center;opacity:.85}
.verify button:hover{background:var(--surface-2,#E9EFEA);opacity:1}
.verify button[data-v="ok"][aria-pressed="true"]{background:var(--accent,#0F7F4C);border-color:var(--accent,#0F7F4C);opacity:1}
.verify button[data-v="add"]{width:auto;padding:0 7px;font-size:11px;font-weight:600}
.verify .vn{font-size:11px;margin-left:2px}
.verify.done .vq{display:none}
.vmodal{position:fixed;inset:0;z-index:70;display:none;align-items:flex-end;justify-content:center;background:rgba(10,18,14,.6);backdrop-filter:blur(4px)}
.vmodal.open{display:flex}
@media (min-width:700px){.vmodal{align-items:center;padding:24px}}
.vsheet{background:var(--surface,#fff);color:var(--ink,#15231C);width:100%;max-width:520px;border-radius:22px 22px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom,0px));display:grid;gap:10px;max-height:92vh;overflow:auto}
@media (min-width:700px){.vsheet{border-radius:22px}}
.vsheet h3{margin:0;font-family:var(--font-display,inherit);font-size:19px}
.vsheet p{margin:0;color:var(--muted,#5E6E65);font-size:14px}
.vsheet textarea,.vsheet input{width:100%;font:inherit;font-size:15px;padding:10px 12px;border:1px solid var(--line,#D6DED8);border-radius:12px;background:var(--bg,#F2F5F1);color:inherit;box-sizing:border-box}
.vsheet textarea{min-height:110px;resize:vertical}
.vsheet .vrow{display:flex;gap:8px;justify-content:flex-end}
.vsheet .vbtn{font:inherit;font-weight:700;padding:11px 18px;border-radius:12px;border:1px solid var(--line,#D6DED8);background:var(--surface,#fff);color:inherit;cursor:pointer}
.vsheet .vbtn.primary{background:var(--accent,#0F7F4C);border-color:var(--accent,#0F7F4C);color:#fff}
.verify button[data-v="photo"]{width:auto;padding:0 7px;font-size:11px;font-weight:600}
.vsheet .vprev{width:100%;max-height:240px;object-fit:cover;border-radius:12px;display:none}
.vtoast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--ink,#15231C);color:var(--bg,#fff);padding:10px 18px;border-radius:12px;font-weight:600;z-index:80;opacity:0;transition:.2s;pointer-events:none;max-width:calc(100% - 32px);text-align:center}
.vtoast.show{opacity:1}
`;
const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
const modal = document.createElement('div'); modal.className = 'vmodal'; modal.innerHTML = `<div class="vsheet" role="dialog" aria-modal="true"><h3 id="vTitle">${T.title}</h3><p id="vSub">${T.sub}</p><img id="vPrev" class="vprev" alt=""><input type="file" id="vFile" accept="image/*" hidden><textarea id="vMsg" placeholder="${T.msg}"></textarea><input id="vContact" placeholder="${T.contact}" maxlength="120"><div class="vrow"><button class="vbtn" id="vCancel" type="button">${T.cancel}</button><button class="vbtn primary" id="vSend" type="button">${T.send}</button></div></div>`;
document.body.appendChild(modal);
const toastEl = document.createElement('div'); toastEl.className = 'vtoast'; document.body.appendChild(toastEl);
let tt = 0; const toast = m => { toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('show'), 2800); };
let cur = null;
const open = (page, item, verdict, title, photo) => { cur = {page, item, verdict, photo: photo || null}; modal.querySelector('#vPrev').style.display = photo ? 'block' : 'none'; if(photo) modal.querySelector('#vPrev').src = photo; modal.querySelector('#vMsg').placeholder = photo ? T.photoMsg : T.msg; modal.querySelector('#vContact').placeholder = photo ? T.photoName : T.contact; modal.querySelector('#vTitle').textContent = title || (verdict === 'add' ? T.addTitle : T.title); modal.querySelector('#vMsg').value = ''; modal.classList.add('open'); setTimeout(() => modal.querySelector('#vMsg').focus(), 50); };
const close = () => { modal.classList.remove('open'); cur = null; };
modal.addEventListener('click', e => { if(e.target === modal) close(); });
modal.querySelector('#vCancel').addEventListener('click', close);
document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
async function post(body){ if(!HOSTED) return true; try{ const r = await fetch('/api/feedback', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body)}); return r.ok; }catch(e){ return false; } }
modal.querySelector('#vSend').addEventListener('click', async () => { if(!cur) return; const message = modal.querySelector('#vMsg').value.trim();
  if(cur.photo){ const b = modal.querySelector('#vSend'); b.disabled = true; b.textContent = T.uploading; let ok = false; try{ const r = await fetch('/api/photo', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({page: cur.page.replace(/^en\//, ''), item: cur.item, image: cur.photo, name: modal.querySelector('#vContact').value.trim()})}); ok = r.ok; }catch(e){} b.disabled = false; b.textContent = T.send; close(); toast(ok ? T.photoOk : T.photoFail); return; }
  if(message.length < 4){ toast(T.more); return; } const b = modal.querySelector('#vSend'); b.disabled = true; const ok = await post({...cur, message, contact: modal.querySelector('#vContact').value.trim()}); b.disabled = false; close(); toast(ok ? T.thanks : T.fail); });

const done = new Set(); try{ JSON.parse(localStorage.getItem('gdb-verified') || '[]').forEach(k => done.add(k)); }catch(e){}
const remember = k => { done.add(k); try{ localStorage.setItem('gdb-verified', JSON.stringify([...done].slice(-300))); }catch(e){} };
function build(el){
  if(el.dataset.built) return; el.dataset.built = '1';
  const page = el.dataset.page || location.pathname.replace(/^\//, ''), item = el.dataset.item || '';
  const key = page + '#' + item; const quiet = el.dataset.quiet === '1';
  el.innerHTML = `<span class="vq">${el.dataset.q || T.q}</span><button type="button" data-v="ok" aria-pressed="${done.has(key)}" title="${T.ok}" aria-label="${T.ok}">👍</button><button type="button" data-v="wrong" title="${T.wrongTitle}" aria-label="${T.wrong}">👎</button>${el.dataset.add === '1' ? `<button type="button" data-v="add" title="${T.addHint}">${T.add}</button>` : ''}${el.dataset.photo === '1' ? `<button type="button" data-v="photo" title="${T.photoHint}">${T.photo}</button>` : ''}<span class="vn"></span>`;
  if(done.has(key)) el.classList.add('done');
  el.querySelector('[data-v="ok"]').addEventListener('click', async e => { const b = e.currentTarget; if(b.getAttribute('aria-pressed') === 'true') return; b.setAttribute('aria-pressed', 'true'); remember(key); el.classList.add('done'); const n = el.querySelector('.vn'); const c = parseInt(n.dataset.ok || '0', 10) + 1; n.dataset.ok = c; n.textContent = T.thanksN(c); await post({page, item, verdict:'ok'}); });
  el.querySelector('[data-v="wrong"]').addEventListener('click', () => open(page, item, 'wrong'));
  const add = el.querySelector('[data-v="add"]'); if(add) add.addEventListener('click', () => open(page, item, 'add'));
  const ph = el.querySelector('[data-v="photo"]'); if(ph) ph.addEventListener('click', () => { const f = modal.querySelector('#vFile'); f.onchange = () => { const file = f.files && f.files[0]; f.value = ''; if(!file) return; const url = URL.createObjectURL(file); const im = new Image(); im.onload = () => { const M = 1600, sc = Math.min(1, M/Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width*sc); c.height = Math.round(im.height*sc); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); open(page, item, 'photo', T.photoTitle, c.toDataURL('image/jpeg', .85)); }; im.onerror = () => toast(T.photoBad); im.src = url; }; f.click(); });
}
async function init(){
  const els = [...document.querySelectorAll('.verify')].filter(el => !el.dataset.built); els.forEach(build);
  if(!HOSTED || !els.length) return;
  const pages = [...new Set(els.map(el => el.dataset.page || location.pathname.replace(/^\//, '')))];
  for(const page of pages){ try{ const c = await (await fetch('/api/feedback?page=' + encodeURIComponent(page))).json(); els.filter(el => (el.dataset.page || location.pathname.replace(/^\//, '')) === page).forEach(el => { const k = el.dataset.item || ''; const v = c[k]; if(v && v.ok){ const n = el.querySelector('.vn'); n.dataset.ok = v.ok; n.textContent = T.count(v.ok); } }); }catch(e){} }
}
init();
window.gdbVerify = { open, toast, init };
})();

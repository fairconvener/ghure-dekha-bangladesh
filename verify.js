/* ঘুরে দেখা বাংলাদেশ - তথ্য যাচাই উইজেট। <div class="verify" data-page="..." data-item="..."></div> যেখানে বসাবেন, সেখানেই "ঠিক আছে / ভুল আছে" বোতাম আসবে। */
(function(){
'use strict';
const BN = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const HOSTED = /^https?:$/.test(location.protocol) && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const css = `
.verify{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;font-size:13px;color:var(--muted,#5E6E65);margin-top:8px}
.verify .vq{font-weight:600}
.verify button{font:inherit;font-size:13px;font-weight:600;padding:5px 11px;border-radius:999px;border:1px solid var(--line,#D6DED8);background:var(--surface,#fff);color:inherit;cursor:pointer;line-height:1.3}
.verify button:hover{background:var(--surface-2,#E9EFEA)}
.verify button[data-v="ok"][aria-pressed="true"]{background:var(--accent,#0F7F4C);border-color:var(--accent,#0F7F4C);color:#fff}
.verify .vn{font-size:12px}
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
.vtoast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--ink,#15231C);color:var(--bg,#fff);padding:10px 18px;border-radius:12px;font-weight:600;z-index:80;opacity:0;transition:.2s;pointer-events:none;max-width:calc(100% - 32px);text-align:center}
.vtoast.show{opacity:1}
`;
const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
const modal = document.createElement('div'); modal.className = 'vmodal'; modal.innerHTML = `<div class="vsheet" role="dialog" aria-modal="true"><h3 id="vTitle">সঠিক তথ্যটা জানান</h3><p id="vSub">যা ভুল বা পুরোনো মনে হচ্ছে, আর সঠিকটা কী, লিখে দিন। আমরা যাচাই করে আপডেট করব।</p><textarea id="vMsg" placeholder="যেমন: জাফলংয়ের ভাড়া এখন ৩০০ টাকা, আর শীতে পানি থাকে না..."></textarea><input id="vContact" placeholder="আপনার নাম বা মোবাইল (ঐচ্ছিক, ক্রেডিট দিতে চাইলে)" maxlength="120"><div class="vrow"><button class="vbtn" id="vCancel" type="button">বাতিল</button><button class="vbtn primary" id="vSend" type="button">পাঠান</button></div></div>`;
document.body.appendChild(modal);
const toastEl = document.createElement('div'); toastEl.className = 'vtoast'; document.body.appendChild(toastEl);
let tt = 0; const toast = m => { toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('show'), 2800); };
let cur = null;
const open = (page, item, verdict, title) => { cur = {page, item, verdict}; modal.querySelector('#vTitle').textContent = title || (verdict === 'add' ? 'নতুন জায়গা বা তথ্য যোগ করুন' : 'সঠিক তথ্যটা জানান'); modal.querySelector('#vMsg').value = ''; modal.classList.add('open'); setTimeout(() => modal.querySelector('#vMsg').focus(), 50); };
const close = () => { modal.classList.remove('open'); cur = null; };
modal.addEventListener('click', e => { if(e.target === modal) close(); });
modal.querySelector('#vCancel').addEventListener('click', close);
document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
async function post(body){ if(!HOSTED) return true; try{ const r = await fetch('/api/feedback', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body)}); return r.ok; }catch(e){ return false; } }
modal.querySelector('#vSend').addEventListener('click', async () => { if(!cur) return; const message = modal.querySelector('#vMsg').value.trim(); if(message.length < 4){ toast('একটু বিস্তারিত লিখুন'); return; } const b = modal.querySelector('#vSend'); b.disabled = true; const ok = await post({...cur, message, contact: modal.querySelector('#vContact').value.trim()}); b.disabled = false; close(); toast(ok ? 'ধন্যবাদ! আমরা যাচাই করে আপডেট করব।' : 'পাঠানো যায়নি, একটু পরে আবার চেষ্টা করুন'); });

const done = new Set(); try{ JSON.parse(localStorage.getItem('gdb-verified') || '[]').forEach(k => done.add(k)); }catch(e){}
const remember = k => { done.add(k); try{ localStorage.setItem('gdb-verified', JSON.stringify([...done].slice(-300))); }catch(e){} };
function build(el){
  if(el.dataset.built) return; el.dataset.built = '1';
  const page = el.dataset.page || location.pathname.replace(/^\//, ''), item = el.dataset.item || '';
  const key = page + '#' + item; const quiet = el.dataset.quiet === '1';
  el.innerHTML = `<span class="vq">${el.dataset.q || 'এই তথ্য ঠিক আছে?'}</span><button type="button" data-v="ok" aria-pressed="${done.has(key)}">👍 ঠিক আছে</button><button type="button" data-v="wrong">✏️ ভুল বা পুরোনো</button>${el.dataset.add === '1' ? '<button type="button" data-v="add">➕ নতুন তথ্য দিন</button>' : ''}<span class="vn"></span>`;
  if(done.has(key)) el.classList.add('done');
  el.querySelector('[data-v="ok"]').addEventListener('click', async e => { const b = e.currentTarget; if(b.getAttribute('aria-pressed') === 'true') return; b.setAttribute('aria-pressed', 'true'); remember(key); el.classList.add('done'); const n = el.querySelector('.vn'); const c = parseInt(n.dataset.ok || '0', 10) + 1; n.dataset.ok = c; n.textContent = `ধন্যবাদ! ${BN(c)} জন ঠিক বলেছেন`; await post({page, item, verdict:'ok'}); });
  el.querySelector('[data-v="wrong"]').addEventListener('click', () => open(page, item, 'wrong'));
  const add = el.querySelector('[data-v="add"]'); if(add) add.addEventListener('click', () => open(page, item, 'add'));
}
async function init(){
  const els = [...document.querySelectorAll('.verify')].filter(el => !el.dataset.built); els.forEach(build);
  if(!HOSTED || !els.length) return;
  const pages = [...new Set(els.map(el => el.dataset.page || location.pathname.replace(/^\//, '')))];
  for(const page of pages){ try{ const c = await (await fetch('/api/feedback?page=' + encodeURIComponent(page))).json(); els.filter(el => (el.dataset.page || location.pathname.replace(/^\//, '')) === page).forEach(el => { const k = el.dataset.item || ''; const v = c[k]; if(v && v.ok){ const n = el.querySelector('.vn'); n.dataset.ok = v.ok; n.textContent = `${BN(v.ok)} জন ঠিক বলেছেন`; } }); }catch(e){} }
}
init();
window.gdbVerify = { open, toast, init };
})();

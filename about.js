/* "আমাদের কথা" + অনুদান modal, shared by every page. Opens from any <a href="#about">. */
(function(){
  var CSS = '.abm{position:fixed;inset:0;background:rgba(14,22,18,.55);display:none;align-items:flex-end;justify-content:center;z-index:60;padding:0}@media(min-width:640px){.abm{align-items:center;padding:20px}}.abm.open{display:flex}'
  + '.abm .box{background:var(--surface,#fff);color:var(--ink,#1B2A21);width:100%;max-width:440px;max-height:92vh;overflow:auto;border-radius:22px 22px 0 0;box-shadow:0 30px 80px rgba(0,0,0,.35);position:relative}@media(min-width:640px){.abm .box{border-radius:22px}}'
  + '.abm .x{position:absolute;right:12px;top:12px;width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.9);color:#1B2A21;font-size:18px;cursor:pointer;z-index:2}'
  + '.abm .hd{background:linear-gradient(135deg,#0F7F4C,#0a5c36);padding:30px 22px 22px;text-align:center;color:#fff}.abm .hd img{width:120px;height:120px;border-radius:50%;border:4px solid rgba(255,255,255,.85);box-shadow:0 10px 30px rgba(0,0,0,.3);display:block;margin:0 auto 12px;background:#fff}'
  + '.abm .hd h2{margin:0;font-size:22px;font-weight:700}.abm .hd small{display:block;opacity:.9;font-size:14px;margin-top:2px}'
  + '.abm .bd{padding:18px 22px 22px;display:grid;gap:14px;font-size:15px;line-height:1.6}.abm .bd p{margin:0}'
  + '.abm .soc{display:flex;gap:10px}.abm .soc a{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:#1877F2;color:#fff;text-decoration:none;font-weight:600;font-size:14px}'
  + '.abm .don{border:1px solid var(--line,#e3e8e4);border-radius:16px;padding:14px 16px;display:grid;gap:8px;background:var(--surface-2,#f4f6f4)}.abm .don b{font-size:16px}.abm .don .num{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.abm .don .num span.b{background:#E2136E;color:#fff;font-weight:700;padding:4px 10px;border-radius:8px;font-size:13px}.abm .don .num code{font-size:19px;font-weight:700;letter-spacing:.5px;font-family:inherit}'
  + '.abm .don button{font:inherit;font-size:14px;font-weight:600;padding:8px 14px;border-radius:10px;border:1px solid var(--line,#e3e8e4);background:var(--surface,#fff);color:inherit;cursor:pointer}.abm .don small{color:var(--muted,#6b7369);font-size:13px}';
  var HTML = '<div class="box" role="dialog" aria-modal="true" aria-label="আমাদের কথা"><button class="x" type="button" aria-label="বন্ধ করুন">✕</button>'
  + '<div class="hd"><img src="/about-galib.png" alt="মাহমুদ গালিব" width="120" height="120"><h2>মাহমুদ গালিব</h2><small>ভ্রমণপ্রেমী · উদ্যোক্তা</small></div>'
  + '<div class="bd"><p>ঘুরতে ভালোবাসি, আর ঘুরে এসে মনে হতো, কয়টা জেলা হলো সেটা এক ছবিতে দেখাতে পারলে ভালো হতো। সেই ভাবনা থেকেই "ঘুরে দেখা বাংলাদেশ": নিজের ভ্রমণের ম্যাপ, ৬৪ জেলার গাইড, বিশ্ব ম্যাপ, সব এক জায়গায়, সবার জন্য ফ্রি। যাঁরা দেশটাকে নতুন করে দেখতে চান, তাঁদের জন্যই।</p>'
  + '<div><div style="font-weight:600;margin-bottom:8px">আমার সাথে যুক্ত থাকুন</div><div class="soc"><a href="https://www.facebook.com/Galib.Dhaka" target="_blank" rel="noopener">f &nbsp;Facebook</a></div></div>'
  + '<div class="don"><b>☕ চাইলে অনুদান দিতে পারেন</b><small>সাইটটা ফ্রি আর বিজ্ঞাপনমুক্ত; ডোমেইন-হোস্টিংয়ের খরচ চালাতে সামর্থ্য অনুযায়ী যেকোনো অঙ্ক।</small>'
  + '<div class="num"><span class="b">বিকাশ</span><code id="abNum">01913770940</code><button type="button" id="abCopy">নম্বর কপি</button></div><small>Send Money · মাহমুদ গালিব</small></div>'
  + '</div></div>';
  function ensure(){
    var m = document.getElementById('aboutModal'); if(m) return m;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    m = document.createElement('div'); m.className = 'abm'; m.id = 'aboutModal'; m.innerHTML = HTML; document.body.appendChild(m);
    var close = function(){ m.classList.remove('open'); document.body.style.overflow = ''; };
    m.querySelector('.x').addEventListener('click', close);
    m.addEventListener('click', function(e){ if(e.target === m) close(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });
    m.querySelector('#abCopy').addEventListener('click', function(){
      var n = m.querySelector('#abNum').textContent, b = m.querySelector('#abCopy');
      var done = function(ok){ b.textContent = ok ? '✓ কপি হয়েছে' : 'কপি হয়নি'; setTimeout(function(){ b.textContent = 'নম্বর কপি'; }, 1800); };
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(n).then(function(){ done(true); }, function(){ done(false); });
      else { try{ var t = document.createElement('textarea'); t.value = n; document.body.appendChild(t); t.select(); done(document.execCommand('copy')); t.remove(); }catch(e){ done(false); } }
    });
    return m;
  }
  function open(){ var m = ensure(); m.classList.add('open'); document.body.style.overflow = 'hidden'; if(window.gdTrack) try{ gdTrack('AboutOpen'); }catch(e){} }
  document.addEventListener('click', function(e){ var a = e.target.closest && e.target.closest('a[href="#about"]'); if(a){ e.preventDefault(); open(); } });
  if(location.hash === '#about') setTimeout(open, 300);
})();

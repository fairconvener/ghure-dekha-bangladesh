/* "আমাদের কথা" + অনুদান modal, shared by every page. Opens from any <a href="#about">.
   Also: registers the service worker (installable app) and handles any <a href="#install"> ("অ্যাপ হিসেবে রাখুন"). */
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
  + '<div class="hd"><img src="/about-galib.png" alt="মাহমুদ গালিব" width="120" height="120"><h2>মাহমুদ গালিব</h2><small>উদ্যোক্তা, ঢাকা</small></div>'
  + '<div class="bd">'
  + '<p><b>কীভাবে শুরু:</b> কাজের জন্য বছরে অনেক জেলায় যেতে হয়। একদিন হিসাব করতে বসে দেখি, কোনটায় গেছি আর কোনটায় যাইনি, নিজেই গুলিয়ে ফেলছি। একটা ম্যাপে টিক দিয়ে রাখতে পারলে কেমন হয়? সেই ছোট সমস্যা থেকে এই সাইট।</p>'
  + '<p><b>এখন যা আছে:</b> জেলা ম্যাপ, উপজেলা ম্যাপ, বিশ্ব ম্যাপ আর দেশভিত্তিক ম্যাপ; ৬৪ জেলার গাইড, ট্রিপ প্ল্যানার, কুইজ।</p>'
  + '<p><b>সামনে:</b> সবার ম্যাপ মিলিয়ে দেখা, বাংলাদেশের মানুষ আসলে কোথায় বেশি যায়, কোথায় কম; সেই তথ্য দিয়ে ভ্রমণকে আরেকটু সহজ করা। পরামর্শ বা ভুল চোখে পড়লে জানাবেন।</p>'
  + '<div><div class="soc"><a href="https://www.facebook.com/Galib.Dhaka" target="_blank" rel="noopener">f &nbsp;মেসেজ দিন</a></div></div>'
  + '<div class="don"><b>🤝 অনুদান</b><small>ডোমেইন, হোস্টিং আর ছবি-ডেটার খরচ এখন নিজের পকেট থেকে যায়। সাইটটা কাজে লাগলে, ইচ্ছা হলে, যেকোনো অঙ্ক পাঠাতে পারেন; না পাঠালেও সব ফিচার একই থাকবে।</small>'
  + '<div class="num"><span class="b">বিকাশ</span><code id="abNum">01913770940</code><button type="button" id="abCopy">নম্বর কপি</button></div><small>Send Money (পার্সোনাল) · মাহমুদ গালিব</small></div>'
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

/* ---- installable app: service worker + "অ্যাপ হিসেবে রাখুন" ---- */
(function(){
  var LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if('serviceWorker' in navigator && window.isSecureContext && (location.protocol === 'https:' || LOCAL)){
    var reg = function(){ navigator.serviceWorker.register('/sw.js').catch(function(){}); };
    if(document.readyState === 'complete') reg(); else window.addEventListener('load', reg);
  }
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function(e){ deferred = e; });
  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var inApp = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|Line\/|MicroMessenger/i.test(ua);
  function standalone(){ return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; }
  function track(n){ if(window.gdTrack) try{ window.gdTrack(n); }catch(e){} }
  function hideLinks(){
    document.querySelectorAll('a[href="#install"]').forEach(function(a){
      var prev = a.previousSibling;
      if(prev && prev.nodeType === 3) prev.textContent = prev.textContent.replace(/\s*·\s*$/, '');
      a.remove();
    });
  }
  var tEl = null, tTimer = 0;
  function note(msg, ms){
    if(!tEl){
      tEl = document.createElement('div'); tEl.setAttribute('role', 'status'); tEl.setAttribute('aria-live', 'polite');
      tEl.style.cssText = 'position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);max-width:min(440px,calc(100% - 32px));background:var(--ink,#15231C);color:var(--bg,#fff);padding:12px 16px;border-radius:14px;font-weight:600;font-size:15px;line-height:1.5;z-index:90;box-shadow:0 10px 30px rgba(0,0,0,.3);text-align:center;opacity:0;transition:opacity .2s;cursor:pointer';
      tEl.addEventListener('click', function(){ tEl.style.opacity = '0'; });
      document.body.appendChild(tEl);
    }
    tEl.textContent = msg; tEl.style.opacity = '1'; clearTimeout(tTimer);
    tTimer = setTimeout(function(){ tEl.style.opacity = '0'; }, ms || 6000);
  }
  var CSS = '.inm{position:fixed;inset:0;background:rgba(14,22,18,.55);display:none;align-items:flex-end;justify-content:center;z-index:61}@media(min-width:640px){.inm{align-items:center;padding:20px}}.inm.open{display:flex}'
    + '.inm .box{background:var(--surface,#fff);color:var(--ink,#1B2A21);width:100%;max-width:420px;max-height:92vh;overflow:auto;border-radius:22px 22px 0 0;box-shadow:0 30px 80px rgba(0,0,0,.35);position:relative;padding:22px 20px calc(20px + env(safe-area-inset-bottom,0px))}@media(min-width:640px){.inm .box{border-radius:22px}}'
    + '.inm .x{position:absolute;right:12px;top:12px;width:38px;height:38px;border-radius:50%;border:1px solid var(--line,#D6DED8);background:var(--surface,#fff);color:inherit;font-size:16px;cursor:pointer}'
    + '.inm .hd{display:flex;align-items:center;gap:12px;padding-right:40px}.inm .hd img{width:52px;height:52px;border-radius:14px;flex:none}.inm h2{margin:0;font-size:20px;line-height:1.3}'
    + '.inm p{margin:12px 0 0;color:var(--muted,#5E6E65);font-size:15px;line-height:1.6}'
    + '.inm ol{margin:14px 0 0;padding-left:0;list-style:none;counter-reset:s;display:grid;gap:12px}.inm li{counter-increment:s;position:relative;padding-left:40px;min-height:28px;font-size:15.5px;line-height:1.6}'
    + '.inm li::before{content:counter(s,bengali);position:absolute;left:0;top:0;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--accent,#0F7F4C);color:var(--bg,#fff);font-weight:700;font-size:14px}'
    + '.inm .ic{display:inline-block;vertical-align:-4px;width:20px;height:20px;margin:0 2px}'
    + '.inm .ok{margin-top:18px;width:100%;font:inherit;font-weight:700;font-size:16px;padding:12px;border-radius:12px;border:0;background:var(--accent,#0F7F4C);color:var(--bg,#fff);cursor:pointer}'
    + '.inm .ghost{margin-top:8px;width:100%;font:inherit;font-weight:600;font-size:15px;padding:11px;border-radius:12px;border:1px solid var(--line,#D6DED8);background:transparent;color:inherit;cursor:pointer}';
  var SHARE_IC = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Share বোতাম"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><rect x="5" y="10" width="14" height="11" rx="2"/></svg>';
  function sheet(title, bodyHtml, extra){
    var m = document.getElementById('installModal');
    if(!m){
      var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
      m = document.createElement('div'); m.className = 'inm'; m.id = 'installModal';
      m.innerHTML = '<div class="box" role="dialog" aria-modal="true" aria-labelledby="inmTitle"><button class="x" type="button" aria-label="বন্ধ করুন">✕</button><div class="hd"><img src="/icon-192.png" alt="" width="52" height="52"><h2 id="inmTitle"></h2></div><div class="bd"></div><button class="ok" type="button">বুঝেছি</button></div>';
      document.body.appendChild(m);
      var close = function(){ m.classList.remove('open'); document.body.style.overflow = ''; };
      m.querySelector('.x').addEventListener('click', close); m.querySelector('.ok').addEventListener('click', close);
      m.addEventListener('click', function(e){ if(e.target === m) close(); });
      document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && m.classList.contains('open')) close(); });
    }
    m.querySelector('#inmTitle').textContent = title;
    m.querySelector('.bd').innerHTML = bodyHtml;
    if(extra) extra(m);
    m.classList.add('open'); document.body.style.overflow = 'hidden';
    m.querySelector('.ok').focus({preventScroll: true});
  }
  function copyLink(btn){
    var url = location.origin + location.pathname;
    var done = function(ok){ btn.textContent = ok ? '✓ লিংক কপি হয়েছে' : url; };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function(){ done(true); }, function(){ done(false); }); else done(false);
  }
  async function install(){
    track('InstallClick');
    if(standalone()){ note('অ্যাপটি এরই মধ্যে আপনার হোম স্ক্রিনে আছে। 👍', 3500); return; }
    if(deferred){
      var ev = deferred;
      try{
        var r = await ev.prompt(); deferred = null;
        var c = (r && r.outcome) ? r : await ev.userChoice;
        if(c && c.outcome === 'accepted'){ track('InstallAccepted'); note('যোগ হচ্ছে! একটু পরে হোম স্ক্রিন বা অ্যাপের তালিকায় "ঘুরে দেখা" পাবেন।'); }
        return;
      }catch(e){ /* no user gesture (e.g. opened with #install): fall back to the written steps */ }
    }
    if(inApp){
      sheet('আগে ব্রাউজারে খুলুন',
        '<p>ফেসবুক বা মেসেঞ্জারের ভেতরের ব্রাউজার থেকে অ্যাপ যোগ করা যায় না। পাতাটা আসল ব্রাউজারে খুলে নিন:</p><ol>'
        + (isIOS ? '<li>নিচে বা ওপরে <b>⋯</b> চাপুন, তারপর <b>Open in Safari</b> (Safari-তে খুলুন) বেছে নিন।</li>'
                 : '<li>ওপরের ডান কোণে <b>⋮</b> (তিন ফোঁটা) চাপুন, তারপর <b>Open in browser</b> বা <b>Chrome-এ খুলুন</b> বেছে নিন।</li>')
        + '<li>ব্রাউজারে পাতাটা খুললে নিচের <b>📲 অ্যাপ হিসেবে রাখুন</b> আবার চাপুন।</li></ol><button class="ghost" type="button" id="inmCopy">🔗 লিংক কপি করুন</button>',
        function(m){ var b = m.querySelector('#inmCopy'); if(b) b.addEventListener('click', function(){ copyLink(b); }); });
      return;
    }
    if(isIOS){
      sheet('আইফোনে অ্যাপ হিসেবে রাখুন',
        '<p>অ্যাপ স্টোর লাগবে না, ৩ ধাপেই হোম স্ক্রিনে চলে আসবে:</p><ol>'
        + '<li>ব্রাউজারের <b>Share</b> বোতাম ' + SHARE_IC + ' চাপুন (আইফোনে সাধারণত নিচে, আইপ্যাডে ওপরে)।</li>'
        + '<li>তালিকা একটু নিচে নামিয়ে <b>Add to Home Screen</b> (হোম স্ক্রিনে যোগ করুন) বেছে নিন।</li>'
        + '<li>ওপরে ডানে <b>Add</b> চাপুন। হোম স্ক্রিনে "ঘুরে দেখা" আইকন চলে আসবে।</li></ol>');
      return;
    }
    note('ব্রাউজারের মেনু (⋮) খুলে "Install app" বা "Add to Home screen" (হোম স্ক্রিনে যোগ করুন) বেছে নিন। অ্যাপ স্টোর লাগবে না।', 8000);
  }
  document.addEventListener('click', function(e){ var a = e.target.closest && e.target.closest('a[href="#install"]'); if(a){ e.preventDefault(); install(); } });
  window.addEventListener('appinstalled', function(){ deferred = null; hideLinks(); track('AppInstalled'); note('অ্যাপ হিসেবে যোগ হয়েছে। হোম স্ক্রিন থেকেই খুলতে পারবেন।', 4500); });
  function boot(){ if(standalone()) hideLinks(); if(location.hash === '#install') setTimeout(install, 400); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

/* ---- one copy helper for every page (window.gdCopy(text) -> Promise<boolean>) ----
   Starts copying synchronously inside the tap: iPhone browsers drop the permission after any await,
   and some in-app browsers have no async Clipboard API at all. */
(function(){
  var IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function execCopy(text, withSel){
    var fired = false, ok = false, ta = null, sel = document.getSelection();
    var onBefore = function(e){ e.preventDefault(); };
    var onCopy = function(e){ try{ if(e.clipboardData){ e.clipboardData.setData('text/plain', text); e.preventDefault(); fired = true; } }catch(err){} };
    document.addEventListener('beforecopy', onBefore, true); document.addEventListener('copy', onCopy, true);
    try{
      if(withSel){
        ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.setAttribute('aria-hidden', 'true'); ta.tabIndex = -1;
        ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;margin:0;padding:0;border:0;outline:0;overflow:hidden;font-size:16px;color:transparent;background:transparent;white-space:pre;-webkit-user-select:text;user-select:text';
        document.body.appendChild(ta);
        if(IOS){ ta.contentEditable = 'true'; ta.readOnly = false; var r = document.createRange(); r.selectNodeContents(ta); sel.removeAllRanges(); sel.addRange(r); ta.setSelectionRange(0, text.length); ta.readOnly = true; }
        else { ta.select(); ta.setSelectionRange(0, text.length); }
      }
      ok = document.execCommand('copy');
    }catch(e){ ok = false; }
    document.removeEventListener('beforecopy', onBefore, true); document.removeEventListener('copy', onCopy, true);
    if(ta){ ta.remove(); try{ sel.removeAllRanges(); }catch(e){} }
    return ok && (fired || withSel);
  }
  window.gdCopy = function(text){
    text = String(text == null ? '' : text);
    var ok = false; try{ ok = execCopy(text, false) || execCopy(text, true); }catch(e){}
    var p = null;
    if(navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext){ try{ p = navigator.clipboard.writeText(text); }catch(e){ p = null; } }
    if(p && !ok) return p.then(function(){ return true; }, function(){ return false; });
    if(p && p.catch) p.catch(function(){});
    return Promise.resolve(ok);
  };
  window.gdCopyStrict = function(text){ return window.gdCopy(text).then(function(ok){ if(!ok) throw new Error('copy failed'); return true; }); };
})();

/* "আমাদের কথা" modal, shared by every page. Opens from any <a href="#about">.
   Also: registers the service worker (installable app) and handles any <a href="#install"> ("অ্যাপ হিসেবে রাখুন").
   English pages (<html lang="en">) get the same modal and install steps in English. */
(function(){
  var CSS = '.abm{position:fixed;inset:0;background:rgba(14,22,18,.55);display:none;align-items:flex-end;justify-content:center;z-index:60;padding:0}@media(min-width:640px){.abm{align-items:center;padding:20px}}.abm.open{display:flex}'
  + '.abm .box{background:var(--surface,#fff);color:var(--ink,#1B2A21);width:100%;max-width:440px;max-height:92vh;overflow:auto;border-radius:22px 22px 0 0;box-shadow:0 30px 80px rgba(0,0,0,.35);position:relative}@media(min-width:640px){.abm .box{border-radius:22px}}'
  + '.abm .x{position:absolute;right:12px;top:12px;width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.9);color:#1B2A21;font-size:18px;cursor:pointer;z-index:2}'
  + '.abm .hd{background:linear-gradient(135deg,#0F7F4C,#0a5c36);padding:30px 22px 22px;text-align:center;color:#fff}.abm .hd img{width:120px;height:120px;border-radius:50%;border:4px solid rgba(255,255,255,.85);box-shadow:0 10px 30px rgba(0,0,0,.3);display:block;margin:0 auto 12px;background:#fff}'
  + '.abm .hd h2{margin:0;font-size:22px;font-weight:700}.abm .hd small{display:block;opacity:.9;font-size:14px;margin-top:2px}'
  + '.abm .bd{padding:18px 22px 22px;display:grid;gap:14px;font-size:15px;line-height:1.6}.abm .bd p{margin:0}'
  + '.abm .soc{display:flex;gap:10px}.abm .soc a{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:#1877F2;color:#fff;text-decoration:none;font-weight:600;font-size:14px}'
  + '.abm .bd ul{margin:0;padding:0;list-style:none;display:grid;gap:10px}';
  var HTML = '<div class="box" role="dialog" aria-modal="true" aria-label="আমাদের কথা"><button class="x" type="button" aria-label="বন্ধ করুন">✕</button>'
  + '<div class="hd"><img src="/about-galib.png" alt="মাহমুদ গালিব" width="120" height="120"><h2>মাহমুদ গালিব</h2><small>প্রতিষ্ঠাতা, ঘুরে দেখা বাংলাদেশ</small></div>'
  + '<div class="bd">'
  + '<p><b>আমাদের উদ্দেশ্য</b><br>ভ্রমণপ্রেমীদের জন্য একটা সহজ প্ল্যাটফর্ম, যেখানে ভ্রমণের দরকারি সব এক জায়গায় পাওয়া যায়। কোথায় যাবেন, কীভাবে যাবেন, কোথায় থাকবেন, কাদের সাথে যাবেন: এসব তথ্য এখন নানা পেজ, গ্রুপ আর পোস্টে ছড়িয়ে আছে। আমরা সেগুলো এক জায়গায় আনছি, সহজ করে সাজাচ্ছি, আর সবার জন্য খোলা রাখছি।</p>'
  + '<ul><li>🧭 <b>সহজ করা:</b> ম্যাপে টিক দিয়ে নিজের ভ্রমণের হিসাব, এক পাতায় জেলার গাইড, ট্রেনের সময়সহ ট্রিপ প্ল্যান। কোনো সাইনআপ লাগে না।</li>'
  + '<li>🤝 <b>সব এক জায়গায়:</b> দর্শনীয় স্থান, যাতায়াত, থাকা-খাওয়া, আর বাছাই করা ট্যুর গ্রুপের প্যাকেজ।</li>'
  + '<li>🔓 <b>তথ্য উন্মুক্ত:</b> সব তথ্য সবার জন্য ফ্রি। কোথাও ভুল চোখে পড়লে যে কেউ জানাতে পারেন, যাচাই করে ঠিক করা হয়।</li></ul>'
  + '<p><b>কীভাবে শুরু</b><br>কাজের সূত্রে বছরজুড়ে নানা জেলায় যেতে হয়। একদিন দেখি, কোন জেলায় গেছি আর কোনটায় যাইনি, নিজেই গুলিয়ে ফেলছি। একটা ম্যাপে টিক দিয়ে রাখার সেই ছোট ভাবনা থেকে শুরু। এখন লক্ষ্য একটাই: বাংলাদেশ ঘোরা সবার জন্য সহজ করা।</p>'
  + '<p>পরামর্শ, ভুল তথ্য বা পার্টনারশিপ নিয়ে কথা বলতে মেসেজ দিন।</p>'
  + '<div><div class="soc"><a href="https://www.facebook.com/Galib.Dhaka" target="_blank" rel="noopener">f &nbsp;মেসেজ দিন</a></div></div>'
  + '</div></div>';
  /* English pages (<html lang="en">, the /en/... pages): the same modal in English */
  if(/^en\b/i.test(document.documentElement.lang || '')) HTML = '<div class="box" role="dialog" aria-modal="true" aria-label="About us"><button class="x" type="button" aria-label="Close">✕</button>'
  + '<div class="hd"><img src="/about-galib.png" alt="Mahmud Galib" width="120" height="120"><h2>Mahmud Galib</h2><small>Founder, Ghure Dekha Bangladesh</small></div>'
  + '<div class="bd">'
  + '<p><b>Our aim</b><br>One easy place for people who love to travel, with everything a trip needs. Where to go, how to get there, where to stay, who to go with: today this is scattered across pages, groups and posts. We are bringing it together, laying it out simply, and keeping it open to everyone.</p>'
  + '<ul><li>🧭 <b>Easier:</b> tick the map to keep track of your travels, read a district\'s guide on one page, plan a trip with real train times. No sign-up.</li>'
  + '<li>🤝 <b>All in one place:</b> places to visit, getting there, food and stays, and packages from hand-picked tour groups.</li>'
  + '<li>🔓 <b>Open information:</b> everything is free for everyone. If you spot a mistake, anyone can tell us; we check it and fix it.</li></ul>'
  + '<p><b>How it started</b><br>Work takes me to different districts all year. One day I realised I could no longer keep track of which districts I had been to and which I had not. It started with that small idea of ticking them off on a map. Now there is one goal: to make travelling around Bangladesh easier for everyone.</p>'
  + '<p>Message us with suggestions, corrections or partnership ideas.</p>'
  + '<div><div class="soc"><a href="https://www.facebook.com/Galib.Dhaka" target="_blank" rel="noopener">f &nbsp;Message us</a></div></div>'
  + '</div></div>';
  function ensure(){
    var m = document.getElementById('aboutModal'); if(m) return m;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    m = document.createElement('div'); m.className = 'abm'; m.id = 'aboutModal'; m.innerHTML = HTML; document.body.appendChild(m);
    var close = function(){ m.classList.remove('open'); document.body.style.overflow = ''; };
    m.querySelector('.x').addEventListener('click', close);
    m.addEventListener('click', function(e){ if(e.target === m) close(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });
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
  var EN = /^en\b/i.test(document.documentElement.lang || '');
  var T = EN ? {
    close: 'Close', ok: 'Got it', copied: '✓ Link copied', share: 'Share button',
    already: 'The app is already on your home screen. 👍', adding: 'Adding it now! In a moment you will find it on your home screen or in your app list.',
    appTitle: 'Open it in your browser first',
    appBody: '<p>Apps cannot be added from the browser inside Facebook or Messenger. Open this page in your real browser:</p><ol>',
    appIOS: '<li>Tap <b>⋯</b> at the bottom or top, then choose <b>Open in Safari</b>.</li>',
    appAndroid: '<li>Tap <b>⋮</b> (three dots) at the top right, then choose <b>Open in browser</b> or <b>Open in Chrome</b>.</li>',
    appAgain: '<li>Once the page is open in your browser, tap <b>📲 Add to home screen</b> at the bottom again.</li></ol><button class="ghost" type="button" id="inmCopy">🔗 Copy the link</button>',
    iosTitle: 'Add it to your iPhone home screen',
    iosBody: function(ic){ return '<p>No app store needed: it is on your home screen in 3 steps.</p><ol>'
      + '<li>Tap the browser\'s <b>Share</b> button ' + ic + ' (usually at the bottom on an iPhone, at the top on an iPad).</li>'
      + '<li>Scroll down the list a little and choose <b>Add to Home Screen</b>.</li>'
      + '<li>Tap <b>Add</b> at the top right. The app\'s icon will appear on your home screen.</li></ol>'; },
    other: 'Open the browser menu (⋮) and choose "Install app" or "Add to Home screen". No app store needed.',
    installed: 'Added as an app. You can open it straight from your home screen.'
  } : {
    close: 'বন্ধ করুন', ok: 'বুঝেছি', copied: '✓ লিংক কপি হয়েছে', share: 'Share বোতাম',
    already: 'অ্যাপটি এরই মধ্যে আপনার হোম স্ক্রিনে আছে। 👍', adding: 'যোগ হচ্ছে! একটু পরে হোম স্ক্রিন বা অ্যাপের তালিকায় "ঘুরে দেখা" পাবেন।',
    appTitle: 'আগে ব্রাউজারে খুলুন',
    appBody: '<p>ফেসবুক বা মেসেঞ্জারের ভেতরের ব্রাউজার থেকে অ্যাপ যোগ করা যায় না। পাতাটা আসল ব্রাউজারে খুলে নিন:</p><ol>',
    appIOS: '<li>নিচে বা ওপরে <b>⋯</b> চাপুন, তারপর <b>Open in Safari</b> (Safari-তে খুলুন) বেছে নিন।</li>',
    appAndroid: '<li>ওপরের ডান কোণে <b>⋮</b> (তিন ফোঁটা) চাপুন, তারপর <b>Open in browser</b> বা <b>Chrome-এ খুলুন</b> বেছে নিন।</li>',
    appAgain: '<li>ব্রাউজারে পাতাটা খুললে নিচের <b>📲 অ্যাপ হিসেবে রাখুন</b> আবার চাপুন।</li></ol><button class="ghost" type="button" id="inmCopy">🔗 লিংক কপি করুন</button>',
    iosTitle: 'আইফোনে অ্যাপ হিসেবে রাখুন',
    iosBody: function(ic){ return '<p>অ্যাপ স্টোর লাগবে না, ৩ ধাপেই হোম স্ক্রিনে চলে আসবে:</p><ol>'
      + '<li>ব্রাউজারের <b>Share</b> বোতাম ' + ic + ' চাপুন (আইফোনে সাধারণত নিচে, আইপ্যাডে ওপরে)।</li>'
      + '<li>তালিকা একটু নিচে নামিয়ে <b>Add to Home Screen</b> (হোম স্ক্রিনে যোগ করুন) বেছে নিন।</li>'
      + '<li>ওপরে ডানে <b>Add</b> চাপুন। হোম স্ক্রিনে "ঘুরে দেখা" আইকন চলে আসবে।</li></ol>'; },
    other: 'ব্রাউজারের মেনু (⋮) খুলে "Install app" বা "Add to Home screen" (হোম স্ক্রিনে যোগ করুন) বেছে নিন। অ্যাপ স্টোর লাগবে না।',
    installed: 'অ্যাপ হিসেবে যোগ হয়েছে। হোম স্ক্রিন থেকেই খুলতে পারবেন।'
  };
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
    + '.inm li::before{content:counter(s,' + (EN ? 'decimal' : 'bengali') + ');position:absolute;left:0;top:0;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--accent,#0F7F4C);color:var(--bg,#fff);font-weight:700;font-size:14px}'
    + '.inm .ic{display:inline-block;vertical-align:-4px;width:20px;height:20px;margin:0 2px}'
    + '.inm .ok{margin-top:18px;width:100%;font:inherit;font-weight:700;font-size:16px;padding:12px;border-radius:12px;border:0;background:var(--accent,#0F7F4C);color:var(--bg,#fff);cursor:pointer}'
    + '.inm .ghost{margin-top:8px;width:100%;font:inherit;font-weight:600;font-size:15px;padding:11px;border-radius:12px;border:1px solid var(--line,#D6DED8);background:transparent;color:inherit;cursor:pointer}';
  var SHARE_IC = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="' + T.share + '"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><rect x="5" y="10" width="14" height="11" rx="2"/></svg>';
  function sheet(title, bodyHtml, extra){
    var m = document.getElementById('installModal');
    if(!m){
      var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
      m = document.createElement('div'); m.className = 'inm'; m.id = 'installModal';
      m.innerHTML = '<div class="box" role="dialog" aria-modal="true" aria-labelledby="inmTitle"><button class="x" type="button" aria-label="' + T.close + '">✕</button><div class="hd"><img src="/icon-192.png" alt="" width="52" height="52"><h2 id="inmTitle"></h2></div><div class="bd"></div><button class="ok" type="button">' + T.ok + '</button></div>';
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
    var done = function(ok){ btn.textContent = ok ? T.copied : url; };
    window.gdCopy(url).then(done);
  }
  async function install(){
    track('InstallClick');
    if(standalone()){ note(T.already, 3500); return; }
    if(deferred){
      var ev = deferred;
      try{
        var r = await ev.prompt(); deferred = null;
        var c = (r && r.outcome) ? r : await ev.userChoice;
        if(c && c.outcome === 'accepted'){ track('InstallAccepted'); note(T.adding); }
        return;
      }catch(e){ /* no user gesture (e.g. opened with #install): fall back to the written steps */ }
    }
    if(inApp){
      sheet(T.appTitle, T.appBody + (isIOS ? T.appIOS : T.appAndroid) + T.appAgain,
        function(m){ var b = m.querySelector('#inmCopy'); if(b) b.addEventListener('click', function(){ copyLink(b); }); });
      return;
    }
    if(isIOS){
      sheet(T.iosTitle, T.iosBody(SHARE_IC));
      return;
    }
    note(T.other, 8000);
  }
  document.addEventListener('click', function(e){ var a = e.target.closest && e.target.closest('a[href="#install"]'); if(a){ e.preventDefault(); install(); } });
  window.addEventListener('appinstalled', function(){ deferred = null; hideLinks(); track('AppInstalled'); note(T.installed, 4500); });
  function boot(){ if(standalone()) hideLinks(); if(location.hash === '#install') setTimeout(install, 400); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

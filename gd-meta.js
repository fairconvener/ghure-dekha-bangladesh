/* ঘুরে দেখা বাংলাদেশ - Meta Pixel ও সাইটের ইভেন্ট।
 * প্রতিটি পেজের <head>-এ শুধু এই এক লাইন:  <script src="/gd-meta.js" defer></script>
 * Dataset: "Ghure Dekha Bangladesh" (1625497289119639), Fair Convener business; FC ad accounts use its audiences.
 * Events: PageView on every page, plus custom events MapStart, PhotoAdded, MapDownload, MapShare,
 * GuideRead, Engaged30s. Custom (not Lead/Purchase) so other campaigns' optimisation stays clean.
 * Nothing personal is sent: no names, photos or place lists - only counts, the page type and a guide's district slug.
 * Other code can send its own event: window.gdTrack('EventName', {key: 'value'}).
 * Visitors can switch tracking off on /privacy (localStorage gd-no-track = 1).
 * After a map download (MapDownload, or the download/save buttons) a small card asks people to follow the site's Facebook
 * page: at most once a day, never again after a tap on Follow, and only once no download/share sheet is open.
 * That card does not depend on tracking being on.
 * English pages live under /en (/en, /en/jela/x ...): the page type is the same as the Bangla twin's and every event
 * carries lang: 'bn' or 'en'.
 */
(function () {
  'use strict';
  if (window.gdTrack) return;
  var PIXEL_ID = '1625497289119639';
  var raw = location.pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
  var LANG = /^\/en(\/|$)/.test(raw) ? 'en' : 'bn';
  var path = LANG === 'en' ? (raw.slice(3) || '/') : raw;  // the Bangla twin's path decides the page type
  var PAGE = path === '/' || path === '/index' ? 'bd'
    : /^\/m\//.test(path) ? 'shared'
    : /^\/jela\/[^/]+/.test(path) ? 'guide'
    : (path.slice(1).split('/')[0] || 'other');

  // every page that uses the pixel links to the privacy page
  function privacyLink() {
    if (PAGE === 'privacy' || document.querySelector('a[href="/privacy"],a[href="/en/privacy"]')) return;
    var f = document.querySelector('footer'); if (!f) return;
    var box = f.querySelector('.wrap') || f, d = document.createElement('div');
    d.className = 'gd-privacy';
    d.innerHTML = LANG === 'en' ? '<a href="/en/privacy" style="color:inherit">Privacy and cookie policy</a>' : '<a href="/privacy" style="color:inherit">প্রাইভেসি ও কুকি নীতি</a>';
    box.appendChild(d);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', privacyLink); else privacyLink();

  /* the "follow our Facebook page" card after a download */
  var FB_PAGE = 'https://www.facebook.com/profile.php?id=61594879211002';
  var nudgeT = 0, nudgeTries = 0;
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function followNudge() {
    if (PAGE === 'admin' || lsGet('gd-fb-follow') === '1') return;
    if (Date.now() - (+lsGet('gd-fb-nudge') || 0) < 864e5) return;
    clearTimeout(nudgeT); nudgeTries = 0; nudgeT = setTimeout(showNudge, 1800);
  }
  function showNudge() {
    if (document.getElementById('gdFollow')) return;
    if (document.querySelector('.modal.open') && nudgeTries++ < 40) { nudgeT = setTimeout(showNudge, 1500); return; }
    lsSet('gd-fb-nudge', String(Date.now()));
    var en = LANG === 'en', box = document.createElement('div');
    box.id = 'gdFollow'; box.setAttribute('role', 'status');
    box.style.cssText = 'position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483000;width:calc(100% - 24px);max-width:440px;box-sizing:border-box;'
      + 'background:#fff;color:#14231b;border:1px solid rgba(0,0,0,.08);border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.22);padding:14px 14px 13px 14px;'
      + 'font:500 15px/1.45 "Hind Siliguri",system-ui,-apple-system,sans-serif;opacity:0;transition:opacity .25s,transform .25s';
    box.innerHTML = '<button type="button" data-x aria-label="' + (en ? 'Close' : 'বন্ধ করুন') + '" style="position:absolute;top:4px;right:6px;border:0;background:none;font-size:24px;line-height:1;color:#6b7470;cursor:pointer;padding:6px 8px">&times;</button>'
      + '<div style="display:flex;gap:12px;align-items:flex-start">'
      + '<div aria-hidden="true" style="flex:none;width:44px;height:44px;border-radius:50%;background:#e8f0fe;display:flex;align-items:center;justify-content:center;font-size:22px">👍</div>'
      + '<div style="flex:1;min-width:0;padding-right:20px"><b style="display:block;font-size:16px;margin-bottom:2px">' + (en ? '✅ Your map is ready!' : '✅ ম্যাপ তৈরি!') + '</b>'
      + '<span>' + (en ? 'Follow our Facebook page for new maps, travel tips and tour offers.' : 'নতুন ম্যাপ, ভ্রমণ টিপস আর ট্যুর অফারের খবর পেতে আমাদের ফেসবুক পেজ ফলো করুন।') + '</span>'
      + '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">'
      + '<a href="' + FB_PAGE + '" target="_blank" rel="noopener" data-f style="background:#1877F2;color:#fff;text-decoration:none;font-weight:700;padding:9px 18px;border-radius:999px">' + (en ? '👍 Follow the page' : '👍 পেজ ফলো করুন') + '</a>'
      + '<button type="button" data-x style="border:1px solid #d6ddd9;background:#fff;color:#33403a;font:inherit;font-weight:600;padding:8px 16px;border-radius:999px;cursor:pointer">' + (en ? 'Later' : 'পরে') + '</button>'
      + '</div></div></div>';
    document.body.appendChild(box);
    requestAnimationFrame(function () { box.style.opacity = '1'; });
    var gone = false, close = function () { if (gone) return; gone = true; box.style.opacity = '0'; setTimeout(function () { box.remove(); }, 300); };
    box.querySelectorAll('[data-x]').forEach(function (b) { b.addEventListener('click', close); });
    box.querySelector('[data-f]').addEventListener('click', function () { lsSet('gd-fb-follow', '1'); try { window.gdTrack('FollowPage', {}); } catch (e) {} setTimeout(close, 400); });
    setTimeout(close, 25000);
  }
  window.gdFollowNudge = followNudge;
  /* the format sheet and the share window's save button download without calling gdTrack (they are counted below by id) */
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('#dlPng,#dlJpg,#dlPdf,#shareSave') : null;
    if (t) followNudge();
  }, true);

  window.gdTrack = function (name) { if (name === 'MapDownload') followNudge(); };
  var live = /^https?:$/.test(location.protocol) && /(^|\.)ghuredekha(bangladesh)?\.com$/.test(location.hostname);
  var off = false;
  try { off = localStorage.getItem('gd-no-track') === '1'; } catch (e) {}
  if (!live || off) return;

  /* Meta Pixel base code */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('set', 'autoConfig', false, PIXEL_ID); // no automatic button-click events (they would send button text, e.g. district names)
  fbq('init', PIXEL_ID);
  fbq('track', 'PageView');

  var sentNow = {};
  function seen(key) { // once per browser session
    try { if (sessionStorage.getItem('gdev-' + key)) return true; sessionStorage.setItem('gdev-' + key, '1'); return false; }
    catch (e) { if (sentNow[key]) return true; sentNow[key] = 1; return false; }
  }
  function track(name, params, onceKey) {
    if (onceKey && seen(onceKey)) return;
    var p = { page: PAGE, lang: LANG }, k;
    params = params || {};
    for (k in params) if (params[k] !== undefined && params[k] !== null) p[k] = params[k];
    try { fbq('trackCustom', name, p, { eventID: name + '.' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7) }); } catch (e) {}
  }
  window.gdTrack = function (name, params) { if (name) { track(String(name), params); if (name === 'MapDownload') followNudge(); } };

  /* map pages (/, /world, /upazila) expose window.__gdb.state */
  function st() { var g = window.__gdb; return g && g.state ? g.state : null; }
  function count() { var s = st(); return s && s.selected ? s.selected.size : undefined; }
  function photo() { var s = st(); return s ? !!s.photo : undefined; }
  function picked() { var s = st(); return s ? (s.selected ? s.selected.size : 0) + (s.wish ? s.wish.size : 0) : null; }
  var base = picked();
  function check() {
    var n = picked(); if (n === null) return;
    if (base === null) base = n;
    if (n > base) track('MapStart', { count: count() }, 'MapStart-' + PAGE);
  }
  function later() { setTimeout(check, 0); }

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('a,button') : null;
    if (t) {
      var id = t.id || '', href = t.getAttribute('href') || '';
      if (id === 'dlPng' || id === 'dlJpg' || id === 'dlPdf' || id === 'shareSave') {
        track('MapDownload', { format: id === 'shareSave' ? 'png' : id.slice(2).toLowerCase(), count: count(), has_photo: photo() });
      } else if (id === 'sharePost' || /facebook\.com\/sharer/.test(href)) {
        track('MapShare', { count: count(), has_photo: photo() });
      }
    }
    later();
  }, true);
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t && t.id === 'photoInput' && t.files && t.files.length) track('PhotoAdded', {}, 'PhotoAdded-' + PAGE);
    later();
  }, true);
  document.addEventListener('keyup', later, true);

  /* district guide pages: read at least half the page */
  if (PAGE === 'guide') {
    var slug = path.split('/')[2] || '';
    var onScroll = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (h > 0 && window.scrollY / h < 0.5) return;
      window.removeEventListener('scroll', onScroll);
      track('GuideRead', { district: slug }, 'GuideRead-' + slug);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* 30 seconds with the page visible */
  var visible = 0, timer = setInterval(function () {
    if (document.visibilityState === 'visible') visible += 5;
    if (visible >= 30) { clearInterval(timer); track('Engaged30s', {}); }
  }, 5000);
})();

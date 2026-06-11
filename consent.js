/* BetterClean marketing consent + ad pixels (Meta Pixel, Google Tag).
   GDPR: pixels load only after the visitor clicks accept. If both IDs below
   are empty, nothing loads and no banner is shown — safe to deploy as-is. */
(function () {
  var META_PIXEL_ID = '';   // Meta Events Manager > Data sources > Pixel ID
  var GOOGLE_TAG_ID = '';   // Google Ads tag (AW-XXXXXXXXX) or GA4 (G-XXXXXXXXXX)

  var KEY = 'bc_marketing_consent';

  function loadPixels() {
    if (META_PIXEL_ID) {
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
        n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', META_PIXEL_ID);
      window.fbq('track', 'PageView');
    }
    if (GOOGLE_TAG_ID) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GOOGLE_TAG_ID;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', GOOGLE_TAG_ID);
    }
  }

  /* Called by the quote form after a successful submission. */
  window.bcTrackLead = function () {
    try {
      if (localStorage.getItem(KEY) !== 'granted') return;
      if (window.fbq) window.fbq('track', 'Lead');
      if (window.gtag) window.gtag('event', 'generate_lead');
    } catch (e) { /* tracking must never break the form */ }
  };

  if (!META_PIXEL_ID && !GOOGLE_TAG_ID) return;

  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) { return; }
  if (choice === 'granted') { loadPixels(); return; }
  if (choice === 'denied') return;

  function decide(granted) {
    try { localStorage.setItem(KEY, granted ? 'granted' : 'denied'); } catch (e) {}
    var el = document.getElementById('bcConsentBar');
    if (el) el.remove();
    if (granted) loadPixels();
  }

  function showBanner() {
    var bar = document.createElement('div');
    bar.id = 'bcConsentBar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Evästeet');
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9999;' +
      'background:#1a2e1a;color:#fff;padding:16px 20px;display:flex;flex-wrap:wrap;' +
      'gap:12px;align-items:center;justify-content:center;font-family:Inter,sans-serif;' +
      'font-size:0.9rem;line-height:1.5;box-shadow:0 -4px 16px rgba(0,0,0,0.2);';
    bar.innerHTML =
      '<span style="max-width:560px;">Käytämme evästeitä markkinointiin ja mainonnan kohdentamiseen. ' +
      '<span style="opacity:0.75;">We use cookies for marketing and ad targeting.</span> ' +
      '<a href="/privacy-policy.html" style="color:#3aaa35;text-decoration:underline;">Tietosuojaseloste</a></span>' +
      '<span style="display:flex;gap:10px;">' +
      '<button id="bcConsentAccept" style="background:#3aaa35;color:#fff;border:none;border-radius:8px;' +
      'padding:10px 18px;font-family:Sora,sans-serif;font-weight:700;cursor:pointer;' +
      'box-shadow:0 4px 16px rgba(58,170,53,0.28);">Hyväksy</button>' +
      '<button id="bcConsentDecline" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.4);' +
      'border-radius:8px;padding:10px 18px;font-family:Sora,sans-serif;font-weight:700;cursor:pointer;">' +
      'Vain välttämättömät</button></span>';
    document.body.appendChild(bar);
    document.getElementById('bcConsentAccept').addEventListener('click', function () { decide(true); });
    document.getElementById('bcConsentDecline').addEventListener('click', function () { decide(false); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }
})();

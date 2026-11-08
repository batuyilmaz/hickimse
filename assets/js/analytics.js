/* hiç kimse — Google Tag Manager / Analytics.
   Varsayılan açık, çerez bandı yok. Ziyaretçi sonradan "Privacy settings" penceresinden kapatabilir.
   Tarayıcı Global Privacy Control / Do Not Track gönderiyorsa, kullanıcı başka seçim yapmadıkça kapalı sayılır. */
(() => {
'use strict';
const GTM_ID = 'GTM-PB6CHT89';
const KEY = 'hk.consent';

const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* özel mod vb. */ } }
};

/* GTM'in verdiği ortak başlangıç */
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
window.gtag = gtag;

/* Consent Mode: reklam depolaması hiçbir zaman verilmez; analiz yalnızca açıkken verilir */
gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });

let loaded = false;
let state = null; // 'granted' | 'denied'
const listeners = [];

function clearGaCookies() {
  const names = document.cookie.split(';').map(c => c.split('=')[0].trim()).filter(n => n === '_ga' || n.startsWith('_ga_') || n === '_gid' || n.startsWith('_gat'));
  if (!names.length) return;
  const parts = location.hostname.split('.');
  const scopes = [''];
  for (let i = 0; i < parts.length - 1; i++) {
    const d = parts.slice(i).join('.');
    scopes.push('; domain=' + d, '; domain=.' + d);
  }
  names.forEach(n => scopes.forEach(s => {
    document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + s + '; SameSite=Lax';
  }));
}

function start() {
  gtag('consent', 'update', { analytics_storage: 'granted' });
  if (loaded) return;
  loaded = true;
  gtag('js', new Date());
  dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(GTM_ID);
  document.head.appendChild(s);
}

function stop() {
  if (loaded) gtag('consent', 'update', { analytics_storage: 'denied' });
  clearGaCookies();
}

function set(v, persist) {
  state = v;
  if (persist) store.set(KEY, v);
  if (v === 'granted') start(); else stop();
  listeners.forEach(f => f(v));
}

/* Başlangıç: kayıtlı seçim → GPC/DNT (kapalı) → varsayılan açık */
const saved = store.get(KEY);
const optOut = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
set(saved === 'granted' || saved === 'denied' ? saved : (optOut ? 'denied' : 'granted'), false);

window.hkPrivacy = {
  get: () => state,
  set: v => set(v, true),
  onChange: f => { listeners.push(f); },
  optOut,
  chosen: () => store.get(KEY) === 'granted' || store.get(KEY) === 'denied'
};

/* Olay gönderimi (GTM dataLayer olayı): kapalıyken hiçbir şey yapmaz */
window.hkTrack = (name, params) => {
  if (state === 'granted') dataLayer.push(Object.assign({ event: name }, params || {}));
};
document.addEventListener('click', e => {
  const t = e.target.closest('[data-track]');
  if (t) window.hkTrack(t.dataset.track, t.dataset.label ? { label: t.dataset.label } : {});
});
})();

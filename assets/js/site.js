/* hiç kimse — ortak betik: tema, arka plan, isim animasyonu, iletişim paneli, bildirim */
(() => {
'use strict';

const root = document.documentElement;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = matchMedia('(hover: hover)').matches;
const wait = ms => new Promise(r => setTimeout(r, ms));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* özel mod vb. */ } }
};
const awake = () => new Promise(res => {
  if (!document.hidden) return res();
  const f = () => { if (!document.hidden) { document.removeEventListener('visibilitychange', f); res(); } };
  document.addEventListener('visibilitychange', f);
});
const EMAIL = ($('meta[name="contact"]') || {}).content || 'adaptivesubject@gmail.com';

/* ==========================================================================
   Hafif mod: zayıf cihaz / veri tasarrufu / düşük kare hızında ağır efektleri kapatır.
   Denemek için adrese ?lite=1 (zorla aç) ya da ?lite=0 (otomatik algılamayı kapat) eklenebilir.
   ========================================================================== */
(() => {
  const forced = new URLSearchParams(location.search).get('lite');
  const conn = navigator.connection || {};
  const weak = conn.saveData === true || (navigator.deviceMemory || 8) <= 2 || (navigator.hardwareConcurrency || 8) <= 2;
  if (forced === '1' || (forced !== '0' && weak)) { root.classList.add('lite'); return; }
  if (forced === '0' || reduce) return;
  const t0 = performance.now();
  let last = 0, sum = 0, n = 0;
  const tick = t => {
    if (document.hidden) { last = 0; requestAnimationFrame(tick); return; }
    if (last && t - t0 > 1500) { sum += t - last; n++; }
    last = t;
    if (n >= 90) { if (sum / n > 28) root.classList.add('lite'); return; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();

/* ==========================================================================
   Bildirim ve kopyalama
   ========================================================================== */
let toastEl = $('#toast');
if (!toastEl) {
  toastEl = document.createElement('div');
  toastEl.id = 'toast';
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastEl);
}
let toastTimer = 0;
function toast(msg, ms = 2600) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* eski tarayıcı ya da izin yok */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    (document.querySelector('dialog[open]') || document.body).appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (e) { return false; }
}
window.hk = { toast, copy, EMAIL, reduce, store };

/* ==========================================================================
   Tema
   ========================================================================== */
function applyTheme(t, persist) {
  root.dataset.theme = t;
  if (persist) store.set('hk.theme', t);
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.content = (t === 'dark' || root.dataset.page === 'outis') ? '#090f24' : '#f1f5fa';
  $$('[data-theme-toggle]').forEach(b => b.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'));
  window.dispatchEvent(new Event('hk:theme'));
}
$$('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true)));
applyTheme(root.dataset.theme || 'light', false);

/* Üst bilgi: kaydırınca ince çizgi + okuma ilerlemesi */
const header = $('.site-header');
if (header) {
  const bar = document.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  header.appendChild(bar);
  let tick = false;
  const onScroll = () => {
    header.classList.toggle('is-stuck', scrollY > 6);
    if (tick) return;
    tick = true;
    requestAnimationFrame(() => {
      tick = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0).toFixed(4) + ')';
    });
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
}

/* Başa dön */
$$('[data-top]').forEach(b => b.addEventListener('click', () => {
  scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  if (history.replaceState && location.hash) history.replaceState(null, '', location.pathname + location.search);
}));

/* Tıklama dalgası: boş bir yere basınca arka planda kısa bir halka açılır */
if (!reduce) {
  addEventListener('pointerdown', e => {
    if (e.button || root.classList.contains('lite') || e.target.closest('a,button,input,select,textarea,summary,dialog,[role="button"],.tree-wrap,.table-wrap')) return;
    const r = document.createElement('span');
    r.className = 'ripple';
    r.style.left = e.clientX + 'px';
    r.style.top = e.clientY + 'px';
    r.addEventListener('animationend', () => r.remove());
    amb.appendChild(r);
  }, { passive: true });
}

/* ==========================================================================
   Arka plan: küreler, nokta ızgarası, ağ ve imleç ışığı
   ========================================================================== */
const amb = document.createElement('div');
amb.className = 'ambient';
amb.setAttribute('aria-hidden', 'true');
amb.innerHTML = '<div class="orb orb--a"></div><div class="orb orb--b"></div><div class="orb orb--c"></div><div class="dots"></div><canvas class="net"></canvas><div class="glow"></div>';
document.body.prepend(amb);

const ptr = { x: innerWidth / 2, y: innerHeight * .4, on: false, dirty: false };
const glow = $('.glow', amb);
const setPtr = e => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = e.pointerType === 'mouse' || e.pointerType === 'pen' || e.type === 'pointerdown'; ptr.dirty = true; };
addEventListener('pointermove', setPtr, { passive: true });
addEventListener('pointerdown', setPtr, { passive: true });
addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') ptr.on = false; }, { passive: true });
root.addEventListener('mouseleave', () => { ptr.on = false; });

const cv = $('.net', amb), ctx = cv.getContext('2d');
let W = 0, H = 0, nodes = [], palette = ['#2a78d6', '#6250d6', '#1baf7a'];
const calm = root.hasAttribute('data-calm');
function readPalette() {
  const cs = getComputedStyle(root);
  palette = ['--net-a', '--net-b', '--net-c'].map(v => cs.getPropertyValue(v).trim() || '#888');
}
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const n = (W < 600 ? 20 : 42) * (calm ? .7 : 1) | 0;
  if (nodes.length !== n) {
    nodes = Array.from({ length: n }, (_, i) => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .42, vy: (Math.random() - .5) * .42,
      r: 1.4 + (i % 3) * .55, c: i % 3
    }));
  }
  if (reduce) drawNet(false);
}
function drawNet(step = true) {
  ctx.clearRect(0, 0, W, H);
  const max = W < 600 ? 110 : 150;
  ctx.lineWidth = .9;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (step) {
      if (ptr.on) {
        const dx = ptr.x - n.x, dy = ptr.y - n.y, d = Math.hypot(dx, dy);
        if (d < 170 && d > 1) { const f = (170 - d) / 170 * .07; n.vx -= dx / d * f; n.vy -= dy / d * f; }
      }
      n.vx *= .99; n.vy *= .99;
      if (Math.hypot(n.vx, n.vy) < .16) { n.vx += (Math.random() - .5) * .07; n.vy += (Math.random() - .5) * .07; }
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) { n.vx *= -1; n.x = Math.max(0, Math.min(W, n.x)); }
      if (n.y < 0 || n.y > H) { n.vy *= -1; n.y = Math.max(0, Math.min(H, n.y)); }
    }
    ctx.fillStyle = ctx.strokeStyle = palette[n.c];
    ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.283); ctx.fill();
    for (let j = i + 1; j < nodes.length; j++) {
      const m = nodes[j], d = Math.hypot(n.x - m.x, n.y - m.y);
      if (d < max) {
        ctx.globalAlpha = (1 - d / max) * .5;
        ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
  // İmleç yakındaki düğümlere ince çizgilerle bağlanır
  if (step && ptr.on) {
    ctx.fillStyle = ctx.strokeStyle = palette[0];
    for (const n of nodes) {
      const d = Math.hypot(n.x - ptr.x, n.y - ptr.y);
      if (d < 170) { ctx.globalAlpha = (1 - d / 170) * .65; ctx.beginPath(); ctx.moveTo(ptr.x, ptr.y); ctx.lineTo(n.x, n.y); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
  }
}
readPalette();
resize();
addEventListener('resize', resize, { passive: true });
window.addEventListener('hk:theme', () => { readPalette(); if (reduce) drawNet(false); });

const kineticHooks = [];
// Kaydırma ilerlemesi (0–1) yumuşatılır ve CSS'e --sp olarak verilir: arka plan sayfayla birlikte değişir
let spT = 0, spV = 0, spLast = -1;
const readSp = () => { const m = document.documentElement.scrollHeight - innerHeight; spT = m > 0 ? Math.min(1, Math.max(0, scrollY / m)) : 0; };
addEventListener('scroll', readSp, { passive: true });
addEventListener('resize', readSp, { passive: true });
readSp();
(function frame() {
  if (!reduce) {
    spV += (spT - spV) * .08;
    if (Math.abs(spV - spLast) > .0004) { spLast = spV; root.style.setProperty('--sp', spV.toFixed(4)); }
  }
  if (ptr.dirty) {
    ptr.dirty = false;
    glow.style.setProperty('--gx', ptr.x + 'px');
    glow.style.setProperty('--gy', ptr.y + 'px');
  }
  if (!reduce) {
    if (!document.hidden && !root.classList.contains('lite')) drawNet(true);
    kineticHooks.forEach(f => f());
  }
  requestAnimationFrame(frame);
})();

/* Plaka üzerinde imleç ışığı */
$$('.plate').forEach(el => {
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
});

/* ==========================================================================
   Kayan parçalar: sayı kökleri ve "hiç kimse" kavramı (yalnızca html[data-fragments])
   ========================================================================== */
if (root.hasAttribute('data-fragments') && !reduce && root.dataset.fragments !== 'none') {
  const wrap = document.createElement('div');
  wrap.className = 'fragments';
  wrap.setAttribute('aria-hidden', 'true');
  document.body.prepend(wrap);
  const SETS = { odyssey: ['Οὖτις • nobody', 'Πολύφημος', 'οἶνοψ πόντος', 'hiç kimse', 'νόστος • return', 'μῆτις • cunning', 'nemo', 'Ὀδυσσεύς', 'Κύκλωψ', 'Ἰθάκη'] };
  const FRAGS = SETS[root.dataset.fragments] || ['*hoikʷ • 1', '*kekʷ • 2', 'Οὖτις • nobody', '*kwed • 3', '*thtp • 4', 'nemo • nobody', '*penh • 5', '𐰇𐰔 • öz',
    '*hetp • 6', 'hiç kimse • nobody', '*sept • 7', '*ter • 10'];
  let k = 0;
  setInterval(() => {
    if (document.hidden || root.classList.contains('lite')) return;
    const f = document.createElement('div');
    f.className = 'frag';
    f.textContent = FRAGS[k++ % FRAGS.length];
    f.style[Math.random() > .5 ? 'left' : 'right'] = (3 + Math.random() * 12) + 'vw';
    f.style.top = (14 + Math.random() * 72) + 'vh';
    f.addEventListener('animationend', () => f.remove());
    wrap.appendChild(f);
  }, 4000);
}

/* ==========================================================================
   İsim: çözülme + imleçle kinetik tipografi ([data-cycle="a|b|c"])
   ========================================================================== */
const CIPHER = Array.from('ʔʃθχŋɣħʕɐɵɛʁ');
$$('[data-cycle]').forEach(el => {
  const words = el.dataset.cycle.split('|');
  const auto = el.hasAttribute('data-auto');
  let idx = 0, chars = [], busy = false, touched = false;

  function build(text) {
    el.textContent = '';
    chars = Array.from(text).map(ch => {
      const s = document.createElement('span');
      s.className = 'k';
      s.textContent = ch;
      s._x = s._y = 0;
      el.appendChild(s);
      return s;
    });
  }
  async function show(text, quick) {
    if (busy) return;
    busy = true;
    build(text);
    if (!reduce && !quick) {
      const target = Array.from(text);
      for (let step = 0; step < 11; step++) {
        chars.forEach((s, i) => {
          if (target[i] === ' ') return;
          s.textContent = step >= 4 + i % 5 ? target[i] : CIPHER[Math.floor(Math.random() * CIPHER.length)];
        });
        await wait(40);
      }
      chars.forEach((s, i) => { s.textContent = target[i]; });
    }
    busy = false;
  }
  const next = () => { if (busy) return; idx = (idx + 1) % words.length; show(words[idx]); };
  el.addEventListener('click', () => { touched = true; next(); });
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); touched = true; next(); } });

  if (!reduce) {
    kineticHooks.push(() => {
      if (!chars.length) return;
      const settled = !chars.some(s => Math.abs(s._x) > .05 || Math.abs(s._y) > .05);
      if (!ptr.on && settled) return;
      const r = el.getBoundingClientRect(), R = 110;
      for (const s of chars) {
        let tx = 0, ty = 0, hot = false;
        if (ptr.on) {
          const dx = ptr.x - (r.left + s.offsetLeft + s.offsetWidth / 2);
          const dy = ptr.y - (r.top + s.offsetTop + s.offsetHeight / 2);
          const d = Math.hypot(dx, dy);
          if (d < R && d > .1) { const p = Math.pow((R - d) / R, 1.5); tx = -dx / d * p * 9; ty = -dy / d * p * 9; hot = true; }
        }
        s._x += (tx - s._x) * .18;
        s._y += (ty - s._y) * .18;
        s.style.transform = 'translate3d(' + s._x.toFixed(2) + 'px,' + s._y.toFixed(2) + 'px,0)';
        s.classList.toggle('hot', hot);
      }
    });
  }

  (async () => {
    await wait(reduce ? 0 : 450);
    await show(words[0], reduce);
    if (auto && !reduce) {
      for (let i = 1; i < words.length && !touched; i++) {
        await wait(2600);
        await awake();
        if (touched) break;
        idx = i;
        await show(words[i]);
      }
      if (!touched) { await wait(2600); idx = 0; await show(words[0]); }
    }
  })();
});

/* ==========================================================================
   Daktilo satırı ([data-typed='["a","b"]'])
   ========================================================================== */
$$('[data-typed]').forEach(el => {
  let phrases;
  try { phrases = JSON.parse(el.dataset.typed); } catch (e) { return; }
  if (reduce || !phrases.length) return;
  (async () => {
    await wait(1100);
    el.textContent = '';
    for (let i = 0; ; i++) {
      await awake();
      const p = phrases[i % phrases.length];
      for (const ch of p) { el.textContent += ch; await wait(46 * (.7 + Math.random() * .6)); }
      await wait(2600);
      while (el.textContent) { el.textContent = el.textContent.slice(0, -1); await wait(18); }
      await wait(320);
    }
  })();
});

/* ==========================================================================
   Sayaçlar ([data-count]): görünür olunca sayar
   ========================================================================== */
$$('[data-count]').forEach(el => {
  const to = Number(el.dataset.count);
  if (reduce || !('IntersectionObserver' in window) || !Number.isFinite(to)) return;
  el.textContent = '0';
  const io = new IntersectionObserver(es => {
    if (!es.some(e => e.isIntersecting)) return;
    io.disconnect();
    const t0 = performance.now(), dur = 1100;
    (function step(t) {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }, { threshold: .6 });
  io.observe(el);
});

/* ==========================================================================
   İletişim paneli
   ========================================================================== */
const dlg = $('#contact');
if (dlg) {
  $$('[data-contact]').forEach(a => a.addEventListener('click', e => {
    if (typeof dlg.showModal !== 'function' || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button) return;
    e.preventDefault();
    dlg.showModal();
  }));
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  const btn = $('#contactCopy');
  if (btn) btn.addEventListener('click', async () => {
    const lbl = $('.lbl', btn);
    const ok = await copy(EMAIL);
    lbl.textContent = ok ? 'Copied' : 'Copy failed. Select the address above.';
    setTimeout(() => { lbl.textContent = 'Copy address'; }, 2200);
  });
}
/* ==========================================================================
   Gizlilik ayarları (istatistik açık/kapalı)
   ========================================================================== */
const pdlg = $('#privacy');
if (pdlg) {
  // Ölçüm betiği (measure.js) bir reklam/izleme engelleyici tarafından kapatılmış olabilir; pencere yine de açılmalı.
  const HP = window.hkPrivacy;
  const sw = $('#statsSwitch'), st = $('#statsState'), note = $('#statsNote');
  const paint = v => {
    const on = v === 'granted';
    sw.setAttribute('aria-checked', String(on));
    st.textContent = on ? 'On' : 'Off';
    note.textContent = !HP
      ? 'Off. The measurement script did not load (a content blocker may be active), so nothing is being measured.'
      : on
        ? 'Visits are being counted. Turn this off and no further measurements are sent.'
        : (HP.optOut && !HP.chosen() ? 'Off, because your browser sends a privacy signal (Global Privacy Control or Do Not Track).' : 'Off. Nothing is being measured and the analytics cookies were deleted.');
  };
  paint(HP ? HP.get() : 'denied');
  if (HP) {
    HP.onChange(paint);
    sw.addEventListener('click', () => { HP.set(sw.getAttribute('aria-checked') === 'true' ? 'denied' : 'granted'); });
  } else {
    sw.disabled = true;
  }
  const open = () => { if (typeof pdlg.showModal === 'function') { if (!pdlg.open) pdlg.showModal(); } else pdlg.setAttribute('open', ''); };
  // Olay yetkilendirme: sonradan eklenen düğmeler de çalışır
  document.addEventListener('click', e => { if (e.target.closest('[data-privacy-open]')) { e.preventDefault(); open(); } });
  pdlg.addEventListener('click', e => { if (e.target === pdlg) pdlg.close(); });
}
$$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();

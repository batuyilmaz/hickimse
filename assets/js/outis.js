/* hiç kimse — Outis sayfası: açılış sahnesi, imleci izleyen göz, mağara ışığı ve gizli şeyler. */
(() => {
'use strict';

const root = document.documentElement;
const $ = (s, c = document) => c.querySelector(s);
const hk = window.hk || { toast() {}, reduce: matchMedia('(prefers-reduced-motion: reduce)').matches };
const reduce = hk.reduce;
const page = $('.outis');
const eye = $('#eye');
const hint = $('#outisHint');
const intro = $('#outisIntro');
const skip = $('#outisSkip');
const replay = $('#outisReplay');
const KEY = 'hk.outis';
if (!page || !eye) return;

const seen = () => { try { return sessionStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
const markSeen = () => { try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* özel mod vb. */ } };
const wait = ms => new Promise(r => setTimeout(r, ms));

console.log('%cΟὖτις', 'font:600 30px Georgia,serif;color:#6fb8ff', '\nnobody is here. (nobody is also watching.)');

/* ==========================================================================
   Mağara ışığı: imleç etrafında açılan bir meşale, arka planı karartır
   ========================================================================== */
const amb = $('.ambient');
let cave = null;
const light = { x: innerWidth / 2, y: innerHeight * .45, tx: innerWidth / 2, ty: innerHeight * .45, mouse: false };
if (amb && !reduce) {
  cave = document.createElement('div');
  cave.className = 'cave';
  amb.appendChild(cave);
}
const ptr = { x: innerWidth / 2, y: innerHeight / 2, has: false };
addEventListener('pointermove', e => {
  ptr.x = e.clientX; ptr.y = e.clientY; ptr.has = true;
  light.tx = e.clientX; light.ty = e.clientY; light.mouse = e.pointerType === 'mouse' || e.pointerType === 'pen';
  wake();
}, { passive: true });
addEventListener('pointerdown', e => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.has = true; wake(); }, { passive: true });

/* ==========================================================================
   Göz: bakış imleci izler; boştayken etrafa bakınır; uzun süre dokunulmazsa uyur
   ========================================================================== */
const state = { poked: false, clicks: 0, sleepy: false };
let lookT = 0;

function eyeCenter() {
  const r = eye.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width };
}
function look(nx, ny) {
  eye.style.setProperty('--px', Math.max(-1, Math.min(1, nx)).toFixed(3));
  eye.style.setProperty('--py', Math.max(-1, Math.min(1, ny)).toFixed(3));
}
function lookLoop() {
  const c = eyeCenter();
  if (ptr.has && !state.poked) {
    const dx = ptr.x - c.x, dy = ptr.y - c.y;
    const d = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, d / 260);
    look(dx / d * k, dy / d * k);
  } else if (!ptr.has && !state.poked && performance.now() - lookT > 2600) {
    lookT = performance.now();
    look((Math.random() - .5) * 1.6, (Math.random() - .5) * 1.2);
  }
  if (cave) {
    // Fare yoksa (dokunmatik) ışık gözün üzerinde durur
    const tx = light.mouse ? light.tx : c.x, ty = light.mouse ? light.ty : c.y;
    light.x += (tx - light.x) * .1; light.y += (ty - light.y) * .1;
    cave.style.setProperty('--lx', light.x.toFixed(1) + 'px');
    cave.style.setProperty('--ly', light.y.toFixed(1) + 'px');
    cave.style.setProperty('--cave-r', (light.mouse ? 300 : Math.max(240, c.w * .8)) + 'px');
  }
  requestAnimationFrame(lookLoop);
}
if (!reduce) requestAnimationFrame(lookLoop);

let idleTimer = 0;
function wake() {
  clearTimeout(idleTimer);
  if (state.sleepy) { state.sleepy = false; eye.classList.remove('eye--sleepy'); }
  if (!state.poked && !reduce) idleTimer = setTimeout(() => { state.sleepy = true; eye.classList.add('eye--sleepy'); }, 15000);
}
addEventListener('keydown', wake);

/* ==========================================================================
   Açılış sahnesi
   ========================================================================== */
let skipped = false;
const naps = [];
const nap = ms => new Promise(r => { const t = setTimeout(r, ms); naps.push(() => { clearTimeout(t); r(); }); });

function reveal(fast) {
  intro.hidden = true;
  skip.hidden = true;
  page.classList.remove('is-intro');
  page.classList.add('is-reveal');
  if (!fast && !reduce) {
    eye.classList.add('eye--open');
    setTimeout(() => eye.classList.remove('eye--open'), 1500);
  }
  page.querySelectorAll('.outis__scene>*:not(.eye)').forEach((el, i) => el.style.setProperty('--d', i));
  markSeen();
  wake();
  setTimeout(() => hint.classList.add('show'), fast ? 4000 : 9000);
  setTimeout(() => hint.classList.remove('show'), fast ? 11000 : 17000);
}

async function play() {
  intro.hidden = false;
  skip.hidden = false;
  page.classList.add('is-intro');
  page.classList.remove('is-reveal');
  intro.textContent = '';
  const spark = document.createElement('span');
  spark.className = 'spark';
  intro.appendChild(spark);
  const lines = [
    ['il il--small', '“Tell me your name.”'],
    ['il il--big', '“Οὖτις.”'],
    ['il il--big', '“Nobody.”']
  ];
  await nap(1500);
  for (const [cls, text] of lines) {
    if (skipped) break;
    const el = document.createElement('p');
    el.className = cls + ' on';
    el.textContent = text;
    if (text.includes('Οὖτις')) el.lang = 'grc';
    intro.appendChild(el);
    await nap(2300);
    el.remove();
  }
  reveal(false);
}

function doSkip() {
  if (skipped) return;
  skipped = true;
  naps.forEach(f => f());
}
skip.addEventListener('click', doSkip);
addEventListener('keydown', e => { if (!intro.hidden && (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); doSkip(); } });

replay.addEventListener('click', () => {
  try { sessionStorage.removeItem(KEY); } catch (e) { /* özel mod vb. */ }
  location.reload();
});

if (reduce || seen()) reveal(true); else play();

/* ==========================================================================
   Göze dokunmak
   ========================================================================== */
const TALK = ['Who’s there?', 'Nobody.', 'Nobody? Then who is staring at me?', 'Stop that.'];
const BLIND = ['Nobody answers.', 'Nobody did it.', 'Ask nobody.'];
let blindI = 0;

function poke() {
  if (state.poked) { hk.toast(BLIND[blindI++ % BLIND.length], 2200); return; }
  const n = ++state.clicks;
  if (n < 5) {
    eye.classList.add('eye--closed');
    setTimeout(() => eye.classList.remove('eye--closed'), 260);
    hk.toast(TALK[n - 1], 2200);
    return;
  }
  state.poked = true;
  clearTimeout(idleTimer);
  eye.classList.remove('eye--sleepy', 'eye--wide');
  eye.classList.add('eye--poked');
  page.classList.add('shake');
  setTimeout(() => page.classList.remove('shake'), 650);
  hint.textContent = 'Nobody did it.';
  hint.classList.add('show');
  hk.toast('Οὖτίς με κτείνει δόλῳ οὐδὲ βίηφιν. “Nobody is killing me by guile or by force.”', 7000);
}
eye.addEventListener('click', poke);
eye.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(); } });
// Basılı tutunca göz iri açılır
let holdT = 0;
eye.addEventListener('pointerdown', () => { holdT = setTimeout(() => { if (!state.poked) eye.classList.add('eye--wide'); }, 450); });
['pointerup', 'pointerleave', 'pointercancel'].forEach(t => eye.addEventListener(t, () => { clearTimeout(holdT); eye.classList.remove('eye--wide'); }));

/* ==========================================================================
   Yazılan kelimeler
   ========================================================================== */
let buf = '';
const GREEK = 'Οὖτίς με κτείνει δόλῳ οὐδὲ βίηφιν. “Nobody is killing me by guile or by force.”';
function ship() {
  if (document.querySelector('.ship') || reduce) return;
  const d = document.createElement('div');
  d.className = 'ship';
  d.setAttribute('aria-hidden', 'true');
  d.innerHTML = '<svg viewBox="0 0 96 64"><path d="M6 44h84c-6 12-16 16-26 16H32C22 60 12 56 6 44z"/><path d="M48 44V6"/><path d="M48 8c18 4 26 18 26 32H48z"/><path d="M48 14c-12 4-18 14-18 26h18"/></svg>';
  d.addEventListener('animationend', () => d.remove());
  document.body.appendChild(d);
  hk.toast('Ὀδυσσεύς. Still sailing home.', 3200);
}
const WORDS = {
  wine() { const on = root.classList.toggle('wine'); hk.toast(on ? 'οἶνοψ πόντος: the wine-dark sea.' : 'The sea is just water again.', 3200); },
  outis() { hk.toast(GREEK, 7000); },
  nobody() { hk.toast(GREEK, 7000); },
  hickimse() { hk.toast('That is the old spelling. Nobody minds.', 3600); },
  hiçkimse() { hk.toast(GREEK, 7000); },
  odysseus: ship,
  metis() { hk.toast('μῆτις means cunning. It also sounds a little like “nobody”.', 5200); },
  polyphemus() { hk.toast('Πολύφημος: “much spoken of”. Everyone knows his name. No one knows who blinded him.', 6200); }
};
addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  buf = (buf + e.key.toLowerCase()).slice(-14);
  for (const w in WORDS) if (buf.endsWith(w)) { buf = ''; WORDS[w](); break; }
});
})();

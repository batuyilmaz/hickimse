/* hiç kimse — Nostratic v2.0 sayfaları (sayılar ve zamirler).
   Veri: sayfadaki <script type="application/json" id="cogData">. Her bölüm için ekrana sığan bir ağaç çizer,
   her dil ailesinin yanına olası ses yolağını gösteren "?" düğmesi koyar, sol rayı kaydırmaya bağlar. */
(() => {
'use strict';

const { toast, copy, reduce } = window.hk;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mid = (a, b) => (a + b) / 2;
const FIT = { s: 'strong', p: 'possible', w: 'weak' };

let DATA = [];
try { DATA = JSON.parse($('#cogData').textContent); } catch (e) { return; }

/* ---- 1. Veri modeli ---- */
const sections = DATA.map((d, i) => {
  const host = $('[data-tree="' + i + '"]');
  const fams = d.fams.map(f => ({
    type: 'fam', idx: f.i, name: f.n, open: true, path: d.paths[f.i] || null,
    kids: f.k.map(k => Array.isArray(k)
      ? { type: 'leaf', idx: f.i, lang: k[0], form: k[1], proto: k[0].startsWith('Proto') }
      : { type: 'branch', idx: f.i, name: k.b, open: true, kids: k.k.map(l => ({ type: 'leaf', idx: f.i, lang: l[0], form: l[1], proto: l[0].startsWith('Proto') })) })
  }));
  return { ...d, fams, host, sec: host && host.closest('.cog'), animated: false, canvas: null };
}).filter(S => S.host);

/* ---- 2. Metin ölçümü ---- */
const meter = svgEl('svg', { class: 'tree', 'aria-hidden': 'true' });
meter.style.cssText = 'position:absolute;visibility:hidden;width:0;height:0;overflow:hidden';
document.body.appendChild(meter);
const widths = new Map();
function measure(text, cls) {
  const key = cls + '|' + text;
  if (widths.has(key)) return widths.get(key);
  const t = svgEl('text', { class: cls }, meter);
  t.textContent = text;
  const w = t.getComputedTextLength();
  t.remove();
  widths.set(key, w);
  return w;
}

/* ---- 3. Yerleşim: ekrana sığdır, yatayda genişlet ---- */
const PADX = 14, PADY = 16, GAP = 14, MINLINK = 34, BTN = 30;
const desktop = () => innerWidth >= 860;
const headerH = () => ($('.site-header') || { offsetHeight: 64 }).offsetHeight;

function rowsOf(S) {
  let r = 0;
  S.fams.forEach(f => {
    if (!f.open) { r++; return; }
    f.kids.forEach(k => { r += k.type === 'branch' ? (k.open ? k.kids.length : 1) : 1; });
  });
  return r;
}

function layout(S, s) {
  const dk = desktop();
  const availW = Math.max(280, S.host.clientWidth);
  const headH = S.sec ? $('.cog__head', S.sec).offsetHeight : 80;
  const availH = innerHeight - headerH() - headH - (dk ? 108 : 40);
  const rows = rowsOf(S);
  const nf = S.fams.length;
  const ROW = dk ? clamp((availH / (s || 1) - 2 * PADY - GAP * (nf - 1)) / Math.max(rows, 1), 22, 38) : 28;

  let y = PADY;
  S.fams.forEach(f => {
    if (!f.open) { f.y = y; y += ROW; }
    else {
      f.kids.forEach(k => {
        if (k.type === 'branch') {
          if (!k.open) { k.y = y; y += ROW; }
          else { const a = y; k.kids.forEach(l => { l.y = y; y += ROW; }); k.y = mid(a, y - ROW); }
        } else { k.y = y; y += ROW; }
      });
      f.y = mid(f.kids[0].y, f.kids[f.kids.length - 1].y);
    }
    y += GAP;
  });
  S.H = y - GAP + PADY;
  S.rootY = mid(S.fams[0].y, S.fams[S.fams.length - 1].y);

  const leaves = S.fams.flatMap(f => f.kids.flatMap(k => (k.type === 'branch' ? k.kids : [k])));
  const hasBranch = S.fams.some(f => f.kids.some(k => k.type === 'branch'));
  const btn = BTN / (s || 1);
  S.btn = btn;
  S.rootW = measure(S.recon, 'recon');
  S.famW = Math.max(...S.fams.map(f => measure(f.name, 'fam-label') + (f.path ? btn : 0)));
  S.brW = hasBranch ? Math.max(...S.fams.flatMap(f => f.kids.filter(k => k.type === 'branch').map(k => measure(k.name, 'branch-label')))) : 0;
  S.formW = Math.max(...leaves.map(l => measure(l.form, 'form')));
  S.langW = Math.max(...leaves.map(l => measure(l.lang, 'lang')));

  const links = hasBranch ? 3 : 2;
  const fixed = PADX + S.rootW + 8 + 14 + S.famW + 6 + (hasBranch ? 14 + S.brW + 6 : 0) + 14 + S.formW + 18 + S.langW + PADX;
  const natural = fixed + links * MINLINK;
  // Boş yer varsa bağlantıları uzat (ağaç genişlesin), yoksa ölçekle
  const target = availW / (s || 1);
  const link = MINLINK + (target > natural ? Math.min(190, (target - natural) / links) : 0);
  S.x0 = PADX;
  S.x1 = PADX + S.rootW + 8 + link;
  S.x2 = S.x1 + 14 + S.famW + 6 + link;
  S.x3 = hasBranch ? S.x2 + 14 + S.brW + 6 + link : S.x2;
  S.W = S.x3 + 14 + S.formW + 18 + S.langW + PADX;
  S.hasBranch = hasBranch;
  return { availW, availH, dk };
}

function fit(S) {
  const a = layout(S, 1);
  let s = Math.min(1, a.availW / S.W, a.dk ? a.availH / S.H : 1);
  s = Math.max(s, a.dk ? .6 : .74);
  if (s < .999) layout(S, s);
  S.s = s;
}

/* ---- 4. Çizim ---- */
function render(S, opts = {}) {
  if (!desktop()) { renderList(S, opts); return; }
  fit(S);
  const s = S.s;
  if (S.canvas) S.canvas.remove();
  const canvas = document.createElement('div');
  canvas.className = 'tree-canvas';
  canvas.style.width = (S.W * s).toFixed(0) + 'px';
  canvas.style.height = (S.H * s).toFixed(0) + 'px';
  S.host.appendChild(canvas);
  S.canvas = canvas;
  const svg = svgEl('svg', { class: 'tree', viewBox: '0 0 ' + S.W.toFixed(0) + ' ' + S.H.toFixed(0), width: (S.W * s).toFixed(0), height: (S.H * s).toFixed(0), role: 'group', 'aria-label': S.title + ': tree of forms by language family' }, canvas);
  S.svg = svg;
  const gL = svgEl('g', {}, svg);
  const gN = svgEl('g', {}, svg);
  const links = [], nodes = [];

  const link = (x1, y1, x2, y2, idx, from, to) => {
    const xm = mid(x1, x2);
    const p = svgEl('path', { class: 'link', d: 'M' + x1 + ',' + y1 + ' C' + xm + ',' + y1 + ' ' + xm + ',' + y2 + ' ' + x2 + ',' + y2 }, gL);
    p.dataset.fam = idx;
    links.push({ p, from, to });
  };
  const activate = (g, fn) => {
    g.addEventListener('click', fn);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
  };

  const rootNode = { type: 'root', g: svgEl('g', { class: 'node node--root' }, gN) };
  const rt = svgEl('text', { class: 'recon', x: S.x0, y: S.rootY, dy: '.35em' }, rootNode.g);
  rt.textContent = S.recon;
  nodes.push(rootNode);

  S.fams.forEach(f => {
    f.parent = rootNode;
    link(S.x0 + S.rootW + 8, S.rootY, S.x1, f.y, f.idx, rootNode, f);
    const labelW = measure(f.name, 'fam-label');
    const g = svgEl('g', { class: 'node node--fam' + (f.open ? '' : ' node--collapsed'), 'data-fam': f.idx, tabindex: 0, role: 'button', 'aria-expanded': String(f.open), 'aria-label': f.name + (f.open ? ', expanded' : ', collapsed') }, gN);
    svgEl('rect', { class: 'hit', x: S.x1 - 10, y: f.y - 13, width: 24 + labelW, height: 26, rx: 8 }, g);
    svgEl('circle', { class: 'dot', cx: S.x1, cy: f.y, r: 5.5 }, g);
    svgEl('text', { class: 'fam-label', x: S.x1 + 14, y: f.y, dy: '.35em' }, g).textContent = f.name;
    f.g = g;
    f.bx = S.x1 + 14 + labelW + S.btn / 2 + 2;
    f.lx = S.x1 + 14 + labelW + (f.path ? S.btn : 0) + 6;
    nodes.push(f);
    activate(g, () => toggle(S, f));
    if (!f.open) return;
    f.kids.forEach(k => {
      k.parent = f;
      if (k.type === 'branch') {
        link(f.lx, f.y, S.x2, k.y, f.idx, f, k);
        const bw = measure(k.name, 'branch-label');
        const bg = svgEl('g', { class: 'node node--branch' + (k.open ? '' : ' node--collapsed'), 'data-fam': f.idx, tabindex: 0, role: 'button', 'aria-expanded': String(k.open), 'aria-label': k.name + ' (' + f.name + ')' + (k.open ? ', expanded' : ', collapsed') }, gN);
        svgEl('rect', { class: 'hit', x: S.x2 - 10, y: k.y - 13, width: 24 + bw, height: 26, rx: 8 }, bg);
        svgEl('circle', { class: 'dot', cx: S.x2, cy: k.y, r: 4.5 }, bg);
        svgEl('text', { class: 'branch-label', x: S.x2 + 14, y: k.y, dy: '.35em' }, bg).textContent = k.name;
        k.g = bg; k.lx = S.x2 + 14 + bw + 6;
        nodes.push(k);
        activate(bg, () => toggle(S, k));
        if (k.open) k.kids.forEach(l => { l.parent = k; leaf(l, k.lx, k.y); });
      } else leaf(k, f.lx, f.y);
    });
  });

  function leaf(l, px, py) {
    link(px, py, S.x3, l.y, l.idx, l.parent, l);
    const g = svgEl('g', { class: 'node node--leaf' + (l.proto ? ' proto' : ''), 'data-fam': l.idx, tabindex: 0, role: 'button', 'aria-label': l.form + ' ' + l.lang + ' (copy form)' }, gN);
    svgEl('rect', { class: 'hit', x: S.x3 - 8, y: l.y - 13, width: 22 + S.formW + 18 + measure(l.lang, 'lang') + 10, height: 26, rx: 8 }, g);
    svgEl('circle', { class: 'dot', cx: S.x3, cy: l.y, r: 3.6 }, g);
    svgEl('text', { class: 'form', x: S.x3 + 14, y: l.y, dy: '.35em' }, g).textContent = l.form;
    g.appendChild(document.createTextNode(' '));
    svgEl('text', { class: 'lang', x: S.x3 + 14 + S.formW + 18, y: l.y, dy: '.35em' }, g).textContent = l.lang;
    l.g = g;
    nodes.push(l);
    activate(g, async () => { toast(await copy(l.form) ? 'Copied ' + l.form : 'Copy failed'); });
  }

  /* "?" düğmeleri: SVG üzerinde HTML düğme (klavye ve ekran okuyucu için) */
  S.fams.forEach(f => {
    if (!f.path) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'why-btn';
    b.dataset.fam = f.idx;
    b.textContent = '?';
    b.setAttribute('aria-label', 'Possible sound path: ' + f.name);
    b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-expanded', 'false');
    b.style.left = (f.bx * s).toFixed(1) + 'px';
    b.style.top = (f.y * s).toFixed(1) + 'px';
    b.addEventListener('click', ev => { ev.stopPropagation(); openWhy(S, f, b); });
    b.addEventListener('pointerenter', () => highlight(f));
    b.addEventListener('pointerleave', clearHl);
    canvas.appendChild(b);
    f.btn = b;
  });

  /* Vurgu */
  const within = (n, anc) => { for (let c = n; c; c = c.parent) if (c === anc) return true; return false; };
  function highlight(n) {
    const on = new Set(nodes.filter(x => within(x, n) || within(n, x)));
    svg.classList.add('hl');
    links.forEach(l => l.p.classList.toggle('on', on.has(l.to) && on.has(l.from)));
    nodes.forEach(x => x.g.classList.toggle('on', on.has(x)));
  }
  function clearHl() {
    svg.classList.remove('hl');
    links.forEach(l => l.p.classList.remove('on'));
    nodes.forEach(x => x.g.classList.remove('on'));
  }
  nodes.forEach(n => {
    if (n.type === 'root') return;
    n.g.addEventListener('pointerenter', () => highlight(n));
    n.g.addEventListener('pointerleave', clearHl);
    n.g.addEventListener('focus', () => highlight(n));
    n.g.addEventListener('blur', clearHl);
  });
  S.links = links; S.nodes = nodes;

  if (!S.animated && !reduce && !opts.noPre) canvas.classList.add('pre');
  if (opts.focus) { const t = nodes.find(n => n.type === opts.focus.type && n.name === opts.focus.name); if (t) t.g.focus({ preventScroll: true }); }
}

/* Dar ekran: aynı veri, dikey girintili liste (yatay kaydırma gerektirmez) */
function renderList(S, opts = {}) {
  if (S.canvas) S.canvas.remove();
  const box = document.createElement('div');
  box.className = 'tlist tree-canvas';
  S.host.appendChild(box);
  S.canvas = box;
  S.links = []; S.nodes = [];
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const rootP = el('p', 'tlist__root', S.recon);
  rootP.lang = 'und-fonipa';
  box.appendChild(rootP);
  const ul = el('ul', 'tlist__fams');
  ul.setAttribute('aria-label', S.title + ': forms by language family');
  box.appendChild(ul);
  const leafLi = l => {
    const li = el('li', 'tlist__leaf' + (l.proto ? ' proto' : ''));
    const b = el('button', 'tlist__copy');
    b.type = 'button';
    b.setAttribute('aria-label', l.form + ' ' + l.lang + ' (copy form)');
    const f = el('span', 'tlist__form', l.form); f.lang = 'und-fonipa';
    b.append(f, document.createTextNode(' '), el('span', 'tlist__lang', l.lang));
    b.addEventListener('click', async () => { toast(await copy(l.form) ? 'Copied ' + l.form : 'Copy failed'); });
    li.appendChild(b);
    return li;
  };
  S.fams.forEach(f => {
    const li = el('li', 'tlist__fam');
    li.dataset.fam = f.idx;
    const head = el('div', 'tlist__fh');
    const t = el('button', 'tlist__toggle', f.name);
    t.type = 'button';
    t.setAttribute('aria-expanded', String(f.open));
    head.appendChild(t);
    if (f.path) {
      const b = el('button', 'why-btn why-btn--inline', '?');
      b.type = 'button';
      b.dataset.fam = f.idx;
      b.setAttribute('aria-label', 'Possible sound path: ' + f.name);
      b.setAttribute('aria-haspopup', 'dialog');
      b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', ev => { ev.stopPropagation(); openWhy(S, f, b); });
      head.appendChild(b);
    }
    li.appendChild(head);
    const kids = el('ul', 'tlist__kids');
    kids.hidden = !f.open;
    f.kids.forEach(k => {
      if (k.type === 'branch') {
        const bl = el('li', 'tlist__br');
        bl.appendChild(el('p', 'tlist__brname', k.name));
        const bu = el('ul', 'tlist__kids');
        k.kids.forEach(l => bu.appendChild(leafLi(l)));
        bl.appendChild(bu);
        kids.appendChild(bl);
      } else kids.appendChild(leafLi(k));
    });
    li.appendChild(kids);
    t.addEventListener('click', () => { f.open = !f.open; kids.hidden = !f.open; t.setAttribute('aria-expanded', String(f.open)); });
    ul.appendChild(li);
  });
  S.animated = true;
}

function animateIn(S) {
  if (S.animated || !S.canvas || !S.links.length) return;
  S.animated = true;
  if (!S.canvas.classList.contains('pre')) return;
  const depth = n => (n.type === 'root' ? 0 : n.type === 'fam' ? 1 : n.type === 'branch' ? 2 : 3);
  S.links.forEach((l, i) => {
    l.p.style.setProperty('--len', l.p.getTotalLength().toFixed(1));
    l.p.style.setProperty('--d', ((depth(l.to) - 1) * .26 + (i % 9) * .02).toFixed(2) + 's');
    l.p.classList.add('draw');
  });
  S.nodes.forEach((n, i) => {
    n.g.style.setProperty('--d', (depth(n) * .26 + (i % 9) * .02).toFixed(2) + 's');
    n.g.classList.add('enter');
  });
  $$('.why-btn', S.canvas).forEach((b, i) => b.style.setProperty('--d', (.5 + i * .05).toFixed(2) + 's'));
  S.canvas.classList.remove('pre');
  S.canvas.classList.add('in');
}

function toggle(S, n) {
  closeWhy();
  n.open = !n.open;
  S.animated = true;
  render(S, { focus: { type: n.type, name: n.name }, noPre: true });
}

/* ---- 5. Olası ses yolağı kutusu ---- */
const why = document.createElement('div');
why.className = 'why';
why.id = 'why';
why.setAttribute('role', 'dialog');
why.setAttribute('aria-labelledby', 'whyTitle');
why.tabIndex = -1;
why.hidden = true;
why.innerHTML = '<div class="why__head"><span class="why__dot" aria-hidden="true"></span><h3 class="why__title" id="whyTitle"></h3>' +
  '<button type="button" class="why__x" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
  '<p class="why__k">Possible sound path</p><ol class="chain"></ol>' +
  '<p class="why__fit"><span class="meter" aria-hidden="true"><i></i><i></i><i></i></span><span class="why__fitlbl"></span></p>' +
  '<p class="why__note"></p><p class="why__foot">A working hypothesis for this page, not an established correspondence.</p>';
document.body.appendChild(why);
let whyFrom = null, whyY = 0;

function openWhy(S, f, btn) {
  if (whyFrom === btn && !why.hidden) { closeWhy(); return; }
  closeWhy(true);
  const p = f.path;
  why.dataset.fam = f.idx;
  $('.why__title', why).textContent = f.name;
  const ol = $('.chain', why);
  ol.textContent = '';
  p.chain.forEach((c, i) => {
    const li = document.createElement('li');
    const sp = document.createElement('span');
    sp.lang = 'und-fonipa';
    sp.textContent = c;
    li.appendChild(sp);
    if (i === 0) li.className = 'chain__root';
    ol.appendChild(li);
  });
  $('.why__fit', why).dataset.fit = p.fit;
  $('.why__fitlbl', why).textContent = 'Fit: ' + FIT[p.fit];
  $('.why__note', why).textContent = p.note;
  why.hidden = false;
  const sheet = innerWidth < 640;
  why.classList.toggle('why--sheet', sheet);
  if (!sheet) {
    const r = btn.getBoundingClientRect();
    const w = why.offsetWidth, h = why.offsetHeight;
    let left = r.right + 12;
    if (left + w > innerWidth - 12) left = r.left - w - 12;
    if (left < 12) left = clamp(r.left - w / 2, 12, innerWidth - w - 12);
    const top = clamp(r.top - 24, headerH() + 8, innerHeight - h - 12);
    why.style.left = left + 'px';
    why.style.top = top + 'px';
  } else { why.style.left = ''; why.style.top = ''; }
  requestAnimationFrame(() => why.classList.add('open'));
  btn.setAttribute('aria-expanded', 'true');
  whyFrom = btn;
  whyY = scrollY;
  why.focus({ preventScroll: true });
}
function closeWhy(silent) {
  if (why.hidden) return;
  why.classList.remove('open');
  why.hidden = true;
  if (whyFrom) {
    whyFrom.setAttribute('aria-expanded', 'false');
    if (!silent && why.contains(document.activeElement)) whyFrom.focus({ preventScroll: true });
  }
  whyFrom = null;
}
$('.why__x', why).addEventListener('click', () => { const b = whyFrom; closeWhy(); if (b) b.focus({ preventScroll: true }); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !why.hidden) { const b = whyFrom; closeWhy(); if (b) b.focus({ preventScroll: true }); } });
document.addEventListener('pointerdown', e => { if (!why.hidden && !why.contains(e.target) && !e.target.closest('.why-btn')) closeWhy(true); });
addEventListener('scroll', () => { if (!why.hidden && !why.classList.contains('why--sheet') && Math.abs(scrollY - whyY) > 60) closeWhy(true); }, { passive: true });

/* ---- 6. Sol ray: kaydırma izleme, başa ve sona git ---- */
const rail = $('.numrail');
const railLinks = rail ? $$('.numrail__link', rail) : [];
const spyEls = $$('[data-spy], .page-head, .overview, .endzone');
function setActive(id) {
  let found = false;
  railLinks.forEach(a => {
    const on = a.getAttribute('href') === '#' + id;
    if (on) {
      found = true;
      a.setAttribute('aria-current', 'location');
      const list = a.closest('.numrail__list');
      list.style.setProperty('--spy', Math.max(0, a.offsetTop + a.offsetHeight / 2 - 18) + 'px');
      if (rail.scrollWidth > rail.clientWidth + 2) rail.scrollTo({ left: a.offsetLeft - rail.clientWidth / 2 + a.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
    } else a.removeAttribute('aria-current');
  });
  if (!found && rail) {
    const list = $('.numrail__list', rail);
    list.style.setProperty('--spy', id === 'end' ? (list.offsetHeight - 36) + 'px' : '0px');
  }
}
if (rail && 'IntersectionObserver' in window) {
  const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }), { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  spyEls.forEach(el => { if (el.id || el.classList.contains('page-head')) spy.observe(el); });
}
$$('[data-bottom]').forEach(b => b.addEventListener('click', () => {
  scrollTo({ top: document.documentElement.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
}));

/* ---- 7. Alıntı ---- */
const cite = $('[data-cite]');
const accessed = $('[data-accessed]');
if (accessed) accessed.textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
if (cite) cite.addEventListener('click', async () => {
  toast(await copy($('#citeText').textContent.trim().replace(/\s+/g, ' ')) ? 'Citation copied' : 'Copy failed');
});

/* ---- 8. Başlangıç ---- */
document.documentElement.classList.add('trees');
function renderAll(noPre) { closeWhy(true); sections.forEach(S => render(S, { noPre: noPre || S.animated })); }
let revealIO = null;
function observeReveal() {
  if (!('IntersectionObserver' in window)) { sections.forEach(S => { S.animated = true; if (S.canvas) S.canvas.classList.remove('pre'); }); return; }
  if (revealIO) return;
  revealIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const S = sections.find(x => x.sec === e.target);
    if (S) animateIn(S);
    revealIO.unobserve(e.target);
  }), { threshold: .2 });
  sections.forEach(S => revealIO.observe(S.sec));
}
let lastW = innerWidth, lastH = innerHeight, rz = 0;
addEventListener('resize', () => {
  clearTimeout(rz);
  rz = setTimeout(() => {
    // Mobilde adres çubuğu yüksekliği değişince yeniden çizme
    if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 120 && !desktop()) return;
    if (!desktop() && lastW < 860 && innerWidth < 860 && innerWidth === lastW) return;
    lastW = innerWidth; lastH = innerHeight;
    renderAll(true);
  }, 160);
});

renderAll(false);
observeReveal();
const fontsReady = document.fonts && document.fonts.load
  ? Promise.all(['600 21px "Noto Serif IPA"', 'italic 600 21px "Noto Serif IPA"', '15px "Noto Serif IPA"', 'italic 15px "Noto Serif IPA"', '700 13px "Plus Jakarta Sans"', '12px "Plus Jakarta Sans"'].map(f => document.fonts.load(f))).catch(() => {}).then(() => document.fonts.ready)
  : Promise.resolve();
fontsReady.then(() => {
  widths.clear();
  renderAll(false);
  sections.forEach(S => { if (S.animated && S.canvas) S.canvas.classList.remove('pre'); });
  observeReveal();
  if (location.hash.length > 1) { const t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) t.scrollIntoView(); }
});
})();

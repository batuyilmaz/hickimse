/* hiç kimse — Nostratic Numbers: tablo verisinden ağaç, karşılaştırma matrisi, aile süzgeci, kaydırma izleme.
   Kaynak veri her sayı bölümündeki <table class="cog"> tablosudur; buraya dokunmadan yalnızca tabloyu düzenlemek yeterlidir. */
(() => {
'use strict';

const { toast, copy, store, reduce } = window.hk;
const root = document.documentElement;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};

/* ---- 1. Tablolardan veri modeli ---- */
const sections = $$('.numeral').map(sec => {
  const fams = [];
  let fam = null, branch = null;
  $$('table.cog tbody', sec).forEach(tb => {
    const idx = Number(tb.dataset.fam);
    fam = { type: 'fam', idx, name: $('tr.fam th', tb).textContent.trim(), kids: [], open: true };
    fams.push(fam);
    branch = null;
    $$('tr', tb).forEach(tr => {
      if (tr.classList.contains('fam')) return;
      if (tr.classList.contains('branch')) {
        branch = { type: 'branch', idx, name: tr.textContent.trim(), kids: [], open: true };
        fam.kids.push(branch);
        return;
      }
      const leaf = { type: 'leaf', idx, lang: $('th', tr).textContent.trim(), form: $('td', tr).textContent.trim(), proto: tr.classList.contains('proto') };
      (tr.dataset.branch && branch ? branch : fam).kids.push(leaf);
    });
  });
  return { sec, id: sec.id, n: sec.dataset.n, recon: sec.dataset.recon, fams, host: $('[data-tree]', sec), svg: null, animated: false };
});

/* ---- 2. Metin ölçümü (yazı tipleri yüklendikten sonra) ---- */
const meter = svgEl('svg', { class: 'tree', 'aria-hidden': 'true' });
meter.style.cssText = 'position:absolute;visibility:hidden;width:0;height:0;min-width:0;overflow:hidden';
document.body.appendChild(meter);
const widthCache = new Map();
function measure(text, cls) {
  const key = cls + '|' + text;
  if (widthCache.has(key)) return widthCache.get(key);
  const t = svgEl('text', { class: cls }, meter);
  t.textContent = text;
  const w = t.getComputedTextLength();
  t.remove();
  widthCache.set(key, w);
  return w;
}

/* ---- 3. Ağaç düzeni ve çizimi ---- */
const ROW = 29, GAP = 16, PADX = 16, PADY = 20, LINK = 44;
const mid = (a, b) => (a + b) / 2;

function layout(S) {
  const allKids = n => n.kids || [];
  let y = PADY;
  S.fams.forEach(f => {
    const startY = y;
    if (!f.open) { f.y = y; y += ROW; }
    else {
      f.kids.forEach(k => {
        if (k.type === 'branch') {
          if (!k.open) { k.y = y; y += ROW; }
          else { const s = y; k.kids.forEach(l => { l.y = y; y += ROW; }); k.y = mid(s, y - ROW); }
        } else { k.y = y; y += ROW; }
      });
      f.y = mid(f.kids[0].y, f.kids[f.kids.length - 1].y);
    }
    f.top = startY;
    y += GAP;
  });
  S.height = y - GAP + PADY;
  S.rootY = mid(S.fams[0].y, S.fams[S.fams.length - 1].y);

  const famLeaves = [];
  S.fams.forEach(f => allKids(f).forEach(k => (k.type === 'branch' ? k.kids : [k]).forEach(l => famLeaves.push(l))));
  const hasBranch = S.fams.some(f => f.kids.some(k => k.type === 'branch'));
  const rootW = measure(S.recon, 'recon');
  const famW = Math.max(...S.fams.map(f => measure(f.name, 'fam-label')));
  const brW = hasBranch ? Math.max(...S.fams.flatMap(f => f.kids.filter(k => k.type === 'branch').map(k => measure(k.name, 'branch-label')))) : 0;
  const formW = Math.max(...famLeaves.map(l => measure(l.form, 'form')));
  const langW = Math.max(...famLeaves.map(l => measure(l.lang, 'lang')));
  S.x0 = PADX;
  S.x1 = PADX + rootW + LINK;
  S.x2 = S.x1 + 14 + famW + LINK;
  S.x3 = hasBranch ? S.x2 + 14 + brW + LINK : S.x2;
  S.formW = formW;
  S.width = S.x3 + 14 + formW + 18 + langW + PADX;
  S.rootW = rootW; S.famW = famW; S.brW = brW;
  S.measured = { rootW, famW, brW };
}

function render(S, opts = {}) {
  layout(S);
  if (S.svg) S.svg.remove();
  const svg = svgEl('svg', { class: 'tree', viewBox: '0 0 ' + S.width.toFixed(0) + ' ' + S.height.toFixed(0), role: 'group', 'aria-label': 'Numeral ' + S.n + ': tree of forms by language family' }, S.host);
  svg.style.aspectRatio = S.width.toFixed(0) + ' / ' + S.height.toFixed(0);
  S.svg = svg;
  const gL = svgEl('g', {}, svg);
  const gN = svgEl('g', {}, svg);
  const links = [];
  const nodes = [];

  const link = (x1, y1, x2, y2, idx, from, to) => {
    const xm = mid(x1, x2);
    const p = svgEl('path', { class: 'link' + (idx ? '' : ' link--root'), d: 'M' + x1 + ',' + y1 + ' C' + xm + ',' + y1 + ' ' + xm + ',' + y2 + ' ' + x2 + ',' + y2 }, gL);
    if (idx) p.dataset.fam = idx;
    links.push({ p, from, to });
  };

  const rootNode = { type: 'root', kids: S.fams, g: null };
  const rg = svgEl('g', { class: 'node node--root' }, gN);
  const rt = svgEl('text', { class: 'recon', x: S.x0, y: S.rootY, dy: '.35em' }, rg);
  rt.textContent = S.recon;
  rootNode.g = rg;
  nodes.push(rootNode);

  S.fams.forEach(f => {
    f.parent = rootNode;
    link(S.x0 + S.rootW + 8, S.rootY, S.x1, f.y, f.idx, rootNode, f);
    const g = svgEl('g', { class: 'node node--fam' + (f.open ? '' : ' node--collapsed'), 'data-fam': f.idx, tabindex: 0, role: 'button', 'aria-expanded': String(f.open),
      'aria-label': f.name + (f.open ? ', expanded' : ', collapsed') }, gN);
    svgEl('rect', { class: 'hit', x: S.x1 - 10, y: f.y - 13, width: 14 + S.famW + 20, height: 26, rx: 8 }, g);
    svgEl('circle', { class: 'dot', cx: S.x1, cy: f.y, r: 5.5 }, g);
    const t = svgEl('text', { class: 'fam-label', x: S.x1 + 14, y: f.y, dy: '.35em' }, g);
    t.textContent = f.name;
    f.g = g; f.lx = S.x1 + 14 + measure(f.name, 'fam-label') + 6;
    nodes.push(f);
    g.addEventListener('click', () => toggle(S, f));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(S, f); } });
    if (!f.open) return;

    f.kids.forEach(k => {
      k.parent = f;
      if (k.type === 'branch') {
        link(f.lx, f.y, S.x2, k.y, f.idx, f, k);
        const bg = svgEl('g', { class: 'node node--branch' + (k.open ? '' : ' node--collapsed'), 'data-fam': f.idx, tabindex: 0, role: 'button', 'aria-expanded': String(k.open),
          'aria-label': k.name + ' (' + f.name + ')' + (k.open ? ', expanded' : ', collapsed') }, gN);
        svgEl('rect', { class: 'hit', x: S.x2 - 10, y: k.y - 13, width: 14 + S.brW + 20, height: 26, rx: 8 }, bg);
        svgEl('circle', { class: 'dot', cx: S.x2, cy: k.y, r: 4.5 }, bg);
        const bt = svgEl('text', { class: 'branch-label', x: S.x2 + 14, y: k.y, dy: '.35em' }, bg);
        bt.textContent = k.name;
        k.g = bg; k.lx = S.x2 + 14 + measure(k.name, 'branch-label') + 6;
        nodes.push(k);
        bg.addEventListener('click', () => toggle(S, k));
        bg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(S, k); } });
        if (k.open) k.kids.forEach(l => { l.parent = k; leaf(l, k.lx, k.y); });
      } else leaf(k, f.lx, f.y);
    });
  });

  function leaf(l, px, py) {
    link(px, py, S.x3, l.y, l.idx, l.parent, l);
    const g = svgEl('g', { class: 'node node--leaf' + (l.proto ? ' proto' : ''), 'data-fam': l.idx, tabindex: 0, role: 'button',
      'aria-label': l.form + ' ' + l.lang + ' (copy form)' }, gN);
    svgEl('rect', { class: 'hit', x: S.x3 - 8, y: l.y - 13, width: 8 + 14 + S.formW + 18 + measure(l.lang, 'lang') + 10, height: 26, rx: 8 }, g);
    svgEl('circle', { class: 'dot', cx: S.x3, cy: l.y, r: 3.6 }, g);
    const ft = svgEl('text', { class: 'form', x: S.x3 + 14, y: l.y, dy: '.35em' }, g);
    ft.textContent = l.form;
    g.appendChild(document.createTextNode(' '));
    const lt = svgEl('text', { class: 'lang', x: S.x3 + 14 + S.formW + 18, y: l.y, dy: '.35em' }, g);
    lt.textContent = l.lang;
    l.g = g;
    nodes.push(l);
    const doCopy = async () => { if (await copy(l.form)) toast('Copied ' + l.form); else toast('Copy failed'); };
    g.addEventListener('click', doCopy);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doCopy(); } });
  }

  /* Vurgu: seçilen düğümün atası ve torunları parlar */
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
    if (!n.g || n.type === 'root') return;
    n.g.addEventListener('pointerenter', () => highlight(n));
    n.g.addEventListener('pointerleave', clearHl);
    n.g.addEventListener('focus', () => highlight(n));
    n.g.addEventListener('blur', clearHl);
  });

  S.links = links; S.nodes = nodes;

  /* Girişte çizim: bölüm ilk kez görünür olunca bir kez oynar */
  if (!S.animated && !reduce && !opts.noPre) svg.classList.add('pre');
  if (opts.focusKey) { const t = nodes.find(n => n.type !== 'root' && (n.name || n.lang) === opts.focusKey.name && n.type === opts.focusKey.type); if (t && t.g) t.g.focus({ preventScroll: true }); }
}

function animateIn(S) {
  if (S.animated || !S.svg) return;
  S.animated = true;
  const svg = S.svg;
  if (!svg.classList.contains('pre')) return;
  S.links.forEach((l, i) => {
    const len = l.p.getTotalLength();
    l.p.style.setProperty('--len', len.toFixed(1));
    const depth = l.to.type === 'fam' ? 0 : l.to.type === 'branch' ? 1 : 2;
    l.p.style.setProperty('--d', (depth * .28 + (i % 9) * .02).toFixed(2) + 's');
    l.p.classList.add('draw');
  });
  S.nodes.forEach((n, i) => {
    const depth = n.type === 'root' ? 0 : n.type === 'fam' ? 1 : n.type === 'branch' ? 2 : 3;
    n.g.style.setProperty('--d', (depth * .28 + (i % 9) * .02).toFixed(2) + 's');
    n.g.classList.add('enter');
  });
  svg.classList.remove('pre');
}

function toggle(S, n) {
  n.open = !n.open;
  const key = { name: n.name, type: n.type };
  S.animated = true;
  render(S, { focusKey: key, noPre: true });
}

/* ---- 4. Karşılaştırma matrisi ---- */
function buildMatrix() {
  const host = $('[data-matrix]');
  if (!host || !sections.length) return;
  const table = document.createElement('table');
  table.className = 'matrix';
  const cap = document.createElement('caption');
  cap.className = 'sr-only';
  cap.textContent = 'Forms for the numerals ' + sections.map(s => s.n).join(', ') + ', by language';
  table.appendChild(cap);
  const thead = table.createTHead().insertRow();
  const h0 = document.createElement('th'); h0.scope = 'col'; h0.textContent = 'Language'; thead.appendChild(h0);
  sections.forEach(s => {
    const th = document.createElement('th'); th.scope = 'col';
    const a = document.createElement('a'); a.href = '#' + s.id; a.textContent = s.n; a.setAttribute('aria-label', 'Numeral ' + s.n + ', jump to its section');
    th.appendChild(a); thead.appendChild(th);
  });
  const base = sections[0];
  const rowsOf = S => S.fams.flatMap(f => f.kids.flatMap(k => (k.type === 'branch' ? k.kids : [k])));
  const leafCols = sections.map(rowsOf);
  const tb = document.createElement('tbody');
  let li = 0;
  base.fams.forEach(f => {
    const fr = tb.insertRow(); fr.className = 'fam'; fr.dataset.fam = f.idx;
    const th = document.createElement('th'); th.scope = 'rowgroup'; th.colSpan = sections.length + 1; th.textContent = f.name;
    fr.appendChild(th);
    f.kids.flatMap(k => (k.type === 'branch' ? k.kids : [k])).forEach(l => {
      const tr = tb.insertRow(); tr.className = 'leaf' + (l.proto ? ' proto' : ''); tr.dataset.fam = f.idx;
      const lh = document.createElement('th'); lh.scope = 'row'; lh.textContent = l.lang; tr.appendChild(lh);
      leafCols.forEach(col => { const td = tr.insertCell(); td.lang = 'und-fonipa'; td.textContent = col[li] ? col[li].form : ''; });
      li++;
    });
  });
  table.appendChild(tb);
  host.appendChild(table);
}

/* ---- 5. Görünüm anahtarı, aile süzgeci, aç/kapat ---- */
const layoutEl = $('.layout');
function ensureTrees() {
  if (root.dataset.view !== 'tree') return;
  sections.forEach(S => { if (!S.svg) render(S); });
  observeReveal();
}
let revealIO = null;
function observeReveal() {
  if (!('IntersectionObserver' in window)) { sections.forEach(S => { S.animated = true; S.svg && S.svg.classList.remove('pre'); }); return; }
  if (revealIO) return;
  revealIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const S = sections.find(s => s.sec === e.target);
    if (S) animateIn(S);
    revealIO.unobserve(e.target);
  }), { threshold: .12 });
  sections.forEach(S => revealIO.observe(S.sec));
}
function setView(v) {
  root.dataset.view = v;
  store.set('hk.view', v);
  $$('.seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
  $$('[data-tree-only]').forEach(el => { el.hidden = v !== 'tree'; });
  ensureTrees();
}
$$('.seg button').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
$$('[data-expand]').forEach(b => b.addEventListener('click', () => { sections.forEach(S => { S.fams.forEach(f => { f.open = true; f.kids.forEach(k => { if (k.type === 'branch') k.open = true; }); }); S.animated = true; if (S.svg) render(S, { noPre: true }); }); }));
$$('[data-collapse]').forEach(b => b.addEventListener('click', () => { sections.forEach(S => { S.fams.forEach(f => { f.open = false; }); S.animated = true; if (S.svg) render(S, { noPre: true }); }); }));

const chips = $$('.legend__chip');
chips.forEach(c => c.addEventListener('click', () => {
  const on = c.getAttribute('aria-pressed') !== 'true';
  chips.forEach(x => x.setAttribute('aria-pressed', 'false'));
  if (on) { c.setAttribute('aria-pressed', 'true'); layoutEl.dataset.focus = c.dataset.f; }
  else delete layoutEl.dataset.focus;
}));

/* ---- 6. Kaydırma izleme (sol ray) ---- */
const rail = $('.numrail');
const railLinks = rail ? $$('.numrail__link', rail) : [];
function setActive(id) {
  railLinks.forEach(a => {
    const on = a.getAttribute('href') === '#' + id;
    if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    if (on) {
      const list = a.closest('.numrail__list');
      list.style.setProperty('--spy', Math.max(0, a.offsetTop + a.offsetHeight / 2 - 18) + 'px');
      if (rail.scrollWidth > rail.clientWidth + 2) rail.scrollTo({ left: a.offsetLeft - rail.clientWidth / 2 + a.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
    }
  });
}
if (railLinks.length && 'IntersectionObserver' in window) {
  const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }), { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  sections.forEach(S => spy.observe(S.sec));
  setActive(sections[0].id);
}

/* ---- 7. Alıntı ---- */
const cite = $('[data-cite]');
const accessed = $('[data-accessed]');
const fmt = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
if (accessed) accessed.textContent = fmt;
if (cite) cite.addEventListener('click', async () => {
  const text = $('#citeText').textContent.trim().replace(/\s+/g, ' ');
  toast(await copy(text) ? 'Citation copied' : 'Copy failed');
});

/* ---- Başlangıç ---- */
buildMatrix();
setView(root.dataset.view === 'tree' ? 'tree' : 'table');
const fontsReady = document.fonts && document.fonts.load
  ? Promise.all([document.fonts.load('600 21px "Noto Serif IPA"'), document.fonts.load('italic 600 21px "Noto Serif IPA"'), document.fonts.load('15px "Noto Serif IPA"'), document.fonts.load('italic 15px "Noto Serif IPA"'), document.fonts.load('700 13px "Plus Jakarta Sans"'), document.fonts.load('12px "Plus Jakarta Sans"')]).catch(() => {}).then(() => document.fonts.ready)
  : Promise.resolve();
fontsReady.then(() => {
  widthCache.clear();
  sections.forEach(S => { if (S.svg) render(S, { noPre: true }); });
  ensureTrees();
  if (location.hash.length > 1) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
});
})();

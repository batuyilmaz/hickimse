/* hiç kimse — Nostratic v2.0 sayfaları (sayılar ve zamirler).
   Veri: sayfadaki <script type="application/json" id="cogData">. Bir bölümde bir ya da daha çok kök olabilir.
   Geniş ekranda soldan sağa açılan, ekrana sığan bir ağaç; telefonda yukarıdan aşağı açılan dikey ağaç çizer.
   Her dil ailesinin yanındaki "?" düğmesi olası ses yolağını gösterir. */
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
let uid = 0;

let DATA = [];
try { DATA = JSON.parse($('#cogData').textContent); } catch (e) { return; }

/* ---- 1. Veri modeli ---- */
const mkLeaf = (k, fi) => ({ type: 'leaf', idx: k[2] || fi, lang: k[0], form: k[1], proto: k[0].startsWith('Proto'), cross: !!k[2] });
const sections = DATA.map((d, i) => {
  const host = $('[data-tree="' + i + '"]');
  const groups = d.roots.map((r, gi) => ({
    type: 'root', gi, recon: r.recon,
    fams: r.fams.map(f => ({
      type: 'fam', idx: f.i, name: f.n, open: true, gi,
      hasPath: Object.prototype.hasOwnProperty.call(r.paths, f.i), path: r.paths[f.i],
      kids: f.k.map(k => Array.isArray(k) ? mkLeaf(k, f.i)
        : { type: 'branch', idx: f.i, name: k.b, open: true, kids: k.k.map(l => mkLeaf(l, f.i)) })
    }))
  }));
  return { ...d, groups, fams: groups.flatMap(g => g.fams), host, sec: host && host.closest('.cog'), animated: false, canvas: null };
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

const desktop = () => innerWidth >= 860;
const headerH = () => ($('.site-header') || { offsetHeight: 64 }).offsetHeight;
const leavesOf = S => S.fams.flatMap(f => f.kids.flatMap(k => (k.type === 'branch' ? k.kids : [k])));
const PILL_PAD = 14, PILL_H = 36;

/* ---- 3. Geniş ekran yerleşimi: soldan sağa, ekrana sığar, yatayda genişler ---- */
const PADX = 14, PADY = 18, GAP = 14, GGAP = 40, MINLINK = 34, BTN = 30;

function rowsOf(S) {
  let r = 0;
  S.fams.forEach(f => {
    if (!f.open) { r++; return; }
    f.kids.forEach(k => { r += k.type === 'branch' ? (k.open ? k.kids.length : 1) : 1; });
  });
  return r;
}

function layoutWide(S, s) {
  const availW = Math.max(280, S.host.clientWidth);
  const headH = S.sec ? $('.cog__head', S.sec).offsetHeight : 80;
  const availH = innerHeight - headerH() - headH - 108;
  const ng = S.groups.length, nf = S.fams.length;
  const ROW = clamp((availH / (s || 1) - 2 * PADY - GAP * (nf - ng) - GGAP * (ng - 1)) / Math.max(rowsOf(S), 1), 22, 38);

  let y = PADY;
  S.groups.forEach((g, gi) => {
    if (gi) y += GGAP - GAP;
    g.fams.forEach(f => {
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
    g.y = mid(g.fams[0].y, g.fams[g.fams.length - 1].y);
  });
  S.H = y - GAP + PADY;

  const leaves = leavesOf(S);
  const hasBranch = S.fams.some(f => f.kids.some(k => k.type === 'branch'));
  S.btn = BTN / (s || 1);
  S.groups.forEach(g => { g.pw = measure(g.recon, 'recon') + PILL_PAD * 2; });
  S.rootW = Math.max(...S.groups.map(g => g.pw)) + 14;
  S.famW = Math.max(...S.fams.map(f => measure(f.name, 'fam-label') + (f.hasPath ? S.btn : 0)));
  S.brW = hasBranch ? Math.max(...S.fams.flatMap(f => f.kids.filter(k => k.type === 'branch').map(k => measure(k.name, 'branch-label')))) : 0;
  S.formW = Math.max(...leaves.map(l => measure(l.form, 'form')));
  S.langW = Math.max(...leaves.map(l => measure(l.lang, 'lang')));

  const links = hasBranch ? 3 : 2;
  const fixed = PADX + S.rootW + 14 + S.famW + 6 + (hasBranch ? 14 + S.brW + 6 : 0) + 14 + S.formW + 18 + S.langW + PADX;
  const natural = fixed + links * MINLINK;
  const target = availW / (s || 1);
  const link = MINLINK + (target > natural ? Math.min(190, (target - natural) / links) : 0);
  S.x0 = PADX;
  S.x1 = PADX + S.rootW + link;
  S.x2 = S.x1 + 14 + S.famW + 6 + link;
  S.x3 = hasBranch ? S.x2 + 14 + S.brW + 6 + link : S.x2;
  S.W = S.x3 + 14 + S.formW + 18 + S.langW + PADX;
  return { availW, availH };
}

/* ---- 4. Telefon yerleşimi: yukarıdan aşağı, girintili, kıvrımlı dallar ---- */
const ROWM = 30, TX = 16, FX = 40, IND = 24;

function layoutNarrow(S) {
  const availW = Math.max(260, S.host.clientWidth);
  let y = 0;
  const leaves = [];
  S.groups.forEach((g, gi) => {
    if (gi) y += 22;
    g.pw = measure(g.recon, 'recon') + PILL_PAD * 2;
    g.y = y + PILL_H / 2;
    y += PILL_H + 10;
    g.fams.forEach(f => {
      f.y = y + ROWM / 2; y += ROWM;
      f.x = FX;
      if (!f.open) return;
      f.kids.forEach(k => {
        k.x = FX + IND;
        k.y = y + ROWM / 2; y += ROWM;
        if (k.type === 'branch') {
          if (!k.open) return;
          k.kids.forEach(l => { l.x = FX + IND * 2; l.y = y + ROWM / 2; y += ROWM; leaves.push(l); });
        } else leaves.push(k);
      });
    });
    g.endY = y;
  });
  S.H = y + 8;
  S.btn = BTN;
  S.langX = leaves.length ? Math.max(...leaves.map(l => l.x + 12 + measure(l.form, 'form'))) + 14 : FX + IND * 2;
  const famRight = Math.max(...S.fams.map(f => FX + 12 + measure(f.name, 'fam-label') + (f.hasPath ? BTN + 4 : 0)));
  S.W = Math.max(S.langX + (leaves.length ? Math.max(...leaves.map(l => measure(l.lang, 'lang'))) : 0), famRight, ...S.groups.map(g => g.pw)) + 6;
  return { availW };
}

/* ---- 5. Çizim ---- */
function render(S, opts = {}) {
  const wide = desktop();
  let s;
  if (wide) {
    const a = layoutWide(S, 1);
    s = Math.max(Math.min(1, a.availW / S.W, a.availH / S.H), .6);
    if (s < .999) layoutWide(S, s);
  } else {
    const a = layoutNarrow(S);
    s = Math.max(Math.min(1, a.availW / S.W), .8);
  }
  S.s = s;
  S.wide = wide;

  if (S.canvas) S.canvas.remove();
  const canvas = document.createElement('div');
  canvas.className = 'tree-canvas' + (wide ? '' : ' tree-canvas--narrow');
  canvas.style.width = (S.W * s).toFixed(0) + 'px';
  canvas.style.height = (S.H * s).toFixed(0) + 'px';
  S.host.appendChild(canvas);
  S.canvas = canvas;
  const svg = svgEl('svg', { class: 'tree', viewBox: '0 0 ' + S.W.toFixed(0) + ' ' + S.H.toFixed(0), width: (S.W * s).toFixed(0), height: (S.H * s).toFixed(0), role: 'group', 'aria-label': S.title + ': tree of forms by language family' }, canvas);
  S.svg = svg;
  const defs = svgEl('defs', {}, svg);
  const gL = svgEl('g', {}, svg);
  const gN = svgEl('g', {}, svg);
  const links = [], nodes = [];
  S.links = links; S.nodes = nodes;

  /* Kök kapsülündeki parıltı */
  const shine = 'shine' + (++uid);
  const lg = svgEl('linearGradient', { id: shine, x1: '0', x2: '1', y1: '0', y2: '0' }, defs);
  [[0, 'var(--ink)'], [.42, 'var(--ink)'], [.5, 'var(--accent)'], [.58, 'var(--ink)'], [1, 'var(--ink)']].forEach(([o, c]) => svgEl('stop', { offset: o, style: 'stop-color:' + c }, lg));
  if (!reduce) svgEl('animateTransform', { attributeName: 'gradientTransform', type: 'translate', values: '-1.2 0;1.2 0;1.2 0', keyTimes: '0;.45;1', dur: '6s', repeatCount: 'indefinite' }, lg);

  const addLink = (d, idx, from, to) => {
    const p = svgEl('path', { class: 'link', d }, gL);
    p.dataset.fam = idx;
    if (to && to.cross) p.classList.add('link--cross');
    links.push({ p, from, to });
  };
  const curve = (x1, y1, x2, y2) => { const xm = mid(x1, x2); return 'M' + x1 + ',' + y1 + ' C' + xm + ',' + y1 + ' ' + xm + ',' + y2 + ' ' + x2 + ',' + y2; };
  const elbow = (x1, y1, x2, y2) => 'M' + x1 + ',' + (y2 - 14) + ' Q' + x1 + ',' + y2 + ' ' + (x1 + 14) + ',' + y2 + ' H' + x2;
  const activate = (g, fn) => {
    g.addEventListener('click', fn);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
  };

  const drawRoot = (g, px, py) => {
    const node = svgEl('g', { class: 'node node--root' }, gN);
    svgEl('rect', { class: 'root-pill', x: px, y: py - PILL_H / 2, width: g.pw, height: PILL_H, rx: PILL_H / 2 }, node);
    const t = svgEl('text', { class: 'recon', x: px + g.pw / 2, y: py, dy: '.35em', 'text-anchor': 'middle' }, node);
    if (!reduce) t.setAttribute('fill', 'url(#' + shine + ')');
    t.textContent = g.recon;
    g.g = node;
    nodes.push(g);
    return node;
  };
  const drawFam = (f, x, y, labelX) => {
    const labelW = measure(f.name, 'fam-label');
    const g = svgEl('g', { class: 'node node--fam' + (f.open ? '' : ' node--collapsed'), 'data-fam': f.idx, tabindex: 0, role: 'button', 'aria-expanded': String(f.open), 'aria-label': f.name + (f.open ? ', expanded' : ', collapsed') }, gN);
    svgEl('rect', { class: 'hit', x: x - 10, y: y - 14, width: labelX - x + 12 + labelW, height: 28, rx: 8 }, g);
    svgEl('circle', { class: 'dot', cx: x, cy: y, r: 5.5 }, g);
    svgEl('text', { class: 'fam-label', x: labelX, y, dy: '.35em' }, g).textContent = f.name;
    f.g = g;
    f.bx = labelX + labelW + S.btn / 2 + 2;
    nodes.push(f);
    activate(g, () => toggle(S, f));
    return labelW;
  };
  const drawBranch = (k, f, x, y) => {
    const bw = measure(k.name, 'branch-label');
    const bg = svgEl('g', { class: 'node node--branch' + (k.open ? '' : ' node--collapsed'), 'data-fam': f.idx, tabindex: 0, role: 'button', 'aria-expanded': String(k.open), 'aria-label': k.name + ' (' + f.name + ')' + (k.open ? ', expanded' : ', collapsed') }, gN);
    svgEl('rect', { class: 'hit', x: x - 10, y: y - 13, width: 24 + bw, height: 26, rx: 8 }, bg);
    svgEl('circle', { class: 'dot', cx: x, cy: y, r: 4.5 }, bg);
    svgEl('text', { class: 'branch-label', x: x + 13, y, dy: '.35em' }, bg).textContent = k.name;
    k.g = bg; k.lx = x + 13 + bw + 6;
    nodes.push(k);
    activate(bg, () => toggle(S, k));
  };
  const drawLeaf = (l, x, y, langX) => {
    const g = svgEl('g', { class: 'node node--leaf' + (l.proto ? ' proto' : '') + (l.cross ? ' cross' : ''), 'data-fam': l.idx, tabindex: 0, role: 'button', 'aria-label': l.form + ' ' + l.lang + ' (copy form)' }, gN);
    svgEl('rect', { class: 'hit', x: x - 8, y: y - 13, width: langX - x + measure(l.lang, 'lang') + 18, height: 26, rx: 8 }, g);
    svgEl('circle', { class: 'dot', cx: x, cy: y, r: 3.6 }, g);
    svgEl('text', { class: 'form', x: x + 12, y, dy: '.35em' }, g).textContent = l.form;
    g.appendChild(document.createTextNode(' '));
    svgEl('text', { class: 'lang', x: langX, y, dy: '.35em' }, g).textContent = l.lang;
    l.g = g;
    nodes.push(l);
    activate(g, async () => { toast(await copy(l.form) ? 'Copied ' + l.form : 'Copy failed'); });
  };

  if (wide) {
    S.groups.forEach(g => {
      drawRoot(g, S.x0, g.y);
      const rx = S.x0 + g.pw;
      g.fams.forEach(f => {
        f.parent = g;
        addLink(curve(rx, g.y, S.x1, f.y), f.idx, g, f);
        const lw = drawFam(f, S.x1, f.y, S.x1 + 14);
        f.lx = S.x1 + 14 + lw + (f.hasPath ? S.btn : 0) + 6;
        if (!f.open) return;
        f.kids.forEach(k => {
          k.parent = f;
          if (k.type === 'branch') {
            addLink(curve(f.lx, f.y, S.x2, k.y), f.idx, f, k);
            drawBranch(k, f, S.x2, k.y);
            if (k.open) k.kids.forEach(l => { l.parent = k; addLink(curve(k.lx, k.y, S.x3, l.y), l.idx, k, l); drawLeaf(l, S.x3, l.y, S.x3 + 14 + S.formW + 18); });
          } else { addLink(curve(f.lx, f.y, S.x3, k.y), k.idx, f, k); drawLeaf(k, S.x3, k.y, S.x3 + 14 + S.formW + 18); }
        });
      });
      // kök noktası: dalların birleştiği yer
      svgEl('circle', { class: 'root-ring', cx: rx, cy: g.y, r: 5 }, g.g);
      svgEl('circle', { class: 'root-dot', cx: rx, cy: g.y, r: 5 }, g.g);
    });
  } else {
    S.groups.forEach(g => {
      drawRoot(g, 0, g.y);
      const last = g.fams[g.fams.length - 1];
      const trunk = svgEl('path', { class: 'link link--trunk', d: 'M' + TX + ',' + (g.y + PILL_H / 2) + ' V' + (last.y - 14) }, gL);
      links.push({ p: trunk, from: g, to: g });
      g.fams.forEach(f => {
        f.parent = g;
        addLink(elbow(TX, g.y, FX - 6, f.y), f.idx, g, f);
        drawFam(f, FX, f.y, FX + 12);
        if (!f.open) return;
        const lastK = f.kids[f.kids.length - 1];
        addLink('M' + FX + ',' + (f.y + 6) + ' V' + (lastK.y - 14), f.idx, f, f);
        f.kids.forEach(k => {
          k.parent = f;
          addLink(elbow(FX, f.y, k.x - 5, k.y), k.idx, f, k);
          if (k.type === 'branch') {
            drawBranch(k, f, k.x, k.y);
            if (!k.open) return;
            const lastL = k.kids[k.kids.length - 1];
            addLink('M' + k.x + ',' + (k.y + 5) + ' V' + (lastL.y - 14), f.idx, k, k);
            k.kids.forEach(l => { l.parent = k; addLink(elbow(k.x, k.y, l.x - 4, l.y), l.idx, k, l); drawLeaf(l, l.x, l.y, S.langX); });
          } else drawLeaf(k, k.x, k.y, S.langX);
        });
      });
      svgEl('circle', { class: 'root-ring', cx: TX, cy: g.y + PILL_H / 2, r: 4.5 }, g.g);
      svgEl('circle', { class: 'root-dot', cx: TX, cy: g.y + PILL_H / 2, r: 4.5 }, g.g);
    });
  }

  /* "?" düğmeleri: SVG üzerinde HTML düğme (klavye ve ekran okuyucu için) */
  S.fams.forEach(f => {
    if (!f.hasPath) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'why-btn';
    b.dataset.fam = f.idx;
    b.textContent = '?';
    b.setAttribute('aria-label', 'Possible sound path: ' + f.name + (S.groups.length > 1 ? ' (' + S.groups[f.gi].recon + ')' : ''));
    b.setAttribute('aria-haspopup', 'dialog');
    b.setAttribute('aria-expanded', 'false');
    b.style.left = (f.bx * s).toFixed(1) + 'px';
    b.style.top = (f.y * s).toFixed(1) + 'px';
    b.addEventListener('click', ev => { ev.stopPropagation(); openWhy(S, f, b); });
    b.addEventListener('pointerenter', () => highlight(f));
    b.addEventListener('pointerleave', clearHl);
    canvas.appendChild(b);
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
  if (wide) nodes.forEach(n => {
    n.g.addEventListener('pointerenter', () => highlight(n));
    n.g.addEventListener('pointerleave', clearHl);
    if (n.type !== 'root') { n.g.addEventListener('focus', () => highlight(n)); n.g.addEventListener('blur', clearHl); }
  });

  if (!S.animated && !reduce && !opts.noPre) canvas.classList.add('pre');
  if (opts.focus) { const t = nodes.find(n => n.type === opts.focus.type && n.name === opts.focus.name && n.gi === opts.focus.gi); if (t) t.g.focus({ preventScroll: true }); }
}

function animateIn(S) {
  if (S.animated || !S.canvas) return;
  S.animated = true;
  if (!S.canvas.classList.contains('pre')) return;
  const depth = n => (n.type === 'root' ? 0 : n.type === 'fam' ? 1 : n.type === 'branch' ? 2 : 3);
  S.links.forEach((l, i) => {
    l.p.style.setProperty('--len', l.p.getTotalLength().toFixed(1));
    l.p.style.setProperty('--d', ((depth(l.to) - 1) * .24 + (i % 9) * .02 + .2).toFixed(2) + 's');
    l.p.classList.add('draw');
  });
  S.nodes.forEach((n, i) => {
    n.g.style.setProperty('--d', (depth(n) * .24 + (i % 9) * .02).toFixed(2) + 's');
    n.g.classList.add('enter');
  });
  $$('.why-btn', S.canvas).forEach((b, i) => b.style.setProperty('--d', (.6 + i * .05).toFixed(2) + 's'));
  S.canvas.classList.remove('pre');
  S.canvas.classList.add('in');
}

function toggle(S, n) {
  closeWhy(true);
  n.open = !n.open;
  S.animated = true;
  const gi = n.type === 'fam' ? n.gi : (n.parent && n.parent.gi);
  render(S, { focus: { type: n.type, name: n.name, gi: n.type === 'fam' ? gi : undefined }, noPre: true });
}

/* ---- 6. Olası ses yolağı kutusu ---- */
const why = document.createElement('div');
why.className = 'why';
why.id = 'why';
why.setAttribute('role', 'dialog');
why.setAttribute('aria-labelledby', 'whyTitle');
why.tabIndex = -1;
why.hidden = true;
why.innerHTML = '<div class="why__head"><span class="why__dot" aria-hidden="true"></span><h3 class="why__title" id="whyTitle"></h3>' +
  '<button type="button" class="why__x" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
  '<p class="why__k">Possible sound path</p><ol class="deriv"></ol>';
document.body.appendChild(why);
let whyFrom = null, whyY = 0;

function openWhy(S, f, btn) {
  if (whyFrom === btn && !why.hidden) { closeWhy(); return; }
  closeWhy(true);
  why.dataset.fam = f.idx;
  $('.why__title', why).textContent = f.name;
  const ol = $('.deriv', why);
  ol.textContent = '';
  const row = (form, change, cls) => {
    const li = document.createElement('li');
    if (cls) li.className = cls;
    const a = document.createElement('span'); a.className = 'deriv__f'; a.lang = 'und-fonipa'; a.textContent = form;
    li.appendChild(a);
    if (change) { const b = document.createElement('span'); b.className = 'deriv__c'; b.lang = 'und-fonipa'; b.textContent = change; li.appendChild(b); }
    ol.appendChild(li);
  };
  if (f.path) f.path.forEach((r, i) => row(r[0], r[1], i ? '' : 'deriv__root'));
  else { row(S.groups[f.gi].recon, '', 'deriv__root'); row('No regular path', '', 'deriv__none'); }
  why.hidden = false;
  const sheet = innerWidth < 640;
  why.classList.toggle('why--sheet', sheet);
  if (!sheet) {
    const r = btn.getBoundingClientRect();
    const w = why.offsetWidth, h = why.offsetHeight;
    let left = r.right + 12;
    if (left + w > innerWidth - 12) left = r.left - w - 12;
    if (left < 12) left = clamp(r.left - w / 2, 12, innerWidth - w - 12);
    why.style.left = left + 'px';
    why.style.top = clamp(r.top - 24, headerH() + 8, innerHeight - h - 12) + 'px';
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

/* ---- 7. Sol ray: kaydırma izleme, başa ve sona git, tablo ---- */
const rail = $('.numrail');
const railLinks = rail ? $$('.numrail__link', rail) : [];
const tableLink = rail ? $('.numrail__table', rail) : null;
function setActive(id) {
  let found = false;
  railLinks.forEach(a => {
    const on = a.getAttribute('href') === '#' + id;
    if (on) {
      found = true;
      a.setAttribute('aria-current', 'location');
      $('.numrail__list', rail).style.setProperty('--spy', Math.max(0, a.offsetTop + a.offsetHeight / 2 - 18) + 'px');
      if (rail.scrollWidth > rail.clientWidth + 2) rail.scrollTo({ left: a.offsetLeft - rail.clientWidth / 2 + a.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
    } else a.removeAttribute('aria-current');
  });
  if (tableLink) { if (id === 'overview') tableLink.setAttribute('aria-current', 'location'); else tableLink.removeAttribute('aria-current'); }
  if (!found && rail) {
    const list = $('.numrail__list', rail);
    list.style.setProperty('--spy', id === 'end' ? (list.offsetHeight - 36) + 'px' : '0px');
  }
}
if (rail && 'IntersectionObserver' in window) {
  const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }), { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  $$('[data-spy], .page-head, .overview, .endzone').forEach(el => spy.observe(el));
}
$$('[data-bottom]').forEach(b => b.addEventListener('click', () => {
  scrollTo({ top: document.documentElement.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
}));

/* ---- 8. Alıntı ---- */
const cite = $('[data-cite]');
const accessed = $('[data-accessed]');
if (accessed) accessed.textContent = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
if (cite) cite.addEventListener('click', async () => {
  toast(await copy($('#citeText').textContent.trim().replace(/\s+/g, ' ')) ? 'Citation copied' : 'Copy failed');
});

/* ---- 9. Başlangıç ---- */
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
  }), { threshold: .12 });
  sections.forEach(S => revealIO.observe(S.sec));
}
let lastW = innerWidth, lastH = innerHeight, rz = 0;
addEventListener('resize', () => {
  clearTimeout(rz);
  rz = setTimeout(() => {
    // Telefonda adres çubuğu yüksekliği değişince yeniden çizme
    if (innerWidth === lastW && (!desktop() || Math.abs(innerHeight - lastH) < 40)) return;
    lastW = innerWidth; lastH = innerHeight;
    renderAll(true);
  }, 160);
});

renderAll(false);
observeReveal();
const fontsReady = document.fonts && document.fonts.load
  ? Promise.all(['italic 600 22px "Noto Serif IPA"', '15px "Noto Serif IPA"', 'italic 15px "Noto Serif IPA"', '700 13px "Plus Jakarta Sans"', '12px "Plus Jakarta Sans"'].map(f => document.fonts.load(f))).catch(() => {}).then(() => document.fonts.ready)
  : Promise.resolve();
fontsReady.then(() => {
  widths.clear();
  renderAll(false);
  if (location.hash.length > 1) { const t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) t.scrollIntoView(); }
});
})();

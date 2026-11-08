/* hickimse — erken başlatma: sayfa boyanmadan önce tema ve görünüm tercihini uygular (titremeyi önler). */
(() => {
  const root = document.documentElement;
  const read = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  root.classList.add('js');

  const saved = read('hk.theme');
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = saved === 'light' || saved === 'dark' ? saved : (dark ? 'dark' : 'light');

  const view = read('hk.view');
  root.dataset.view = view === 'tree' || view === 'table' ? view : (innerWidth >= 860 ? 'tree' : 'table');

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = root.dataset.theme === 'dark' ? '#090f24' : '#f1f5fa';
})();

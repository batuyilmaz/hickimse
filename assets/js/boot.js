/* hiç kimse — erken başlatma: sayfa boyanmadan önce tema ve görünüm tercihini uygular (titremeyi önler). */
(() => {
  const root = document.documentElement;
  const read = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  root.classList.add('js');

  const saved = read('hk.theme');
  // Varsayılan tema her zaman açık; yalnızca ziyaretçi değiştirdiyse koyu açılır.
  root.dataset.theme = saved === 'dark' ? 'dark' : 'light';

  const view = read('hk.view');
  root.dataset.view = view === 'tree' || view === 'table' ? view : (innerWidth >= 860 ? 'tree' : 'table');

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = root.dataset.theme === 'dark' ? '#090f24' : '#f1f5fa';
})();

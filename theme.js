/* Przełącznik jasny/ciemny motyw strony Moje Kręgi. Bez wyboru strona idzie za ustawieniem systemu;
   wybór zapisuje się w przeglądarce (localStorage „mk-theme”). Wczesne ustawienie data-theme robi skrypt w <head>, żeby nie mignęło. */
(function () {
  var root = document.documentElement;
  var dark = matchMedia('(prefers-color-scheme: dark)');
  var current = function () { return root.dataset.theme || (dark.matches ? 'dark' : 'light'); };
  var paint = function () {
    var isDark = current() === 'dark';
    document.querySelectorAll('.theme-toggle').forEach(function (b) {
      b.setAttribute('aria-pressed', String(isDark));
      b.setAttribute('aria-label', isDark ? 'Włącz jasny motyw' : 'Włącz ciemny motyw');
      b.title = b.getAttribute('aria-label');
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = isDark ? '#121815' : '#38614F';
  };
  document.querySelectorAll('.theme-toggle').forEach(function (b) {
    b.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      var apply = function () {
        root.dataset.theme = next;
        try { localStorage.setItem('mk-theme', next); } catch (e) { /* bez pamięci, tylko na tę wizytę */ }
        paint();
      };
      if (document.startViewTransition && document.visibilityState === 'visible' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // przejście bywa przerwane (karta w tle, kolejne kliknięcie), motyw i tak zmienia się w apply()
        var vt = document.startViewTransition(apply);
        vt.ready.catch(function () {}); vt.finished.catch(function () {});
      } else apply();
    });
  });
  dark.addEventListener('change', paint);
  paint();
})();

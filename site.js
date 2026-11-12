/* Strona Moje Kręgi: zapasowe „odsłanianie” sekcji (bez animation-timeline) i licznik w statystykach. */
(function () {
  var root = document.documentElement;
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (calm || !('IntersectionObserver' in window)) return;

  // Odsłanianie przy przewijaniu: CSS scroll-driven animations, a gdzie ich brak – IntersectionObserver.
  if (!(window.CSS && CSS.supports('animation-timeline: view()'))) {
    root.classList.add('io');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  }

  // Liczby w statystykach doliczają się raz, gdy pasek wejdzie w widok.
  var stats = document.querySelector('.stats');
  if (!stats) return;
  var once = new IntersectionObserver(function (entries) {
    if (!entries[0].isIntersecting) return;
    once.disconnect();
    stats.querySelectorAll('[data-count]').forEach(function (el) {
      var end = +el.dataset.count, t0 = performance.now(), dur = 900;
      (function tick(t) {
        var p = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: 0.6 });
  once.observe(stats);
})();

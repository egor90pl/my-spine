/* Strona Moje Kręgi: zapasowe „odsłanianie” sekcji (bez animation-timeline) i licznik w statystykach. */
(function () {
  var root = document.documentElement;
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (calm || !('IntersectionObserver' in window)) return;

  // Odsłanianie przy przewijaniu: CSS scroll-driven animations, a gdzie ich brak, IntersectionObserver.
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

/* Partie ciała (sylwetka + karty) i wybór sprzętu z licznikiem ćwiczeń. Bez JS: wszystkie karty widoczne jedna pod drugą. */
(function () {
  var map = document.querySelector('[data-body-map]');
  if (map) {
    map.classList.add('bm--js');
    var tabs = [].slice.call(map.querySelectorAll('.bm-chip'));
    var zones = [].slice.call(map.querySelectorAll('.zone'));
    var select = function (id, focus) {
      tabs.forEach(function (t) {
        var on = t.dataset.zone === id;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      map.querySelectorAll('.bm-panel').forEach(function (p) {
        if (p.dataset.zone === id) p.setAttribute('data-active', ''); else p.removeAttribute('data-active');
      });
      zones.forEach(function (z) { z.classList.toggle('is-active', z.dataset.zone === id); });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t.dataset.zone); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (e.key === 'Home') d = -i; else if (e.key === 'End') d = tabs.length - 1 - i;
        if (!d) return;
        e.preventDefault();
        select(tabs[(i + d + tabs.length) % tabs.length].dataset.zone, true);
      });
    });
    zones.forEach(function (z) { z.addEventListener('click', function () { select(z.dataset.zone); }); });
    select(tabs[0] && tabs[0].dataset.zone);
  }

  var gear = document.querySelector('[data-gear]');
  if (gear) {
    var needs;
    try { needs = JSON.parse(gear.dataset.gear).map(function (s) { return s ? s.split(' ') : []; }); } catch (e) { return; }
    var total = +gear.dataset.total || needs.length;
    var nEl = gear.querySelector('.gear-n'), bar = gear.querySelector('.gear-bar span'), note = gear.querySelector('.gear-note');
    var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var shown = +nEl.textContent, raf = 0;
    var word = function (n) {
      if (n === 1) return 'ćwiczenie';
      var a = n % 10, b = n % 100;
      return a >= 2 && a <= 4 && (b < 10 || b >= 20) ? 'ćwiczenia' : 'ćwiczeń';
    };
    var base = needs.filter(function (k) { return !k.length; }).length;
    var count = function () {
      var have = {};
      gear.querySelectorAll('.gear-chip[aria-pressed="true"]').forEach(function (b) { have[b.dataset.key] = true; });
      var n = needs.filter(function (k) { return k.every(function (x) { return have[x]; }); }).length;
      bar.style.setProperty('--p', (n / total * 100).toFixed(1) + '%');
      note.textContent = n === base
        ? 'Bez sprzętu masz ' + base + ' ' + word(base) + '. Zaznacz, co masz w domu, i zobacz, ile ich przybędzie.'
        : 'Z zaznaczonym sprzętem masz ' + n + ' ' + word(n) + ', o ' + (n - base) + ' więcej niż bez sprzętu.';
      cancelAnimationFrame(raf);
      if (calm) { nEl.textContent = shown = n; return; }
      var from = shown, t0 = performance.now();
      (function tick(t) {
        var p = Math.min(1, (t - t0) / 450);
        shown = Math.round(from + (n - from) * (1 - Math.pow(1 - p, 3)));
        nEl.textContent = shown;
        if (p < 1) raf = requestAnimationFrame(tick);
      })(t0);
    };
    gear.querySelectorAll('.gear-chip[data-key]').forEach(function (b) {
      b.addEventListener('click', function () {
        b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
        count();
      });
    });
  }
})();

/* Lektorzy: kliknięcie odtwarza kolejną kwestię i pokazuje jej napis. Naraz mówi jeden lektor. */
(function () {
  var cards = [].slice.call(document.querySelectorAll('.voice[data-quotes]'));
  if (!cards.length) return;
  var audio = new Audio(), current = null;
  audio.preload = 'none';
  audio.addEventListener('ended', function () { if (current) current.classList.remove('is-playing'); });
  audio.addEventListener('error', function () {
    if (!current) return;
    current.classList.remove('is-playing');
    current.parentNode.querySelector('.voice-quote').textContent = '';
  });
  cards.forEach(function (card) {
    var quotes;
    try { quotes = JSON.parse(card.dataset.quotes); } catch (e) { return; }
    var i = 0, bubble = card.parentNode.querySelector('.voice-quote');
    card.addEventListener('click', function () {
      var q = quotes[i % quotes.length]; i += 1;
      if (current && current !== card) current.parentNode.querySelector('.voice-quote').textContent = '';
      if (current) current.classList.remove('is-playing');
      audio.pause();
      current = card;
      bubble.textContent = '„' + q.text + '”';
      audio.src = q.src;
      var p = audio.play();
      card.classList.add('is-playing');
      if (p && p.catch) p.catch(function () { if (audio.paused) card.classList.remove('is-playing'); });
    });
  });
})();

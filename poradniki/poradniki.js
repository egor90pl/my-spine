/* Poradniki mojekregi.eu (M48): spis treści z podświetleniem, udostępnianie, druk i „na górę”.
   Bez bibliotek; strona działa też bez JS. */
(function () {
  'use strict';
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // ---------- spis treści: bieżąca sekcja ----------
  var tocLinks = $$('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
      var heads = $$('.prose h2[id]');
      var current = null;
      for (var i = 0; i < heads.length; i++) { if (heads[i].getBoundingClientRect().top < window.innerHeight * 0.35) current = heads[i].id; }
      tocLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
      if (current && byId[current]) byId[current].setAttribute('aria-current', 'true');
    }, { rootMargin: '-80px 0px -55% 0px' });
    $$('.prose h2[id]').forEach(function (h) { io.observe(h); });
  }
  // na telefonie spis treści zwinięty
  var tocDetails = $('.toc details');
  if (tocDetails && matchMedia('(max-width: 1000px)').matches) tocDetails.removeAttribute('open');

  // ---------- kopiowanie linku do sekcji ----------
  $$('.anchor').forEach(function (a) {
    a.addEventListener('click', function () {
      var url = location.href.split('#')[0] + a.getAttribute('href');
      if (navigator.clipboard) navigator.clipboard.writeText(url).catch(function () {});
    });
  });

  // ---------- udostępnianie i druk ----------
  $$('[data-act="share"]').forEach(function (b) {
    b.addEventListener('click', function () {
      var data = { title: document.title, url: location.href.split('#')[0] };
      if (navigator.share) { navigator.share(data).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(data.url).then(function () {
        var span = $('span', b), old = span.textContent;
        span.textContent = 'Skopiowano link';
        setTimeout(function () { span.textContent = old; }, 2000);
      }).catch(function () {});
    });
  });
  $$('[data-act="print"]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });

  // ---------- na górę ----------
  var top = $('.to-top');
  if (top) {
    var onScroll = function () { top.classList.toggle('show', window.scrollY > 900); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();

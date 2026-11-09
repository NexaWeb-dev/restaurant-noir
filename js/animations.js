/* =========================================================
   NOIR — animations.js
   Intersection Observer reveals, staggering, parallax.
   ========================================================= */
(function () {
  'use strict';
  var N = window.NOIR;
  var $$ = N.$$;
  var reduce = N.reduce;

  /* ---------- Stagger indices ---------- */
  $$('[data-reveal="lines"]').forEach(function (h) {
    $$('.line', h).forEach(function (l, i) { l.firstElementChild.style.setProperty('--i', i); });
  });
  $$('[data-stagger]').forEach(function (group) {
    $$('[data-reveal]', group).forEach(function (el, i) { el.style.setProperty('--d', (i * 0.13) + 's'); });
  });
  // Dish blocks: stagger the text parts after the image
  $$('.dish__body').forEach(function (body) {
    $$('[data-reveal]', body).forEach(function (el, i) {
      el.style.setProperty('--d', (0.25 + i * 0.12) + 's');
    });
  });

  /* ---------- Reveals ---------- */
  var targets = $$('[data-reveal], [data-panel]');
  var reveal = function (el) {
    el.classList.add('is-in');
    if (el.getAttribute('data-reveal') === 'img') {
      setTimeout(function () { el.classList.add('is-done'); }, reduce ? 0 : 2200);
    }
  };
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(reveal);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        reveal(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- Parallax (uses the independent `translate` property so
     it never fights the reveal/hover `transform` scale) ---------- */
  var pItems = $$('img[data-parallax]').map(function (img) {
    return { img: img, frame: img.parentElement, speed: parseFloat(img.getAttribute('data-parallax')) || 0.08, visible: false };
  });
  if (!reduce && pItems.length && 'IntersectionObserver' in window && 'translate' in document.documentElement.style) {
    pItems.forEach(function (p) { p.img.classList.add('has-parallax'); });
    var pio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var p = pItems.filter(function (x) { return x.frame === en.target; })[0];
        if (p) p.visible = en.isIntersecting;
      });
      schedule();
    }, { rootMargin: '15% 0px' });
    pItems.forEach(function (p) { pio.observe(p.frame); });

    var queued = false;
    var update = function () {
      queued = false;
      var vh = window.innerHeight;
      pItems.forEach(function (p) {
        if (!p.visible) return;
        var r = p.frame.getBoundingClientRect();
        var delta = (r.top + r.height / 2) - vh / 2;
        var limit = r.height * 0.07;
        var y = Math.max(-limit, Math.min(limit, -delta * p.speed));
        p.img.style.translate = '0 ' + y.toFixed(1) + 'px';
      });
    };
    var schedule = function () { if (!queued) { queued = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
  }
})();

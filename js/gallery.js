/* =========================================================
   NOIR — gallery.js
   Full-screen lightbox: the photo grows out of (and shrinks back
   into) the thumbnail that was clicked. Keyboard, swipe, focus trap.
   ========================================================= */
(function () {
  'use strict';
  var N = window.NOIR;
  var $ = N.$, $$ = N.$$, reduce = N.reduce;

  var buttons = $$('.g-item__btn');
  var lb = $('#lightbox');
  if (!buttons.length || !lb) return;

  var img = $('.lightbox__img', lb);
  var count = $('.lightbox__count', lb);
  var text = $('.lightbox__text', lb);
  var prev = $('.lightbox__nav--prev', lb);
  var next = $('.lightbox__nav--next', lb);
  var closeBtn = $('.lightbox__close', lb);

  var items = buttons.map(function (b) {
    var im = $('img', b);
    return { btn: b, thumb: im, src: im.getAttribute('src'), alt: im.alt, cap: $('.g-item__cap', b).textContent };
  });
  var index = 0, isOpen = false, lastFocus = null, closing = false;

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function setContent(i) {
    var it = items[i];
    img.src = it.src;
    img.alt = it.alt;
    count.textContent = pad(i + 1) + ' / ' + pad(items.length);
    text.textContent = it.cap;
  }
  function whenReady(el, cb) {
    var done = false;
    var fin = function () { if (!done) { done = true; cb(); } };
    if (el.complete && el.naturalWidth) return fin();
    el.addEventListener('load', fin, { once: true });
    el.addEventListener('error', fin, { once: true });
    setTimeout(fin, 3000);
  }

  // Transform that makes the lightbox image sit exactly over a thumbnail
  function fromRect(rect) {
    var r = img.getBoundingClientRect();
    if (!r.width || !r.height) return '';
    var s = Math.max(rect.width / r.width, rect.height / r.height);
    var dx = (rect.left + rect.width / 2) - (r.left + r.width / 2);
    var dy = (rect.top + rect.height / 2) - (r.top + r.height / 2);
    return 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')';
  }

  function open(i) {
    if (isOpen) return;
    isOpen = true; index = i;
    lastFocus = document.activeElement;
    var scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = scrollbar + 'px';
    lb.hidden = false;
    setContent(i);
    img.classList.add('no-anim');
    img.style.opacity = '0';

    whenReady(img, function () {
      var thumbRect = items[i].thumb.getBoundingClientRect();
      var start = reduce ? '' : fromRect(thumbRect);
      img.style.transform = start;
      img.style.opacity = start ? '1' : '0';
      void img.offsetWidth;
      img.classList.remove('no-anim');
      requestAnimationFrame(function () {
        lb.classList.add('is-open');
        img.style.transform = '';
        img.style.opacity = '1';
      });
      closeBtn.focus({ preventScroll: true });
    });
  }

  function finishClose() {
    lb.hidden = true;
    lb.classList.remove('is-open');
    img.style.transform = ''; img.style.opacity = '';
    document.documentElement.style.overflow = '';
    document.body.style.paddingRight = '';
    isOpen = false; closing = false;
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function close() {
    if (!isOpen || closing) return;
    closing = true;
    var thumb = items[index].thumb;
    var rect = thumb.getBoundingClientRect();
    var visible = rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
    lb.classList.remove('is-open');
    if (reduce) return finishClose();
    if (visible) {
      img.style.transform = fromRect(rect);
      img.style.opacity = '0';
    } else {
      img.style.opacity = '0';
    }
    setTimeout(finishClose, 750);
  }

  function go(delta) {
    if (!isOpen || closing) return;
    index = (index + delta + items.length) % items.length;
    img.classList.add('is-swap');
    setTimeout(function () {
      setContent(index);
      whenReady(img, function () { img.classList.remove('is-swap'); });
    }, reduce ? 0 : 280);
  }

  buttons.forEach(function (b, i) { b.addEventListener('click', function () { open(i); }); });
  prev.addEventListener('click', function () { go(-1); });
  next.addEventListener('click', function () { go(1); });
  $$('[data-lb-close]', lb).forEach(function (el) { el.addEventListener('click', close); });

  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Tab') {
      var f = [closeBtn, prev, next];
      var i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });

  // Swipe
  var sx = 0, sy = 0;
  lb.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].clientX; sy = e.changedTouches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  }, { passive: true });
})();

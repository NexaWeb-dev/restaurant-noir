/* =========================================================
   NOIR — main.js
   Core: helpers, entrance, navigation, progress, cursor,
   testimonials and the reservation form.
   ========================================================= */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Shared across modules
  window.NOIR = { $: $, $$: $$, reduce: reduce, finePointer: finePointer };

  /* ---------- Footer year ---------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Image fallbacks (never leave an empty frame) ---------- */
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (!t || t.tagName !== 'IMG') return;
    var box = t.closest('.frame, .g-item, .menu__frame, .exp__bg, .lightbox__figure');
    if (box) box.classList.add('img-failed');
    t.setAttribute('data-failed', '');
  }, true);

  /* ---------- Split headline into masked characters ---------- */
  function splitChars(el, lineIndex) {
    var text = el.textContent.trim();
    el.textContent = '';
    var sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    el.appendChild(sr);
    el.style.setProperty('--l', lineIndex);
    var c = 0;
    text.split(' ').forEach(function (word, wi, arr) {
      var w = document.createElement('span');
      w.className = 'split-word';
      w.setAttribute('aria-hidden', 'true');
      word.split('').forEach(function (ch) {
        var s = document.createElement('span');
        s.className = 'split-char';
        s.textContent = ch;
        s.style.setProperty('--c', c++);
        w.appendChild(s);
      });
      el.appendChild(w);
      if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }
  $$('[data-split]').forEach(function (el, i) { splitChars(el, i); });
  // The h1 already has an aria-label; hide duplicated sr text from the accessibility tree.
  $$('.hero h1 .sr-only').forEach(function (n) { n.setAttribute('aria-hidden', 'true'); });

  /* ---------- Entrance: wait for hero image + fonts, then reveal ---------- */
  $$('.hero__actions > *').forEach(function (n, i) { n.style.setProperty('--i', i); });
  $$('.hero__meta li').forEach(function (n, i) { n.style.setProperty('--i', i); });

  var started = false;
  function start() {
    if (started) return;
    started = true;
    document.body.classList.add('is-ready');
  }
  var heroImg = $('.hero__img img');
  var ready = [
    (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve(),
    new Promise(function (res) {
      if (!heroImg || (heroImg.complete && heroImg.naturalWidth)) return res();
      heroImg.addEventListener('load', res, { once: true });
      heroImg.addEventListener('error', res, { once: true });
    })
  ];
  Promise.all(ready).then(function () { requestAnimationFrame(start); });
  setTimeout(start, 2500); // never block the page on a slow font/image

  /* ---------- Scroll: nav state, progress, back-to-top, active link ---------- */
  var nav = $('#nav');
  var bar = $('.progress__bar');
  var toTop = $('.to-top');
  var navLinks = $$('.nav__links a');
  var sectionMap = [
    ['discover', 'discover'], ['signature', 'discover'], ['experience', 'experience'], ['menu', 'menu'],
    ['story', 'story'], ['gallery', 'gallery'], ['reviews', null], ['reservations', 'reservations'], ['visit', null]
  ].map(function (p) { return { el: document.getElementById(p[0]), key: p[1] }; }).filter(function (p) { return p.el; });
  var activeKey = null;
  var ticking = false;

  function setActive(key) {
    if (key === activeKey) return;
    activeKey = key;
    navLinks.forEach(function (a) {
      var on = a.getAttribute('data-nav') === key;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }

  function onScroll() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('is-scrolled', y > 60);
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    toTop.classList.toggle('is-visible', y > window.innerHeight * 1.2);

    var probe = window.innerHeight * 0.4, key = null;
    for (var i = 0; i < sectionMap.length; i++) {
      if (sectionMap[i].el.getBoundingClientRect().top <= probe) key = sectionMap[i].key; else break;
    }
    setActive(key);
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------- Mobile menu ---------- */
  var toggle = $('.nav__toggle');
  var menu = $('#mobile-menu');
  $$('.mobile-menu__nav a', menu).forEach(function (a, i) { a.style.setProperty('--i', i); });

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) nav.classList.add('is-scrolled-menu');
    else nav.classList.remove('is-scrolled-menu');
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 1025px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });

  /* ---------- Custom cursor (desktop pointers only) ---------- */
  var cursor = $('.cursor');
  if (finePointer && !reduce && cursor) {
    var label = $('.cursor__label', cursor);
    var cx = 0, cy = 0, tx = 0, ty = 0, running = false;
    var loop = function () {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cursor.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) requestAnimationFrame(loop); else running = false;
    };
    window.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!cursor.classList.contains('is-on')) { cx = tx; cy = ty; cursor.classList.add('is-on'); }
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { cursor.classList.remove('is-on'); });
    document.addEventListener('mouseover', function (e) {
      var lab = e.target.closest('[data-cursor]');
      var link = e.target.closest('a, button, input, select, textarea, label');
      cursor.classList.toggle('is-label', !!lab);
      cursor.classList.toggle('is-link', !!link && !lab);
      if (lab) label.textContent = lab.getAttribute('data-cursor');
    });
  }

  /* ---------- Testimonials (sample content) ---------- */
  var reviews = [
    { name: 'Ananya Rao', src: 'Google Reviews', stars: 5, text: 'An evening that felt composed, like a film. The striploin was extraordinary and the service never once intruded.' },
    { name: 'Marcus Hale', src: 'TripAdvisor', stars: 5, text: 'I have eaten in Paris and in Tokyo. NOIR belongs in that conversation — quiet, confident and beautifully paced.' },
    { name: 'Priya Nair', src: 'Zomato', stars: 5, text: 'The coconut bisque alone is worth the reservation. Every plate arrived exactly as it should, and nothing was unnecessary.' },
    { name: 'Daniel Okafor', src: 'Google Reviews', stars: 4, text: 'Superb atmosphere and a dessert I am still thinking about. Book early for weekends — the room fills quickly.' }
  ];
  var quotesEl = $('.reviews__quotes');
  var peopleEl = $('.reviews__people');
  if (quotesEl && peopleEl) {
    var current = 0, timer = null, manual = false;
    reviews.forEach(function (r, i) {
      var q = document.createElement('blockquote');
      q.className = 'quote' + (i === 0 ? ' is-active' : '');
      q.id = 'quote-' + i;
      q.setAttribute('role', 'tabpanel');
      q.setAttribute('aria-labelledby', 'person-' + i);
      var mark = document.createElement('span'); mark.className = 'quote__mark'; mark.setAttribute('aria-hidden', 'true'); mark.textContent = '“';
      var t = document.createElement('p'); t.className = 'quote__text'; t.textContent = r.text;
      var m = document.createElement('div'); m.className = 'quote__meta';
      var st = document.createElement('span'); st.className = 'stars'; st.setAttribute('role', 'img'); st.setAttribute('aria-label', r.stars + ' out of 5 stars');
      for (var s = 0; s < 5; s++) { var star = document.createElement('span'); star.textContent = '★'; if (s >= r.stars) star.className = 'off'; star.setAttribute('aria-hidden', 'true'); st.appendChild(star); }
      var who = document.createElement('span'); who.textContent = r.name + ' · ' + r.src + ' (sample)';
      m.appendChild(st); m.appendChild(who);
      q.appendChild(mark); q.appendChild(t); q.appendChild(m);
      quotesEl.appendChild(q);

      var b = document.createElement('button');
      b.type = 'button'; b.className = 'person'; b.id = 'person-' + i;
      b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'quote-' + i);
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false'); b.tabIndex = i === 0 ? 0 : -1;
      b.innerHTML = '<span class="person__name"></span><span class="person__src"></span>';
      $('.person__name', b).textContent = r.name;
      $('.person__src', b).textContent = r.src;
      b.addEventListener('click', function () { manual = true; stop(); show(i); });
      b.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = (current + 1) % reviews.length;
        if (e.key === 'ArrowLeft') n = (current - 1 + reviews.length) % reviews.length;
        if (n !== null) { e.preventDefault(); manual = true; stop(); show(n); $$('.person', peopleEl)[n].focus(); }
      });
      peopleEl.appendChild(b);
    });

    var show = function (i) {
      current = i;
      $$('.quote', quotesEl).forEach(function (q, k) { q.classList.toggle('is-active', k === i); });
      $$('.person', peopleEl).forEach(function (p, k) {
        p.setAttribute('aria-selected', String(k === i));
        p.tabIndex = k === i ? 0 : -1;
        p.classList.toggle('is-paused', manual);
      });
    };
    var stop = function () { clearInterval(timer); timer = null; };
    var play = function () {
      if (reduce || manual || timer) return;
      $$('.person', peopleEl).forEach(function (p) { p.classList.remove('is-paused'); });
      timer = setInterval(function () { show((current + 1) % reviews.length); }, 6000);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { en[0].isIntersecting ? play() : stop(); }, { threshold: 0.35 }).observe($('.reviews'));
    }
    // Stack quotes absolutely only while hidden; give the container the height of the tallest quote.
    var fit = function () {
      var h = 0;
      $$('.quote', quotesEl).forEach(function (q) {
        var was = q.className;
        q.style.cssText = 'position:relative;opacity:0;visibility:hidden;transition:none';
        h = Math.max(h, q.offsetHeight);
        q.style.cssText = '';
        q.className = was;
      });
      quotesEl.style.minHeight = h + 'px';
    };
    fit();
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }

  /* ---------- Reservation form ---------- */
  var form = $('#resv-form');
  if (form) {
    var confirmEl = $('#resv-confirm');
    var dateEl = $('#f-date');
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var iso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
    var parseDate = function (v) { var p = v.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
    var now = new Date();
    var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var maxDate = new Date(startOfToday); maxDate.setDate(maxDate.getDate() + 120);
    dateEl.min = iso(startOfToday);
    dateEl.max = iso(maxDate);

    var timeToMinutes = function (str) {
      var m = /^(\d{1,2}):(\d{2})\s(AM|PM)$/.exec(str);
      if (!m) return null;
      var h = parseInt(m[1], 10) % 12;
      if (m[3] === 'PM') h += 12;
      return h * 60 + parseInt(m[2], 10);
    };

    var rules = {
      name: function (v) {
        v = v.trim();
        if (!v) return 'Please tell us your name.';
        if (v.length < 2) return 'Your name looks a little short.';
        if (!/^[\p{L}][\p{L}\s'.\-]*$/u.test(v)) return 'Please use letters only.';
        return '';
      },
      email: function (v) {
        v = v.trim();
        if (!v) return 'We need an email to confirm your table.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'That email doesn\'t look quite right.';
        return '';
      },
      phone: function (v) {
        v = v.trim();
        if (!v) return 'Please share a phone number.';
        if (!/^[+()\d\s\-]+$/.test(v)) return 'Use digits, spaces and + only.';
        var d = v.replace(/\D/g, '');
        if (d.length < 10 || d.length > 13) return 'Enter a valid number (10–13 digits).';
        return '';
      },
      date: function (v) {
        if (!v) return 'Please choose a date.';
        var d = parseDate(v);
        if (isNaN(d)) return 'Please choose a valid date.';
        if (d < startOfToday) return 'That date has already passed.';
        if (d > maxDate) return 'We take bookings up to 120 days ahead.';
        if (d.getDay() === 1) return 'We are closed on Mondays — please pick another day.';
        return '';
      },
      time: function (v) {
        if (!v) return 'Please select a time.';
        var d = dateEl.value ? parseDate(dateEl.value) : null;
        if (d && d.getTime() === startOfToday.getTime()) {
          var n = new Date();
          if (timeToMinutes(v) <= n.getHours() * 60 + n.getMinutes()) return 'That time has already passed today.';
        }
        return '';
      },
      guests: function () {
        return form.querySelector('input[name="guests"]:checked') ? '' : 'Please select your party size.';
      }
    };

    var box = function (name) {
      if (name === 'guests') return $('.guests', form);
      return form.elements[name].closest('.field');
    };
    var setError = function (name, msg) {
      var b = box(name), err = $('.field__err', b);
      b.classList.toggle('has-error', !!msg);
      err.textContent = msg;
      if (name !== 'guests') form.elements[name].setAttribute('aria-invalid', msg ? 'true' : 'false');
      return !msg;
    };
    var check = function (name) {
      var val = name === 'guests' ? '' : form.elements[name].value;
      return setError(name, rules[name](val));
    };

    var touched = {};
    Object.keys(rules).forEach(function (name) {
      if (name === 'guests') {
        $$('input[name="guests"]', form).forEach(function (r) { r.addEventListener('change', function () { check('guests'); }); });
        return;
      }
      var el = form.elements[name];
      el.addEventListener('blur', function () { touched[name] = true; check(name); });
      var ev = (el.tagName === 'SELECT' || el.type === 'date') ? 'change' : 'input';
      el.addEventListener(ev, function () {
        if (touched[name] || box(name).classList.contains('has-error')) check(name);
        if (name === 'date' && form.elements.time.value) check('time');
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = null;
      Object.keys(rules).forEach(function (name) {
        if (!check(name) && !first) first = name;
      });
      if (first) {
        var target = first === 'guests' ? $('input[name="guests"]', form) : form.elements[first];
        target.focus({ preventScroll: false });
        return;
      }
      var btn = $('button[type="submit"]', form);
      btn.disabled = true;
      $('span', btn).textContent = 'Reserving…';
      setTimeout(function () { showConfirmation(); btn.disabled = false; $('span', btn).textContent = 'Request Reservation'; }, reduce ? 0 : 900);
    });

    var showConfirmation = function () {
      var data = {
        name: form.elements.name.value.trim(),
        date: parseDate(form.elements.date.value).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        time: form.elements.time.value,
        guests: form.querySelector('input[name="guests"]:checked').value,
        notes: form.elements.notes.value.trim()
      };
      $('.confirm__who', confirmEl).textContent = 'Thank you, ' + data.name.split(' ')[0] + '. We would be delighted to host you.';
      var dl = $('.confirm__details', confirmEl);
      dl.textContent = '';
      [['Date', data.date], ['Time', data.time], ['Guests', data.guests + (data.guests === '1' ? ' guest' : ' guests')]]
        .concat(data.notes ? [['Requests', data.notes]] : [])
        .forEach(function (row) {
          var d = document.createElement('div');
          var dt = document.createElement('dt'); dt.textContent = row[0];
          var dd = document.createElement('dd'); dd.textContent = row[1];
          d.appendChild(dt); d.appendChild(dd); dl.appendChild(d);
        });
      var ref = 'NR-' + Math.random().toString(36).slice(2, 7).toUpperCase();
      $('.confirm__ref strong', confirmEl).textContent = ref;

      form.hidden = true;
      confirmEl.hidden = false;
      confirmEl.classList.remove('is-in');
      void confirmEl.offsetWidth;
      confirmEl.classList.add('is-in');
      confirmEl.focus({ preventScroll: true });
      confirmEl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    };

    $('#resv-reset').addEventListener('click', function () {
      form.reset();
      touched = {};
      Object.keys(rules).forEach(function (n) { setError(n, ''); });
      confirmEl.hidden = true;
      form.hidden = false;
      form.elements.name.focus();
    });
  }
})();

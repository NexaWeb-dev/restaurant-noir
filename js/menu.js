/* =========================================================
   NOIR — menu.js
   Data-driven menu with animated category filtering and a
   sticky photo preview that follows the dish being read.
   ========================================================= */
(function () {
  'use strict';
  var N = window.NOIR;
  var $ = N.$, $$ = N.$$, reduce = N.reduce;

  var IMG = 'assets/images/menu/';
  // diet: veg | egg | non   ·   special: chef's special
  var CATEGORIES = [
    {
      id: 'breakfast', label: 'Breakfast', items: [
        { name: 'Avocado, Soft Egg & Sourdough', desc: 'Heirloom sourdough, smashed avocado, 63° egg, chilli crisp, pickled shallot.', price: 620, diet: 'egg', img: 'egg-avocado.jpg' },
        { name: 'Saffron Brioche Pancakes', desc: 'Cardamom-whipped mascarpone, caramelised banana, burnt honey butter.', price: 580, diet: 'veg', img: 'pancakes.jpg', special: true },
        { name: 'Shakshuka, Slow-Cooked', desc: 'Smoked tomato, harissa, feta, baked eggs, charred flatbread.', price: 640, diet: 'egg' },
        { name: 'Masala Omelette Croissant', desc: 'Laminated croissant, soft masala omelette, green chutney.', price: 520, diet: 'egg' },
        { name: 'Hung Curd & Wild Honey', desc: 'House granola, seasonal fruit, toasted seeds, wild honey.', price: 480, diet: 'veg' }
      ]
    },
    {
      id: 'starters', label: 'Starters', items: [
        { name: 'Charred Garden Salad', desc: 'Roasted beetroot, pomegranate, whipped chèvre, walnut, sherry dressing.', price: 780, diet: 'veg', img: 'salad.jpg' },
        { name: 'Chickpea & Avocado Grain Bowl', desc: 'Sweet potato, quinoa, pickled cabbage, tahini, lemon.', price: 720, diet: 'veg', img: 'bowl.jpg' },
        { name: 'Heirloom Tomato & Burrata', desc: 'Basil oil, aged balsamic, toasted pine nut, grilled sourdough.', price: 890, diet: 'veg', special: true },
        { name: 'Yellowfin Tuna Crudo', desc: 'Yuzu kosho, cucumber, shiso, crisp rice.', price: 1250, diet: 'non' },
        { name: 'Wild Mushroom Velouté', desc: 'Porcini, truffle oil, chive crème.', price: 760, diet: 'veg' }
      ]
    },
    {
      id: 'mains', label: 'Main Course', items: [
        { name: 'Seared Sirloin, Lime & Chilli', desc: 'Medium-rare sirloin, cashew, shallot, bird\'s-eye chilli, herbs, lime.', price: 1650, diet: 'non', img: 'steak-salad.jpg' },
        { name: 'Twelve-Hour Glazed Ribs', desc: 'Tamarind-molasses glaze, charred tomato, pickled red onion.', price: 1950, diet: 'non', img: 'ribs.jpg', special: true },
        { name: 'Wild Mushroom Risotto', desc: 'Carnaroli rice, parmesan, thyme butter, crisp shallots.', price: 1380, diet: 'veg' },
        { name: 'Roasted Cauliflower', desc: 'Tahini, dukkah, pomegranate molasses, herbs.', price: 1150, diet: 'veg' },
        { name: 'Rack of Lamb, Mint & Pistachio', desc: 'Herb-crusted rack, pistachio crumb, mint jus, garlic confit.', price: 2850, diet: 'non' }
      ]
    },
    {
      id: 'signature', label: 'Signature Specials', items: [
        { name: 'Wagyu Striploin, Bone-Marrow Frites', desc: 'Dry-aged 28 days, ember-seared, red-wine jus.', price: 4200, diet: 'non', special: true },
        { name: 'Tiger Prawn, Coconut Bisque', desc: 'Grilled head-on prawns, roasted shell bisque, curry leaf.', price: 2850, diet: 'non', special: true },
        { name: 'Cured Salmon, Miso & Sesame', desc: 'Three-day cure, pickled cucumber, black sesame.', price: 1950, diet: 'non', special: true },
        { name: 'Black Truffle Gnocchi', desc: 'Potato gnocchi, brown butter, Parmigiano, shaved black truffle.', price: 2400, diet: 'veg', special: true }
      ]
    },
    {
      id: 'desserts', label: 'Desserts', items: [
        { name: 'Chocolate Drip Torte', desc: '70% dark ganache, hazelnut praline, flaked sea salt.', price: 780, diet: 'egg', img: 'choc-cake.jpg', special: true },
        { name: 'Vanilla Panna Cotta', desc: 'Madagascan vanilla, macerated strawberries, basil sugar.', price: 720, diet: 'veg', img: 'panna-cotta.jpg' },
        { name: 'Pistachio Kulfi Millefeuille', desc: 'Slow-frozen kulfi, caramelised puff pastry, rose.', price: 690, diet: 'veg' },
        { name: 'Burnt Basque Cheesecake', desc: 'Caramelised top, soft centre, seasonal compote.', price: 760, diet: 'egg' }
      ]
    },
    {
      id: 'beverages', label: 'Beverages', items: [
        { name: 'Smoked Old Fashioned', desc: 'Bourbon, demerara, orange oil, clear ice, hickory smoke.', price: 1150, diet: 'veg', img: 'old-fashioned.jpg', special: true },
        { name: 'Single-Origin Pour-Over', desc: 'Estate coffee from Coorg, washed process, brewed to order.', price: 420, diet: 'veg', img: 'coffee.jpg' },
        { name: 'Saffron Cardamom Latte', desc: 'Double espresso, steamed milk, saffron, green cardamom.', price: 380, diet: 'veg' },
        { name: 'Jasmine Cold Brew Tonic', desc: 'Cold-brew concentrate, jasmine tea, tonic, citrus.', price: 420, diet: 'veg' },
        { name: 'House Kombucha', desc: 'Naturally fermented, seasonal fruit, lightly sparkling.', price: 450, diet: 'veg' }
      ]
    }
  ];

  var DIET_LABEL = { veg: 'Vegetarian', egg: 'Contains egg', non: 'Non-vegetarian' };
  var tabsEl = $('.menu__tabs');
  var listEl = $('.menu__list');
  var panelEl = $('#menu-panel');
  var frame = $('.menu__frame');
  var previewImg = $('.menu__img');
  var plainCat = $('.menu__plain-cat');
  var caption = $('.menu__caption');
  if (!tabsEl || !listEl) return;

  var inr = function (n) { return '₹' + n.toLocaleString('en-IN'); };
  var current = null;
  var busy = false;
  var swapTimer = null;

  /* ---------- Preview panel ---------- */
  var currentSrc = previewImg.getAttribute('src');
  function showPreview(item, cat) {
    if (!item || !item.img) {
      // Dish without a photo: keep the last photo unless the category has none at all
      if (!cat.items.some(function (i) { return i.img; })) {
        frame.classList.add('is-plain');
        plainCat.textContent = cat.label;
        caption.textContent = 'The chef\'s own selection';
      }
      return;
    }
    frame.classList.remove('is-plain');
    var src = IMG + item.img;
    caption.textContent = item.name + ' — ' + inr(item.price);
    if (src === currentSrc) return;
    currentSrc = src;
    previewImg.classList.add('is-swap');
    clearTimeout(swapTimer);
    var loader = new Image();
    var apply = function () {
      previewImg.src = src;
      previewImg.alt = '';
      requestAnimationFrame(function () { previewImg.classList.remove('is-swap'); });
    };
    loader.onload = apply;
    loader.onerror = function () { previewImg.classList.remove('is-swap'); };
    swapTimer = setTimeout(function () { loader.src = src; }, reduce ? 0 : 200);
  }

  /* ---------- Rendering ---------- */
  function buildItem(item, cat, i) {
    var li = document.createElement('li');
    li.className = 'menu-item is-entering';
    li.style.setProperty('--i', i);
    if (item.img) li.tabIndex = 0;

    var diet = document.createElement('span');
    diet.className = 'diet diet--' + item.diet;
    diet.innerHTML = '<i></i><span class="sr-only"></span>';
    $('.sr-only', diet).textContent = DIET_LABEL[item.diet];

    var body = document.createElement('div');
    body.className = 'menu-item__body';
    var h = document.createElement('h3');
    h.className = 'menu-item__name';
    h.appendChild(document.createTextNode(item.name));
    if (item.special) {
      var sp = document.createElement('span');
      sp.className = 'menu-item__special';
      sp.innerHTML = '<span aria-hidden="true">✦</span> Chef\'s special';
      h.appendChild(sp);
    }
    var d = document.createElement('p');
    d.className = 'menu-item__desc';
    d.textContent = item.desc;
    body.appendChild(h); body.appendChild(d);

    var price = document.createElement('span');
    price.className = 'menu-item__price';
    price.textContent = inr(item.price);

    li.appendChild(diet); li.appendChild(body); li.appendChild(price);

    if (item.img) {
      var th = document.createElement('img');
      th.className = 'menu-item__thumb';
      th.src = IMG + item.img;
      th.alt = item.name;
      th.loading = 'lazy';
      th.decoding = 'async';
      th.addEventListener('error', function () { th.style.display = 'none'; });
      li.appendChild(th);
    }

    var enter = function () { showPreview(item, cat); };
    li.addEventListener('mouseenter', enter);
    li.addEventListener('focus', enter);
    return li;
  }

  function render(cat) {
    listEl.textContent = '';
    cat.items.forEach(function (it, i) { listEl.appendChild(buildItem(it, cat, i)); });
    var firstWithImg = cat.items.filter(function (i) { return i.img; })[0];
    showPreview(firstWithImg || null, cat);
  }

  function select(id, instant) {
    var cat = CATEGORIES.filter(function (c) { return c.id === id; })[0];
    if (!cat || cat === current || busy) return;
    $$('.menu__tab', tabsEl).forEach(function (t) {
      var on = t.getAttribute('data-cat') === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panelEl.setAttribute('aria-labelledby', 'tab-' + id);
    current = cat;
    if (instant || reduce) { render(cat); return; }
    busy = true;
    listEl.classList.add('is-out');
    setTimeout(function () {
      render(cat);
      listEl.classList.remove('is-out');
      busy = false;
    }, 320);
  }

  /* ---------- Tabs ---------- */
  CATEGORIES.forEach(function (cat) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'menu__tab';
    b.id = 'tab-' + cat.id;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', 'menu-panel');
    b.setAttribute('data-cat', cat.id);
    b.setAttribute('aria-selected', 'false');
    b.tabIndex = -1;
    b.appendChild(document.createTextNode(cat.label));
    var s = document.createElement('sup');
    s.textContent = String(cat.items.length).padStart(2, '0');
    s.setAttribute('aria-hidden', 'true');
    b.appendChild(s);
    b.addEventListener('click', function () { select(cat.id); });
    b.addEventListener('keydown', function (e) {
      var idx = CATEGORIES.indexOf(cat), n = null;
      if (e.key === 'ArrowRight') n = (idx + 1) % CATEGORIES.length;
      if (e.key === 'ArrowLeft') n = (idx - 1 + CATEGORIES.length) % CATEGORIES.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = CATEGORIES.length - 1;
      if (n === null) return;
      e.preventDefault();
      $$('.menu__tab', tabsEl)[n].focus();
      select(CATEGORIES[n].id);
    });
    tabsEl.appendChild(b);
  });

  select(CATEGORIES[0].id, true);
})();

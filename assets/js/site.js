/* ARCYN Defense — site script (no dependencies) */
(function () {
  'use strict';

  /*
   * Form endpoints. The old site posted to WordPress; a static site needs a
   * form service (e.g. Formspree, Basin, Netlify Forms, or your own API).
   * Paste the endpoint URL below. While empty, the forms fall back to
   * opening the visitor's email client addressed to FALLBACK_EMAIL.
   */
  var FORM_ENDPOINTS = {
    contact: '',
    subscribe: ''
  };
  var FALLBACK_EMAIL = 'info@arcyndefense.com';

  var doc = document.documentElement;
  doc.classList.add('js');

  /* ---- Header: scrolled state + mobile menu ---- */
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var toTop = document.querySelector('.to-top');

  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 40);
    if (toTop) toTop.classList.toggle('is-visible', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    doc.classList.toggle('nav-open', open);
    if (toggle) toggle.setAttribute('aria-expanded', String(open));
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      setMenu(!doc.classList.contains('nav-open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
    document.querySelectorAll('.site-nav a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
  }

  /* Dropdown toggle (click / keyboard; hover is handled in CSS) */
  document.querySelectorAll('.has-sub').forEach(function (item) {
    var btn = item.querySelector('.sub-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) {
      if (!item.contains(e.target)) { item.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    });
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { item.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    });
  });

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---- Reveal on scroll ---- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---- Scroll-scrubbed word reveal ("Kinetic UAS defense powered by AI") ----
   The section pins while you scroll through it. Words fade in from invisible one
   after another (first 70% of the scroll), then the gradient wipes left-to-right
   across the last line (final 25%). */
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-scroll-words]').forEach(function (section) {
    if (reduceMotion) return; // keep the finished state
    var words = section.querySelectorAll('.w');
    var ai = section.querySelector('.kinetic__ai');
    var n = words.length;
    var ticking = false;
    section.classList.add('is-scrubbing');

    function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function update() {
      ticking = false;
      var rect = section.getBoundingClientRect();
      var vh = window.innerHeight;
      // 0 when the section's top is 20% down the screen, 1 when its bottom reaches the bottom,
      // so nearly all of the reveal plays while the section is pinned.
      var p = clamp((vh * 0.2 - rect.top) / (rect.height - vh * 0.8));
      var pw = clamp(p / 0.7);
      for (var i = 0; i < n; i++) {
        words[i].style.setProperty('--p', clamp(pw * n - i).toFixed(3));
      }
      if (ai) ai.style.setProperty('--g', clamp((p - 0.72) / 0.25).toFixed(3));
    }
    function onScrollWords() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScrollWords, { passive: true });
    window.addEventListener('resize', onScrollWords);
    update();
  });

  /* ---- Compare models: on phones show two columns, chosen with the pickers ---- */
  document.querySelectorAll('[data-compare]').forEach(function (wrap) {
    var selects = wrap.querySelectorAll('.compare__pickers select');
    var cells = wrap.querySelectorAll('.c-cell[data-m]');
    var narrow = window.matchMedia('(max-width: 760px)');

    function apply() {
      var picked = [selects[0].value, selects[1].value];
      cells.forEach(function (cell) {
        var slot = picked.indexOf(cell.getAttribute('data-m'));
        var hide = narrow.matches && slot === -1;
        cell.classList.toggle('is-hidden', hide);
        cell.style.order = narrow.matches && slot !== -1 ? slot : '';
      });
    }
    selects.forEach(function (sel, i) {
      sel.addEventListener('change', function () {
        var other = selects[1 - i];
        if (other.value === sel.value) {            // never show the same model twice: swap
          var free = ['0', '1', '2'].filter(function (v) { return v !== sel.value; });
          other.value = free.indexOf(sel.dataset.prev) !== -1 ? sel.dataset.prev : free[0];
          other.dataset.prev = other.value;
        }
        sel.dataset.prev = sel.value;
        apply();
      });
      sel.dataset.prev = sel.value;
    });
    if (narrow.addEventListener) narrow.addEventListener('change', apply); else narrow.addListener(apply);
    apply();
  });

  /* ---- News tabs ---- */
  document.querySelectorAll('[data-tabs]').forEach(function (wrap) {
    var tabs = wrap.querySelectorAll('[role="tab"]');
    var cards = document.querySelectorAll(wrap.getAttribute('data-tabs') + ' .post-card');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var filter = tab.getAttribute('data-filter');
        tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t === tab)); });
        cards.forEach(function (card) {
          var cats = (card.getAttribute('data-cats') || '').split(' ');
          card.hidden = filter !== 'all' && cats.indexOf(filter) === -1;
        });
      });
    });
  });

  /* ---- FAQ: keep one item open at a time ---- */
  document.querySelectorAll('.faq').forEach(function (faq) {
    var items = faq.querySelectorAll('details');
    items.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        items.forEach(function (other) { if (other !== d) other.open = false; });
      });
    });
  });

  /* ---- Click-to-load video (no third-party requests until played) ---- */
  document.querySelectorAll('.video[data-src]').forEach(function (wrap) {
    var btn = wrap.querySelector('button');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var iframe = document.createElement('iframe');
      iframe.src = wrap.getAttribute('data-src');
      iframe.title = wrap.getAttribute('data-title') || 'Video';
      iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      iframe.allowFullscreen = true;
      wrap.replaceChild(iframe, btn);
    });
  });

  /* ---- Forms ---- */
  function setStatus(form, msg, isError) {
    var el = form.querySelector('.form-status');
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('is-error', !!isError);
  }

  function mailtoFallback(kind, data) {
    var subject, body;
    if (kind === 'subscribe') {
      subject = 'Newsletter subscription';
      body = 'Please add me to ARCYN Defense updates: ' + data.get('email');
    } else {
      subject = 'Website inquiry from ' + (data.get('first_name') || '') + ' ' + (data.get('last_name') || '');
      body = [
        'Name: ' + (data.get('first_name') || '') + ' ' + (data.get('last_name') || ''),
        'Phone: ' + (data.get('phone') || ''),
        'Email: ' + (data.get('email') || ''),
        '',
        data.get('message') || ''
      ].join('\n');
    }
    window.location.href = 'mailto:' + FALLBACK_EMAIL +
      '?subject=' + encodeURIComponent(subject.trim()) +
      '&body=' + encodeURIComponent(body);
  }

  document.querySelectorAll('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var kind = form.getAttribute('data-form');
      var data = new FormData(form);
      if (data.get('_gotcha')) return; // honeypot filled: silently drop
      var endpoint = FORM_ENDPOINTS[kind];

      if (!endpoint) {
        mailtoFallback(kind, data);
        setStatus(form, 'Opening your email app…');
        return;
      }

      var btn = form.querySelector('[type="submit"]');
      if (btn) btn.disabled = true;
      setStatus(form, 'Sending…');
      fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error(res.status);
          form.reset();
          setStatus(form, kind === 'subscribe'
            ? 'Thanks — you’re subscribed.'
            : 'Thank you. Your message has been sent and our team will be in touch.');
        })
        .catch(function () {
          setStatus(form, 'Sorry, something went wrong. Please email ' + FALLBACK_EMAIL + '.', true);
        })
        .then(function () { if (btn) btn.disabled = false; });
    });
  });

  /* ---- Footer year ---- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();

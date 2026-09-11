'use strict';

/* =========================================================================
   VMAX Machine Ltd shared frontend.

   Exposes helpers on window.VMAX for per-page scripts and drives the shared
   behaviour: the nav sheet, every slider on the page, scroll progress and
   parallax, reveals, counters, meters and sparklines, and the enquiry form.

   Listings are rendered at build time, so this file animates and hydrates
   rather than populates: the site still reads with JavaScript switched off.
   ========================================================================= */

(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  async function fetchJSON(url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  /* Icon and image helpers come from /js/icons.js and /js/media.js, both
     generated from the same modules the pages are built with, so a card drawn
     here is identical to one drawn at build time. */
  const icon = (name) => (window.VMAX_ICON ? window.VMAX_ICON(name) : '');
  const media = (img, opts) => (window.VMAX_MEDIA ? window.VMAX_MEDIA.media(img, opts) : '');

  /** One machine, as a card. Mirrors machineCard() in src/site/pages.js. */
  function machineCard(m) {
    const specs = (m.specs || []).map((s) => `
            <li class="spec"><span class="spec-ico">${icon(s.icon)}</span><span class="spec-val"><span class="spec-k">${esc(s.label)}</span>${esc(s.value)}</span></li>`).join('');
    return `
      <a class="mcard" href="/machines/${esc(m.id)}" data-category="${esc(m.category)}" data-condition="${esc(m.condition)}" data-reveal>
        <div class="mcard-flags">
          <span class="flag ${m.condition === 'New' ? 'is-new' : 'is-used'}">${esc(m.condition)}</span>
          <span class="flag-stock">${esc(m.status)}</span>
        </div>
        <div class="mcard-media">${media(m.image, { alt: m.name, className: 'media-machine' })}</div>
        <div class="mcard-body">
          <h3>${esc(m.model)}</h3>
          <p class="mcard-type">${esc(String(m.category || '').replace(/s$/, ''))}</p>
          <ul class="specs">${specs}</ul>
          <span class="mcard-go">View machine <span class="go-pill">${icon('arrow')}</span></span>
        </div>
      </a>`;
  }

  /* Reveal on scroll -------------------------------------------------------
     Idempotent, so it is safe to re-run after injecting content. Siblings
     inside one section arrive in sequence rather than all at once, which is
     the difference between a page that animates and one that lurches. */
  function observeReveals() {
    const els = $$('[data-reveal]:not(.in)');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const section = el.closest('section, header, article') || document.body;
        const peers = $$('[data-reveal]', section);
        const step = Math.min(peers.indexOf(el), 6);
        el.style.setProperty('--reveal-delay', (step * 70) + 'ms');
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { threshold: 0.04, rootMargin: '0px 0px -4% 0px' });
    els.forEach((el) => io.observe(el));
  }

  /* Sliders ----------------------------------------------------------------
     One implementation for every [data-slider] on the page: crossfade,
     autoplay that pauses on hover and when the tab is hidden, arrows, dots,
     a counter, keyboard arrows and a swipe. */
  function setupSlider(root) {
    const slides = $$('.slide', root);
    if (slides.length === 0) return;
    const dots = $$('.slider-dots .dot', root);
    const counter = $('[data-slider-count]', root);
    const DURATION = Number(root.dataset.interval || 6000);
    let idx = 0;
    let timer = null;

    const paint = () => {
      slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
      dots.forEach((d, i) => {
        d.classList.toggle('is-active', i === idx);
        d.setAttribute('aria-selected', String(i === idx));
      });
      if (counter) counter.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    };
    const go = (n) => { idx = (n + slides.length) % slides.length; paint(); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => { stop(); if (!reduceMotion && slides.length > 1) timer = setInterval(() => go(idx + 1), DURATION); };

    const prev = $('[data-slider-prev]', root);
    const next = $('[data-slider-next]', root);
    if (prev) prev.addEventListener('click', () => { go(idx - 1); start(); });
    if (next) next.addEventListener('click', () => { go(idx + 1); start(); });
    dots.forEach((d) => d.addEventListener('click', () => { go(Number(d.dataset.slide)); start(); }));

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { go(idx - 1); start(); }
      if (e.key === 'ArrowRight') { go(idx + 1); start(); }
    });

    // Swipe. A drag of more than 40px counts, anything less is a tap.
    let x0 = null;
    root.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; stop(); }, { passive: true });
    root.addEventListener('touchend', (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
      x0 = null;
      start();
    });

    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    paint();
    start();
  }

  /* Contact details --------------------------------------------------------
     Pages are built with the values in src/data/site.json, so the static HTML
     is already right. This only replaces them when the desk has changed them
     under Settings at /admin, which is what lets a new address or telephone
     number reach every page without a deploy. */
  const site = { email: '', phone: '', address: '', hours: '' };
  const telHref = (value) => 'tel:' + String(value).replace(/[^+\d]/g, '');

  function applySite(values) {
    Object.assign(site, values);
    $$('[data-site]').forEach((el) => {
      const key = el.getAttribute('data-site');
      const value = values[key];
      if (!value) return;
      el.textContent = value;
      if (el.tagName === 'A') {
        if (key === 'email') el.href = 'mailto:' + value;
        if (key === 'phone') el.href = telHref(value);
      }
    });
    // Address and telephone are optional. A row appears only once there is
    // something to put in it, so an unset detail is absent rather than an
    // empty label.
    $$('[data-site-row]').forEach((row) => {
      const key = row.getAttribute('data-site-row');
      const value = values[key];
      row.hidden = !value;
      if (!value) return;
      const target = row.querySelector('[data-site="' + key + '"]') || row;
      target.textContent = value;
      const link = row.tagName === 'A' ? row : row.querySelector('a');
      if (link && key === 'phone') link.href = telHref(value);
    });
  }

  async function hydrateSite() {
    $$('[data-site]').forEach((el) => {
      const key = el.getAttribute('data-site');
      if (!site[key]) site[key] = el.textContent.trim();
    });
    try {
      applySite(await fetchJSON('/api/site'));
    } catch (e) {
      /* the built-in values stand */
    }
  }

  window.VMAX = { $, $$, esc, fetchJSON, reduceMotion, machineCard, observeReveals, setupSlider, icon, media, site };

  /* Scroll: progress bar, nav state, parallax ------------------------------ */
  const nav = $('#nav');
  const progress = $('#progress');
  let parallax = [];
  let ticking = false;

  function frame() {
    ticking = false;
    const doc = document.documentElement;
    const scrolled = doc.scrollTop || window.scrollY || 0;
    const pct = scrolled / (doc.scrollHeight - doc.clientHeight || 1);

    if (nav) nav.classList.toggle('scrolled', scrolled > 20);
    if (progress) progress.style.width = (pct * 100) + '%';

    if (!reduceMotion) {
      // Depth without a library: each layer moves a fraction of the distance
      // its own section has travelled through the viewport.
      for (let i = 0; i < parallax.length; i += 1) {
        const el = parallax[i];
        const box = el.getBoundingClientRect();
        if (box.bottom < -300 || box.top > window.innerHeight + 300) continue;
        const centre = (box.top + box.height / 2 - window.innerHeight / 2) / window.innerHeight;
        el.style.setProperty('--para', (centre * Number(el.dataset.para || 0)).toFixed(1) + 'px');
      }
    }
  }

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  /* Nav sheet -------------------------------------------------------------- */
  const toggle = $('#navtoggle');
  const links = $('#navlinks');
  if (toggle && links) {
    const setSheet = (open) => {
      links.classList.toggle('open', open);
      nav.classList.toggle('open-sheet', open);
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => setSheet(!links.classList.contains('open')));
    $$('#navlinks a').forEach((a) => a.addEventListener('click', () => setSheet(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && links.classList.contains('open')) setSheet(false);
    });
  }

  /* Counters, meters and sparklines ---------------------------------------
     All three are the same idea: hold the resting state until the element is
     actually on screen, then run once. */
  function countUp(el) {
    const target = Number(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || '';
    const fmt = (n) => (target >= 1000 ? n.toLocaleString('en-GB') : String(n));
    if (reduceMotion) { el.textContent = fmt(target) + suffix; return; }
    const dur = 1500;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3)))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function runOnView() {
    const targets = [
      ...$$('[data-count]'),
      ...$$('[data-meter]'),
      ...$$('.spark'),
    ];
    if (!targets.length) return;
    const fire = (el) => {
      if (el.dataset.ran) return;
      el.dataset.ran = '1';
      if (el.hasAttribute('data-count')) countUp(el);
      else if (el.hasAttribute('data-meter')) el.style.width = el.dataset.meter + '%';
      else el.classList.add('in');
    };
    if (!('IntersectionObserver' in window)) { targets.forEach(fire); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { fire(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.35 });
    targets.forEach((el) => io.observe(el));
  }

  /* Enquiry form ----------------------------------------------------------- */

  /** Wire every enquiry form on the page. Both post to the same endpoint, so
      both land in `enquiries` and appear on the desk at /admin. */
  function setupForms() {
    $$('[data-contact-form]').forEach(setupForm);
  }

  function setupForm(form) {
    if (!form || form.dataset.wired) return;
    form.dataset.wired = '1';
    const statusEl = $('[data-form-status]', form);
    const btn = $('[data-submit]', form);
    // `form.elements.namedItem` rather than `form.name`, which is the form's
    // own name attribute and would shadow the field of the same name.
    const field = (n) => form.elements.namedItem(n);
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const setErr = (name, msg) => {
      const errEl = form.querySelector(`[data-err="${name}"]`);
      const wrapper = errEl ? errEl.closest('.field') : null;
      if (errEl) errEl.textContent = msg || '';
      if (wrapper) wrapper.classList.toggle('invalid', !!msg);
    };
    const validate = () => {
      let ok = true;
      const name = field('name').value.trim(), email = field('email').value.trim(), message = field('message').value.trim();
      if (name.length < 2) { setErr('name', 'Please enter your name.'); ok = false; } else setErr('name', '');
      if (!EMAIL_RE.test(email)) { setErr('email', 'Enter a valid email.'); ok = false; } else setErr('email', '');
      if (message.length < 10) { setErr('message', 'A little more detail, please.'); ok = false; } else setErr('message', '');
      return ok;
    };
    ['name', 'email', 'message'].forEach((n) => {
      field(n).addEventListener('blur', validate);
      field(n).addEventListener('input', () => {
        const errEl = form.querySelector(`[data-err="${n}"]`);
        if (errEl && errEl.textContent) validate();
      });
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      statusEl.className = 'form-status';
      if (!validate()) { statusEl.className = 'form-status bad'; statusEl.textContent = 'Please correct the highlighted fields.'; return; }
      const payload = {
        name: field('name').value.trim(), email: field('email').value.trim(),
        company: field('company').value.trim(), service: field('service').value,
        message: field('message').value.trim(), website: field('website') ? field('website').value : ''
      };
      btn.disabled = true;
      const original = btn.innerHTML;
      btn.innerHTML = 'Sending';
      try {
        const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json().catch(() => ({}));
        if (res.ok) { form.reset(); statusEl.className = 'form-status ok'; statusEl.textContent = data.message || 'Thank you. Your enquiry has reached the sales desk.'; }
        else if (res.status === 422 && data.fields) { Object.entries(data.fields).forEach(([k, v]) => setErr(k, v)); statusEl.className = 'form-status bad'; statusEl.textContent = 'Please correct the highlighted fields.'; }
        else if (res.status === 429) { statusEl.className = 'form-status bad'; statusEl.textContent = 'Too many attempts. Please wait a moment and try again.'; }
        else { statusEl.className = 'form-status bad'; statusEl.textContent = data.message || `Something went wrong. Please email ${site.email}.`; }
      } catch (err) { statusEl.className = 'form-status bad'; statusEl.textContent = `Network error. Please email ${site.email}.`; }
      finally { btn.disabled = false; btn.innerHTML = original; }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
    parallax = $$('[data-para]');
    hydrateSite();
    $$('[data-slider]').forEach(setupSlider);
    runOnView();
    setupForms();
    observeReveals();
    frame();
  });
})();

'use strict';

/* The services index. Each department is a row that opens its own page. */
(function () {
  const V = window.VMAX; if (!V) return;
  const wrap = document.getElementById('service-index');
  if (!wrap) return;
  const esc = V.esc;

  const row = (s) => `
    <a class="service-row" href="/services/${esc(s.id)}" data-reveal>
      <div class="service-row-media">${V.media(s.image, { alt: s.title })}</div>
      <div class="service-row-body">
        <span class="code">${esc(s.code)}</span>
        <h2>${esc(s.title)}</h2>
        <p>${esc(s.summary)}</p>
        <ul>${(s.capabilities || []).slice(0, 4).map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
      </div>
      <span class="service-row-go" aria-hidden="true">&rsaquo;</span>
    </a>`;

  (async () => {
    let services = [];
    try { const d = await V.fetchJSON('/api/services'); services = d.services || []; } catch (e) {}
    if (!services.length) {
      wrap.innerHTML = '<p class="filter-empty">Services are loading from the API. Refresh in a moment.</p>';
      return;
    }
    wrap.innerHTML = services.map(row).join('');
    V.observeReveals();
  })();
})();

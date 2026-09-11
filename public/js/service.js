'use strict';

/* One department, resolved from the path so /services/parts is a real URL. */
(function () {
  const V = window.VMAX; if (!V) return;
  const root = document.getElementById('service-detail');
  if (!root) return;
  const esc = V.esc;

  const id = decodeURIComponent(window.location.pathname.split('/').filter(Boolean).pop() || '');

  function render(s, machines) {
    document.title = `${s.title} | VMAX Machine Ltd`;
    const related = machines.filter((m) => (m.services || []).includes(s.title)).slice(0, 4);

    root.removeAttribute('data-loading');
    root.innerHTML = `
      <header class="page-header">
        <div class="wrap page-header-grid">
          <div class="page-header-copy">
            <span class="eyebrow">${esc(s.code)} / Services</span>
            <h1 data-reveal>${esc(s.title)}</h1>
            <p data-reveal>${esc(s.lede || s.summary)}</p>
          </div>
          <div class="page-header-media" data-reveal data-para="-22">${V.media(s.image, { alt: s.title, eager: true })}</div>
        </div>
      </header>

      <section class="section-pad">
        <div class="wrap detail-cols">
          <div class="overview" data-reveal>
            ${(s.body || [s.summary]).map((para) => `<p>${esc(para)}</p>`).join('')}
            <ul class="feature-list">${(s.capabilities || []).map((c) => `<li>${V.icon('check')}<span>${esc(c)}</span></li>`).join('')}</ul>
          </div>
          <aside class="detail-aside" data-reveal>
            <div class="fact-block">
              ${(s.deliverables || []).map((d) => `<div class="fact"><span class="k">What you get</span><span class="v">${esc(d)}</span></div>`).join('')}
            </div>
            <div class="tag-row">
              ${(s.sectors || []).map((c) => `<span>${esc(c)}</span>`).join('')}
            </div>
            <a href="/contact" class="btn sm" style="margin-top:18px">Talk to the desk <span class="arw">&rsaquo;</span></a>
          </aside>
        </div>
      </section>

      ${related.length ? `
      <section class="section-pad alt">
        <div class="wrap">
          <div class="section-head" data-reveal>
            <span class="eyebrow">Machines</span>
            <h2>Where this applies.</h2>
          </div>
          <div class="mcard-grid">${related.map(V.machineCard).join('')}</div>
        </div>
      </section>` : ''}

      <section class="cta-band">
        <div class="wrap">
          <div class="cta-inner" data-reveal>
            <div>
              <h2>Need this on your fleet?</h2>
              <p>Tell us what you are running and we will come back with a plan and a price.</p>
            </div>
            <a href="/contact" class="btn">Talk to the desk <span class="arw">&rsaquo;</span></a>
          </div>
        </div>
      </section>`;
    V.observeReveals();
  }

  (async () => {
    try {
      const [service, list] = await Promise.all([
        V.fetchJSON(`/api/services/${encodeURIComponent(id)}`),
        V.fetchJSON('/api/machines').catch(() => ({ machines: [] })),
      ]);
      render(service, list.machines || []);
    } catch (err) {
      root.removeAttribute('data-loading');
      root.innerHTML = `
        <section class="notfound">
          <div class="wrap">
            <span class="eyebrow">Not found</span>
            <h1>No such <span class="mark">service</span>.</h1>
            <p>That department is not one of ours, or the link has changed.</p>
            <div class="hero-actions"><a href="/services" class="btn">All services <span class="arw">&rsaquo;</span></a></div>
          </div>
        </section>`;
    }
  })();
})();

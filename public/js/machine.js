'use strict';

/* One machine, resolved from the path so /machines/vx-l350 is a real URL. */
(function () {
  const V = window.VMAX; if (!V) return;
  const root = document.getElementById('machine-detail');
  if (!root) return;
  const esc = V.esc;
  const id = decodeURIComponent(window.location.pathname.replace(/\/+$/, '').split('/').pop() || '');

  function notFound() {
    root.removeAttribute('data-loading');
    root.innerHTML = `
      <section class="notfound"><div class="wrap">
        <span class="eyebrow">Not found</span>
        <h1>Not on the <span class="mark">yard</span>.</h1>
        <p>That machine has been sold or the link has changed. The full list is a click away.</p>
        <div class="hero-actions"><a href="/machines" class="btn">All machines <span class="arw">&rsaquo;</span></a></div>
      </div></section>`;
  }

  function render(m, next) {
    document.title = `${m.model} ${m.category.replace(/s$/, '')} | VMAX Machine Ltd`;

    const specCells = (m.specs || []).map((s) => `
          <div class="cell">${V.icon(s.icon)}<div><span class="k">${esc(s.label)}</span><span class="v">${esc(s.value)}</span></div></div>`).join('');
    const features = (m.features || []).map((f) => `<li>${V.icon('check')}<span>${esc(f)}</span></li>`).join('');
    const facts = [
      ['Stock number', m.stock],
      ['Condition', m.condition],
      ['Year', m.year],
      ['Availability', m.status],
      ['Located', m.location],
      ['Price', m.price],
    ].filter(([, v]) => v).map(([k, v]) => `<div class="fact"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('');
    const tags = (m.services || []).map((s) => `<span>${esc(s)}</span>`).join('');

    root.removeAttribute('data-loading');
    root.innerHTML = `
      <header class="machine-hero">
        <div class="wrap machine-hero-grid">
          <div class="machine-hero-copy">
            <div class="machine-meta" data-reveal>
              <span class="flag ${m.condition === 'New' ? 'is-new' : 'is-used'}">${esc(m.condition)}</span>
              <span class="flag-stock">${esc(m.status)}${m.stock ? ' &middot; ' + esc(m.stock) : ''}</span>
            </div>
            <span class="eyebrow">${esc(m.category)}</span>
            <h1 data-reveal>${esc(m.model)}</h1>
            <p class="lede" data-reveal>${esc(m.blurb)}</p>
            <div class="hero-actions" data-reveal>
              <a href="/contact" class="btn">Request a quote <span class="arw">&rsaquo;</span></a>
              <a href="/machines" class="btn ghost">All machines <span class="arw">&rsaquo;</span></a>
            </div>
          </div>
          <div class="machine-hero-media" data-reveal data-para="-24">${V.media(m.image, { alt: m.name, eager: true })}</div>
        </div>
      </header>

      <section class="section-pad">
        <div class="wrap">
          <div class="spec-table" data-reveal>${specCells}</div>
        </div>
      </section>

      <section class="section-pad alt">
        <div class="wrap detail-cols">
          <div class="overview" data-reveal>
            <span class="eyebrow">The machine</span>
            <p>${esc(m.overview || m.blurb)}</p>
            <ul class="feature-list">${features}</ul>
          </div>
          <aside class="detail-aside" data-reveal>
            <div class="fact-block">${facts}</div>
            ${tags ? `<div class="tag-row">${tags}</div>` : ''}
            <a href="/contact" class="btn sm" style="margin-top:18px">Book a viewing <span class="arw">&rsaquo;</span></a>
          </aside>
        </div>
      </section>

      <section class="section-pad">
        <div class="wrap next-nav" data-reveal>
          <a href="/machines/${esc(next.id)}">
            <span><span class="lbl">Next machine</span><br><span class="nm">${esc(next.model || next.name)}</span></span>
            <span class="arw">&rsaquo;</span>
          </a>
        </div>
      </section>

      <section class="cta-band">
        <div class="wrap">
          <div class="cta-inner" data-reveal>
            <div>
              <h2>Want to see it run?</h2>
              <p>Come and load with it, or ask us to bring it to your site for a demonstration.</p>
            </div>
            <a href="/contact" class="btn">Book a viewing <span class="arw">&rsaquo;</span></a>
          </div>
        </div>
      </section>`;
    V.observeReveals();
  }

  (async () => {
    if (!id) return notFound();
    try {
      const d = await V.fetchJSON('/api/machines/' + encodeURIComponent(id));
      render(d.machine, d.next || { id: 'vx-l350', model: 'VX-L350' });
    } catch (e) { notFound(); }
  })();
})();

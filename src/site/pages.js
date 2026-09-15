'use strict';

const machines = require('../data/machines.json');
const services = require('../data/services.json');
const images = require('./images');
const site = require('../data/site.json');
const { media, esc } = require('./media');
const { icon, iconRef } = require('./icons');
const { contactForm } = require('./layout');

const COMPANY = 'VMAX Machine Ltd';

/* ---------- Shared pieces ---------------------------------------------- */

/* Interior page header: copy on the left, a framed picture on the right. */
function pageHeader({ title, sub, image, alt }) {
  return `
  <header class="page-header">
    <div class="wrap page-header-grid">
      <div class="page-header-copy">
        <h1 data-reveal>${title}</h1>
        ${sub ? `<p data-reveal>${sub}</p>` : ''}
      </div>
      <div class="page-header-media" data-reveal data-para="-22">${media(image, { alt: alt || title, eager: true })}</div>
    </div>
  </header>`;
}

/* A slider. The hero and the yard gallery are the same component with
   different slides, so behaviour stays in one place in /js/main.js. */
function slider({ id, slides, count = true, ratio = '' }) {
  return `
      <div class="slider" id="${id}" data-slider>
        <div class="slider-track"${ratio ? ` style="aspect-ratio:${ratio}"` : ''}>
          ${slides.map((s, i) => `<div class="slide${i === 0 ? ' is-active' : ''}" data-slide-index="${i}">${s}</div>`).join('\n          ')}
        </div>
        ${count ? `<span class="slider-count" data-slider-count>01 / ${String(slides.length).padStart(2, '0')}</span>` : ''}
        <div class="slider-ui">
          <div class="slider-dots" role="tablist" aria-label="Slides">
            ${slides.map((s, i) => `<button class="dot${i === 0 ? ' is-active' : ''}" data-slide="${i}" aria-label="Slide ${i + 1}"></button>`).join('\n            ')}
          </div>
          <div class="slider-arrows">
            <button type="button" data-slider-prev aria-label="Previous slide">&lsaquo;</button>
            <button type="button" data-slider-next aria-label="Next slide">&rsaquo;</button>
          </div>
        </div>
      </div>`;
}

/* ---------- Machine card ------------------------------------------------
   The unit the site is built from: photograph, model, and the four numbers a
   buyer compares. A tall rounded pane on a desktop grid, a wide one on a
   phone, never a square. The same markup is produced in the browser by
   /js/main.js, so the two cannot drift. */
function specRow(spec) {
  return `<li class="spec"><span class="spec-ico">${iconRef(spec.icon)}</span><span class="spec-val"><span class="spec-k">${esc(spec.label)}</span>${esc(spec.value)}</span></li>`;
}

/** The photograph a machine wants: its own, then its class's. */
function machineImage(m) {
  return images.resolveName([m.imageName, m.imageFallback], m.name);
}

/* The back of the card. The front carries the four numbers a buyer compares;
   turning it over gives the sentence behind them and the commercial detail,
   without a second request. Hidden from assistive technology because the card
   is one link to a page that says all of it properly. */
function machineBack(m) {
  const facts = [
    ['Model year', m.year],
    ['Stock no.', m.stock],
    ['Availability', m.status],
    ['Price', m.price],
  ].filter(([, v]) => v).map(([k, v]) => `<div class="b-fact"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('');
  return `
          <div class="mcard-face mcard-back" aria-hidden="true">
            <span class="mcard-back-code">${esc(m.brand)} &middot; ${esc(m.category.replace(/s$/, ''))}</span>
            <h3>${esc(m.model)}</h3>
            <p class="mcard-blurb">${esc(m.blurb)}</p>
            <div class="mcard-facts">${facts}</div>
            <span class="mcard-go">View machine <span class="go-pill">${iconRef('arrow')}</span></span>
          </div>`;
}

function machineCard(m) {
  // Terms a search should find that the card does not print: the features are
  // on the machine's own page, but someone hunting "hydrostatic" should still
  // land on it. Everything else is read off the card's own text.
  const more = [m.name, m.location, ...(m.features || [])].filter(Boolean).join(' ');
  return `
      <a class="mcard" href="/machines/${esc(m.id)}" data-category="${esc(m.category)}" data-brand="${esc(m.brand)}" data-more="${esc(more)}" data-reveal>
        <div class="mcard-inner">
          <div class="mcard-face mcard-front">
            <div class="mcard-flags">
              <span class="flag">${esc(m.brand)}</span>
              <span class="flag-stock">${esc(m.status)}</span>
            </div>
            <div class="mcard-media">${media(machineImage(m), { alt: m.name, className: 'media-machine' })}</div>
            <div class="mcard-body">
              <h3>${esc(m.model)}</h3>
              <p class="mcard-type">${esc(m.category.replace(/s$/, ''))}</p>
              <ul class="specs">${(m.specs || []).map(specRow).join('')}</ul>
              <span class="mcard-go">View machine <span class="go-pill">${iconRef('arrow')}</span></span>
            </div>
          </div>
${machineBack(m)}
        </div>
      </a>`;
}

/* ---------- Analytics tiles ---------------------------------------------
   Stat first, plot second. The number is the headline, the little chart is
   context beneath it, and the value is always written out rather than left
   to be read off the bars. One series each, so no legend is needed; the bars
   are ink and only the most recent one carries the accent. */
function spark(values) {
  // Scaled between the series' own low and high rather than from zero, so the
  // shape of twelve months is readable in 60 pixels. The number above the plot
  // carries the value, so the bars are shape, not measurement.
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);
  return `<div class="spark" aria-hidden="true">${values
    .map((v, i) => `<i style="height:${Math.round(20 + ((v - min) / span) * 80)}%;transition-delay:${i * 45}ms"${i === values.length - 1 ? ' class="is-last"' : ''}></i>`)
    .join('')}</div>`;
}

function kpi({ label, value, suffix = '', delta, foot, values, tinted = false }) {
  return `
        <article class="kpi${tinted ? ' is-tinted' : ''}" data-reveal>
          <div class="kpi-top">
            <span class="kpi-label">${esc(label)}</span>
            ${delta ? `<span class="kpi-delta">${iconRef('trend')}${esc(delta)}</span>` : ''}
          </div>
          <div class="kpi-value"><span data-count="${value}" data-suffix="${esc(suffix)}">0</span></div>
          ${foot ? `<p class="kpi-foot">${esc(foot)}</p>` : ''}
          ${values ? spark(values) : ''}
        </article>`;
}

function meterRow({ label, value }) {
  return `
          <div class="meter-row">
            <div class="meter-head"><span class="m-k">${esc(label)}</span><span class="m-v"><span data-count="${value}" data-suffix="%">0</span></span></div>
            <div class="meter"><span data-meter="${value}"></span></div>
          </div>`;
}

/* ---------- Landing ------------------------------------------------------ */

/* Classes and brands, read off the catalogue rather than listed twice. */
const categories = Array.from(new Set(machines.map((m) => m.category)));
const categoryIcon = {};
machines.forEach((m) => { categoryIcon[m.category] = m.icon; });
const brands = Array.from(new Set(machines.map((m) => m.brand))).sort((a, b) =>
  a === 'VMAX' ? -1 : b === 'VMAX' ? 1 : a.localeCompare(b));
const countBy = (key, value) => machines.filter((m) => m[key] === value).length;

const heroSlides = images.heroSlides.map((img, i) =>
  media(img, { alt: `VMAX machines at work ${i + 1}`, className: 'media-fill', eager: i === 0 })
);

const heroSection = `
  <section class="hero" id="top" data-chapter="VMAX">
    <div class="hero-bg" data-para="60">
      ${slider({ id: 'hero-slider', slides: heroSlides, count: false })}
    </div>
    <div class="wrap hero-inner">
      <div class="hero-copy">
        <h1 data-reveal>Brand new machines.<br /><span class="mark">Kept working.</span></h1>
        <p class="hero-sub" data-reveal>Factory-new plant from ${brands.length} makers, sold, delivered and serviced by the people who specified it. Nothing second hand, nothing subcontracted.</p>
        <div class="hero-actions" data-reveal>
          <a href="/machines" class="btn">Browse machines <span class="arw">&rsaquo;</span></a>
          <a href="#quote" class="btn ghost">Request a quote <span class="arw">&rsaquo;</span></a>
        </div>
        <div class="hero-facts" data-reveal>
          <div class="hero-fact"><div class="v"><span data-count="${machines.length}">0</span></div><div class="k">Models available</div></div>
          <div class="hero-fact"><div class="v"><span data-count="${categories.length}">0</span></div><div class="k">Machine classes</div></div>
          <div class="hero-fact"><div class="v">Same day</div><div class="k">Service response</div></div>
        </div>
      </div>
      <div class="hero-chip" data-reveal>
        <span class="ring">${iconRef('shield')}</span>
        <div>
          <div class="v">Full factory warranty</div>
          <div class="k">On every machine we sell</div>
        </div>
      </div>
    </div>
  </section>

  <div class="marquee" aria-hidden="true">
    <div class="marquee-track">
      ${[0, 1].map(() => `<span>${brands.join('</span><span>')}</span>`).join('')}
    </div>
  </div>`;

const categorySection = `
  <section class="band" id="categories" data-chapter="Classes">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <h2>Seventeen classes of machine, one supplier.</h2>
        <p>Earthmoving, lifting, drilling, compaction, agriculture and site power. Pick a class to see what we supply, or tell us the job and we will size it for you.</p>
      </div>
      <div class="cat-row" data-reveal>
        ${categories.map((c) => `
        <a class="cat" href="/machines?category=${encodeURIComponent(c)}" data-tilt>
          <span class="cat-ico">${iconRef(categoryIcon[c])}</span>
          <span class="cat-name">${esc(c)}</span>
          <span class="cat-count">${countBy('category', c)}</span>
        </a>`).join('')}
      </div>
    </div>
  </section>`;

const analyticsSection = `
  <section class="band band-tint" id="numbers" data-chapter="Numbers">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <h2>What the yard actually delivers.</h2>
        <p>Figures we are held to by the fleets that buy from us, tracked month by month.</p>
      </div>
      <div class="kpi-grid">
        ${kpi({ label: 'Machines delivered', value: 2400, suffix: '+', delta: '+18% YoY', foot: 'Since we opened the yard in 1995.', values: [42, 48, 45, 53, 58, 55, 64, 69, 66, 74, 79, 86] })}
        ${kpi({ label: 'First-visit fix rate', value: 96, suffix: '%', delta: '+4 pts', foot: 'Breakdowns closed without a second visit.', values: [78, 80, 83, 82, 86, 88, 87, 90, 91, 93, 94, 96], tinted: true })}
        ${kpi({ label: 'Parts lines held', value: 9400, delta: '+1,200', foot: 'Stocked lines despatched the same day.', values: [55, 58, 61, 63, 62, 68, 71, 74, 78, 82, 88, 94] })}
        ${kpi({ label: 'Average response', value: 4, suffix: ' hrs', delta: 'Same day', foot: 'From your call to a van on your site.', values: [92, 88, 84, 80, 74, 70, 66, 60, 54, 48, 42, 38] })}
      </div>

      <div class="kpi-wide glass" data-reveal>
        <div>
          <h3>Measured on the machines we look after.</h3>
          <p class="kpi-foot">Rolling twelve months across the fleets on a VMAX service plan. We publish these because the sale is the easy half.</p>
          <a class="link-arrow" href="/services">How the support works <span class="arw">&rsaquo;</span></a>
        </div>
        <div class="meters">
          ${meterRow({ label: 'Fleet availability on service plans', value: 97 })}
          ${meterRow({ label: 'Stocked parts despatched same day', value: 92 })}
          ${meterRow({ label: 'Deliveries on the agreed date', value: 95 })}
        </div>
      </div>
    </div>
  </section>`;

const rangeSection = `
  <section class="band" id="range" data-chapter="Machines">
    <div class="wrap">
      <div class="section-head with-action" data-reveal>
        <div>
          <h2>New in the yard this week.</h2>
          <p>Factory-new machines you can walk around, start and load with before you sign anything.</p>
        </div>
        <a href="/machines" class="btn ghost">All machines <span class="arw">&rsaquo;</span></a>
      </div>
      <div class="mcard-grid">
        ${machines.slice(0, 8).map(machineCard).join('')}
      </div>
    </div>
  </section>`;

const gallerySection = `
  <section class="band band-paper" id="yard" data-chapter="The yard">
    <div class="wrap">
      <div class="section-head centred" data-reveal>
        <h2>Come and see it run.</h2>
        <p>Fifteen acres of machines, a workshop with the lifting gear to do the job properly, and a parts counter that answers the phone.</p>
      </div>
      <div data-reveal>
        ${slider({
          id: 'yard-slider',
          ratio: '21 / 9',
          slides: [images.fleet, images.workshop, images.parts, images.yard].map((img, i) =>
            media(img, { alt: `The VMAX yard ${i + 1}`, className: 'media-fill' })
          ),
        })}
      </div>
    </div>
  </section>`;

const servicesSection = `
  <section class="band" id="services" data-chapter="Services">
    <div class="wrap">
      <div class="section-head with-action" data-reveal>
        <div>
          <h2>Sold, supplied, serviced.</h2>
          <p>Eight departments behind every machine that leaves the yard.</p>
        </div>
        <a href="/services" class="btn ghost">All services <span class="arw">&rsaquo;</span></a>
      </div>
      <div class="svc-grid">
        ${services.map((s) => `
        <a class="svc" href="/services/${esc(s.id)}" data-tilt data-reveal>
          <span class="svc-ico">${iconRef(s.icon || 'machine')}</span>
          <span class="svc-code">${esc(s.code)}</span>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.summary)}</p>
          <span class="svc-go">Read more <span class="arw">&rsaquo;</span></span>
        </a>`).join('')}
      </div>
    </div>
  </section>`;

const contactSection = `
  <section class="band" id="quote" data-chapter="Quote">
    <div class="wrap contact-grid">
      <div class="contact-info" data-reveal>
        <h2>Tell us the job.<br />We will spec the machine.</h2>
        <p class="contact-lede">Give us the material, the hours and the ground conditions. You will get a machine recommendation, a price and a delivery date, not a brochure.</p>
        <div class="contact-detail">
          <div class="row"><span class="row-ico">${icon('mail')}</span><div class="k">Email</div><div class="val"><a href="mailto:${site.email}" data-site="email">${site.email}</a></div></div>
          <div class="row" data-site-row="phone" hidden><span class="row-ico">${icon('phone')}</span><div class="k">Telephone</div><div class="val"><a data-site="phone"></a></div></div>
          <div class="row"><span class="row-ico">${icon('clock')}</span><div class="k">Hours</div><div class="val" data-site="hours">${site.hours}</div></div>
        </div>
      </div>
      ${contactForm('home-contact-form')}
    </div>
  </section>`;

const indexContent = [
  heroSection,
  categorySection,
  analyticsSection,
  rangeSection,
  gallerySection,
  servicesSection,
  contactSection,
].join('\n');

/* ---------- Machines listing ----------
   No page header: a buyer who has clicked Machines wants the machines, so the
   page opens on the search and the grid rather than on a picture they have
   already seen on the way in. */
const machinesContent = `
  <section class="section-pad listing-top">
    <div class="wrap">
      <div class="listing-head" data-reveal>
        <h1>Machines.</h1>
        <p>Brand new plant from ${brands.length} makers across ${categories.length} classes, supplied to your specification and serviced by us afterwards.</p>
      </div>

      <div class="search-bar" data-reveal>
        <div class="search-field">
          <span class="search-ico">${iconRef('search')}</span>
          <input type="search" id="machine-search" name="q" autocomplete="off" spellcheck="false"
                 placeholder="Search ${machines.length} machines by model, brand, class or spec"
                 aria-label="Search machines" />
          <button type="button" class="search-clear" id="search-clear" aria-label="Clear search" hidden>&times;</button>
        </div>
        <div class="search-side">
          <label class="search-sort" for="machine-sort"><span>Sort</span>
            <select id="machine-sort">
              <option value="featured">Featured</option>
              <option value="model">Model A&ndash;Z</option>
              <option value="brand">Brand A&ndash;Z</option>
              <option value="category">Class A&ndash;Z</option>
            </select>
          </label>
          <p class="filter-count" id="filter-count" aria-live="polite">${machines.length} machines</p>
        </div>
      </div>

      <div class="filter-bar" data-reveal>
        <div class="filter-row">
          <span class="filter-label">Class</span>
          <div class="filters" id="machine-filters" role="tablist">
            <button class="chip is-active" data-filter="All">All <span class="chip-n">${machines.length}</span></button>
            ${categories.map((c) => `<button class="chip" data-filter="${esc(c)}">${esc(c)} <span class="chip-n">${countBy('category', c)}</span></button>`).join('\n            ')}
          </div>
        </div>
        <div class="filter-row">
          <span class="filter-label">Brand</span>
          <div class="filters" id="brand-filters" role="tablist">
            <button class="chip is-active" data-brand="All">All</button>
            ${brands.map((b) => `<button class="chip" data-brand="${esc(b)}">${esc(b)} <span class="chip-n">${countBy('brand', b)}</span></button>`).join('\n            ')}
          </div>
        </div>
      </div>
      <div class="mcard-grid" id="machines-grid">
        ${machines.map(machineCard).join('')}
      </div>
      <p class="filter-empty" id="filter-empty" hidden>Nothing matches that. Clear the search or a filter, or tell us what you are after and we will quote it.</p>
      <div class="more-wrap"><button type="button" class="btn ghost" id="show-more" hidden>Show more machines <span class="arw">&rsaquo;</span></button></div>
    </div>
  </section>
  <section class="cta-band">
    <div class="wrap">
      <div class="cta-inner" data-reveal>
        <div>
          <h2>Not on the list?</h2>
          <p>We supply to order across every brand we represent, and we will tell you honestly when another make suits the job better.</p>
        </div>
        <a href="/contact" class="btn">Ask the sales desk <span class="arw">&rsaquo;</span></a>
      </div>
    </div>
  </section>`;

/* ---------- One page per machine ---------------------------------------
   Each machine gets a real page built at build time rather than an empty
   shell filled in by script: it is indexable, it opens instantly, and it
   reads with JavaScript switched off. scripts/build-pages.js writes these
   to public/machines/<id>.html. */
function machinePage(m, next) {
  const specCells = (m.specs || []).map((s) => `
          <div class="cell" data-tilt>${iconRef(s.icon)}<div><span class="k">${esc(s.label)}</span><span class="v">${esc(s.value)}</span></div></div>`).join('');
  const features = (m.features || []).map((f) => `<li>${iconRef('check')}<span>${esc(f)}</span></li>`).join('');
  const facts = [
    ['Brand', m.brand],
    ['Model', m.model],
    ['Class', m.category],
    ['Condition', m.condition],
    ['Model year', m.year],
    ['Stock number', m.stock],
    ['Availability', m.status],
    ['Price', m.price],
  ].filter(([, v]) => v).map(([k, v]) => `<div class="fact"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('');
  const related = machines.filter((x) => x.category === m.category && x.id !== m.id).slice(0, 4);

  const content = `
  <article class="machine-detail">
    <header class="machine-hero">
      <div class="wrap machine-hero-grid">
        <div class="machine-hero-copy">
          <nav class="crumbs" aria-label="Breadcrumb">
            <a href="/machines">Machines</a> <span aria-hidden="true">/</span>
            <a href="/machines?category=${encodeURIComponent(m.category)}">${esc(m.category)}</a>
          </nav>
          <div class="machine-meta" data-reveal>
            <span class="flag">${esc(m.brand)}</span>
            <span class="flag-stock">${esc(m.status)} &middot; ${esc(m.stock)}</span>
          </div>
          <h1 data-reveal>${esc(m.model)}</h1>
          <p class="lede" data-reveal>${esc(m.blurb)}</p>
          <div class="hero-actions" data-reveal>
            <a href="/contact" class="btn">Request a quote <span class="arw">&rsaquo;</span></a>
            <a href="/machines?category=${encodeURIComponent(m.category)}" class="btn ghost">More ${esc(m.category.toLowerCase())} <span class="arw">&rsaquo;</span></a>
          </div>
        </div>
        <div class="machine-hero-media" data-reveal data-para="-24">${media(machineImage(m), { alt: m.name, eager: true })}</div>
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
          <h2>About this machine</h2>
          <p>${esc(m.overview)}</p>
          <ul class="feature-list">${features}</ul>
        </div>
        <aside class="detail-aside" data-reveal>
          <div class="fact-block">${facts}</div>
          <div class="tag-row">${(m.services || []).map((s) => `<span>${esc(s)}</span>`).join('')}</div>
          <a href="/contact" class="btn sm" style="margin-top:18px">Enquire about this machine <span class="arw">&rsaquo;</span></a>
        </aside>
      </div>
    </section>

    ${related.length ? `
    <section class="section-pad">
      <div class="wrap">
        <div class="section-head" data-reveal>
          <h2>Other ${esc(m.category.toLowerCase())}.</h2>
        </div>
        <div class="mcard-grid">${related.map(machineCard).join('')}</div>
      </div>
    </section>` : ''}

    <section class="section-pad">
      <div class="wrap next-nav" data-reveal>
        <a href="/machines/${esc(next.id)}">
          <span><span class="lbl">Next machine</span><br><span class="nm">${esc(next.name)}</span></span>
          <span class="arw">&rsaquo;</span>
        </a>
      </div>
    </section>

    <section class="cta-band">
      <div class="wrap">
        <div class="cta-inner" data-reveal>
          <div>
            <h2>Want to see the ${esc(m.model)} run?</h2>
            <p>Come and load with it here, or ask us to bring one to your site for a demonstration.</p>
          </div>
          <a href="/contact" class="btn">Book a demonstration <span class="arw">&rsaquo;</span></a>
        </div>
      </div>
    </section>
  </article>`;

  return {
    file: `machines/${m.id}.html`,
    active: 'machines',
    bodyClass: 'page-machine',
    title: `${m.name} for sale | ${COMPANY}`,
    description: `${m.name}: ${m.blurb} New ${m.category.toLowerCase().replace(/s$/, '')} supplied and serviced by VMAX Machine Ltd.`,
    content,
  };
}

/** Every machine page, each pointing at the next one in the catalogue. */
const machinePages = machines.map((m, i) => machinePage(m, machines[(i + 1) % machines.length]));

/* ---------- Services listing ----------
   Every department is written into the page at build time rather than fetched
   and drawn afterwards, so /services and every /services/<id> beneath it is a
   real file on disk: indexable, instant, and correct with scripts off. */

/** The photograph a department wants: the one it was specified with, then the
    one named behind it. Same treatment the machine cards get. */
function serviceImage(s) {
  return images.resolveName([s.imageName, s.imageFallback], s.title);
}

const serviceRow = (s) => `
      <a class="service-row" href="/services/${esc(s.id)}" data-reveal>
        <div class="service-row-media">${media(serviceImage(s), { alt: s.title })}</div>
        <div class="service-row-body">
          <span class="code">${esc(s.code)}</span>
          <h2>${esc(s.title)}</h2>
          <p>${esc(s.summary)}</p>
          <ul>${(s.capabilities || []).slice(0, 4).map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
        </div>
        <span class="service-row-go" aria-hidden="true">&rsaquo;</span>
      </a>`;

const servicesContent = `
  ${pageHeader({
    title: 'Services.',
    sub: 'Sales, servicing, breakdown, parts, warranty, delivery, training and finance, all under one roof.',
    image: images.servicesHeader,
    alt: 'VMAX workshop',
  })}
  <section class="section-pad">
    <div class="wrap">
      <div class="service-index">
        ${services.map(serviceRow).join('')}
      </div>
    </div>
  </section>`;

/* ---------- One page per service ----------------------------------------
   Built to public/services/<id>.html, so the department a visitor clicks is
   the page they land on rather than an empty shell that has to resolve its
   own id from the address bar. */
function servicePage(s, next) {
  const related = machines.filter((m) => (m.services || []).includes(s.title)).slice(0, 4);
  const body = (s.body && s.body.length ? s.body : [s.summary]).map((para) => `<p>${esc(para)}</p>`).join('');
  const capabilities = (s.capabilities || []).map((c) => `<li>${iconRef('check')}<span>${esc(c)}</span></li>`).join('');
  const deliverables = (s.deliverables || []).map((d) => `<div class="fact"><span class="k">What you get</span><span class="v">${esc(d)}</span></div>`).join('');

  const content = `
  <article class="service-detail">
    <header class="machine-hero">
      <div class="wrap machine-hero-grid">
        <div class="machine-hero-copy">
          <nav class="crumbs" aria-label="Breadcrumb">
            <a href="/services">Services</a> <span aria-hidden="true">/</span>
            <span>${esc(s.title)}</span>
          </nav>
          <div class="machine-meta" data-reveal>
            <span class="flag">${esc(s.code)}</span>
            <span class="flag-stock">${(s.capabilities || []).length} capabilities</span>
          </div>
          <h1 data-reveal>${esc(s.title)}</h1>
          <p class="lede" data-reveal>${esc(s.lede || s.summary)}</p>
          <div class="hero-actions" data-reveal>
            <a href="/contact" class="btn">Talk to the desk <span class="arw">&rsaquo;</span></a>
            <a href="/services" class="btn ghost">All services <span class="arw">&rsaquo;</span></a>
          </div>
        </div>
        <div class="machine-hero-media" data-reveal data-para="-24">${media(serviceImage(s), { alt: s.title, eager: true })}</div>
      </div>
    </header>

    ${capabilities ? `
    <section class="section-pad">
      <div class="wrap">
        <div class="spec-table">
          ${(s.capabilities || []).map((c, i) => `
          <div class="cell" data-tilt>${iconRef(s.icon || 'machine')}<div><span class="k">${String(i + 1).padStart(2, '0')} / ${String((s.capabilities || []).length).padStart(2, '0')}</span><span class="v">${esc(c)}</span></div></div>`).join('')}
        </div>
      </div>
    </section>` : ''}

    <section class="section-pad alt">
      <div class="wrap detail-cols">
        <div class="overview" data-reveal>
          <h2>How it works</h2>
          ${body}
          <ul class="feature-list">${capabilities}</ul>
        </div>
        <aside class="detail-aside" data-reveal>
          <div class="fact-block">${deliverables}</div>
          <div class="tag-row">${(s.sectors || []).map((c) => `<span>${esc(c)}</span>`).join('')}</div>
          <a href="/contact" class="btn sm" style="margin-top:18px">Ask about ${esc(s.title.toLowerCase())} <span class="arw">&rsaquo;</span></a>
        </aside>
      </div>
    </section>

    ${related.length ? `
    <section class="section-pad">
      <div class="wrap">
        <div class="section-head" data-reveal>
          <h2>Where this applies.</h2>
          <p>Machines on our books that this department looks after.</p>
        </div>
        <div class="mcard-grid">${related.map(machineCard).join('')}</div>
      </div>
    </section>` : ''}

    <section class="section-pad">
      <div class="wrap next-nav" data-reveal>
        <a href="/services/${esc(next.id)}">
          <span><span class="lbl">Next service</span><br><span class="nm">${esc(next.title)}</span></span>
          <span class="arw">&rsaquo;</span>
        </a>
      </div>
    </section>

    <section class="cta-band">
      <div class="wrap">
        <div class="cta-inner" data-reveal>
          <div>
            <h2>${esc(s.title)} on your fleet.</h2>
            <p>Tell us what you run and where it runs, and we will put a plan and a price against it.</p>
          </div>
          <a href="/contact" class="btn">Request a quote <span class="arw">&rsaquo;</span></a>
        </div>
      </div>
    </section>
  </article>`;

  return {
    file: `services/${s.id}.html`,
    active: 'services',
    bodyClass: 'page-service',
    title: `${s.title} | ${COMPANY}`,
    description: `${s.title}: ${s.lede || s.summary}`,
    content,
  };
}

/** Every service page, each pointing at the next department. */
const servicePages = services.map((s, i) => servicePage(s, services[(i + 1) % services.length]));

/* ---------- Apply ---------- */
const applyContent = `
  ${pageHeader({
    title: 'Apply.',
    sub: 'One form, read by the workshop manager you would work for. We reply to everyone.',
    image: images.careersHeader,
    alt: 'VMAX workshop team',
  })}
  <section class="section-pad">
    <div class="wrap contact-grid">
      <div class="contact-info" data-reveal>
        <h2 id="apply-role-title">Open application</h2>
        <p class="contact-lede" id="apply-role-sub">Tell us what you have worked on and what you want to be turning a spanner on next.</p>
        <div class="contact-detail" id="apply-role-meta"></div>
        <div class="contact-note">
          <p>Time served counts more here than a stack of certificates, and we will say so if a role is not the right fit rather than leaving you waiting.</p>
        </div>
        <a class="link-arrow" href="/careers">All open roles <span class="arw">&rsaquo;</span></a>
      </div>

      <form id="apply-form" novalidate data-reveal>
        <div class="field two">
          <div class="field"><label for="apply-name">Name</label><input type="text" id="apply-name" name="name" autocomplete="name" required /><div class="err" data-err="name"></div></div>
          <div class="field"><label for="apply-email">Email</label><input type="email" id="apply-email" name="email" autocomplete="email" required /><div class="err" data-err="email"></div></div>
        </div>
        <div class="field two">
          <div class="field"><label for="apply-phone">Phone <span class="opt">(optional)</span></label><input type="tel" id="apply-phone" name="phone" autocomplete="tel" /><div class="err" data-err="phone"></div></div>
          <div class="field"><label for="apply-experience">Years on the tools</label>
            <select id="apply-experience" name="experience">
              <option value="">Select</option>
              <option>Apprentice</option>
              <option>1 to 3</option>
              <option>4 to 8</option>
              <option>9 to 15</option>
              <option>15 or more</option>
            </select><div class="err" data-err="experience"></div>
          </div>
        </div>
        <div class="field"><label for="apply-role">Role</label>
          <select id="apply-role" name="roleId"><option value="">Open application</option></select>
          <div class="err" data-err="roleId"></div>
        </div>
        <div class="field"><label for="apply-portfolio">Licences or profile <span class="opt">(optional)</span></label><input type="url" id="apply-portfolio" name="portfolio" placeholder="https://" /><div class="err" data-err="portfolio"></div></div>
        <div class="field"><label for="apply-message">What have you worked on?</label><textarea id="apply-message" name="message" placeholder="The machines and makes you know, and the work you would want us to ask about." required></textarea><div class="err" data-err="message"></div></div>
        <div class="honeypot" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off" /></label></div>
        <div class="form-status" id="apply-status" role="status" aria-live="polite"></div>
        <button type="submit" class="btn" id="apply-submit">Send application <span class="arw">&rsaquo;</span></button>
      </form>
    </div>
  </section>`;

/* ---------- Careers ---------- */
const careersContent = `
  ${pageHeader({
    title: 'Work on big iron.',
    sub: 'Technicians, field engineers, parts people and drivers. If you would rather be paid for what you can fix than for what you can say, write to us.',
    image: images.careersHeader,
    alt: 'VMAX technicians',
  })}
  <section class="section-pad">
    <div class="wrap careers-intro" data-reveal>
      <div>
        <h2>Tools bought. Training paid. Overtime honoured.</h2>
      </div>
      <p>Our technicians work on machines from twenty tonnes to sixty, in a heated workshop with the lifting gear and diagnostic kit to do the job properly. We pay for manufacturer training, we buy the specialist tools when someone asks for them, and a job that runs late is paid late, not absorbed. Apprentices get a qualified technician beside them from the first week rather than a broom.</p>
    </div>
  </section>
  <section class="section-pad alt">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <h2>Where we are hiring.</h2>
        <p>If your trade is not listed, write to us anyway and say what you want to work on.</p>
      </div>
      <div class="roles" id="roles"></div>
      <div class="roles-cta" data-reveal>
        <a href="/apply" class="btn ghost">Send an open application <span class="arw">&rsaquo;</span></a>
      </div>
    </div>
  </section>`;

/* ---------- Contact ---------- */
const contactContent = `
  ${pageHeader({
    title: 'Request a quote.',
    sub: 'Tell us the material, the hours and the ground. A sales engineer comes back with a machine, a price and a date.',
    image: images.contactHeader,
    alt: 'VMAX sales desk',
  })}
  <section class="section-pad">
    <div class="wrap contact-grid">
      <div class="contact-info" data-reveal>
        <div class="contact-detail">
          <div class="row"><span class="row-ico">${icon('mail')}</span><div class="k">Email</div><div class="val"><a href="mailto:${site.email}" data-site="email">${site.email}</a></div></div>
          <div class="row" data-site-row="phone" hidden><span class="row-ico">${icon('phone')}</span><div class="k">Telephone</div><div class="val"><a data-site="phone"></a></div></div>
          <div class="row" data-site-row="address" hidden><span class="row-ico">${icon('pin')}</span><div class="k">Yard</div><div class="val" data-site="address"></div></div>
          <div class="row"><span class="row-ico">${icon('clock')}</span><div class="k">Hours</div><div class="val" data-site="hours">${site.hours}</div></div>
        </div>
        <div class="contact-note">
          <p>Every enquiry lands on the sales desk and a person picks it up. Parts and breakdowns go straight through to the service controller. If you would rather talk now, the live chat in the corner reaches the same desk.</p>
        </div>
      </div>

      ${contactForm('contact-form')}
    </div>
  </section>`;

/* ---------- Admin dashboard (staff only, no site furniture) ---------- */
const adminContent = `
  <main class="admin" id="admin">
    <section class="admin-gate" id="admin-boot">
      <div class="admin-card"><p class="admin-note">Checking access&hellip;</p></div>
    </section>

    <section class="admin-gate" id="admin-unconfigured" hidden>
      <div class="admin-card">
        <span class="eyebrow">VMAX / Desk</span>
        <h1>Backend not connected.</h1>
        <div id="admin-missing"></div>
        <p class="admin-note">Set it in the deployment's environment variables and reload. Nothing needs rebuilding, but the change only reaches a running deployment after a redeploy.</p>
        <p class="admin-note"><a href="/api/health">/api/health</a> lists everything the server can see.</p>
        <a class="admin-back" href="/">Back to site</a>
      </div>
    </section>

    <section class="admin-gate" id="admin-login" hidden>
      <form class="admin-card" id="login-form" novalidate>
        <span class="eyebrow">VMAX / Desk</span>
        <h1>Staff sign in.</h1>
        <p class="admin-note" id="login-note">Enquiries, applications, live chat and mail in one place.</p>
        <div class="field"><label for="login-email">Email</label><input type="email" id="login-email" name="email" autocomplete="username" required /></div>
        <div class="field"><label for="login-password">Password</label><input type="password" id="login-password" name="password" autocomplete="current-password" required /></div>
        <div class="err" id="login-error" role="alert"></div>
        <button type="submit" class="btn" id="login-btn">Sign in <span class="arw">&rsaquo;</span></button>
        <a class="admin-back" href="/">Back to site</a>
      </form>
    </section>

    <div class="admin-shell" id="admin-shell" hidden>
      <header class="admin-bar">
        <a class="admin-brand" href="/">
          <span class="brand-type is-small" aria-label="${COMPANY}"><span class="brand-v">V</span><span class="brand-max">MAX</span></span>
          <span>Sales desk</span>
        </a>
        <div class="admin-bar-end">
          <span class="admin-who" id="admin-who"></span>
          <button type="button" class="admin-signout" id="admin-signout">Sign out</button>
        </div>
      </header>

      <nav class="admin-tabs" id="admin-tabs" role="tablist" aria-label="Sections">
        <button type="button" class="admin-tab is-active" role="tab" data-tab="enquiries" aria-selected="true">Enquiries<span class="tally" data-tally="enquiries">0</span></button>
        <button type="button" class="admin-tab" role="tab" data-tab="applications" aria-selected="false">Applications<span class="tally" data-tally="applications">0</span></button>
        <button type="button" class="admin-tab" role="tab" data-tab="chat" aria-selected="false">Live chat<span class="tally" data-tally="chat">0</span></button>
        <button type="button" class="admin-tab" role="tab" data-tab="email" aria-selected="false">Email<span class="tally" data-tally="email">0</span></button>
        <button type="button" class="admin-tab" role="tab" data-tab="settings" aria-selected="false">Settings</button>
      </nav>

      <p class="admin-alert" id="admin-alert" role="alert" hidden></p>

      <div class="admin-body">
        <section class="admin-panel" data-panel="enquiries">
          <div class="admin-split">
            <ul class="admin-list" id="enquiry-list"><li class="admin-empty">Loading&hellip;</li></ul>
            <div class="admin-detail" id="enquiry-detail"><p class="admin-empty">Pick an enquiry to read it.</p></div>
          </div>
        </section>

        <section class="admin-panel" data-panel="applications" hidden>
          <div class="admin-split">
            <ul class="admin-list" id="application-list"><li class="admin-empty">Loading&hellip;</li></ul>
            <div class="admin-detail" id="application-detail"><p class="admin-empty">Pick an application to read it.</p></div>
          </div>
        </section>

        <section class="admin-panel" data-panel="chat" hidden>
          <div class="admin-split">
            <ul class="admin-list" id="chat-list"><li class="admin-empty">Loading&hellip;</li></ul>
            <div class="admin-detail" id="chat-detail"><p class="admin-empty">Pick a conversation to read and reply.</p></div>
          </div>
        </section>

        <section class="admin-panel" data-panel="email" hidden>
          <div class="admin-split">
            <ul class="admin-list" id="email-list"><li class="admin-empty">Loading&hellip;</li></ul>
            <div class="admin-detail" id="email-detail"><p class="admin-empty">Pick a thread to read it.</p></div>
          </div>
        </section>
        <section class="admin-panel" data-panel="settings" hidden>
          <div class="admin-settings" id="settings-panel"><p class="admin-empty">Loading&hellip;</p></div>
        </section>
      </div>
    </div>
  </main>`;

/* ---------- 404 ---------- */
const notFoundContent = `
  <section class="notfound">
    <div class="wrap">
      <h1>Off the <span class="mark">haul road</span>.</h1>
      <p>This page has moved or never existed. The links below will get you back on site.</p>
      <div class="hero-actions"><a href="/" class="btn">Back to home <span class="arw">&rsaquo;</span></a><a href="/machines" class="btn ghost">Browse machines <span class="arw">&rsaquo;</span></a></div>
    </div>
  </section>`;

const pages = [
  { file: 'index.html', active: '', bodyClass: 'page-home', title: `${COMPANY} | New Heavy Machinery Sales and Servicing`, description: 'VMAX Machine Ltd supplies brand new heavy machinery from Caterpillar, Volvo, Komatsu, JCB, John Deere, Genie and more: excavators, loaders, dozers, tractors, drill rigs, aerial lifts and site power, with servicing, parts and warranty behind every machine.', content: indexContent },
  { file: 'machines.html', active: 'machines', bodyClass: 'page-machines', title: `Machines for sale | ${COMPANY}`, description: 'Brand new heavy machinery for sale across 17 classes and 27 brands: excavators, wheel loaders, dozers, haulers, graders, tractors, drill rigs, aerial lifts, forklifts, cranes and site power.', content: machinesContent, extraScripts: ['/js/machines.js'] },
  { file: 'services.html', active: 'services', bodyClass: 'page-services', title: `Services | ${COMPANY}`, description: 'New machine sales, scheduled servicing, field service and breakdown, genuine parts, warranty, delivery and commissioning, training, finance and leasing.', content: servicesContent },
  { file: 'apply.html', active: 'careers', bodyClass: 'page-apply', title: `Apply | ${COMPANY}`, description: 'Apply to VMAX Machine Ltd. One form, read by the manager you would work for.', content: applyContent, extraScripts: ['/js/apply.js'] },
  { file: 'careers.html', active: 'careers', bodyClass: 'page-careers', title: `Careers | ${COMPANY}`, description: 'Open roles at VMAX Machine Ltd for technicians, field service engineers, parts advisors, drivers and apprentices.', content: careersContent, extraScripts: ['/js/careers.js'] },
  { file: 'contact.html', active: 'contact', bodyClass: 'page-contact', title: `Request a quote | ${COMPANY}`, description: 'Contact VMAX Machine Ltd for machine sales, parts, hire and service. Tell us the job and a sales engineer comes back with a machine, a price and a date.', content: contactContent },
  { file: 'admin.html', active: '', bodyClass: 'page-admin', bare: true, noindex: true,
    styles: ['/css/admin.css'],
    title: `Sales desk | ${COMPANY}`, description: 'Staff dashboard.',
    content: adminContent, extraScripts: ['/js/supabase-lite.js', '/js/admin.js'] },
  { file: '404.html', active: '', bodyClass: 'page-404', title: `Page not found | ${COMPANY}`, description: 'Page not found.', content: notFoundContent },
];

/* The fixed pages, then one page per machine and one per service. */
module.exports = pages.concat(machinePages, servicePages);

'use strict';

const machines = require('../data/machines.json');
const services = require('../data/services.json');
const images = require('./images');
const site = require('../data/site.json');
const { media, esc } = require('./media');
const { icon } = require('./icons');
const { contactForm } = require('./layout');

const COMPANY = 'VMAX Machine Ltd';

/* ---------- Shared pieces ---------------------------------------------- */

/* Interior page header: copy on the left, a framed picture on the right. */
function pageHeader({ eyebrow, title, sub, image, alt }) {
  return `
  <header class="page-header">
    <div class="wrap page-header-grid">
      <div class="page-header-copy">
        <span class="eyebrow">${eyebrow}</span>
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
  return `<li class="spec"><span class="spec-ico">${icon(spec.icon)}</span><span class="spec-val"><span class="spec-k">${esc(spec.label)}</span>${esc(spec.value)}</span></li>`;
}

function machineCard(m) {
  const img = images.resolveName(m.imageName, m.name);
  return `
      <a class="mcard" href="/machines/${esc(m.id)}" data-category="${esc(m.category)}" data-condition="${esc(m.condition)}" data-reveal>
        <div class="mcard-flags">
          <span class="flag ${m.condition === 'New' ? 'is-new' : 'is-used'}">${esc(m.condition)}</span>
          <span class="flag-stock">${esc(m.status)}</span>
        </div>
        <div class="mcard-media">${media(img, { alt: m.name, className: 'media-machine' })}</div>
        <div class="mcard-body">
          <h3>${esc(m.model)}</h3>
          <p class="mcard-type">${esc(m.category.replace(/s$/, ''))}</p>
          <ul class="specs">${(m.specs || []).map(specRow).join('')}</ul>
          <span class="mcard-go">View machine <span class="go-pill">${icon('arrow')}</span></span>
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
            ${delta ? `<span class="kpi-delta">${icon('trend')}${esc(delta)}</span>` : ''}
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

const CATEGORY_ICONS = {
  'Wheel Loaders': 'bucket',
  Excavators: 'machine',
  Dozers: 'power',
  Haulers: 'transport',
  Graders: 'reach',
  'Backhoe Loaders': 'machine',
  Compaction: 'weight',
  Telehandlers: 'payload',
};

const categories = Array.from(new Set(machines.map((m) => m.category)));

const heroSlides = images.heroSlides.map((img, i) =>
  media(img, { alt: `VMAX machines at work ${i + 1}`, className: 'media-fill', eager: i === 0 })
);

const heroSection = `
  <section class="hero" id="top" data-chapter="VMAX">
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <span class="eyebrow" data-reveal>New &amp; used heavy plant</span>
        <h1 data-reveal>Move more.<br /><span class="mark">Stop less.</span></h1>
        <p class="hero-sub" data-reveal>Loaders, excavators, dozers, haulers and graders, sold with the parts and field service that keep them working.</p>
        <div class="hero-actions" data-reveal>
          <a href="/machines" class="btn">Browse machines <span class="arw">&rsaquo;</span></a>
          <a href="#quote" class="btn ghost">Request a quote <span class="arw">&rsaquo;</span></a>
        </div>
        <div class="hero-facts" data-reveal>
          <div class="hero-fact"><div class="v"><span data-count="${machines.length * 4}">0</span></div><div class="k">Machines in stock</div></div>
          <div class="hero-fact"><div class="v"><span data-count="9400">0</span></div><div class="k">Parts lines held</div></div>
          <div class="hero-fact"><div class="v">Same day</div><div class="k">Breakdown response</div></div>
        </div>
      </div>
      <div class="hero-media" data-reveal data-para="-30">
        ${slider({ id: 'hero-slider', slides: heroSlides })}
        <div class="hero-chip">
          <span class="ring">${icon('shield')}</span>
          <div>
            <div class="v">140-point checked</div>
            <div class="k">Every used machine</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="marquee" aria-hidden="true">
    <div class="marquee-track">
      ${[0, 1].map(() => `<span>${categories.join('</span><span>')}</span>`).join('')}
    </div>
  </div>`;

const categorySection = `
  <section class="band" id="categories" data-chapter="Classes">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <span class="eyebrow">01 / What we sell</span>
        <h2>Every class of machine on one yard.</h2>
        <p>Pick a class to see what is on the ground this week, or tell us the job and we will size it for you.</p>
      </div>
      <div class="cat-row" data-reveal>
        ${categories.map((c) => {
          const count = machines.filter((m) => m.category === c).length;
          return `
        <a class="cat" href="/machines?category=${encodeURIComponent(c)}">
          <span class="cat-ico">${icon(CATEGORY_ICONS[c] || 'machine')}</span>
          <span class="cat-name">${esc(c)}</span>
          <span class="cat-count">${count}</span>
        </a>`;
        }).join('')}
      </div>
    </div>
  </section>`;

const analyticsSection = `
  <section class="band band-tint" id="numbers" data-chapter="Numbers">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <span class="eyebrow">02 / The numbers</span>
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
          <span class="eyebrow">03 / The range</span>
          <h2>In the yard this week.</h2>
          <p>Every machine listed is one you can walk around, start and load with before you sign anything.</p>
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
        <span class="eyebrow">04 / Inside the yard</span>
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
          <span class="eyebrow">05 / Support</span>
          <h2>Sold, supplied, serviced.</h2>
          <p>Eight departments behind every machine that leaves the yard.</p>
        </div>
        <a href="/services" class="btn ghost">All services <span class="arw">&rsaquo;</span></a>
      </div>
      <div class="svc-grid">
        ${services.map((s, i) => `
        <a class="svc" href="/services/${esc(s.id)}" data-reveal>
          <span class="svc-ico">${icon(['machine', 'shield', 'parts', 'service', 'rental', 'finance', 'training', 'transport'][i] || 'machine')}</span>
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
        <span class="eyebrow">06 / Talk to the desk</span>
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

/* ---------- Machines listing ---------- */
const machinesContent = `
  ${pageHeader({
    eyebrow: 'Sales inventory',
    title: 'Machines.',
    sub: 'New and certified used plant, priced to sell and ready to inspect. Filter by class, then come and see it.',
    image: images.machinesHeader,
    alt: 'VMAX machines',
  })}
  <section class="section-pad">
    <div class="wrap">
      <div class="filters" id="machine-filters" role="tablist" data-reveal>
        <button class="chip is-active" data-filter="All">All <span class="chip-n">${machines.length}</span></button>
        ${categories.map((c) => `<button class="chip" data-filter="${esc(c)}">${esc(c)} <span class="chip-n">${machines.filter((m) => m.category === c).length}</span></button>`).join('\n        ')}
      </div>
      <div class="mcard-grid" id="machines-grid">
        ${machines.map(machineCard).join('')}
      </div>
      <p class="filter-empty" id="filter-empty" hidden>Nothing in that class on the yard right now. Tell us what you are after and we will source it.</p>
    </div>
  </section>
  <section class="cta-band">
    <div class="wrap">
      <div class="cta-inner" data-reveal>
        <div>
          <h2>Not on the list?</h2>
          <p>We source machines to order and take part-exchange against anything we sell.</p>
        </div>
        <a href="/contact" class="btn">Ask the sales desk <span class="arw">&rsaquo;</span></a>
      </div>
    </div>
  </section>`;

/* ---------- Machine detail (hydrated by id) ---------- */
const machineContent = `
  <article id="machine-detail" class="machine-detail" data-loading="true">
    <div class="wrap page-loading">Loading machine&hellip;</div>
  </article>`;

/* ---------- Services listing ---------- */
const servicesContent = `
  ${pageHeader({
    eyebrow: 'Support',
    title: 'Services.',
    sub: 'Sales, used, parts, field service, hire, finance, training and transport, all under one roof.',
    image: images.servicesHeader,
    alt: 'VMAX workshop',
  })}
  <section class="section-pad">
    <div class="wrap">
      <div class="service-index" id="service-index"></div>
    </div>
  </section>`;

/* ---------- Service detail (hydrated by id) ---------- */
const serviceContent = `
  <article id="service-detail" class="service-detail" data-loading="true">
    <div class="wrap page-loading">Loading service&hellip;</div>
  </article>`;

/* ---------- Apply ---------- */
const applyContent = `
  ${pageHeader({
    eyebrow: 'Careers',
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
    eyebrow: 'Careers',
    title: 'Work on big iron.',
    sub: 'Technicians, field engineers, parts people and drivers. If you would rather be paid for what you can fix than for what you can say, write to us.',
    image: images.careersHeader,
    alt: 'VMAX technicians',
  })}
  <section class="section-pad">
    <div class="wrap careers-intro" data-reveal>
      <div>
        <span class="eyebrow">Life at VMAX</span>
        <h2>Tools bought. Training paid. Overtime honoured.</h2>
      </div>
      <p>Our technicians work on machines from twenty tonnes to sixty, in a heated workshop with the lifting gear and diagnostic kit to do the job properly. We pay for manufacturer training, we buy the specialist tools when someone asks for them, and a job that runs late is paid late, not absorbed. Apprentices get a qualified technician beside them from the first week rather than a broom.</p>
    </div>
  </section>
  <section class="section-pad alt">
    <div class="wrap">
      <div class="section-head" data-reveal>
        <span class="eyebrow">Open roles</span>
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
    eyebrow: 'Sales desk',
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
      <span class="eyebrow">Error 404</span>
      <h1>Off the <span class="mark">haul road</span>.</h1>
      <p>This page has moved or never existed. The links below will get you back on site.</p>
      <div class="hero-actions"><a href="/" class="btn">Back to home <span class="arw">&rsaquo;</span></a><a href="/machines" class="btn ghost">Browse machines <span class="arw">&rsaquo;</span></a></div>
    </div>
  </section>`;

module.exports = [
  { file: 'index.html', active: '', bodyClass: 'page-home', title: `${COMPANY} | Heavy Machinery Sales, Parts and Service`, description: 'VMAX Machine Ltd sells new and certified used heavy plant: wheel loaders, excavators, dozers, articulated haulers, graders and telehandlers, backed by parts, field service, hire and finance.', content: indexContent },
  { file: 'machines.html', active: 'machines', bodyClass: 'page-machines', title: `Machines for sale | ${COMPANY}`, description: 'New and certified used heavy machinery for sale: wheel loaders, excavators, dozers, haulers, graders, backhoe loaders, compaction and telehandlers.', content: machinesContent, extraScripts: ['/js/machines.js'] },
  { file: 'machine.html', active: 'machines', bodyClass: 'page-machine', title: `Machine | ${COMPANY}`, description: 'Machine specification, features and price.', content: machineContent, extraScripts: ['/js/machine.js'] },
  { file: 'services.html', active: 'services', bodyClass: 'page-services', title: `Services | ${COMPANY}`, description: 'Machine sales, certified used equipment, genuine parts and attachments, field service, rental, finance, training and transport.', content: servicesContent, extraScripts: ['/js/services.js'] },
  { file: 'service.html', active: 'services', bodyClass: 'page-service', title: `Service | ${COMPANY}`, description: 'Service detail.', content: serviceContent, extraScripts: ['/js/service.js'] },
  { file: 'apply.html', active: 'careers', bodyClass: 'page-apply', title: `Apply | ${COMPANY}`, description: 'Apply to VMAX Machine Ltd. One form, read by the manager you would work for.', content: applyContent, extraScripts: ['/js/apply.js'] },
  { file: 'careers.html', active: 'careers', bodyClass: 'page-careers', title: `Careers | ${COMPANY}`, description: 'Open roles at VMAX Machine Ltd for technicians, field service engineers, parts advisors, drivers and apprentices.', content: careersContent, extraScripts: ['/js/careers.js'] },
  { file: 'contact.html', active: 'contact', bodyClass: 'page-contact', title: `Request a quote | ${COMPANY}`, description: 'Contact VMAX Machine Ltd for machine sales, parts, hire and service. Tell us the job and a sales engineer comes back with a machine, a price and a date.', content: contactContent },
  { file: 'admin.html', active: '', bodyClass: 'page-admin', bare: true, noindex: true,
    styles: ['/css/admin.css'],
    title: `Sales desk | ${COMPANY}`, description: 'Staff dashboard.',
    content: adminContent, extraScripts: ['/js/supabase-lite.js', '/js/admin.js'] },
  { file: '404.html', active: '', bodyClass: 'page-404', title: `Page not found | ${COMPANY}`, description: 'Page not found.', content: notFoundContent },
];

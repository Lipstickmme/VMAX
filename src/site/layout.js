'use strict';

/**
 * Shared page layout. Pages provide their own content; this module wraps it
 * with the head, the aurora, the nav, the footer and the chat widget so every
 * page stays consistent. Rendered at build time (scripts/build-pages.js) into
 * static HTML, so there is no client-side layout flash.
 */

const images = require('./images');
const { media } = require('./media');
const { icon } = require('./icons');
const site = require('../data/site.json');

const YEAR = new Date().getFullYear();
const COMPANY = 'VMAX Machine Ltd';

/**
 * The layer the glass reads against.
 *
 * Frosted panes over flat white are grey boxes. Three wide, very faint yellow
 * washes and a hairline grid sit fixed behind the whole site so every pane has
 * something to refract, and they drift a little as the page scrolls.
 */
function aurora() {
  return `
  <div class="aurora" aria-hidden="true">
    <span class="a1" data-para="-40"></span>
    <span class="a2" data-para="26"></span>
    <span class="a3" data-para="-18"></span>
    <span class="grid"></span>
  </div>`;
}

/**
 * The wordmark.
 *
 * No logo file ships with the site, so the mark is set in type until one is
 * dropped in as vmaxlogo. Typeset is the default rather than the fallback: it
 * is the same mark either way, and the page never shows a gap.
 */
function wordmark({ tone = 'light', small = false } = {}) {
  const img = tone === 'dark' ? images.logoDark : images.logoLight;
  if (img && img.src) {
    return `<img class="brand-logo" src="${img.src}" alt="${COMPANY}" />`;
  }
  return `<span class="brand-type${small ? ' is-small' : ''}" aria-label="${COMPANY}">
      <span class="brand-v">V</span><span class="brand-max">MAX</span><span class="brand-sub">Machine Ltd</span>
    </span>`;
}

/**
 * The enquiry form. Shared so the landing page and /contact stay identical in
 * behaviour: both POST to /api/contact, which writes the enquiry and raises it
 * with the sales desk, and both appear at /admin.
 */
function contactForm(id = 'contact-form') {
  return `
      <form id="${id}" data-contact-form novalidate data-reveal>
        <div class="field two">
          <div class="field"><label for="${id}-name">Name</label><input type="text" id="${id}-name" name="name" autocomplete="name" required /><div class="err" data-err="name"></div></div>
          <div class="field"><label for="${id}-email">Email</label><input type="email" id="${id}-email" name="email" autocomplete="email" required /><div class="err" data-err="email"></div></div>
        </div>
        <div class="field two">
          <div class="field"><label for="${id}-company">Company <span class="opt">(optional)</span></label><input type="text" id="${id}-company" name="company" autocomplete="organization" /><div class="err" data-err="company"></div></div>
          <div class="field"><label for="${id}-service">What do you need?</label>
            <select id="${id}-service" name="service">
              <option value="">Select</option>
              <option>Buy a new machine</option>
              <option>Buy used equipment</option>
              <option>Hire or lease</option>
              <option>Parts and attachments</option>
              <option>Service or repair</option>
              <option>Sell or part-exchange a machine</option>
              <option>Not sure yet</option>
            </select><div class="err" data-err="service"></div>
          </div>
        </div>
        <div class="field"><label for="${id}-message">Tell us about the job</label><textarea id="${id}-message" name="message" placeholder="What are you moving, how many hours a week, and what is the ground like?" required></textarea><div class="err" data-err="message"></div></div>
        <div class="honeypot" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off" /></label></div>
        <div class="form-status" data-form-status role="status" aria-live="polite"></div>
        <button type="submit" class="btn" data-submit>Request a quote <span class="arw">&rsaquo;</span></button>
      </form>`;
}

function head({ title, description, noindex = false, styles = [] }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />${noindex ? '\n  <meta name="robots" content="noindex, nofollow" />' : ''}
  <meta name="theme-color" content="#ffffff" />
  <link rel="icon" href="/favicon.ico" sizes="32x32" />
  <link rel="icon" href="/favicon.png" type="image/png" sizes="512x512" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Barlow:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/css/styles.css" />
  ${styles.map((href) => `<link rel="stylesheet" href="${href}" />`).join('\n  ')}
</head>`;
}

function nav(active = '') {
  const link = (href, label, key) =>
    `<a href="${href}"${key === active ? ' class="is-active"' : ''}>${label}</a>`;
  return `
  <header class="nav" id="nav">
    <a class="brand" href="/" aria-label="${COMPANY} home">
      ${wordmark({ tone: 'light' })}
    </a>
    <nav class="nav-links" id="navlinks">
      ${link('/machines', 'Machines', 'machines')}
      ${link('/services', 'Services', 'services')}
      ${link('/careers', 'Careers', 'careers')}
      ${link('/contact', 'Contact', 'contact')}
      <a class="nav-sheet-cta" href="/contact">Request a quote <span class="arw">&rsaquo;</span></a>
    </nav>
    <a href="/contact" class="btn nav-cta">Request a quote <span class="arw">&rsaquo;</span></a>
    <button class="nav-toggle" id="navtoggle" aria-label="Open menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </header>`;
}

function footer() {
  return `
  <footer class="footer">
    <div class="wrap footer-top">
      <div class="footer-brand">
        ${wordmark({ tone: 'light' })}
        <p>Heavy plant sales, parts, service and hire. New and certified used machines, supported after the invoice.</p>
      </div>
      <div class="col">
        <h5>Equipment</h5>
        <a href="/machines">All machines</a>
        <a href="/machines?category=Wheel%20Loaders">Wheel loaders</a>
        <a href="/machines?category=Excavators">Excavators</a>
        <a href="/machines?category=Haulers">Haulers</a>
      </div>
      <div class="col">
        <h5>Company</h5>
        <a href="/services">Services</a>
        <a href="/careers">Careers</a>
        <a href="/apply">Apply</a>
      </div>
      <div class="col">
        <h5>Contact</h5>
        <a href="mailto:${site.email}" data-site="email">${site.email}</a>
        <a href="/contact">Request a quote</a>
        <span class="footer-hours" data-site="hours">${site.hours}</span>
      </div>
    </div>
    <div class="wrap footer-bottom">
      <span>&copy; ${YEAR} ${COMPANY}</span>
      <span class="footer-strip" aria-hidden="true"></span>
    </div>
  </footer>`;
}

function chatWidget() {
  return `
  <div class="chat" id="chat" aria-live="polite">
    <button class="chat-toggle" id="chat-toggle" aria-label="Open live chat" aria-expanded="false">
      <svg class="i-open" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z"/></svg>
      <svg class="i-close" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    <div class="chat-panel" id="chat-panel" hidden>
      <div class="chat-head">
        <div class="chat-head-id">
          <span class="dot"></span>
          <div>
            <strong>VMAX Sales Desk</strong>
            <small>Typically replies in a few minutes</small>
          </div>
        </div>
        <button class="chat-min" id="chat-min" aria-label="Minimise chat">&minus;</button>
      </div>
      <div class="chat-log" id="chat-log"></div>
      <form class="chat-form" id="chat-form">
        <input type="text" id="chat-input" name="text" placeholder="Ask about a machine, part or hire" autocomplete="off" maxlength="2000" />
        <button type="submit" aria-label="Send message">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        </button>
      </form>
    </div>
  </div>`;
}

/**
 * Script tags. An entry may be a path, or `{ src, type }` when it needs to
 * load as a module (the admin dashboard imports the Supabase client).
 */
function scripts(list) {
  const tags = list
    .map((s) => (typeof s === 'string' ? { src: s } : s))
    .map(({ src, type }) => `<script${type ? ` type="${type}"` : ''} src="${src}"></script>`)
    .join('\n  ');
  return `  ${tags}\n</body>\n</html>`;
}

/**
 * Compose a full page.
 *
 * `bare` pages get the same shell styling but none of the site furniture:
 * no nav, no footer and no chat widget. The admin dashboard is one, since a
 * member of staff answering the chat should not also be offered it.
 *
 * @param {{title,description,active,bodyClass,content,extraScripts,bare,noindex,styles}} opts
 */
function page(opts) {
  const { active = '', bodyClass = '', content = '', extraScripts = [], bare = false } = opts;
  if (bare) {
    return [head(opts), `<body class="${bodyClass}">`, content, scripts(extraScripts)].join('\n');
  }
  return [
    head(opts),
    `<body class="${bodyClass}">`,
    aurora(),
    `  <div class="scroll-progress" id="progress"></div>`,
    nav(active),
    content,
    footer(),
    chatWidget(),
    scripts(['/js/icons.js', '/js/media.js', '/js/main.js', '/js/supabase-lite.js', '/js/chat.js', ...extraScripts]),
  ].join('\n');
}

module.exports = { page, nav, footer, chatWidget, head, contactForm, wordmark, aurora, media, icon, COMPANY };

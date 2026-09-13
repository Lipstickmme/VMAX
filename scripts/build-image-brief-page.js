'use strict';

/**
 * Builds the shareable image brief page from docs/image-brief.json.
 *
 * The brief is long and repetitive by nature - 81 files, each with a prompt
 * somebody has to copy - so it is worth a page rather than a document: search,
 * filter by class, copy a prompt in one click, and tick a file off when it is
 * done. Kept as a builder rather than hand-written HTML so the page cannot
 * drift from the catalogue.
 *
 * Run with `npm run gen:brief`; writes docs/image-brief.html.
 */

const fs = require('fs');
const path = require('path');

const items = require('../docs/image-brief.json');

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const groups = [];
items.forEach((it) => {
  let g = groups.find((x) => x.name === it.group);
  if (!g) groups.push((g = { name: it.group, items: [] }));
  g.items.push(it);
});

const machineCount = items.filter((i) => !['Scenes and page artwork', 'Class fallbacks', 'Logos'].includes(i.group)).length;
const classCount = (groups.find((g) => g.name === 'Class fallbacks') || { items: [] }).items.length;

const row = (it, i, total) => `
        <article class="row" data-file="${esc(it.file)}" data-group="${esc(it.group)}" data-hay="${esc((it.file + ' ' + it.title + ' ' + it.brand + ' ' + it.group).toLowerCase())}">
          <div class="row-mark">
            <input type="checkbox" class="tick" id="tick-${esc(it.file)}" data-tick="${esc(it.file)}" />
            <label for="tick-${esc(it.file)}"><span class="sr">Mark ${esc(it.file)} as done</span></label>
          </div>
          <div class="row-meta">
            <p class="seq">${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</p>
            <h3 class="file">${esc(it.file)}</h3>
            <p class="name">${esc(it.title)}<span class="brand">${esc(it.brand)}</span></p>
            <p class="where">${esc(it.where)}</p>
            <p class="desc">${esc(it.description)}</p>
          </div>
          <div class="row-prompt">
            <div class="prompt-head">
              <span class="lbl">Generation prompt</span>
              <button type="button" class="copy" data-copy="${esc(it.file)}">Copy</button>
            </div>
            <pre class="prompt" id="p-${esc(it.file)}">${esc(it.prompt)}</pre>
          </div>
        </article>`;

const section = (g) => `
      <section class="group" id="g-${esc(g.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}" data-group-section="${esc(g.name)}">
        <header class="group-head">
          <h2>${esc(g.name)}</h2>
          <p class="group-count"><span data-group-done="${esc(g.name)}">0</span> of ${g.items.length} done</p>
        </header>
        <div class="rows">${g.items.map((it, i) => row(it, i, g.items.length)).join('')}</div>
      </section>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>VMAX Image Brief</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@500;600;700&family=Public+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>
  :root {
    --paper: #faf8f2;
    --panel: #ffffff;
    --rule: #e7e1d3;
    --rule-soft: #f1ece0;
    --ink: #16140e;
    --ink-2: #4b4639;
    --muted: #837c6b;
    --accent: #ffc400;
    --accent-deep: #8a6200;
    --accent-wash: #fff3ce;
    --ok: #2c6a4a;
    --ok-wash: #e4efe8;
    --focus: #1d6fd0;
    --font-display: "Familjen Grotesk", "Trebuchet MS", sans-serif;
    --font-body: "Public Sans", system-ui, sans-serif;
    --font-mono: "IBM Plex Mono", ui-monospace, "SFMono-Regular", monospace;
    --gutter: clamp(16px, 4vw, 56px);
    --maxw: 1180px;
  }
  :root:not([data-theme="light"]) { color-scheme: light; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      color-scheme: dark;
      --paper: #15140f;
      --panel: #1c1b15;
      --rule: #302e24;
      --rule-soft: #26241c;
      --ink: #f3f0e6;
      --ink-2: #cbc5b5;
      --muted: #8d8775;
      --accent: #ffc400;
      --accent-deep: #ffd966;
      --accent-wash: #2b2412;
      --ok: #7fc8a0;
      --ok-wash: #1b2820;
      --focus: #7fb2f0;
    }
  }
  :root[data-theme="dark"] {
    color-scheme: dark;
    --paper: #15140f;
    --panel: #1c1b15;
    --rule: #302e24;
    --rule-soft: #26241c;
    --ink: #f3f0e6;
    --ink-2: #cbc5b5;
    --muted: #8d8775;
    --accent: #ffc400;
    --accent-deep: #ffd966;
    --accent-wash: #2b2412;
    --ok: #7fc8a0;
    --ok-wash: #1b2820;
    --focus: #7fb2f0;
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  :focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: 3px; }
  .wrap { max-width: var(--maxw); margin: 0 auto; padding-inline: var(--gutter); }

  /* Masthead ------------------------------------------------------------ */
  .masthead { padding-block: clamp(28px, 5vw, 56px) clamp(20px, 3vw, 32px); }
  .kicker {
    font-family: var(--font-mono); font-size: 11.5px; letter-spacing: .16em;
    text-transform: uppercase; color: var(--accent-deep); margin: 0 0 14px;
  }
  h1 {
    font-family: var(--font-display); font-weight: 700;
    font-size: clamp(30px, 4.6vw, 50px); line-height: 1.04; letter-spacing: -0.02em;
    margin: 0 0 14px; text-wrap: balance;
  }
  .standfirst { font-size: clamp(16px, 1.3vw, 19px); color: var(--ink-2); margin: 0; max-width: 62ch; }

  .tallies { display: flex; flex-wrap: wrap; gap: clamp(20px, 4vw, 56px); margin-top: clamp(22px, 3vw, 34px); }
  .tally .n {
    font-family: var(--font-display); font-weight: 700; font-size: clamp(26px, 3vw, 36px);
    letter-spacing: -0.02em; font-variant-numeric: tabular-nums; display: block; line-height: 1.05;
  }
  .tally .k { font-family: var(--font-mono); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }

  .note {
    margin-top: clamp(24px, 3vw, 36px);
    border-left: 3px solid var(--accent);
    background: var(--accent-wash);
    padding: 16px 20px;
    font-size: 15.5px; color: var(--ink-2);
    max-width: 78ch;
  }
  .note strong { color: var(--ink); }

  /* Control strip ------------------------------------------------------- */
  .controls {
    position: sticky; top: 0; z-index: 5;
    background: color-mix(in srgb, var(--paper) 92%, transparent);
    backdrop-filter: blur(8px);
    border-block: 1px solid var(--rule);
    padding-block: 12px;
    margin-top: clamp(24px, 3vw, 36px);
  }
  .controls-inner { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
  .search {
    flex: 1 1 240px; min-width: 0;
    font-family: var(--font-mono); font-size: 14px;
    padding: 10px 14px; color: var(--ink);
    background: var(--panel); border: 1px solid var(--rule); border-radius: 4px;
  }
  .search::placeholder { color: var(--muted); }
  .select {
    font-family: var(--font-body); font-size: 14px; padding: 10px 12px;
    background: var(--panel); color: var(--ink); border: 1px solid var(--rule); border-radius: 4px;
  }
  .toggle { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; color: var(--ink-2); }
  .progress { flex: 1 1 180px; display: flex; align-items: center; gap: 10px; justify-content: flex-end; }
  .bar { flex: 0 1 160px; height: 6px; background: var(--rule); border-radius: 999px; overflow: hidden; }
  .bar span { display: block; height: 100%; width: 0; background: var(--accent); transition: width .3s ease; }
  .progress-n { font-family: var(--font-mono); font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }

  /* Groups and rows ----------------------------------------------------- */
  .group { padding-block: clamp(26px, 3.5vw, 44px) 0; }
  .group-head {
    display: flex; align-items: baseline; justify-content: space-between; gap: 16px;
    padding-bottom: 10px; border-bottom: 2px solid var(--ink);
  }
  .group-head h2 { font-family: var(--font-display); font-weight: 600; font-size: clamp(19px, 2vw, 24px); letter-spacing: -0.01em; margin: 0; }
  .group-count { font-family: var(--font-mono); font-size: 12px; color: var(--muted); margin: 0; font-variant-numeric: tabular-nums; }

  .rows { display: flex; flex-direction: column; }
  .row {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) minmax(0, 1.1fr);
    gap: clamp(14px, 2vw, 28px);
    padding-block: 22px;
    border-bottom: 1px solid var(--rule-soft);
    align-items: start;
  }
  .row.is-done { background: var(--ok-wash); }
  .row.is-done .row-meta, .row.is-done .row-prompt { opacity: .62; }
  .row[hidden] { display: none; }

  .row-mark { padding-top: 2px; }
  .tick { position: absolute; opacity: 0; width: 22px; height: 22px; }
  .tick + label {
    display: grid; place-items: center; width: 22px; height: 22px;
    border: 1.5px solid var(--rule); border-radius: 4px; background: var(--panel); cursor: pointer;
  }
  .tick + label::after {
    content: ""; width: 10px; height: 6px; border-left: 2px solid var(--ok); border-bottom: 2px solid var(--ok);
    transform: rotate(-45deg) scale(.6); opacity: 0; transition: opacity .15s ease, transform .15s ease;
  }
  .tick:checked + label { border-color: var(--ok); background: var(--panel); }
  .tick:checked + label::after { opacity: 1; transform: rotate(-45deg) scale(1); }
  .tick:focus-visible + label { outline: 2px solid var(--focus); outline-offset: 2px; }

  .seq { font-family: var(--font-mono); font-size: 11px; letter-spacing: .1em; color: var(--muted); margin: 0 0 6px; font-variant-numeric: tabular-nums; }
  .file { font-family: var(--font-mono); font-weight: 500; font-size: 15px; letter-spacing: -0.01em; margin: 0; overflow-wrap: anywhere; }
  .name { font-family: var(--font-display); font-weight: 600; font-size: 17px; margin: 8px 0 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; }
  .brand {
    font-family: var(--font-mono); font-size: 10.5px; font-weight: 400; letter-spacing: .1em; text-transform: uppercase;
    color: var(--accent-deep); background: var(--accent-wash); padding: 3px 8px; border-radius: 999px;
  }
  .where { font-size: 13.5px; color: var(--muted); margin: 6px 0 0; }
  .desc { font-size: 14.5px; color: var(--ink-2); margin: 10px 0 0; max-width: 58ch; }

  .prompt-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
  .lbl { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
  .copy {
    font-family: var(--font-mono); font-size: 11.5px; letter-spacing: .08em; text-transform: uppercase;
    padding: 6px 12px; cursor: pointer; color: var(--ink);
    background: var(--panel); border: 1px solid var(--rule); border-radius: 999px;
    transition: background .18s ease, border-color .18s ease;
  }
  .copy:hover { background: var(--accent-wash); border-color: var(--accent); }
  .copy.is-copied { background: var(--accent); border-color: var(--accent); color: #16140e; }
  .prompt {
    font-family: var(--font-mono); font-size: 13px; line-height: 1.6;
    background: var(--panel); border: 1px solid var(--rule); border-radius: 4px;
    padding: 14px 16px; margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--ink-2);
  }

  .empty { padding: 40px 0; color: var(--muted); font-family: var(--font-mono); font-size: 13px; }
  footer.foot { padding-block: clamp(32px, 5vw, 56px); color: var(--muted); font-size: 13.5px; border-top: 1px solid var(--rule); margin-top: 40px; }
  footer.foot code { font-family: var(--font-mono); font-size: 12.5px; color: var(--ink-2); }

  @media (max-width: 860px) {
    .row { grid-template-columns: 26px minmax(0, 1fr); }
    .row-prompt { grid-column: 2; }
    .progress { justify-content: flex-start; }
  }
  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; animation: none !important; }
  }
</style>
</head>
<body>
  <header class="masthead wrap">
    <p class="kicker">VMAX Machine Ltd &middot; production brief</p>
    <h1>Every photograph the site is waiting for</h1>
    <p class="standfirst">${items.length} files: the machines, one fallback per class, the page artwork and the wordmark. Each one names where it appears on the site, what it should show, and a prompt for generating something that looks like it.</p>
    <div class="tallies">
      <div class="tally"><span class="n">${items.length}</span><span class="k">Files in total</span></div>
      <div class="tally"><span class="n">${machineCount}</span><span class="k">Machine shots</span></div>
      <div class="tally"><span class="n">${classCount}</span><span class="k">Class fallbacks cover them all</span></div>
      <div class="tally"><span class="n" id="done-n">0</span><span class="k">Ticked off</span></div>
    </div>
    <p class="note"><strong>Start with the ${classCount} class fallbacks.</strong> One photograph per class covers every machine in it, so those files alone finish the catalogue. A per-machine file then overrides its class picture wherever it matters most.</p>
    <p class="note"><strong>On the branded machines.</strong> These are real models from real makers. A generated picture of a Caterpillar 320 GC is not one, and selling from it misrepresents the product and uses someone else's trademark. Ask the maker or your distributor for press and dealer photography first: it is free, accurate and licensed for exactly this. Generated images are a fair stand-in while you wait, and fine for the scenes, which are nobody's product.</p>
  </header>

  <div class="controls">
    <div class="wrap controls-inner">
      <input type="search" id="search" class="search" placeholder="Search file, model or brand" aria-label="Search the brief" />
      <select id="group" class="select" aria-label="Filter by group">
        <option value="">All groups</option>
        ${groups.map((g) => `<option value="${esc(g.name)}">${esc(g.name)} (${g.items.length})</option>`).join('\n        ')}
      </select>
      <label class="toggle"><input type="checkbox" id="hide-done" /> Hide done</label>
      <div class="progress">
        <div class="bar"><span id="bar"></span></div>
        <span class="progress-n" id="progress-n">0 of ${items.length}</span>
      </div>
    </div>
  </div>

  <main class="wrap" id="list">
${groups.map(section).join('\n')}
    <p class="empty" id="empty" hidden>Nothing matches that search.</p>
  </main>

  <footer class="foot wrap">
    <p>Drop finished files into <code>public/assets/img/</code>, logos into <code>public/assets/brand/</code>. Any of <code>.webp .avif .jpg .jpeg .png</code> works, and <code>.webp</code> wins when both exist. Rebuild and the placeholders become photographs.</p>
    <p>Generated from the site's own catalogue by <code>npm run gen:brief</code>. Ticks are shared with everyone who opens this page.</p>
  </footer>

<script>
(function () {
  var rows = Array.prototype.slice.call(document.querySelectorAll('.row'));
  var searchEl = document.getElementById('search');
  var groupEl = document.getElementById('group');
  var hideDoneEl = document.getElementById('hide-done');
  var barEl = document.getElementById('bar');
  var progressEl = document.getElementById('progress-n');
  var doneNEl = document.getElementById('done-n');
  var emptyEl = document.getElementById('empty');
  var total = rows.length;
  var done = Object.create(null);
  var store = null;           // db, once it answers
  var LOCAL = 'vmax-brief-done';

  /* Ticks live in the artifact's shared store when the viewer has it, and
     fall back to this browser alone when they do not. */
  function readLocal() {
    try { return JSON.parse(localStorage.getItem(LOCAL) || '{}'); } catch (e) { return {}; }
  }
  function writeLocal() {
    try { localStorage.setItem(LOCAL, JSON.stringify(done)); } catch (e) { /* private window */ }
  }

  function paint() {
    var q = searchEl.value.trim().toLowerCase();
    var group = groupEl.value;
    var hide = hideDoneEl.checked;
    var shown = 0;
    var doneCount = 0;
    var perGroup = Object.create(null);

    rows.forEach(function (row) {
      var file = row.dataset.file;
      var isDone = !!done[file];
      if (isDone) {
        doneCount += 1;
        perGroup[row.dataset.group] = (perGroup[row.dataset.group] || 0) + 1;
      }
      row.classList.toggle('is-done', isDone);
      var box = row.querySelector('.tick');
      if (box.checked !== isDone) box.checked = isDone;

      var match = (!q || row.dataset.hay.indexOf(q) !== -1) &&
        (!group || row.dataset.group === group) &&
        (!hide || !isDone);
      row.hidden = !match;
      if (match) shown += 1;
    });

    document.querySelectorAll('[data-group-section]').forEach(function (sec) {
      var any = Array.prototype.some.call(sec.querySelectorAll('.row'), function (r) { return !r.hidden; });
      sec.hidden = !any;
    });
    document.querySelectorAll('[data-group-done]').forEach(function (el) {
      el.textContent = perGroup[el.dataset.groupDone] || 0;
    });

    emptyEl.hidden = shown > 0;
    barEl.style.width = (total ? (doneCount / total) * 100 : 0) + '%';
    progressEl.textContent = doneCount + ' of ' + total;
    doneNEl.textContent = doneCount;
  }

  function setDone(file, isDone) {
    if (isDone) done[file] = true; else delete done[file];
    paint();
    if (store) {
      var ref = store.collection('done').doc(file);
      (isDone ? ref.set({ at: Date.now() }) : ref.delete()).catch(function () { /* shared state is best effort */ });
    } else {
      writeLocal();
    }
  }

  document.addEventListener('change', function (e) {
    if (e.target.classList.contains('tick')) setDone(e.target.dataset.tick, e.target.checked);
    if (e.target === hideDoneEl) paint();
  });
  searchEl.addEventListener('input', paint);
  groupEl.addEventListener('change', paint);

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.copy');
    if (!btn) return;
    var pre = document.getElementById('p-' + btn.dataset.copy);
    var text = pre ? pre.textContent : '';
    var reset = function () {
      btn.textContent = 'Copied';
      btn.classList.add('is-copied');
      setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('is-copied'); }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(reset, function () { fallback(text, reset); });
    } else {
      fallback(text, reset);
    }
  });

  function fallback(text, then) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); then(); } catch (err) { /* nothing else to try */ }
    document.body.removeChild(ta);
  }

  done = readLocal();
  paint();

  /* The shared store answers later, if at all. When it does it becomes the
     source of truth and everyone's ticks appear live. */
  if (window.claude && window.claude.use) {
    window.claude.use('db').then(function (db) {
      if (!db) return;
      store = db;
      db.collection('done').onSnapshot(function (snap) {
        done = Object.create(null);
        snap.docs.forEach(function (d) { done[d.id] = true; });
        paint();
      }, function () { store = null; });
    }).catch(function () { /* local ticks stand */ });
  }
})();
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, '..', 'docs', 'image-brief.html'), html, 'utf8');
console.log('[brief] wrote docs/image-brief.html (' + Math.round(html.length / 1024) + ' KB, ' + items.length + ' items)');

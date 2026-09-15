'use strict';

/* The sales list.
   Every card is already in the HTML, built from machines.json, so searching
   and filtering hides and shows what is there rather than fetching and
   redrawing it: the page works without JavaScript, and with it the list
   answers instantly. Three controls combine - a free-text search, the class
   chips and the brand chips - and long results are revealed a batch at a time
   so the first paint stays light. */
(function () {
  const V = window.VMAX; if (!V) return;
  const grid = document.getElementById('machines-grid');
  const catBar = document.getElementById('machine-filters');
  const brandBar = document.getElementById('brand-filters');
  const empty = document.getElementById('filter-empty');
  const countEl = document.getElementById('filter-count');
  const moreBtn = document.getElementById('show-more');
  const searchEl = document.getElementById('machine-search');
  const clearBtn = document.getElementById('search-clear');
  const sortEl = document.getElementById('machine-sort');
  if (!grid || !catBar) return;

  const BATCH = 12;
  const cards = V.$$('.mcard', grid);
  const catChips = V.$$('.chip', catBar);
  const brandChips = brandBar ? V.$$('.chip', brandBar) : [];

  /* What each card can be found by. The card already prints its model, class,
     brand, availability and all four spec lines, and the back of it carries
     the description, the year, the stock number and the price, so its own text
     is most of the index; data-more adds the features, which live on the
     machine's own page rather than on the card. */
  const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  cards.forEach((card) => {
    card._hay = norm([
      card.textContent,
      card.dataset.more,
      card.dataset.brand,
      card.dataset.category,
    ].join(' '));
    card._model = norm(card.querySelector('h3') && card.querySelector('h3').textContent);
  });

  const SORTS = {
    featured: null,
    model: (a, b) => a._model.localeCompare(b._model),
    brand: (a, b) => a.dataset.brand.localeCompare(b.dataset.brand) || a._model.localeCompare(b._model),
    category: (a, b) => a.dataset.category.localeCompare(b.dataset.category) || a._model.localeCompare(b._model),
  };

  let category = 'All';
  let brand = 'All';
  let query = '';
  let sort = 'featured';
  let shown = BATCH;

  // Every word has to be somewhere on the card, so "cat excavator" narrows
  // rather than widening the way a single OR would.
  let terms = [];
  const matches = (card) =>
    (category === 'All' || card.dataset.category === category) &&
    (brand === 'All' || card.dataset.brand === brand) &&
    terms.every((t) => card._hay.indexOf(t) !== -1);

  /** Put the grid in the chosen order and hand back that order, so the batch
      that gets revealed first is the first batch as the visitor reads it. */
  function order() {
    const cmp = SORTS[sort];
    const wanted = cmp ? cards.slice().sort(cmp) : cards;
    // Only touch the DOM when the order actually differs from what is there.
    const current = V.$$('.mcard', grid);
    for (let i = 0; i < wanted.length; i += 1) {
      if (current[i] !== wanted[i]) { wanted.forEach((c) => grid.appendChild(c)); break; }
    }
    return wanted;
  }

  function paint() {
    let matched = 0;
    order().forEach((card) => {
      if (!matches(card)) { card.hidden = true; return; }
      matched += 1;
      card.hidden = matched > shown;
    });

    catChips.forEach((c) => c.classList.toggle('is-active', c.dataset.filter === category));
    brandChips.forEach((c) => c.classList.toggle('is-active', c.dataset.brand === brand));
    if (clearBtn) clearBtn.hidden = !query;

    if (countEl) {
      countEl.textContent = matched === 0
        ? 'No machines match'
        : `${Math.min(shown, matched)} of ${matched} machine${matched === 1 ? '' : 's'}`;
    }
    if (empty) empty.hidden = matched > 0;
    if (moreBtn) moreBtn.hidden = matched <= shown;

    // Anything newly revealed still has to animate in.
    V.observeReveals();

    // Keep the address bar in step, so a filtered list can be sent to someone.
    const url = new URL(window.location.href);
    const set = (k, v, blank) => (v === blank ? url.searchParams.delete(k) : url.searchParams.set(k, v));
    set('category', category, 'All');
    set('brand', brand, 'All');
    set('q', query, '');
    set('sort', sort, 'featured');
    window.history.replaceState({}, '', url);
  }

  function setFilter(next) {
    if (next.category !== undefined) category = next.category;
    if (next.brand !== undefined) brand = next.brand;
    if (next.sort !== undefined) sort = SORTS[next.sort] !== undefined ? next.sort : 'featured';
    if (next.query !== undefined) {
      query = next.query;
      terms = norm(query).split(' ').filter(Boolean);
    }
    shown = BATCH;
    paint();
  }

  catBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip) setFilter({ category: chip.dataset.filter });
  });
  if (brandBar) {
    brandBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (chip) setFilter({ brand: chip.dataset.brand });
    });
  }
  if (moreBtn) {
    moreBtn.addEventListener('click', () => {
      shown += BATCH;
      paint();
    });
  }
  if (sortEl) sortEl.addEventListener('change', () => setFilter({ sort: sortEl.value }));

  if (searchEl) {
    searchEl.addEventListener('input', () => setFilter({ query: searchEl.value }));
    searchEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchEl.value) { searchEl.value = ''; setFilter({ query: '' }); }
    });
  }
  if (clearBtn && searchEl) {
    clearBtn.addEventListener('click', () => {
      searchEl.value = '';
      setFilter({ query: '' });
      searchEl.focus();
    });
  }
  // "/" puts the cursor in the search from anywhere on the page.
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    const el = document.activeElement;
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    if (!searchEl) return;
    e.preventDefault();
    searchEl.focus();
    searchEl.select();
  });

  /* /machines?category=Excavators&brand=Volvo&q=loader arrives ready, which is
     what the class tiles, the brand strip and the footer links point at. */
  const params = new URLSearchParams(window.location.search);
  const wantedCat = params.get('category');
  const wantedBrand = params.get('brand');
  const catMatch = wantedCat && catChips.find((c) => c.dataset.filter.toLowerCase() === wantedCat.toLowerCase());
  const brandMatch = wantedBrand && brandChips.find((c) => c.dataset.brand.toLowerCase() === wantedBrand.toLowerCase());
  if (catMatch) category = catMatch.dataset.filter;
  if (brandMatch) brand = brandMatch.dataset.brand;
  const wantedSort = params.get('sort');
  if (wantedSort && SORTS[wantedSort] !== undefined) { sort = wantedSort; if (sortEl) sortEl.value = sort; }
  const wantedQ = params.get('q');
  if (wantedQ) { query = wantedQ; terms = norm(query).split(' ').filter(Boolean); if (searchEl) searchEl.value = query; }

  paint();
})();

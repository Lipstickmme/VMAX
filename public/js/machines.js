'use strict';

/* The sales list.
   Every card is already in the HTML, built from machines.json, so filtering
   hides and shows what is there rather than fetching and redrawing it: the
   page works without JavaScript, and with it the filter is instant. Two
   filters combine (class and brand), and long results are revealed a batch at
   a time so the first paint stays light. */
(function () {
  const V = window.VMAX; if (!V) return;
  const grid = document.getElementById('machines-grid');
  const catBar = document.getElementById('machine-filters');
  const brandBar = document.getElementById('brand-filters');
  const empty = document.getElementById('filter-empty');
  const countEl = document.getElementById('filter-count');
  const moreBtn = document.getElementById('show-more');
  if (!grid || !catBar) return;

  const BATCH = 12;
  const cards = V.$$('.mcard', grid);
  const catChips = V.$$('.chip', catBar);
  const brandChips = brandBar ? V.$$('.chip', brandBar) : [];

  let category = 'All';
  let brand = 'All';
  let shown = BATCH;

  const matches = (card) =>
    (category === 'All' || card.dataset.category === category) &&
    (brand === 'All' || card.dataset.brand === brand);

  function paint() {
    let matched = 0;
    cards.forEach((card) => {
      if (!matches(card)) { card.hidden = true; return; }
      matched += 1;
      card.hidden = matched > shown;
    });

    catChips.forEach((c) => c.classList.toggle('is-active', c.dataset.filter === category));
    brandChips.forEach((c) => c.classList.toggle('is-active', c.dataset.brand === brand));

    if (countEl) {
      countEl.textContent = matched === 0
        ? 'No machines match'
        : `${Math.min(shown, matched)} of ${matched} machine${matched === 1 ? '' : 's'}`;
    }
    if (empty) empty.hidden = matched > 0;
    if (moreBtn) moreBtn.hidden = matched <= shown;

    // Anything newly revealed still has to animate in.
    V.observeReveals();
    V.setupTilt(grid);

    // Keep the address bar in step, so a filtered list can be sent to someone.
    const url = new URL(window.location.href);
    if (category === 'All') url.searchParams.delete('category');
    else url.searchParams.set('category', category);
    if (brand === 'All') url.searchParams.delete('brand');
    else url.searchParams.set('brand', brand);
    window.history.replaceState({}, '', url);
  }

  function setFilter(next) {
    if (next.category !== undefined) category = next.category;
    if (next.brand !== undefined) brand = next.brand;
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

  // /machines?category=Excavators&brand=Volvo arrives filtered, which is what
  // the class tiles, the brand strip and the footer links point at.
  const params = new URLSearchParams(window.location.search);
  const wantedCat = params.get('category');
  const wantedBrand = params.get('brand');
  const catMatch = wantedCat && catChips.find((c) => c.dataset.filter.toLowerCase() === wantedCat.toLowerCase());
  const brandMatch = wantedBrand && brandChips.find((c) => c.dataset.brand.toLowerCase() === wantedBrand.toLowerCase());
  if (catMatch) category = catMatch.dataset.filter;
  if (brandMatch) brand = brandMatch.dataset.brand;

  paint();
})();

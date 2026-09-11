'use strict';

/* The sales list. Cards are already in the HTML, built from machines.json, so
   filtering hides and shows what is there rather than fetching and redrawing
   it: the page works without JavaScript, and with it the filter is instant. */
(function () {
  const V = window.VMAX; if (!V) return;
  const grid = document.getElementById('machines-grid');
  const bar = document.getElementById('machine-filters');
  const empty = document.getElementById('filter-empty');
  if (!grid || !bar) return;

  const cards = V.$$('.mcard', grid);
  const chips = V.$$('.chip', bar);

  function apply(filter) {
    let shown = 0;
    cards.forEach((card) => {
      const match = filter === 'All' || card.dataset.category === filter;
      card.hidden = !match;
      if (match) shown += 1;
    });
    chips.forEach((c) => c.classList.toggle('is-active', c.dataset.filter === filter));
    if (empty) empty.hidden = shown > 0;

    // Keep the address bar in step, so a filtered list can be sent to someone.
    const url = new URL(window.location.href);
    if (filter === 'All') url.searchParams.delete('category');
    else url.searchParams.set('category', filter);
    window.history.replaceState({}, '', url);
  }

  bar.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    apply(chip.dataset.filter);
  });

  // /machines?category=Excavators arrives filtered, which is what the
  // category tiles on the landing page and the footer links link to.
  const wanted = new URLSearchParams(window.location.search).get('category');
  if (wanted) {
    const match = chips.find((c) => c.dataset.filter.toLowerCase() === wanted.toLowerCase());
    if (match) apply(match.dataset.filter);
  }
})();

'use strict';

/**
 * The icon set, in two drawings per icon.
 *
 * `desk` is the fine line drawing used from tablet width up, where there is
 * room for detail and the strokes sit beside long spec values. `mob` is a
 * different, heavier drawing for phones: fewer strokes, filled masses and a
 * simpler idea of the same thing, because a 1.4px hairline disappears on a
 * small screen held at arm's length on a site. Both ship in the markup and
 * CSS shows one of them, so there is no layout shift and no second request.
 *
 * Only the inner geometry is stored. Two renderings are built from it:
 *
 *   icon(name)     a pair of standalone <svg> elements, for one-off use
 *   iconRef(name)  a pair of <use> references into the page's sprite
 *
 * A listing page carries over a hundred machine cards with four icons each;
 * inlining the geometry every time costs several hundred kilobytes, so the
 * cards use references and the page carries one copy in sprite().
 *
 * Shared with the browser: scripts/build-pages.js writes this set out to
 * public/js/icons.js so cards rendered client-side use the same drawings.
 */

const ICONS = {
  /* ---- machine spec icons ---- */
  emissions: {
    desk: '<path d="M7 17.5h9a3.5 3.5 0 0 0 .5-7 5.2 5.2 0 0 0-9.9-1.1A3.7 3.7 0 0 0 7 17.5Z"/><path d="M8 20.5h3M14 20.5h2.5"/>',
    mob: '<path fill="currentColor" stroke="none" d="M7.2 18h9.3a3.6 3.6 0 0 0 .3-7.2 5.4 5.4 0 0 0-10.3-1A3.9 3.9 0 0 0 7.2 18Z"/>',
  },
  bucket: {
    desk: '<path d="M4.5 6h15l-2.3 9.6a3 3 0 0 1-2.9 2.3H9.7a3 3 0 0 1-2.9-2.3L4.5 6Z"/><path d="M8.4 18v2.2M12 18.2v2.3M15.6 18v2.2"/>',
    mob: '<path fill="currentColor" stroke="none" d="M4 6.4h16l-2.2 8.4a3.4 3.4 0 0 1-3.3 2.5H9.5a3.4 3.4 0 0 1-3.3-2.5L4 6.4Z"/><path d="M9 18.6v2.2M12 18.8v2.2M15 18.6v2.2"/>',
  },
  weight: {
    desk: '<path d="M8.4 8.2a3.6 3.6 0 0 1 7.2 0"/><path d="M6.2 8.2h11.6L19.4 20H4.6L6.2 8.2Z"/>',
    mob: '<path d="M9 8.4a3 3 0 0 1 6 0"/><path fill="currentColor" stroke="none" d="M5.6 8.8h12.8L20 20.4H4L5.6 8.8Z"/>',
  },
  payload: {
    desk: '<path d="M12 3v9.5"/><path d="M8.3 9.2 12 12.9l3.7-3.7"/><path d="M4 14.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5"/>',
    mob: '<path d="M12 3.4v8"/><path d="M8.4 8.2 12 11.8l3.6-3.6"/><path fill="currentColor" stroke="none" d="M3.4 15h17.2v5.4H3.4z"/>',
  },
  power: {
    desk: '<path d="M13.2 2.8 5.6 13.4h5.6l-.8 7.8 8.2-10.8h-5.5l.1-7.6Z"/>',
    mob: '<path fill="currentColor" stroke="none" d="M13.6 2.2 5 14.2h5.7l-.9 7.6 8.9-11.6h-5.4l.3-8Z"/>',
  },
  reach: {
    desk: '<path d="M4.5 19.5 19.5 4.5"/><path d="M4.5 13.6v5.9h5.9"/><path d="M19.5 10.4V4.5h-5.9"/>',
    mob: '<path d="M12 3v18"/><path d="M7.6 7.4 12 3l4.4 4.4"/><path d="M7.6 16.6 12 21l4.4-4.4"/>',
  },
  hours: {
    desk: '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.2V12l3.2 2.1"/>',
    mob: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.6V12l3 1.9"/>',
  },
  /* ---- machine classes ---- */
  machine: {
    desk: '<path d="M3 17h13.5"/><circle cx="6.5" cy="17" r="2.6"/><circle cx="16.5" cy="17" r="2.6"/><path d="M4 14.2V9.6h5.2l2.4 4.6"/><path d="M11.6 9.6h4.8l3.6 4.6H21"/>',
    mob: '<circle cx="6.6" cy="16.8" r="3"/><circle cx="17" cy="16.8" r="3"/><path fill="currentColor" stroke="none" d="M3.4 8.8h6.2l2.8 5.2H3.4z"/><path fill="currentColor" stroke="none" d="M12.6 9.4h4.8l3.4 4.6h-8.2z"/>',
  },
  tractor: {
    desk: '<circle cx="7" cy="16.4" r="4.2"/><circle cx="18" cy="17.6" r="2.9"/><path d="M4.6 11.2V6.4h4.8l2 4.8"/><path d="M11.4 11.2h4.4v4"/><path d="M16 8.4h3.4"/>',
    mob: '<circle cx="7" cy="16.4" r="4.4"/><circle cx="18.2" cy="17.6" r="3.1"/><path fill="currentColor" stroke="none" d="M4.2 5.8h5.6l2.4 5.8H4.2z"/><path fill="currentColor" stroke="none" d="M12.6 9.8h4.2v4.6h-4.2z"/>',
  },
  drill: {
    desk: '<path d="M12 2.6v10.2"/><path d="M8.6 5.4h6.8M8.6 9h6.8"/><path d="m12 21.4-3-4.2h6l-3 4.2Z"/><path d="M4.4 20.8h15.2"/>',
    mob: '<path d="M12 2.6v9.8"/><path d="M8.2 5.2h7.6M8.2 9.2h7.6"/><path fill="currentColor" stroke="none" d="m12 21.8-3.4-4.8h6.8L12 21.8Z"/>',
  },
  lift: {
    desk: '<path d="M4.6 20.4h14.8"/><path d="M7.6 20.4V6.6h4.2"/><path d="m7.6 13.4 8.6-6.8"/><path d="M14.4 3.4h5.2v4.2h-5.2z"/>',
    mob: '<path d="M4.4 20.8h15.2"/><path fill="currentColor" stroke="none" d="M6.6 6h4v14.2h-4z"/><path fill="currentColor" stroke="none" d="M13.8 3h6.2v4.6h-6.2z"/>',
  },
  forklift: {
    desk: '<circle cx="7" cy="18" r="2.4"/><circle cx="14.4" cy="18" r="2.4"/><path d="M4.4 15.6V9.4h6.2l2.2 4.4h3.6"/><path d="M18.4 18.4V4.6"/><path d="M18.4 6.2h2.8"/>',
    mob: '<circle cx="7" cy="18.2" r="2.6"/><circle cx="14.6" cy="18.2" r="2.6"/><path fill="currentColor" stroke="none" d="M4 8.8h6.8l2.4 5H4z"/><path d="M18.6 18.6V4.4h2.8"/>',
  },
  crane: {
    desk: '<path d="M4.6 20.6h14.8"/><path d="M10.4 20.6V4.4h9"/><path d="M10.4 8.2 19 4.4"/><path d="M16.4 5.6v4.8"/><path d="M14.6 10.4h3.6v3.2h-3.6z"/>',
    mob: '<path d="M4.4 20.8h15.2"/><path fill="currentColor" stroke="none" d="M9.2 4h3.4v16.4H9.2z"/><path d="M11.4 4.2h8.2"/><path fill="currentColor" stroke="none" d="M14.6 9.8h3.8v3.6h-3.8z"/>',
  },
  crusher: {
    desk: '<path d="M3.4 6.4h17.2l-3 5.4H6.4L3.4 6.4Z"/><path d="M7.4 11.8 5.6 20.6"/><path d="M16.6 11.8l1.8 8.8"/><path d="M9 16.4h6"/>',
    mob: '<path fill="currentColor" stroke="none" d="M3 6h18l-3.2 6H6.2L3 6Z"/><path d="M7.2 12.4 5.4 20.8M16.8 12.4l1.8 8.4M9 16.8h6"/>',
  },
  /* ---- departments ---- */
  parts: {
    desk: '<circle cx="12" cy="12" r="3.1"/><path d="M12 2.8v2.6M12 18.6v2.6M4.5 12H2m20 0h-2.5M6.4 6.4 4.6 4.6m14.8 14.8-1.8-1.8M6.4 17.6l-1.8 1.8M19.4 4.6l-1.8 1.8"/>',
    mob: '<circle cx="12" cy="12" r="3.6"/><path d="M12 2.6v3M12 18.4v3M2.6 12h3M18.4 12h3"/>',
  },
  service: {
    desk: '<path d="M15.2 4.4a4.6 4.6 0 0 0 5.6 6.4L12 19.6a2.7 2.7 0 0 1-3.8-3.8l9-8.8"/><path d="M4.4 15.2 9 10.6"/>',
    mob: '<path fill="currentColor" stroke="none" d="M14.6 3.4a5.2 5.2 0 0 0 6.4 6.8l-8.8 8.6a3.2 3.2 0 1 1-4.5-4.5l6.9-10.9Z"/>',
  },
  rental: {
    desk: '<path d="M3.5 7.5h10v9h-10z"/><path d="M13.5 10.5h3.8l3.2 3.4v2.6h-7z"/><circle cx="7" cy="18.5" r="1.8"/><circle cx="17" cy="18.5" r="1.8"/>',
    mob: '<path fill="currentColor" stroke="none" d="M3 7h10.4v9.4H3z"/><path fill="currentColor" stroke="none" d="M14.6 10.4h3.2l3.2 3.6v2.4h-6.4z"/><circle cx="7" cy="18.8" r="2"/><circle cx="17.4" cy="18.8" r="2"/>',
  },
  finance: {
    desk: '<path d="M3.4 6.6h17.2v10.8H3.4z"/><circle cx="12" cy="12" r="2.8"/><path d="M6.6 12h.1M17.3 12h.1"/>',
    mob: '<path fill="currentColor" stroke="none" d="M2.8 6h18.4v5.2H2.8z"/><path d="M2.8 13.4h18.4v4.6H2.8z"/>',
  },
  training: {
    desk: '<path d="M12 4 2.8 8.4 12 12.8l9.2-4.4L12 4Z"/><path d="M6.4 10.8v4.6c0 1.6 2.5 2.9 5.6 2.9s5.6-1.3 5.6-2.9v-4.6"/>',
    mob: '<path fill="currentColor" stroke="none" d="M12 3.4 2.4 8.2 12 13l9.6-4.8L12 3.4Z"/><path d="M6.6 11.4v4.2c0 1.5 2.4 2.7 5.4 2.7s5.4-1.2 5.4-2.7v-4.2"/>',
  },
  transport: {
    desk: '<path d="M2.6 16.6h18.8"/><path d="M5.2 16.6V13h9.4v3.6"/><path d="M14.6 13h2.8l2.6 3.6"/><circle cx="7.4" cy="18.6" r="1.6"/><circle cx="16.8" cy="18.6" r="1.6"/>',
    mob: '<path fill="currentColor" stroke="none" d="M3 11.6h11.6v5.2H3z"/><path fill="currentColor" stroke="none" d="M15.6 13h2.8l2.6 3.8h-5.4z"/><circle cx="7.4" cy="19" r="1.9"/><circle cx="17" cy="19" r="1.9"/>',
  },
  shield: {
    desk: '<path d="M12 2.8 4.6 6v6c0 4.4 3.1 7.6 7.4 9.2 4.3-1.6 7.4-4.8 7.4-9.2V6L12 2.8Z"/><path d="m8.8 12 2.3 2.4 4.1-4.6"/>',
    mob: '<path fill="currentColor" stroke="none" d="M12 2.4 4.2 5.8v6.4c0 4.6 3.3 8 7.8 9.6 4.5-1.6 7.8-5 7.8-9.6V5.8L12 2.4Z"/>',
  },
  /* ---- interface ---- */
  clock: {
    desk: '<circle cx="12" cy="12" r="8.4"/><path d="M12 6.8V12l3.4 2.2"/>',
    mob: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3 2"/>',
  },
  mail: {
    desk: '<path d="M3 6.4h18v11.2H3z"/><path d="m3.6 7 8.4 6 8.4-6"/>',
    mob: '<path d="M2.8 6.2h18.4v11.6H2.8z"/><path fill="currentColor" stroke="none" d="M4.2 7.4h15.6L12 12.9 4.2 7.4Z"/>',
  },
  phone: {
    desk: '<path d="M7.4 3.4H4.8A1.8 1.8 0 0 0 3 5.4c0 8.4 7.2 15.6 15.6 15.6a1.8 1.8 0 0 0 1.8-1.8v-2.6l-4.4-1.6-2.2 2.2a13.6 13.6 0 0 1-5.8-5.8L10.2 9 7.4 3.4Z"/>',
    mob: '<path fill="currentColor" stroke="none" d="M7 3H4.6A1.9 1.9 0 0 0 2.7 5c0 8.7 7.4 16.1 16.1 16.1a1.9 1.9 0 0 0 1.9-1.9v-2.8l-4.6-1.6-2.2 2.3a14 14 0 0 1-6-6l2.3-2.2L7 3Z"/>',
  },
  pin: {
    desk: '<path d="M12 21.2c4-4.4 6.2-7.6 6.2-10.6A6.2 6.2 0 0 0 5.8 10.6c0 3 2.2 6.2 6.2 10.6Z"/><circle cx="12" cy="10.4" r="2.4"/>',
    mob: '<path fill="currentColor" stroke="none" d="M12 21.6c4.2-4.6 6.4-8 6.4-11A6.4 6.4 0 0 0 5.6 10.6c0 3 2.2 6.4 6.4 11Z"/>',
  },
  check: {
    desk: '<path d="m4.6 12.6 4.8 4.8L19.4 7.2"/>',
    mob: '<path d="m4.4 12.8 5 5L19.6 6.8"/>',
  },
  arrow: {
    desk: '<path d="M4.5 12h14"/><path d="m12.8 5.6 6.4 6.4-6.4 6.4"/>',
    mob: '<path d="M4.8 12h13.4"/><path d="m12.6 6.2 5.8 5.8-5.8 5.8"/>',
  },
  trend: {
    desk: '<path d="M3.6 16.6 9 11.2l3.4 3.4 7-7"/><path d="M15.4 7.6h4v4"/>',
    mob: '<path d="M3.6 16.6 9 11.2l3.4 3.4 7-7"/><path d="M15.4 7.6h4v4"/>',
  },
};

/* The two renderings share these attributes; the desk drawing is drawn thin
   and the mob drawing heavy, which is the whole point of having two. */
const COMMON = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
const DESK_ATTRS = `${COMMON} stroke-width="1.5"`;
const MOB_ATTRS = `${COMMON} stroke-width="2.6"`;

/** Standalone pair. Use where an icon appears once or twice on a page. */
function icon(name) {
  const set = ICONS[name] || ICONS.machine;
  return (
    `<svg class="ico ico-desk" width="22" height="22" ${DESK_ATTRS} aria-hidden="true">${set.desk}</svg>` +
    `<svg class="ico ico-mob" width="20" height="20" ${MOB_ATTRS} aria-hidden="true">${set.mob}</svg>`
  );
}

/** Referencing pair. Needs sprite() somewhere on the same page. */
function iconRef(name) {
  const key = ICONS[name] ? name : 'machine';
  return (
    `<svg class="ico ico-desk" width="22" height="22" aria-hidden="true"><use href="#i-${key}-d"/></svg>` +
    `<svg class="ico ico-mob" width="20" height="20" aria-hidden="true"><use href="#i-${key}-m"/></svg>`
  );
}

/** Every drawing once, as symbols, for the references above to point at. */
function sprite() {
  const symbols = Object.entries(ICONS)
    .map(([name, set]) =>
      `<symbol id="i-${name}-d" ${DESK_ATTRS}>${set.desk}</symbol>` +
      `<symbol id="i-${name}-m" ${MOB_ATTRS}>${set.mob}</symbol>`
    )
    .join('');
  return `<svg class="icon-sprite" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">${symbols}</svg>`;
}

module.exports = { ICONS, icon, iconRef, sprite, DESK_ATTRS, MOB_ATTRS };

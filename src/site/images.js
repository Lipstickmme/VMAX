'use strict';

/**
 * Resolves image slots to real files.
 *
 * No artwork ships with this site on purpose. Every slot names the file it
 * wants (vmax1, vmaxhero1, vmaxlogo and so on) and resolves to null until
 * that file is dropped into public/assets/img or public/assets/brand, at
 * which point the next build picks it up with no code change. A slot that
 * resolves to null is drawn as a labelled placeholder carrying the file name
 * it is waiting for, so an outstanding upload reads as outstanding rather
 * than as a broken page.
 */

const fs = require('fs');
const path = require('path');

const data = require('../data/images.json');

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');
// Preference order, best format first. WebP wins, so a converted copy is used
// in place of a heavy original without anyone having to delete the original.
const EXTENSIONS = ['.webp', '.avif', '.jpg', '.jpeg', '.png', '.svg'];
const DIRS = ['/assets/img/', '/assets/brand/'];

/**
 * Every candidate file, indexed by lower-cased name.
 *
 * Case-insensitive on purpose: an upload named VMAX3.JPG has to be found on
 * Linux, where the deploy runs, not only on the machine it was named on.
 */
function buildIndex() {
  const index = new Map();
  DIRS.forEach((dir) => {
    let entries = [];
    try {
      entries = fs.readdirSync(path.join(PUBLIC_DIR, dir));
    } catch (err) {
      return;
    }
    entries.forEach((file) => {
      const key = `${dir}${file.toLowerCase()}`;
      if (!index.has(key)) index.set(key, `${dir}${file}`);
    });
  });
  return index;
}

let index = buildIndex();

/** Re-read the folders. Only needed by tests and long-running dev servers. */
function refresh() {
  index = buildIndex();
  return index.size;
}

/** The first file that actually exists for any of these base names, or null. */
function lookUp(names) {
  for (const name of names || []) {
    for (const dir of DIRS) {
      for (const ext of EXTENSIONS) {
        const hit = index.get(`${dir}${name}${ext}`.toLowerCase());
        if (hit) return hit;
      }
    }
  }
  return null;
}

/**
 * One slot.
 *
 * `name` is the file the site is asking for and is what a placeholder shows,
 * so it stays useful whether or not the file is there yet.
 */
function resolve(spec, key) {
  const prefer = spec.prefer || [];
  return {
    slot: key || '',
    name: prefer[0] || '',
    label: spec.label || '',
    src: lookUp(prefer),
  };
}

/** Resolve a bare file name, for images named in the content JSON. */
function resolveName(name, label) {
  return { slot: '', name: name || '', label: label || '', src: lookUp([name]) };
}

const images = {};
Object.entries(data.slots).forEach(([slot, spec]) => {
  images[slot] = resolve(spec, slot);
});
images.heroSlides = data.heroSlides.map((spec, i) => resolve(spec, `heroSlide${i + 1}`));

/** Build-log material: what was found, and what the site is still waiting on. */
function report() {
  // Read the manifest rather than the module's own keys: helpers are attached
  // to the same object below, and they are not image slots.
  const all = [...Object.keys(data.slots).map((k) => images[k]), ...images.heroSlides];
  const seen = new Set();
  const found = [];
  const missing = [];
  all.forEach((img) => {
    if (!img || !img.name || seen.has(img.name)) return;
    seen.add(img.name);
    (img.src ? found : missing).push(img.src || img.name);
  });
  return { found, missing };
}

module.exports = Object.assign(images, { resolve, resolveName, lookUp, refresh, report });

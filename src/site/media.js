'use strict';

/**
 * Draws an image slot.
 *
 * The site ships without photography, so every slot has two states and both
 * are real designs: the photograph once it is there, and a plate carrying the
 * file name the site is waiting for until it is. The plate is not an error
 * state. It is hazard-striped, it names the file, and it keeps the exact box
 * the photograph will occupy, so the page holds its shape now and swaps in
 * the picture later without a reflow.
 *
 * Shared with the browser: scripts/build-pages.js writes the same two
 * functions out to public/js/media.js for machine cards rendered client-side.
 */

const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

/**
 * @param {{src:string|null,name:string,label:string}} img slot from images.js
 * @param {{alt?:string, className?:string, eager?:boolean, ratio?:string}} opts
 */
function media(img, opts = {}) {
  const { alt = '', className = '', eager = false, ratio = '' } = opts;
  const cls = ['media', className].filter(Boolean).join(' ');
  const style = ratio ? ` style="--media-ratio:${esc(ratio)}"` : '';
  if (img && img.src) {
    return `<div class="${cls}"${style}><img src="${esc(img.src)}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" /></div>`;
  }
  const name = (img && img.name) || 'image';
  const label = (img && img.label) || alt || 'Photograph';
  return `<div class="${cls} is-empty"${style} role="img" aria-label="${esc(label)} photograph not uploaded yet: ${esc(name)}">
        <span class="media-plate">
          <span class="media-file">${esc(name)}</span>
          <span class="media-hint">${esc(label)}</span>
        </span>
      </div>`;
}

/** The same thing as a CSS background, for the few places that need one. */
function backgroundStyle(img) {
  return img && img.src ? `background-image:url('${esc(img.src)}')` : '';
}

module.exports = { media, backgroundStyle, esc };

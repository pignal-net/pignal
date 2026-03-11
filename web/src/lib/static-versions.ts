/**
 * Content-hash based cache-busting for static assets.
 *
 * Computes a short FNV-1a hash of each imported asset at module load time
 * and appends it as a `?v=` query param. This ensures browsers fetch the
 * new version after deploys while keeping `immutable` cache headers.
 */

import picoCSS from '../static/pico.min.css';
import htmxJS from '../static/htmx.min.js';
import appCSS from '../static/app.css';
import appJS from '../static/app.js';
import logoSVG from '../static/logo.svg';

function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

export const PICO_CSS_URL = `/static/pico.min.css?v=${fnv1a(picoCSS)}`;
export const HTMX_JS_URL = `/static/htmx.min.js?v=${fnv1a(htmxJS)}`;
export const APP_CSS_URL = `/static/app.css?v=${fnv1a(appCSS)}`;
export const APP_JS_URL = `/static/app.js?v=${fnv1a(appJS)}`;
export const LOGO_SVG_URL = `/static/logo.svg?v=${fnv1a(logoSVG)}`;
export { logoSVG };

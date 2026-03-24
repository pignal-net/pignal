import type { SettingsMap } from '@pignal/db';

/* ----------------------------------------------------------------
   Theme engine — single source of truth for source color customization.
   Pure functions, no side effects.

   One accent/brand color drives all theme overrides. Secondary, hover,
   and focus colors are derived automatically for both light and dark
   modes — guaranteeing proper contrast.
   ---------------------------------------------------------------- */

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/** Validate a 6-digit hex color string (e.g. `#7C3AED`). */
export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(value);
}

/* ----------------------------------------------------------------
   CSS builder
   ---------------------------------------------------------------- */

/**
 * Build minified CSS from a single accent color (`source_color_accent`).
 * Only overrides `--tw-primary*` and `--tw-secondary*` — background,
 * text, muted, surface, and border stay as the system defaults.
 *
 * Returns an empty string when no accent color is configured.
 */
export function buildThemeCss(settings: SettingsMap): string {
  const accent = settings.source_color_accent;
  if (!accent || !isValidHexColor(accent)) return '';

  const light = [
    `--tw-primary:${accent}`,
    `--tw-primary-bg:${accent}`,
    `--tw-primary-hover:color-mix(in srgb,${accent} 80%,black)`,
    `--tw-primary-focus:color-mix(in srgb,${accent} 25%,transparent)`,
    `--tw-secondary:color-mix(in srgb,${accent} 40%,#596B7C)`,
    `--tw-secondary-hover:color-mix(in srgb,${accent} 35%,#4a5a6a)`,
  ].join(';');

  const dark = [
    `--tw-primary:color-mix(in srgb,${accent} 85%,white)`,
    `--tw-primary-bg:${accent}`,
    `--tw-primary-hover:color-mix(in srgb,${accent} 90%,white)`,
    `--tw-primary-focus:color-mix(in srgb,${accent} 25%,transparent)`,
    `--tw-secondary:color-mix(in srgb,${accent} 40%,#8b949e)`,
    `--tw-secondary-hover:color-mix(in srgb,${accent} 45%,#a0aab4)`,
  ].join(';');

  return [
    `:root:not([data-theme="dark"]),[data-theme="light"]{${light}}`,
    `[data-theme="dark"]{${dark}}`,
    `@media(prefers-color-scheme:dark){:root:not([data-theme]){${dark}}}`,
  ].join('');
}

/**
 * Build a `<style>` tag with theme CSS, or an empty string if no
 * accent color is configured.
 */
export function buildThemeStyleTag(settings: SettingsMap): string {
  const css = buildThemeCss(settings);
  return css ? `<style>${css}</style>` : '';
}

/* ----------------------------------------------------------------
   Font system
   ---------------------------------------------------------------- */

export interface FontOption {
  label: string;
  family: string;
  googleId: string;
  weights: string;
  category: 'sans-serif' | 'serif' | 'monospace';
}

export const FONT_OPTIONS: Record<string, FontOption> = {
  inter:            { label: 'Inter',            family: '"Inter"',            googleId: 'Inter',            weights: '400;500;600;700', category: 'sans-serif' },
  'source-sans':    { label: 'Source Sans 3',    family: '"Source Sans 3"',    googleId: 'Source+Sans+3',    weights: '400;500;600;700', category: 'sans-serif' },
  'dm-sans':        { label: 'DM Sans',          family: '"DM Sans"',          googleId: 'DM+Sans',          weights: '400;500;600;700', category: 'sans-serif' },
  'open-sans':      { label: 'Open Sans',        family: '"Open Sans"',        googleId: 'Open+Sans',        weights: '400;500;600;700', category: 'sans-serif' },
  lora:             { label: 'Lora',             family: '"Lora"',             googleId: 'Lora',             weights: '400;500;600;700', category: 'serif' },
  merriweather:     { label: 'Merriweather',     family: '"Merriweather"',     googleId: 'Merriweather',     weights: '400;700',         category: 'serif' },
  'source-serif':   { label: 'Source Serif 4',   family: '"Source Serif 4"',   googleId: 'Source+Serif+4',   weights: '400;500;600;700', category: 'serif' },
  playfair:         { label: 'Playfair Display', family: '"Playfair Display"', googleId: 'Playfair+Display', weights: '400;500;600;700', category: 'serif' },
  'jetbrains-mono': { label: 'JetBrains Mono',   family: '"JetBrains Mono"',   googleId: 'JetBrains+Mono',   weights: '400;500;600;700', category: 'monospace' },
  'fira-code':      { label: 'Fira Code',        family: '"Fira Code"',        googleId: 'Fira+Code',        weights: '400;500;600;700', category: 'monospace' },
};

/**
 * Build Google Fonts link tags and CSS variable overrides for custom fonts.
 * Returns an empty string when no fonts are selected.
 */
export function buildFontTags(settings: SettingsMap): string {
  const headingFont = settings.source_font_heading;
  const bodyFont = settings.source_font_body;

  const families: string[] = [];
  if (headingFont && FONT_OPTIONS[headingFont]) {
    const f = FONT_OPTIONS[headingFont];
    families.push(`family=${f.googleId}:wght@${f.weights}`);
  }
  if (bodyFont && FONT_OPTIONS[bodyFont] && bodyFont !== headingFont) {
    const f = FONT_OPTIONS[bodyFont];
    families.push(`family=${f.googleId}:wght@${f.weights}`);
  }

  if (families.length === 0) return '';

  const linkTag = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?${families.join('&')}&display=swap" rel="stylesheet">`;

  const vars: string[] = [];
  if (headingFont && FONT_OPTIONS[headingFont]) {
    const f = FONT_OPTIONS[headingFont];
    vars.push(`--tw-font-heading:${f.family},${f.category}`);
  }
  if (bodyFont && FONT_OPTIONS[bodyFont]) {
    const f = FONT_OPTIONS[bodyFont];
    vars.push(`--tw-font-body:${f.family},${f.category}`);
  }

  const styleTag = vars.length > 0 ? `<style>:root{${vars.join(';')}}</style>` : '';

  return linkTag + styleTag;
}

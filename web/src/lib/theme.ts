import type { SettingsMap } from '@pignal/db';

/* ----------------------------------------------------------------
   Theme engine — single source of truth for source color customization.
   Pure functions, no side effects.
   ---------------------------------------------------------------- */

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/** Validate a 6-digit hex color string (e.g. `#7C3AED`). */
export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(value);
}

/* ----------------------------------------------------------------
   Token definitions
   ---------------------------------------------------------------- */

export interface ThemeColorToken {
  settingsKey: string;
  label: string;
  description: string;
  placeholder: string;
  /** Generate CSS variable declarations for light mode. */
  lightVars: (hex: string) => string;
  /** Generate CSS variable declarations for dark mode. */
  darkVars: (hex: string) => string;
}

export const THEME_TOKENS: ThemeColorToken[] = [
  {
    settingsKey: 'source_color_primary',
    label: 'Primary Color',
    description: 'Main accent color for links, buttons, and interactive elements. Leave empty for default blue.',
    placeholder: '#1095C1',
    lightVars: (c) => [
      `--pico-primary:${c}`,
      `--pico-primary-background:${c}`,
      `--pico-primary-border:${c}`,
      `--pico-primary-underline:color-mix(in srgb,${c} 50%,transparent)`,
      `--pico-primary-hover:color-mix(in srgb,${c} 80%,black)`,
      `--pico-primary-hover-background:color-mix(in srgb,${c} 80%,black)`,
      `--pico-primary-hover-border:color-mix(in srgb,${c} 80%,black)`,
      `--pico-primary-hover-underline:color-mix(in srgb,${c} 80%,black)`,
      `--pico-primary-focus:color-mix(in srgb,${c} 25%,transparent)`,
      `--pico-primary-inverse:#fff`,
    ].join(';'),
    darkVars: (c) => [
      `--pico-primary:color-mix(in srgb,${c} 85%,white)`,
      `--pico-primary-background:${c}`,
      `--pico-primary-border:${c}`,
      `--pico-primary-underline:color-mix(in srgb,${c} 50%,transparent)`,
      `--pico-primary-hover:color-mix(in srgb,${c} 90%,white)`,
      `--pico-primary-hover-background:color-mix(in srgb,${c} 90%,white)`,
      `--pico-primary-hover-border:color-mix(in srgb,${c} 90%,white)`,
      `--pico-primary-hover-underline:color-mix(in srgb,${c} 90%,white)`,
      `--pico-primary-focus:color-mix(in srgb,${c} 25%,transparent)`,
      `--pico-primary-inverse:#fff`,
    ].join(';'),
  },
  {
    settingsKey: 'source_color_secondary',
    label: 'Secondary Color',
    description: 'Used for secondary buttons and accents. Leave empty for default gray.',
    placeholder: '#596B7C',
    lightVars: (c) => [
      `--pico-secondary:${c}`,
      `--pico-secondary-background:${c}`,
      `--pico-secondary-border:${c}`,
      `--pico-secondary-underline:color-mix(in srgb,${c} 50%,transparent)`,
      `--pico-secondary-hover:color-mix(in srgb,${c} 80%,black)`,
      `--pico-secondary-hover-background:color-mix(in srgb,${c} 80%,black)`,
      `--pico-secondary-hover-border:color-mix(in srgb,${c} 80%,black)`,
      `--pico-secondary-hover-underline:color-mix(in srgb,${c} 80%,black)`,
      `--pico-secondary-focus:color-mix(in srgb,${c} 25%,transparent)`,
      `--pico-secondary-inverse:#fff`,
    ].join(';'),
    darkVars: (c) => [
      `--pico-secondary:color-mix(in srgb,${c} 85%,white)`,
      `--pico-secondary-background:${c}`,
      `--pico-secondary-border:${c}`,
      `--pico-secondary-underline:color-mix(in srgb,${c} 50%,transparent)`,
      `--pico-secondary-hover:color-mix(in srgb,${c} 90%,white)`,
      `--pico-secondary-hover-background:color-mix(in srgb,${c} 90%,white)`,
      `--pico-secondary-hover-border:color-mix(in srgb,${c} 90%,white)`,
      `--pico-secondary-hover-underline:color-mix(in srgb,${c} 90%,white)`,
      `--pico-secondary-focus:color-mix(in srgb,${c} 25%,transparent)`,
      `--pico-secondary-inverse:#fff`,
    ].join(';'),
  },
  {
    settingsKey: 'source_color_background',
    label: 'Page Background',
    description: 'Page background color. Leave empty for default.',
    placeholder: '#FFFFFF',
    lightVars: (c) => `--pico-background-color:${c}`,
    darkVars: (c) => `--pico-background-color:color-mix(in srgb,${c} 15%,#11191f)`,
  },
  {
    settingsKey: 'source_color_text',
    label: 'Text Color',
    description: 'Main body text color. Leave empty for default.',
    placeholder: '#373C44',
    lightVars: (c) => `--pico-color:${c}`,
    darkVars: (c) => `--pico-color:color-mix(in srgb,${c} 20%,#e5e7eb)`,
  },
  {
    settingsKey: 'source_color_muted',
    label: 'Muted Text Color',
    description: 'Secondary text, captions, and subtle borders. Leave empty for default.',
    placeholder: '#646B79',
    lightVars: (c) => `--pico-muted-color:${c};--pico-muted-border-color:color-mix(in srgb,${c} 30%,transparent)`,
    darkVars: (c) => `--pico-muted-color:color-mix(in srgb,${c} 70%,#9ca3af);--pico-muted-border-color:color-mix(in srgb,${c} 25%,transparent)`,
  },
];

/** All theme setting keys, derived from token definitions. */
export const THEME_SETTING_KEYS: string[] = THEME_TOKENS.map((t) => t.settingsKey);

/* ----------------------------------------------------------------
   CSS builder
   ---------------------------------------------------------------- */

/**
 * Build minified CSS from settings. Returns an empty string when no
 * theme colors are configured (= use Pico defaults).
 */
export function buildThemeCss(settings: SettingsMap): string {
  const lightParts: string[] = [];
  const darkParts: string[] = [];

  for (const token of THEME_TOKENS) {
    const hex = settings[token.settingsKey];
    if (!hex || !isValidHexColor(hex)) continue;

    lightParts.push(token.lightVars(hex));
    darkParts.push(token.darkVars(hex));
  }

  if (lightParts.length === 0) return '';

  const light = lightParts.join(';');
  const dark = darkParts.join(';');

  return [
    `:root:not([data-theme="dark"]),[data-theme="light"]{${light}}`,
    `[data-theme="dark"]{${dark}}`,
    `@media(prefers-color-scheme:dark){:root:not([data-theme]){${dark}}}`,
  ].join('');
}

/**
 * Build a `<style>` tag with theme CSS, or an empty string if no
 * theme colors are configured.
 */
export function buildThemeStyleTag(settings: SettingsMap): string {
  const css = buildThemeCss(settings);
  return css ? `<style>${css}</style>` : '';
}

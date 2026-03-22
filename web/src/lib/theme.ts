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
      `--tw-primary:${c}`,
      `--tw-primary-bg:${c}`,
      `--tw-primary-hover:color-mix(in srgb,${c} 80%,black)`,
      `--tw-primary-focus:color-mix(in srgb,${c} 25%,transparent)`,
    ].join(';'),
    darkVars: (c) => [
      `--tw-primary:color-mix(in srgb,${c} 85%,white)`,
      `--tw-primary-bg:${c}`,
      `--tw-primary-hover:color-mix(in srgb,${c} 90%,white)`,
      `--tw-primary-focus:color-mix(in srgb,${c} 25%,transparent)`,
    ].join(';'),
  },
  {
    settingsKey: 'source_color_secondary',
    label: 'Secondary Color',
    description: 'Used for secondary buttons and accents. Leave empty for default gray.',
    placeholder: '#596B7C',
    lightVars: (c) => [
      `--tw-secondary:${c}`,
      `--tw-secondary-hover:color-mix(in srgb,${c} 80%,black)`,
    ].join(';'),
    darkVars: (c) => [
      `--tw-secondary:color-mix(in srgb,${c} 85%,white)`,
      `--tw-secondary-hover:color-mix(in srgb,${c} 90%,white)`,
    ].join(';'),
  },
  {
    settingsKey: 'source_color_background',
    label: 'Page Background',
    description: 'Page background color. Leave empty for default.',
    placeholder: '#FFFFFF',
    lightVars: (c) => `--tw-bg:${c};--tw-bg-page:${c}`,
    darkVars: (c) => `--tw-bg:color-mix(in srgb,${c} 15%,#0d1117);--tw-bg-page:color-mix(in srgb,${c} 10%,#010409)`,
  },
  {
    settingsKey: 'source_color_text',
    label: 'Text Color',
    description: 'Main body text color. Leave empty for default.',
    placeholder: '#373C44',
    lightVars: (c) => `--tw-text:${c}`,
    darkVars: (c) => `--tw-text:color-mix(in srgb,${c} 20%,#e6edf3)`,
  },
  {
    settingsKey: 'source_color_muted',
    label: 'Muted Text Color',
    description: 'Secondary text, captions, and subtle borders. Leave empty for default.',
    placeholder: '#646B79',
    lightVars: (c) => `--tw-muted:${c};--tw-border:color-mix(in srgb,${c} 30%,transparent)`,
    darkVars: (c) => `--tw-muted:color-mix(in srgb,${c} 70%,#8b949e);--tw-border:color-mix(in srgb,${c} 25%,transparent)`,
  },
];

/** All theme setting keys, derived from token definitions. */
export const THEME_SETTING_KEYS: string[] = THEME_TOKENS.map((t) => t.settingsKey);

/* ----------------------------------------------------------------
   CSS builder
   ---------------------------------------------------------------- */

/**
 * Build minified CSS from settings. Returns an empty string when no
 * theme colors are configured (= use defaults).
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

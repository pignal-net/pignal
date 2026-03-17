import type { Context } from 'hono';
import type { Child } from 'hono/jsx';
import type { SignalStoreRpc } from '@pignal/db';
import type { WebEnv } from '../types';
import { AppLayout } from '../components/app-layout';
import { getCsrfToken } from '../middleware/csrf';
import { isHtmxRequest, toastTrigger } from '../lib/htmx';
import { THEME_TOKENS, THEME_SETTING_KEYS, isValidHexColor } from '../lib/theme';
import { raw } from 'hono/html';

type WebVars = { store: SignalStoreRpc };

/* --- Default values (from seed migration) --- */

const DEFAULTS: Record<string, string> = {
  owner_name: 'Pignal',
  source_title: 'My Signals',
  source_description: 'Insights captured from AI conversations',
  source_posts_per_page: '20',
  source_show_toc: 'true',
  source_show_reading_time: 'true',
  source_card_style: 'list',
  source_code_theme: 'default',
  source_logo_text: '',
  source_social_github: '',
  source_social_twitter: '',
  source_custom_footer: '',
  source_custom_css: '',
  source_custom_head: '',
  source_color_primary: '',
  source_color_secondary: '',
  source_color_background: '',
  source_color_text: '',
  source_color_muted: '',
  quality_guidelines: '{"keySummary":{"tips":"Use first-person I/My framing for better recall. Follow the type-specific pattern from guidance."},"content":{"tips":"Write for your future self reviewing this days later. ALWAYS restructure raw data into proper markdown."},"formatting":["Tables: structured/comparative data","Bullet lists: grouped items, options, non-sequential points","Numbered lists: sequential steps, ranked items, procedures","Headings: separate distinct sections within longer content","Code blocks: commands, snippets, config, error messages","Paragraphs: reasoning, context, narrative explanation"],"avoid":["Bold-only pseudo-structure","Flat text walls without hierarchy","Raw copy-paste without restructuring","Repeating the keySummary in the content"]}',
  validation_limits: '{"keySummary":{"min":20,"max":140},"content":{"min":1,"max":10000},"sourceAi":{"min":1,"max":100}}',
  max_actions_per_type: '3',
};

/* --- Field type definitions --- */

interface SelectOption {
  value: string;
  label: string;
}

interface FieldConfig {
  label: string;
  description?: string;
  type: 'text' | 'url' | 'number' | 'color' | 'select' | 'textarea';
  placeholder?: string;
  options?: SelectOption[];
  min?: number;
  max?: number;
  maxLength?: number;
}

/* --- Settings categories --- */

const CATEGORIES = [
  {
    title: 'Profile',
    description: 'Your identity, branding, and social links',
    keys: [
      'owner_name',
      'source_social_github',
      'source_social_twitter',
      'source_logo_text',
      'source_custom_footer',
    ],
  },
  {
    title: 'Source Page',
    description: 'Public source page metadata',
    keys: ['source_title', 'source_description'],
  },
  {
    title: 'Source Theme',
    description: 'Color palette for your source page. Dark mode variants are generated automatically.',
    keys: THEME_SETTING_KEYS,
  },
  {
    title: 'Source Layout',
    description: 'Display preferences and content rendering',
    keys: [
      'source_posts_per_page',
      'source_show_toc',
      'source_show_reading_time',
      'source_card_style',
      'source_code_theme',
    ],
  },
  {
    title: 'Advanced',
    description: 'Custom CSS and HTML injection for source pages',
    keys: ['source_custom_css', 'source_custom_head'],
  },
  {
    title: 'Content Quality',
    description: 'Validation rules and limits',
    keys: ['quality_guidelines', 'validation_limits', 'max_actions_per_type'],
  },
];

const FIELDS: Record<string, FieldConfig> = {
  owner_name: {
    label: 'Display Name',
    description: 'Author name shown on posts, in JSON-LD metadata, and in the federation discovery endpoint (/.well-known/pignal).',
    type: 'text',
    placeholder: 'Jane Doe',
    maxLength: 200,
  },
  source_title: {
    label: 'Source Title',
    description: 'Shown in the nav bar, page titles, and meta tags.',
    type: 'text',
    placeholder: 'My Signals',
    maxLength: 200,
  },
  source_description: {
    label: 'Source Description',
    description: 'Subtitle shown on the source feed and used in meta description.',
    type: 'text',
    placeholder: 'Insights captured from AI conversations',
    maxLength: 500,
  },
  source_logo_text: {
    label: 'Logo Text',
    description: 'Custom text for the nav brand. Leave empty to use the source title.',
    type: 'text',
    placeholder: 'My Source',
    maxLength: 100,
  },
  source_social_github: {
    label: 'GitHub URL',
    description: 'GitHub profile link shown in the nav bar. Also used for federation discovery — your GitHub username is extracted from this URL.',
    type: 'url',
    placeholder: 'https://github.com/username',
    maxLength: 2000,
  },
  source_social_twitter: {
    label: 'Twitter/X URL',
    description: 'Twitter/X profile link shown in the source nav bar. Leave empty to hide.',
    type: 'url',
    placeholder: 'https://x.com/username',
    maxLength: 2000,
  },
  source_custom_footer: {
    label: 'Custom Footer Text',
    description: 'Replaces the default "Powered by pignal" footer. Supports plain text.',
    type: 'textarea',
    placeholder: 'Built with care by my team',
    maxLength: 10_000,
  },
  source_posts_per_page: {
    label: 'Posts Per Page',
    description: 'Number of posts shown per page on the source feed.',
    type: 'number',
    placeholder: '20',
    min: 1,
    max: 100,
  },
  source_show_toc: {
    label: 'Show Table of Contents',
    description: 'Display a sticky table of contents sidebar on source posts.',
    type: 'select',
    options: [
      { value: 'true', label: 'Enabled' },
      { value: 'false', label: 'Disabled' },
    ],
  },
  source_show_reading_time: {
    label: 'Show Reading Time',
    description: 'Display estimated reading time on posts and feed cards.',
    type: 'select',
    options: [
      { value: 'true', label: 'Enabled' },
      { value: 'false', label: 'Disabled' },
    ],
  },
  source_card_style: {
    label: 'Card Style',
    description: 'Layout style for the source feed page.',
    type: 'select',
    options: [
      { value: 'list', label: 'List — vertical list with separator lines' },
      { value: 'grid', label: 'Grid — 2-column cards with borders' },
    ],
  },
  source_code_theme: {
    label: 'Code Theme',
    description: 'Color scheme for code blocks in source posts.',
    type: 'select',
    options: [
      { value: 'default', label: 'Default — Pico CSS default' },
      { value: 'github', label: 'GitHub — light gray background' },
      { value: 'monokai', label: 'Monokai — dark background' },
    ],
  },
  source_custom_css: {
    label: 'Custom CSS',
    description: 'CSS injected on all source pages. Use to customize fonts, colors, spacing, etc.',
    type: 'textarea',
    placeholder: '.source-article .content p {\n  font-size: 1.05rem;\n}',
    maxLength: 50_000,
  },
  source_custom_head: {
    label: 'Custom Head HTML',
    description: 'Raw HTML injected into <head> on source pages. Use for analytics, fonts, or meta tags. Warning: this has full script access.',
    type: 'textarea',
    placeholder: '<script defer data-domain="example.com" src="https://plausible.io/js/script.js"></script>',
    maxLength: 50_000,
  },
  quality_guidelines: {
    label: 'Quality Guidelines',
    description: 'JSON configuration for signal content quality rules. Used by MCP tool validation.',
    type: 'textarea',
    maxLength: 50_000,
  },
  validation_limits: {
    label: 'Validation Limits',
    description: 'JSON configuration for field length limits (keySummary, content, sourceAi).',
    type: 'textarea',
    maxLength: 10_000,
  },
  max_actions_per_type: {
    label: 'Max Actions Per Type',
    description: 'Maximum number of validation actions allowed per signal type.',
    type: 'number',
    placeholder: '3',
    min: 1,
    max: 10,
  },
};

/* Register theme token fields from the single source of truth */
for (const token of THEME_TOKENS) {
  FIELDS[token.settingsKey] = {
    label: token.label,
    description: token.description,
    type: 'color',
    placeholder: token.placeholder,
  };
}

/** All known setting keys — used as an allowlist for writes. */
const ALLOWED_KEYS = new Set(CATEGORIES.flatMap((cat) => cat.keys));

function getFieldConfig(key: string): FieldConfig {
  return FIELDS[key] || { label: key, type: 'text' };
}

/* --- Field validation (pure function, shared by single + batch) --- */

function validateSettingField(key: string, value: string): string | null {
  if (!ALLOWED_KEYS.has(key)) {
    return 'Unknown setting key';
  }

  const config = getFieldConfig(key);

  if (config.maxLength && value.length > config.maxLength) {
    return `Value too long. Maximum ${config.maxLength.toLocaleString()} characters.`;
  }
  if (config.type === 'color' && value && !isValidHexColor(value)) {
    return 'Invalid hex color. Use format: #RRGGBB (e.g. #7C3AED)';
  }
  if (config.type === 'url' && value) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Invalid protocol');
      }
    } catch {
      return 'Invalid URL. Must start with http:// or https://';
    }
  }
  if (config.type === 'number' && value) {
    const num = parseInt(value, 10);
    if (isNaN(num) || (config.min !== undefined && num < config.min) || (config.max !== undefined && num > config.max)) {
      return `Must be a number${config.min !== undefined ? ` between ${config.min}` : ''}${config.max !== undefined ? ` and ${config.max}` : ''}`;
    }
  }
  if (config.type === 'select' && config.options) {
    const validValues = config.options.map((o) => o.value);
    if (!validValues.includes(value)) {
      return `Invalid value. Must be one of: ${validValues.join(', ')}`;
    }
  }

  return null;
}

/* --- Setting field component --- */

function SettingField({ settingKey, value }: {
  settingKey: string;
  value: string;
}) {
  const config = getFieldConfig(settingKey);

  let inputElement: Child;

  switch (config.type) {
    case 'select':
      inputElement = (
        <select data-setting-key={settingKey} data-original={value}>
          {config.options!.map((opt) => (
            <option value={opt.value} selected={value === opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
      break;

    case 'number':
      inputElement = (
        <input
          type="number"
          data-setting-key={settingKey}
          data-original={value}
          value={value}
          placeholder={config.placeholder}
          min={config.min}
          max={config.max}
        />
      );
      break;

    case 'color':
      inputElement = (
        <div role="group">
          <input
            type="color"
            value={value || config.placeholder || '#000000'}
            data-sync={`#color-text-${settingKey}`}
            aria-label={`${config.label} picker`}
          />
          <input
            type="text"
            id={`color-text-${settingKey}`}
            data-setting-key={settingKey}
            data-original={value}
            value={value}
            placeholder={config.placeholder}
            pattern={"#[0-9a-fA-F]{6}"}
          />
        </div>
      );
      break;

    case 'textarea':
      inputElement = (
        <textarea
          data-setting-key={settingKey}
          data-original={value}
          rows={4}
          placeholder={config.placeholder}
        >{value}</textarea>
      );
      break;

    default:
      inputElement = (
        <input
          type={config.type === 'url' ? 'url' : 'text'}
          data-setting-key={settingKey}
          data-original={value}
          value={value}
          placeholder={config.placeholder}
        />
      );
  }

  return (
    <div class="setting-field" id={`setting-${settingKey}`}>
      <label>{config.label}</label>
      {config.description && (
        <small class="muted">{config.description}</small>
      )}
      {inputElement}
    </div>
  );
}

/* --- Page render --- */

export async function settingsPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const settings = await store.getSettings();
  const csrfToken = getCsrfToken(c);
  const flash = c.req.query('success') ? { type: 'success' as const, message: c.req.query('success')! } :
    c.req.query('error') ? { type: 'error' as const, message: c.req.query('error')! } : undefined;

  return c.html(
    <AppLayout
      title="Settings"
      currentPath="/pignal/settings"
      csrfToken={csrfToken}
      flash={flash}
    >
      <script id="setting-defaults" type="application/json">
        {raw(JSON.stringify(DEFAULTS))}
      </script>

      {CATEGORIES.map((category, index) => {
        const resetKeys = category.keys.filter((k) => k in DEFAULTS);
        return (
          <details class="settings-group" open={index === 0}>
            <summary>{category.title} <small class="muted">{category.description}</small></summary>
            {category.keys.map((key) => (
              <SettingField settingKey={key} value={settings[key] ?? ''} />
            ))}
            {resetKeys.length > 0 && (
              <button
                type="button"
                class="outline secondary btn-sm reset-defaults-btn"
                data-reset-keys={JSON.stringify(resetKeys)}
              >
                Reset to defaults
              </button>
            )}
          </details>
        );
      })}

      <div id="save-bar" class="save-bar" hidden>
        <div class="save-bar-content">
          <span class="save-bar-text">
            <strong id="save-bar-count">0</strong> unsaved changes
          </span>
          <div class="save-bar-actions">
            <button type="button" id="save-bar-discard" class="outline secondary">Discard</button>
            <button type="button" id="save-bar-save">Save All</button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/* --- Single field update handler --- */

export async function updateSettingHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const key = c.req.param('key')!;

  if (!ALLOWED_KEYS.has(key)) {
    const msg = 'Unknown setting key';
    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger(msg, 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    return c.redirect(`/pignal/settings?error=${encodeURIComponent(msg)}`);
  }

  const store = c.get('store');
  const body = await c.req.parseBody();
  const value = body.value as string;

  if (value === undefined || value === null) {
    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger('Value is required', 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    return c.redirect('/pignal/settings?error=Value+is+required');
  }

  const error = validateSettingField(key, value);
  if (error) {
    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger(error, 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    return c.redirect(`/pignal/settings?error=${encodeURIComponent(error)}`);
  }

  try {
    await store.updateSetting(key, value);
    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger('Setting updated'));
      return c.html(<SettingField settingKey={key} value={value} />);
    }
    return c.redirect('/pignal/settings?success=Setting+updated');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update setting';
    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger(msg, 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    return c.redirect(`/pignal/settings?error=${encodeURIComponent(msg)}`);
  }
}

/* --- Batch update handler (JSON API for save bar) --- */

export async function batchUpdateSettingsHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  let changes: Record<string, string>;
  try {
    const body = await c.req.json<{ changes: Record<string, string> }>();
    changes = body.changes;
  } catch {
    return c.json({ saved: [], errors: { _body: 'Invalid JSON body' } }, 400);
  }

  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    return c.json({ saved: [], errors: { _body: 'Missing "changes" object' } }, 400);
  }

  const errors: Record<string, string> = {};
  const store = c.get('store');

  // Validate all fields first
  const validEntries: [string, string][] = [];
  for (const [key, value] of Object.entries(changes)) {
    const error = validateSettingField(key, String(value));
    if (error) {
      errors[key] = error;
    } else {
      validEntries.push([key, String(value)]);
    }
  }

  // Save all valid entries in parallel
  const results = await Promise.all(
    validEntries.map(async ([key, value]) => {
      try {
        await store.updateSetting(key, value);
        return key;
      } catch (err) {
        errors[key] = err instanceof Error ? err.message : 'Failed to save';
        return null;
      }
    })
  );

  const saved = results.filter((key): key is string => key !== null);

  return c.json({ saved, errors });
}

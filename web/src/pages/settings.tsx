import type { Context } from 'hono';
import type { Child } from 'hono/jsx';
import type { ItemStoreRpc } from '@pignal/db';
import type { WebEnv } from '../types';
import { AppLayout } from '../components/app-layout';
import { getCsrfToken } from '../middleware/csrf';
import { isHtmxRequest, toastTrigger } from '../lib/htmx';
import { FONT_OPTIONS, isValidHexColor } from '../lib/theme';
import { raw } from 'hono/html';

type WebVars = { store: ItemStoreRpc };

/* --- Default values (from seed migration) --- */

const DEFAULTS: Record<string, string> = {
  owner_name: 'Pignal',
  source_posts_per_page: '20',
  source_show_reading_time: 'true',
  source_code_theme: 'default',
  source_logo_text: '',
  source_logo_url: '',
  source_favicon_url: '',
  source_og_image_url: '',
  source_font_heading: '',
  source_font_body: '',
  source_social_github: '',
  source_social_twitter: '',
  source_social_linkedin: '',
  source_social_mastodon: '',
  source_social_youtube: '',
  source_social_website: '',
  source_custom_footer: '',
  source_custom_css: '',
  source_custom_head: '',
  source_color_accent: '',
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
    title: 'Identity',
    slug: 'identity',
    description: 'Your name and site metadata',
    keys: ['owner_name', 'source_title', 'source_description'],
  },
  {
    title: 'Branding',
    slug: 'branding',
    description: 'Logo, favicon, fonts, and Open Graph image',
    keys: [
      'source_logo_text',
      'source_logo_url',
      'source_favicon_url',
      'source_og_image_url',
      'source_font_heading',
      'source_font_body',
    ],
  },
  {
    title: 'Social Links',
    slug: 'social',
    description: 'Social profiles shown in the navigation bar',
    keys: [
      'source_social_github',
      'source_social_twitter',
      'source_social_linkedin',
      'source_social_mastodon',
      'source_social_youtube',
      'source_social_website',
    ],
  },
  {
    title: 'Theme',
    slug: 'theme',
    description: 'Brand color for links, buttons, and accents. Dark mode is generated automatically.',
    keys: ['source_color_accent'],
  },
  {
    title: 'Layout',
    slug: 'layout',
    description: 'Display preferences and content rendering',
    keys: [
      'source_posts_per_page',
      'source_show_reading_time',
      'source_code_theme',
      'source_custom_footer',
    ],
  },
  {
    title: 'Advanced',
    slug: 'advanced',
    description: 'Custom CSS and HTML injection for source pages',
    keys: ['source_custom_css', 'source_custom_head'],
  },
  {
    title: 'Call to Action',
    slug: 'cta',
    description: 'Configure CTA blocks on source and post pages to drive visitor engagement',
    keys: [
      'cta_hero_enabled',
      'cta_hero_title',
      'cta_hero_description',
      'cta_hero_button_text',
      'cta_hero_button_url',
      'cta_hero_action_slug',
      'cta_post_enabled',
      'cta_post_title',
      'cta_post_description',
      'cta_post_button_text',
      'cta_post_button_url',
      'cta_post_action_slug',
      'cta_sticky_enabled',
      'cta_sticky_text',
      'cta_sticky_button_text',
      'cta_sticky_button_url',
      'cta_sticky_action_slug',
    ],
  },
  {
    title: 'Content Quality',
    slug: 'content-quality',
    description: 'Validation rules and limits for MCP clients',
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
    placeholder: 'My Pignal',
    maxLength: 200,
  },
  source_description: {
    label: 'Source Description',
    description: 'Subtitle shown on the source feed and used in meta description.',
    type: 'text',
    placeholder: 'A self-hosted content platform powered by Cloudflare',
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
  source_show_reading_time: {
    label: 'Show Reading Time',
    description: 'Display estimated reading time on posts and feed cards.',
    type: 'select',
    options: [
      { value: 'true', label: 'Enabled' },
      { value: 'false', label: 'Disabled' },
    ],
  },
  source_code_theme: {
    label: 'Code Theme',
    description: 'Color scheme for code blocks in source posts.',
    type: 'select',
    options: [
      { value: 'default', label: 'Default — system default' },
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
  source_logo_url: {
    label: 'Logo Image URL',
    description: 'URL to your logo image. Shown in the navigation bar. Leave empty for default.',
    type: 'url',
    placeholder: 'https://example.com/logo.png',
    maxLength: 2000,
  },
  source_favicon_url: {
    label: 'Favicon URL',
    description: 'URL to your favicon. Leave empty for default pignal icon.',
    type: 'url',
    placeholder: 'https://example.com/favicon.ico',
    maxLength: 2000,
  },
  source_og_image_url: {
    label: 'Open Graph Image URL',
    description: 'Default image used in social media previews. Leave empty to use GitHub avatar.',
    type: 'url',
    placeholder: 'https://example.com/og-image.png',
    maxLength: 2000,
  },
  source_font_heading: {
    label: 'Heading Font',
    description: 'Font for headings. Loaded automatically from Google Fonts.',
    type: 'select',
    options: [
      { value: '', label: 'System Default' },
      ...Object.entries(FONT_OPTIONS).map(([id, f]) => ({ value: id, label: `${f.label} (${f.category})` })),
    ],
  },
  source_font_body: {
    label: 'Body Font',
    description: 'Font for body text. Loaded automatically from Google Fonts.',
    type: 'select',
    options: [
      { value: '', label: 'System Default' },
      ...Object.entries(FONT_OPTIONS).map(([id, f]) => ({ value: id, label: `${f.label} (${f.category})` })),
    ],
  },
  source_social_linkedin: {
    label: 'LinkedIn URL',
    description: 'LinkedIn profile link shown in the source nav bar.',
    type: 'url',
    placeholder: 'https://linkedin.com/in/username',
    maxLength: 2000,
  },
  source_social_mastodon: {
    label: 'Mastodon URL',
    description: 'Mastodon/fediverse profile link shown in the source nav bar.',
    type: 'url',
    placeholder: 'https://mastodon.social/@username',
    maxLength: 2000,
  },
  source_social_youtube: {
    label: 'YouTube URL',
    description: 'YouTube channel link shown in the source nav bar.',
    type: 'url',
    placeholder: 'https://youtube.com/@channel',
    maxLength: 2000,
  },
  source_social_website: {
    label: 'Website URL',
    description: 'Personal website link shown in the source nav bar.',
    type: 'url',
    placeholder: 'https://example.com',
    maxLength: 2000,
  },
  source_color_accent: {
    label: 'Accent Color',
    description: 'Brand color for links, buttons, and interactive elements. Leave empty for default blue (#1095C1).',
    type: 'color',
    placeholder: '#1095C1',
  },
  // CTA Hero settings
  cta_hero_enabled: {
    label: 'Hero CTA Enabled',
    description: 'Show a full-width banner CTA at the top of the source feed page.',
    type: 'select',
    options: [
      { value: 'true', label: 'Enabled' },
      { value: 'false', label: 'Disabled' },
    ],
  },
  cta_hero_title: {
    label: 'Hero CTA Title',
    description: 'Heading text for the hero CTA banner.',
    type: 'text',
    placeholder: 'Subscribe to our newsletter',
    maxLength: 200,
  },
  cta_hero_description: {
    label: 'Hero CTA Description',
    description: 'Optional subtext shown below the title.',
    type: 'text',
    placeholder: 'Get the latest posts delivered straight to your inbox.',
    maxLength: 500,
  },
  cta_hero_button_text: {
    label: 'Hero CTA Button Text',
    description: 'Label for the CTA button.',
    type: 'text',
    placeholder: 'Subscribe',
    maxLength: 100,
  },
  cta_hero_button_url: {
    label: 'Hero CTA Button URL',
    description: 'External link for the CTA button. Leave empty if using an action form.',
    type: 'url',
    placeholder: 'https://example.com/subscribe',
    maxLength: 2000,
  },
  cta_hero_action_slug: {
    label: 'Hero CTA Action Slug',
    description: 'Slug of a site action form to load inline. Mutually exclusive with button URL.',
    type: 'text',
    placeholder: 'newsletter',
    maxLength: 100,
  },
  // CTA Post settings
  cta_post_enabled: {
    label: 'Post CTA Enabled',
    description: 'Show a CTA card after article content on item post pages.',
    type: 'select',
    options: [
      { value: 'true', label: 'Enabled' },
      { value: 'false', label: 'Disabled' },
    ],
  },
  cta_post_title: {
    label: 'Post CTA Title',
    description: 'Heading text for the post CTA card.',
    type: 'text',
    placeholder: 'Enjoyed this post?',
    maxLength: 200,
  },
  cta_post_description: {
    label: 'Post CTA Description',
    description: 'Optional subtext shown below the title.',
    type: 'text',
    placeholder: 'Share it with your friends or subscribe for more.',
    maxLength: 500,
  },
  cta_post_button_text: {
    label: 'Post CTA Button Text',
    description: 'Label for the CTA button.',
    type: 'text',
    placeholder: 'Subscribe',
    maxLength: 100,
  },
  cta_post_button_url: {
    label: 'Post CTA Button URL',
    description: 'External link for the CTA button. Leave empty if using an action form.',
    type: 'url',
    placeholder: 'https://example.com/subscribe',
    maxLength: 2000,
  },
  cta_post_action_slug: {
    label: 'Post CTA Action Slug',
    description: 'Slug of a site action form to load inline. Mutually exclusive with button URL.',
    type: 'text',
    placeholder: 'newsletter',
    maxLength: 100,
  },
  // CTA Sticky settings
  cta_sticky_enabled: {
    label: 'Sticky CTA Enabled',
    description: 'Show a persistent CTA bar at the bottom of all public pages.',
    type: 'select',
    options: [
      { value: 'true', label: 'Enabled' },
      { value: 'false', label: 'Disabled' },
    ],
  },
  cta_sticky_text: {
    label: 'Sticky CTA Text',
    description: 'Message shown in the sticky bottom bar.',
    type: 'text',
    placeholder: 'Stay up to date with our latest posts.',
    maxLength: 200,
  },
  cta_sticky_button_text: {
    label: 'Sticky CTA Button Text',
    description: 'Label for the sticky CTA button.',
    type: 'text',
    placeholder: 'Subscribe',
    maxLength: 100,
  },
  cta_sticky_button_url: {
    label: 'Sticky CTA Button URL',
    description: 'External link for the sticky CTA button. Leave empty if using an action form.',
    type: 'url',
    placeholder: 'https://example.com/subscribe',
    maxLength: 2000,
  },
  cta_sticky_action_slug: {
    label: 'Sticky CTA Action Slug',
    description: 'Slug of a site action form to load inline. Mutually exclusive with button URL.',
    type: 'text',
    placeholder: 'newsletter',
    maxLength: 100,
  },
};

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
        <div class="form-dropdown" data-setting-key={settingKey} data-original={value}>
          <button type="button" class="form-dropdown-trigger" aria-haspopup="listbox">
            <span class="form-dropdown-label">{config.options!.find(o => o.value === value)?.label ?? '-- Select --'}</span>
          </button>
          <ul role="listbox" class="form-dropdown-list">
            {config.options!.map((opt) => (
              <li>
                <button type="button" data-value={opt.value} data-label={opt.label}
                  aria-selected={value === opt.value ? 'true' : undefined}>
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
          <input type="hidden" name={settingKey} value={value} />
        </div>
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
        <div class="flex items-center gap-3">
          <input
            type="color"
            value={value || config.placeholder || '#000000'}
            data-sync={`#color-text-${settingKey}`}
            aria-label={`${config.label} picker`}
            class="w-12 h-10 rounded-lg"
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
    <div class="mb-4" id={`setting-${settingKey}`}>
      <label>{config.label}</label>
      {config.description && (
        <p class="text-sm text-muted leading-relaxed mb-2">{config.description}</p>
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
      <div class="mb-8">
        <h1 class="text-2xl font-bold tracking-tight">Settings</h1>
        <p class="text-muted text-sm mt-1">Configure your signal store</p>
      </div>

      <script id="setting-defaults" type="application/json">
        {raw(JSON.stringify(DEFAULTS))}
      </script>

      {/* Sidebar + Content two-column layout */}
      <div class="flex flex-col lg:flex-row gap-8">
        {/* Left sidebar: vertical nav on desktop, horizontal pills on mobile */}
        <nav class="lg:w-48 shrink-0 lg:sticky lg:top-20 lg:self-start">
          {/* Mobile: horizontal scroll pills */}
          <div class="flex lg:hidden gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <a
                href={`#settings-${cat.slug}`}
                class="px-3 py-1.5 text-sm rounded-full whitespace-nowrap bg-surface border border-border-subtle text-muted hover:text-text hover:bg-surface-hover transition-colors"
              >
                {cat.title}
              </a>
            ))}
          </div>
          {/* Desktop: vertical nav links */}
          <div class="hidden lg:flex flex-col gap-0.5">
            {CATEGORIES.map((cat) => (
              <a
                href={`#settings-${cat.slug}`}
                class="px-3 py-2 text-sm rounded-lg text-muted hover:text-text hover:bg-surface-hover transition-colors"
              >
                {cat.title}
              </a>
            ))}
          </div>
        </nav>

        {/* Right content: open sections */}
        <div class="flex-1 min-w-0 space-y-8">
          {CATEGORIES.map((category) => {
            const resetKeys = category.keys.filter((k) => k in DEFAULTS);
            return (
              <section
                id={`settings-${category.slug}`}
                class="bg-surface rounded-xl border border-border-subtle shadow-card p-6 sm:p-8 scroll-mt-20"
              >
                <div class="mb-6">
                  <h2 class="text-lg font-semibold">{category.title}</h2>
                  <p class="text-sm text-muted mt-1">{category.description}</p>
                </div>
                {category.keys.map((key) => (
                  <SettingField settingKey={key} value={settings[key] ?? ''} />
                ))}
                {resetKeys.length > 0 && (
                  <button
                    type="button"
                    class="outline secondary text-sm px-4 py-2 mt-2"
                    data-reset-keys={JSON.stringify(resetKeys)}
                  >
                    Reset to defaults
                  </button>
                )}
              </section>
            );
          })}
        </div>
      </div>

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

import type { Context } from 'hono';
import type { Child } from 'hono/jsx';
import type { TFunction } from '@pignal/render/i18n/types';
import type { WebEnv, WebVars } from '../types';
import { AppLayout } from '../components/app-layout';
import { getCsrfToken } from '../middleware/csrf';
import { isHtmxRequest, toastTrigger } from '../lib/htmx';
import { FONT_OPTIONS, isValidHexColor } from '@pignal/render/lib/theme';
import { raw } from 'hono/html';

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
  source_locale: 'en',
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

/* --- Static category definitions (keys only, for ALLOWED_KEYS) --- */

const CATEGORY_DEFS = [
  {
    slug: 'identity',
    i18nKey: 'identity',
    keys: ['owner_name', 'source_title', 'source_description'],
  },
  {
    slug: 'branding',
    i18nKey: 'branding',
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
    slug: 'social',
    i18nKey: 'social',
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
    slug: 'theme',
    i18nKey: 'theme',
    keys: ['source_color_accent'],
  },
  {
    slug: 'layout',
    i18nKey: 'layout',
    keys: [
      'source_posts_per_page',
      'source_show_reading_time',
      'source_code_theme',
      'source_custom_footer',
    ],
  },
  {
    slug: 'language',
    i18nKey: 'language',
    keys: ['source_locale'],
  },
  {
    slug: 'advanced',
    i18nKey: 'advanced',
    keys: ['source_custom_css', 'source_custom_head'],
  },
  {
    slug: 'cta',
    i18nKey: 'cta',
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
    slug: 'content-quality',
    i18nKey: 'contentQuality',
    keys: ['quality_guidelines', 'validation_limits', 'max_actions_per_type'],
  },
] as const;

/** All known setting keys — used as an allowlist for writes. */
const ALLOWED_KEYS: Set<string> = new Set(CATEGORY_DEFS.flatMap((cat) => cat.keys));

/* --- Localized categories builder --- */

function getCategories(t: TFunction) {
  return CATEGORY_DEFS.map((def) => ({
    title: t(`settings.category.${def.i18nKey}`),
    slug: def.slug,
    description: t(`settings.category.${def.i18nKey}Description`),
    keys: [...def.keys],
  }));
}

/* --- Localized fields builder --- */

function getFields(t: TFunction): Record<string, FieldConfig> {
  const enabledDisabledOptions: SelectOption[] = [
    { value: 'true', label: t('settings.field.enabled') },
    { value: 'false', label: t('settings.field.disabled') },
  ];

  return {
    owner_name: {
      label: t('settings.field.ownerName'),
      description: t('settings.field.ownerNameDescription'),
      type: 'text',
      placeholder: t('settings.field.ownerNamePlaceholder'),
      maxLength: 200,
    },
    source_title: {
      label: t('settings.field.sourceTitle'),
      description: t('settings.field.sourceTitleDescription'),
      type: 'text',
      placeholder: t('settings.field.sourceTitlePlaceholder'),
      maxLength: 200,
    },
    source_description: {
      label: t('settings.field.sourceDescription'),
      description: t('settings.field.sourceDescriptionDescription'),
      type: 'text',
      placeholder: t('settings.field.sourceDescriptionPlaceholder'),
      maxLength: 500,
    },
    source_logo_text: {
      label: t('settings.field.logoText'),
      description: t('settings.field.logoTextDescription'),
      type: 'text',
      placeholder: t('settings.field.logoTextPlaceholder'),
      maxLength: 100,
    },
    source_social_github: {
      label: t('settings.field.githubUrl'),
      description: t('settings.field.githubUrlDescription'),
      type: 'url',
      placeholder: t('settings.field.githubUrlPlaceholder'),
      maxLength: 2000,
    },
    source_social_twitter: {
      label: t('settings.field.twitterUrl'),
      description: t('settings.field.twitterUrlDescription'),
      type: 'url',
      placeholder: t('settings.field.twitterUrlPlaceholder'),
      maxLength: 2000,
    },
    source_custom_footer: {
      label: t('settings.field.customFooter'),
      description: t('settings.field.customFooterDescription'),
      type: 'textarea',
      placeholder: t('settings.field.customFooterPlaceholder'),
      maxLength: 10_000,
    },
    source_posts_per_page: {
      label: t('settings.field.postsPerPage'),
      description: t('settings.field.postsPerPageDescription'),
      type: 'number',
      placeholder: t('settings.field.postsPerPagePlaceholder'),
      min: 1,
      max: 100,
    },
    source_show_reading_time: {
      label: t('settings.field.showReadingTime'),
      description: t('settings.field.showReadingTimeDescription'),
      type: 'select',
      options: enabledDisabledOptions,
    },
    source_code_theme: {
      label: t('settings.field.codeTheme'),
      description: t('settings.field.codeThemeDescription'),
      type: 'select',
      options: [
        { value: 'default', label: t('settings.field.codeThemeDefault') },
        { value: 'github', label: t('settings.field.codeThemeGithub') },
        { value: 'monokai', label: t('settings.field.codeThemeMonokai') },
      ],
    },
    source_locale: {
      label: t('settings.field.sourceLocale'),
      description: t('settings.field.sourceLocaleDescription'),
      type: 'select',
      options: [
        { value: 'en', label: 'English' },
        { value: 'vi', label: 'Tiếng Việt' },
        { value: 'zh', label: '中文 (简体)' },
      ],
    },
    source_custom_css: {
      label: t('settings.field.customCss'),
      description: t('settings.field.customCssDescription'),
      type: 'textarea',
      placeholder: '.source-article .content p {\n  font-size: 1.05rem;\n}',
      maxLength: 50_000,
    },
    source_custom_head: {
      label: t('settings.field.customHead'),
      description: t('settings.field.customHeadDescription'),
      type: 'textarea',
      placeholder: '<script defer data-domain="example.com" src="https://plausible.io/js/script.js"></script>',
      maxLength: 50_000,
    },
    quality_guidelines: {
      label: t('settings.field.qualityGuidelines'),
      description: t('settings.field.qualityGuidelinesDescription'),
      type: 'textarea',
      maxLength: 50_000,
    },
    validation_limits: {
      label: t('settings.field.validationLimits'),
      description: t('settings.field.validationLimitsDescription'),
      type: 'textarea',
      maxLength: 10_000,
    },
    max_actions_per_type: {
      label: t('settings.field.maxActionsPerType'),
      description: t('settings.field.maxActionsPerTypeDescription'),
      type: 'number',
      placeholder: t('settings.field.maxActionsPerTypePlaceholder'),
      min: 1,
      max: 10,
    },
    source_logo_url: {
      label: t('settings.field.logoUrl'),
      description: t('settings.field.logoUrlDescription'),
      type: 'url',
      placeholder: t('settings.field.logoUrlPlaceholder'),
      maxLength: 2000,
    },
    source_favicon_url: {
      label: t('settings.field.faviconUrl'),
      description: t('settings.field.faviconUrlDescription'),
      type: 'url',
      placeholder: t('settings.field.faviconUrlPlaceholder'),
      maxLength: 2000,
    },
    source_og_image_url: {
      label: t('settings.field.ogImageUrl'),
      description: t('settings.field.ogImageUrlDescription'),
      type: 'url',
      placeholder: t('settings.field.ogImageUrlPlaceholder'),
      maxLength: 2000,
    },
    source_font_heading: {
      label: t('settings.field.headingFont'),
      description: t('settings.field.headingFontDescription'),
      type: 'select',
      options: [
        { value: '', label: t('settings.field.systemDefault') },
        ...Object.entries(FONT_OPTIONS).map(([id, f]) => ({ value: id, label: `${f.label} (${f.category})` })),
      ],
    },
    source_font_body: {
      label: t('settings.field.bodyFont'),
      description: t('settings.field.bodyFontDescription'),
      type: 'select',
      options: [
        { value: '', label: t('settings.field.systemDefault') },
        ...Object.entries(FONT_OPTIONS).map(([id, f]) => ({ value: id, label: `${f.label} (${f.category})` })),
      ],
    },
    source_social_linkedin: {
      label: t('settings.field.linkedinUrl'),
      description: t('settings.field.linkedinUrlDescription'),
      type: 'url',
      placeholder: t('settings.field.linkedinUrlPlaceholder'),
      maxLength: 2000,
    },
    source_social_mastodon: {
      label: t('settings.field.mastodonUrl'),
      description: t('settings.field.mastodonUrlDescription'),
      type: 'url',
      placeholder: t('settings.field.mastodonUrlPlaceholder'),
      maxLength: 2000,
    },
    source_social_youtube: {
      label: t('settings.field.youtubeUrl'),
      description: t('settings.field.youtubeUrlDescription'),
      type: 'url',
      placeholder: t('settings.field.youtubeUrlPlaceholder'),
      maxLength: 2000,
    },
    source_social_website: {
      label: t('settings.field.websiteUrl'),
      description: t('settings.field.websiteUrlDescription'),
      type: 'url',
      placeholder: t('settings.field.websiteUrlPlaceholder'),
      maxLength: 2000,
    },
    source_color_accent: {
      label: t('settings.field.accentColor'),
      description: t('settings.field.accentColorDescription'),
      type: 'color',
      placeholder: t('settings.field.accentColorPlaceholder'),
    },
    // CTA Hero settings
    cta_hero_enabled: {
      label: t('settings.cta.heroEnabled'),
      description: t('settings.cta.heroEnabledDescription'),
      type: 'select',
      options: enabledDisabledOptions,
    },
    cta_hero_title: {
      label: t('settings.cta.heroTitle'),
      description: t('settings.cta.heroTitleDescription'),
      type: 'text',
      placeholder: t('settings.cta.heroTitlePlaceholder'),
      maxLength: 200,
    },
    cta_hero_description: {
      label: t('settings.cta.heroDescription'),
      description: t('settings.cta.heroDescriptionDescription'),
      type: 'text',
      placeholder: t('settings.cta.heroDescriptionPlaceholder'),
      maxLength: 500,
    },
    cta_hero_button_text: {
      label: t('settings.cta.heroButtonText'),
      description: t('settings.cta.heroButtonTextDescription'),
      type: 'text',
      placeholder: t('settings.cta.heroButtonTextPlaceholder'),
      maxLength: 100,
    },
    cta_hero_button_url: {
      label: t('settings.cta.heroButtonUrl'),
      description: t('settings.cta.heroButtonUrlDescription'),
      type: 'url',
      placeholder: t('settings.cta.heroButtonUrlPlaceholder'),
      maxLength: 2000,
    },
    cta_hero_action_slug: {
      label: t('settings.cta.heroActionSlug'),
      description: t('settings.cta.heroActionSlugDescription'),
      type: 'text',
      placeholder: t('settings.cta.heroActionSlugPlaceholder'),
      maxLength: 100,
    },
    // CTA Post settings
    cta_post_enabled: {
      label: t('settings.cta.postEnabled'),
      description: t('settings.cta.postEnabledDescription'),
      type: 'select',
      options: enabledDisabledOptions,
    },
    cta_post_title: {
      label: t('settings.cta.postTitle'),
      description: t('settings.cta.postTitleDescription'),
      type: 'text',
      placeholder: t('settings.cta.postTitlePlaceholder'),
      maxLength: 200,
    },
    cta_post_description: {
      label: t('settings.cta.postDescription'),
      description: t('settings.cta.postDescriptionDescription'),
      type: 'text',
      placeholder: t('settings.cta.postDescriptionPlaceholder'),
      maxLength: 500,
    },
    cta_post_button_text: {
      label: t('settings.cta.postButtonText'),
      description: t('settings.cta.postButtonTextDescription'),
      type: 'text',
      placeholder: t('settings.cta.postButtonTextPlaceholder'),
      maxLength: 100,
    },
    cta_post_button_url: {
      label: t('settings.cta.postButtonUrl'),
      description: t('settings.cta.postButtonUrlDescription'),
      type: 'url',
      placeholder: t('settings.cta.postButtonUrlPlaceholder'),
      maxLength: 2000,
    },
    cta_post_action_slug: {
      label: t('settings.cta.postActionSlug'),
      description: t('settings.cta.postActionSlugDescription'),
      type: 'text',
      placeholder: t('settings.cta.postActionSlugPlaceholder'),
      maxLength: 100,
    },
    // CTA Sticky settings
    cta_sticky_enabled: {
      label: t('settings.cta.stickyEnabled'),
      description: t('settings.cta.stickyEnabledDescription'),
      type: 'select',
      options: enabledDisabledOptions,
    },
    cta_sticky_text: {
      label: t('settings.cta.stickyText'),
      description: t('settings.cta.stickyTextDescription'),
      type: 'text',
      placeholder: t('settings.cta.stickyTextPlaceholder'),
      maxLength: 200,
    },
    cta_sticky_button_text: {
      label: t('settings.cta.stickyButtonText'),
      description: t('settings.cta.stickyButtonTextDescription'),
      type: 'text',
      placeholder: t('settings.cta.stickyButtonTextPlaceholder'),
      maxLength: 100,
    },
    cta_sticky_button_url: {
      label: t('settings.cta.stickyButtonUrl'),
      description: t('settings.cta.stickyButtonUrlDescription'),
      type: 'url',
      placeholder: t('settings.cta.stickyButtonUrlPlaceholder'),
      maxLength: 2000,
    },
    cta_sticky_action_slug: {
      label: t('settings.cta.stickyActionSlug'),
      description: t('settings.cta.stickyActionSlugDescription'),
      type: 'text',
      placeholder: t('settings.cta.stickyActionSlugPlaceholder'),
      maxLength: 100,
    },
  };
}

function getFieldConfig(key: string, t: TFunction): FieldConfig {
  const fields = getFields(t);
  return fields[key] || { label: key, type: 'text' };
}

/* --- Field validation (pure function, shared by single + batch) --- */

function validateSettingField(key: string, value: string, t: TFunction): string | null {
  if (!ALLOWED_KEYS.has(key)) {
    return t('settings.validation.unknownKey');
  }

  const config = getFieldConfig(key, t);

  if (config.maxLength && value.length > config.maxLength) {
    return t('settings.validation.valueTooLong', { max: config.maxLength.toLocaleString() });
  }
  if (config.type === 'color' && value && !isValidHexColor(value)) {
    return t('settings.validation.invalidColor');
  }
  if (config.type === 'url' && value) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Invalid protocol');
      }
    } catch {
      return t('settings.validation.invalidUrl');
    }
  }
  if (config.type === 'number' && value) {
    const num = parseInt(value, 10);
    if (isNaN(num) || (config.min !== undefined && num < config.min) || (config.max !== undefined && num > config.max)) {
      return t('settings.validation.invalidNumber', {
        min: config.min ?? 0,
        max: config.max ?? 0,
      });
    }
  }
  if (config.type === 'select' && config.options) {
    const validValues = config.options.map((o) => o.value);
    if (!validValues.includes(value)) {
      return t('settings.validation.invalidOption', { options: validValues.join(', ') });
    }
  }

  return null;
}

/* --- Setting field component --- */

function SettingField({ settingKey, value, t }: {
  settingKey: string;
  value: string;
  t: TFunction;
}) {
  const config = getFieldConfig(settingKey, t);

  let inputElement: Child;

  switch (config.type) {
    case 'select':
      inputElement = (
        <div class="form-dropdown" data-setting-key={settingKey} data-original={value}>
          <button type="button" class="form-dropdown-trigger" aria-haspopup="listbox">
            <span class="form-dropdown-label">{config.options!.find(o => o.value === value)?.label ?? t('settings.field.selectDefault')}</span>
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
            class="w-12 h-10 rounded-lg cursor-pointer"
          />
          <span
            class="inline-block w-5 h-5 rounded-full border border-border-subtle shrink-0"
            style={`background: ${value || config.placeholder || '#000000'}`}
            id={`color-preview-${settingKey}`}
            aria-hidden="true"
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
  const t = c.get('t');
  const locale = c.get('locale');
  const defaultLocale = c.get('defaultLocale');
  const flash = c.req.query('success') ? { type: 'success' as const, message: c.req.query('success')! } :
    c.req.query('error') ? { type: 'error' as const, message: c.req.query('error')! } : undefined;

  const categories = getCategories(t);

  return c.html(
    <AppLayout
      title={t('settings.title')}
      currentPath="/pignal/settings"
      csrfToken={csrfToken}
      flash={flash}
      t={t}
      locale={locale}
      defaultLocale={defaultLocale}
    >
      <div class="mb-8">
        <h1 class="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p class="text-muted text-sm mt-1">{t('settings.description')}</p>
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
            {categories.map((cat) => (
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
            {categories.map((cat) => (
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
          {categories.map((category) => {
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
                  <SettingField settingKey={key} value={settings[key] ?? ''} t={t} />
                ))}
                {resetKeys.length > 0 && (
                  <button
                    type="button"
                    class="outline secondary text-sm px-4 py-2 mt-2"
                    data-reset-keys={JSON.stringify(resetKeys)}
                  >
                    {t('common.resetToDefaults')}
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
            <strong id="save-bar-count">0</strong> {t('common.unsavedChanges')}
          </span>
          <div class="save-bar-actions">
            <button type="button" id="save-bar-discard" class="outline secondary">{t('common.discard')}</button>
            <button type="button" id="save-bar-save">{t('common.saveAll')}</button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/* --- Single field update handler --- */

export async function updateSettingHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const key = c.req.param('key')!;
  const t = c.get('t');

  if (!ALLOWED_KEYS.has(key)) {
    const msg = t('settings.validation.unknownKey');
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
    const msg = t('settings.validation.valueRequired');
    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger(msg, 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    return c.redirect(`/pignal/settings?error=${encodeURIComponent(msg)}`);
  }

  const error = validateSettingField(key, value, t);
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
      c.header('HX-Trigger', toastTrigger(t('settings.toast.updated')));
      return c.html(<SettingField settingKey={key} value={value} t={t} />);
    }
    return c.redirect(`/pignal/settings?success=${encodeURIComponent(t('settings.toast.updated'))}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : t('settings.validation.failedToUpdate');
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
  const t = c.get('t');
  let changes: Record<string, string>;
  try {
    const body = await c.req.json<{ changes: Record<string, string> }>();
    changes = body.changes;
  } catch {
    return c.json({ saved: [], errors: { _body: t('settings.validation.invalidJsonBody') } }, 400);
  }

  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    return c.json({ saved: [], errors: { _body: t('settings.validation.missingChanges') } }, 400);
  }

  const errors: Record<string, string> = {};
  const store = c.get('store');

  // Validate all fields first
  const validEntries: [string, string][] = [];
  for (const [key, value] of Object.entries(changes)) {
    const error = validateSettingField(key, String(value), t);
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
        errors[key] = err instanceof Error ? err.message : t('settings.validation.failedToSave');
        return null;
      }
    })
  );

  const saved = results.filter((key): key is string => key !== null);

  return c.json({ saved, errors });
}

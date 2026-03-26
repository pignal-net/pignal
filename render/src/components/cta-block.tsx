/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { SettingsMap } from '@pignal/db';
import type { TFunction } from '../i18n/types';

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */

interface HeroCtaProps {
  title: string;
  description?: string;
  buttonText: string;
  buttonUrl?: string;
  actionSlug?: string;
}

interface PostCtaProps {
  title: string;
  description?: string;
  buttonText: string;
  buttonUrl?: string;
  actionSlug?: string;
}

interface StickyCtaProps {
  text: string;
  buttonText: string;
  buttonUrl?: string;
  actionSlug?: string;
  t?: TFunction;
}

interface InlineCtaProps {
  title: string;
  description?: string;
  buttonText: string;
  buttonUrl?: string;
  actionSlug?: string;
}

/* ------------------------------------------------------------------ */
/*  Shared: safe URL validation                                       */
/* ------------------------------------------------------------------ */

function safeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? url : undefined;
  } catch {
    return undefined;
  }
}

/* ------------------------------------------------------------------ */
/*  CTA button (shared across variants)                               */
/* ------------------------------------------------------------------ */

function CtaButton({ buttonText, buttonUrl, actionSlug, targetId }: {
  buttonText: string;
  buttonUrl?: string;
  actionSlug?: string;
  targetId: string;
}) {
  const buttonClass = 'bg-primary text-primary-inverse rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors mt-4 inline-block';

  if (actionSlug) {
    return (
      <button
        type="button"
        class={buttonClass}
        hx-get={`/form/${actionSlug}`}
        hx-target={`#${targetId}`}
        hx-swap="innerHTML"
      >
        {buttonText}
      </button>
    );
  }

  const href = safeUrl(buttonUrl);
  if (href) {
    return (
      <a
        href={href}
        class={buttonClass}
        target="_blank"
        rel="noopener"
      >
        {buttonText}
      </a>
    );
  }

  return <span class={buttonClass}>{buttonText}</span>;
}

/* ------------------------------------------------------------------ */
/*  HeroCta — full-width banner at top of source pages                */
/* ------------------------------------------------------------------ */

export function HeroCta({ title, description, buttonText, buttonUrl, actionSlug }: HeroCtaProps) {
  return (
    <div class="bg-primary/5 border border-primary/20 rounded-xl p-8 text-center mb-8">
      <h2 class="text-xl font-bold text-text">{title}</h2>
      {description && <p class="text-muted mt-2">{description}</p>}
      <CtaButton
        buttonText={buttonText}
        buttonUrl={buttonUrl}
        actionSlug={actionSlug}
        targetId="cta-hero-form"
      />
      {actionSlug && <div id="cta-hero-form" class="mt-4" />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PostCta — card shown after article content                        */
/* ------------------------------------------------------------------ */

export function PostCta({ title, description, buttonText, buttonUrl, actionSlug }: PostCtaProps) {
  return (
    <div class="bg-surface rounded-xl border border-border-subtle shadow-card p-6 mt-8">
      <h3 class="text-lg font-semibold text-text">{title}</h3>
      {description && <p class="text-muted mt-2">{description}</p>}
      <CtaButton
        buttonText={buttonText}
        buttonUrl={buttonUrl}
        actionSlug={actionSlug}
        targetId="cta-post-form"
      />
      {actionSlug && <div id="cta-post-form" class="mt-4" />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  StickyCta — fixed bottom bar                                      */
/* ------------------------------------------------------------------ */

const identity = (key: string) => key;

export function StickyCta({ text, buttonText, buttonUrl, actionSlug, t: tProp }: StickyCtaProps) {
  const buttonClass = 'bg-primary text-primary-inverse rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors inline-block';

  return (
    <div class="sticky-cta fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-sm border-t border-border shadow-lg z-40 py-3 px-4">
      <div class="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
        <p class="text-sm text-text">{text}</p>
        <div class="flex items-center gap-3 shrink-0">
          {actionSlug ? (
            <button
              type="button"
              class={buttonClass}
              hx-get={`/form/${actionSlug}`}
              hx-target="#cta-sticky-form"
              hx-swap="innerHTML"
            >
              {buttonText}
            </button>
          ) : (
            safeUrl(buttonUrl)
              ? <a href={safeUrl(buttonUrl)!} class={buttonClass} target="_blank" rel="noopener">{buttonText}</a>
              : <span class={buttonClass}>{buttonText}</span>
          )}
          <button
            type="button"
            class="p-1.5 rounded-md text-muted hover:text-text hover:bg-surface-hover transition-colors"
            onclick="this.closest('.sticky-cta').remove()"
            aria-label={(tProp ?? identity)('common.dismiss')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      {actionSlug && <div id="cta-sticky-form" class="max-w-[1200px] mx-auto mt-3" />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  InlineCta — used by directive handler, rendered inline in content  */
/* ------------------------------------------------------------------ */

export function InlineCta({ title, description, buttonText, buttonUrl, actionSlug }: InlineCtaProps) {
  return (
    <div class="bg-surface rounded-xl border border-border-subtle shadow-card p-6">
      <h3 class="text-lg font-semibold text-text">{title}</h3>
      {description && <p class="text-muted mt-2">{description}</p>}
      <CtaButton
        buttonText={buttonText}
        buttonUrl={buttonUrl}
        actionSlug={actionSlug}
        targetId="cta-inline-form"
      />
      {actionSlug && <div id="cta-inline-form" class="mt-4" />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: read CTA settings for a given slot                        */
/* ------------------------------------------------------------------ */

interface CtaSettingsResult {
  enabled: boolean;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  actionSlug?: string;
  text?: string;
}

export function getCtaSettings(settings: SettingsMap, slot: 'hero' | 'post' | 'sticky'): CtaSettingsResult | null {
  const prefix = `cta_${slot}_`;
  const enabled = settings[`${prefix}enabled`] === 'true';

  if (!enabled) return null;

  if (slot === 'sticky') {
    const text = settings[`${prefix}text`];
    const buttonText = settings[`${prefix}button_text`];
    if (!text || !buttonText) return null;
    return {
      enabled: true,
      text,
      buttonText,
      buttonUrl: settings[`${prefix}button_url`] || undefined,
      actionSlug: settings[`${prefix}action_slug`] || undefined,
    };
  }

  const title = settings[`${prefix}title`];
  const buttonText = settings[`${prefix}button_text`];
  if (!title || !buttonText) return null;

  return {
    enabled: true,
    title,
    description: settings[`${prefix}description`] || undefined,
    buttonText,
    buttonUrl: settings[`${prefix}button_url`] || undefined,
    actionSlug: settings[`${prefix}action_slug`] || undefined,
  };
}

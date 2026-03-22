/**
 * Shared SVG icon components for the Pignal web UI.
 *
 * All icons are inline SVGs (no external dependencies). Default size is 16×16
 * with `currentColor` fill/stroke so they inherit text color from their parent.
 *
 * Usage: <IconSun class="w-4 h-4" /> or <IconSun size={18} />
 */

interface IconProps {
  size?: number;
  class?: string;
}

function s(props: IconProps) {
  return { width: props.size ?? 16, height: props.size ?? 16, class: props.class };
}

// ─── Theme ────────────────────────────────────────────────────────────────────

export function IconSun(props: IconProps) {
  const a = s(props);
  return (
    <svg {...a} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M3.4 12.6l.7-.7M11.9 4.1l.7-.7" />
    </svg>
  );
}

export function IconMoon(props: IconProps) {
  const a = s(props);
  return (
    <svg {...a} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M13.5 8.5a5.5 5.5 0 1 1-6-6 4.5 4.5 0 0 0 6 6z" />
    </svg>
  );
}

export function IconMonitor(props: IconProps) {
  const a = s(props);
  return (
    <svg {...a} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="1.5" y="2" width="13" height="9" rx="1.5" />
      <path d="M5.5 14h5M8 11v3" />
    </svg>
  );
}

// ─── Social ───────────────────────────────────────────────────────────────────

export function IconGitHub(props: IconProps) {
  const a = s(props);
  return (
    <svg {...a} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 .2A8 8 0 0 0 5.47 15.79c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 8 .2z" />
    </svg>
  );
}

export function IconTwitter(props: IconProps) {
  const a = s(props);
  return (
    <svg {...a} viewBox="0 0 16 16" fill="currentColor">
      <path d="M9.29 6.77L14.26 1h-1.18L8.78 5.98 5.49 1H1.33l5.22 7.59L1.33 15h1.18l4.56-5.3L10.51 15h4.16L9.29 6.77zm-1.61 1.88l-.53-.76L2.96 1.92h1.81l3.4 4.86.53.75 4.41 6.31h-1.81L7.68 8.65z" />
    </svg>
  );
}

export function IconRSS(props: IconProps) {
  const a = s(props);
  return (
    <svg {...a} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 11a3 3 0 0 1 3 3" />
      <path d="M2 7a7 7 0 0 1 7 7" />
      <path d="M2 3a11 11 0 0 1 11 11" />
      <circle cx="3" cy="13" r="1" fill="currentColor" />
    </svg>
  );
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export function IconHamburger(props: IconProps) {
  const a = s(props);
  return (
    <svg {...a} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
      <path d="M2 4h12M2 8h12M2 12h12" />
    </svg>
  );
}

export function IconExternalLink(props: IconProps) {
  const a = s(props);
  return (
    <svg {...a} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 8.67V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4.33M10 2h4v4M6.67 9.33L14 2" />
    </svg>
  );
}

export function IconChevronLeft(props: IconProps) {
  const a = s(props);
  return (
    <svg {...a} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 12L6 8l4-4" />
    </svg>
  );
}

export function IconChevronDown(props: IconProps) {
  const a = s(props);
  return (
    <svg {...a} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

export function IconLogout(props: IconProps) {
  const a = s(props);
  return (
    <svg {...a} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M11 11l3-3-3-3M14 8H6" />
    </svg>
  );
}

// ─── Content ──────────────────────────────────────────────────────────────────

export function IconKey(props: IconProps) {
  const a = s(props);
  return (
    <svg {...a} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10.5 1.5l4 4-2 2-1.5-1.5L9.5 7.5 8 6l1-1-2.5-2.5A3.5 3.5 0 1 0 4 8.5L12.5 0" />
      <circle cx="4" cy="12" r="1.5" />
    </svg>
  );
}

export function IconSettings(props: IconProps) {
  const a = s(props);
  return (
    <svg {...a} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6.86 2.07a.75.75 0 0 1 .73-.57h.82a.75.75 0 0 1 .73.57l.2.82a4.5 4.5 0 0 1 .87.5l.8-.26a.75.75 0 0 1 .86.34l.41.71a.75.75 0 0 1-.13.92l-.6.56a4.5 4.5 0 0 1 0 1l.6.56a.75.75 0 0 1 .13.92l-.41.71a.75.75 0 0 1-.86.34l-.8-.26a4.5 4.5 0 0 1-.87.5l-.2.82a.75.75 0 0 1-.73.57h-.82a.75.75 0 0 1-.73-.57l-.2-.82a4.5 4.5 0 0 1-.87-.5l-.8.26a.75.75 0 0 1-.86-.34l-.41-.71a.75.75 0 0 1 .13-.92l.6-.56a4.5 4.5 0 0 1 0-1l-.6-.56a.75.75 0 0 1-.13-.92l.41-.71a.75.75 0 0 1 .86-.34l.8.26a4.5 4.5 0 0 1 .87-.5l.2-.82z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

export function IconList(props: IconProps) {
  const a = s(props);
  return (
    <svg {...a} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 3h8M6 8h8M6 13h8M2 3h.01M2 8h.01M2 13h.01" />
    </svg>
  );
}

export function IconTag(props: IconProps) {
  const a = s(props);
  return (
    <svg {...a} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1.5 9.16V2.5a1 1 0 0 1 1-1h6.66a1 1 0 0 1 .7.29l4.85 4.85a1 1 0 0 1 0 1.41l-5.36 5.36a1 1 0 0 1-1.41 0L1.79 9.87a1 1 0 0 1-.29-.71z" />
      <circle cx="5" cy="5" r="1" fill="currentColor" />
    </svg>
  );
}

export function IconEmptyInbox(props: IconProps) {
  const a = s(props);
  return (
    <svg {...a} viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="6" y="10" width="36" height="28" rx="3" />
      <path d="M6 22h12l3 4h6l3-4h12" />
      <path d="M20 18h8M22 14h4" />
    </svg>
  );
}

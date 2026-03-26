import type { Context } from 'hono';
import type { WebEnv, WebVars } from '../types';
import { Layout } from '@pignal/render/components/layout';
import { createSessionCookie } from '../lib/cookie';
import { timingSafeEqual } from '@pignal/core/auth/timing-safe';
import { getCsrfToken, CSRF_FIELD, CSRF_COOKIE } from '../middleware/csrf';
import { APP_JS_URL, LOGO_SVG_URL } from '@pignal/render/lib/static-versions';

export function loginPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const t = c.get('t');
  const locale = c.get('locale');
  const error = c.req.query('error');

  return c.html(
    <Layout title={`${t('login.title')} | pignal`} locale={locale}>
      <main class="min-h-screen flex items-center justify-center px-4 bg-bg-page">
        <div class="w-full max-w-sm">
          {/* Logo + branding */}
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl shadow-md bg-surface border border-border-subtle mb-4">
              <img src={LOGO_SVG_URL} alt="pignal" width="28" height="28" class="rounded" />
            </div>
            <h1 class="text-2xl font-bold tracking-tight text-text">{t('login.heading')}</h1>
            <p class="text-muted text-sm mt-1">{t('login.subtitle')}</p>
          </div>

          {/* Login card */}
          <div class="bg-surface rounded-2xl shadow-lg border border-border-subtle p-8">
            {error && (
              <div class="mb-4 px-4 py-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm" role="alert">
                {error}
              </div>
            )}
            <form method="post" action="/pignal/login">
              <input type="hidden" name={CSRF_FIELD} value={getCsrfToken(c)} />
              <div class="mb-4">
                <label for="token" class="block text-sm font-medium text-text mb-1.5">{t('login.serverToken')}</label>
                <input
                  id="token"
                  type="password"
                  name="token"
                  required
                  autofocus
                  placeholder={t('login.placeholder')}
                  class="w-full"
                />
              </div>
              <button type="submit" class="w-full py-2.5">{t('login.button')}</button>
            </form>
          </div>

          {/* Footer */}
          <p class="text-center text-xs text-muted mt-6">{t('login.footer')}</p>
        </div>
      </main>
      <script src={APP_JS_URL}></script>
    </Layout>
  );
}

/**
 * Login POST handler with manual CSRF validation.
 * Does NOT use csrfMiddleware (which would overwrite the regenerated CSRF cookie
 * in its post-next() hook). Instead, validates CSRF inline and sets a fresh token.
 */
export async function loginHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  // Manual CSRF validation (same logic as csrfMiddleware)
  const cookieHeader = c.req.header('Cookie');
  const csrfCookieMatch = cookieHeader?.match(new RegExp(`${CSRF_COOKIE}=([^;]+)`));
  const cookieToken = csrfCookieMatch ? csrfCookieMatch[1] : null;

  const body = await c.req.parseBody();
  const submittedToken = body[CSRF_FIELD] as string;

  if (!cookieToken || !submittedToken || cookieToken !== submittedToken) {
    return c.text('CSRF validation failed', 403);
  }

  const token = body.token as string;
  if (!token || !(await timingSafeEqual(token, c.env.SERVER_TOKEN, c.env.SERVER_TOKEN))) {
    return c.redirect('/pignal/login?error=Invalid+token');
  }

  const sessionCookie = await createSessionCookie(c.env.SERVER_TOKEN);
  c.header('Set-Cookie', sessionCookie);

  // Regenerate CSRF token on login to prevent token fixation
  const newCsrf = crypto.randomUUID();
  c.header('Set-Cookie', `${CSRF_COOKIE}=${newCsrf}; SameSite=Strict; Path=/; Secure`, { append: true });

  return c.redirect('/pignal');
}

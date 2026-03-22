import type { Context } from 'hono';
import type { WebEnv } from '../types';
import { Layout } from '../components/layout';
import { createSessionCookie } from '../lib/cookie';
import { APP_JS_URL, LOGO_SVG_URL } from '../lib/static-versions';

export function loginPage(c: Context<{ Bindings: WebEnv }>) {
  const error = c.req.query('error');

  return c.html(
    <Layout title="Login | pignal">
      <main class="min-h-screen flex items-center justify-center px-4 bg-bg-page">
        <div class="w-full max-w-sm">
          {/* Logo + branding */}
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl shadow-md bg-surface border border-border-subtle mb-4">
              <img src={LOGO_SVG_URL} alt="pignal" width="28" height="28" class="rounded" />
            </div>
            <h1 class="text-2xl font-bold tracking-tight text-text">pignal</h1>
            <p class="text-muted text-sm mt-1">Sign in to your signal store</p>
          </div>

          {/* Login card */}
          <div class="bg-surface rounded-2xl shadow-lg border border-border-subtle p-8">
            {error && (
              <div class="mb-4 px-4 py-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm" role="alert">
                {error}
              </div>
            )}
            <form method="post" action="/pignal/login">
              <div class="mb-4">
                <label for="token" class="block text-sm font-medium text-text mb-1.5">Server Token</label>
                <input
                  id="token"
                  type="password"
                  name="token"
                  required
                  autofocus
                  placeholder="Enter SERVER_TOKEN"
                  class="w-full"
                />
              </div>
              <button type="submit" class="w-full py-2.5">Login</button>
            </form>
          </div>

          {/* Footer */}
          <p class="text-center text-xs text-muted mt-6">Self-hosted content platform</p>
        </div>
      </main>
      <script src={APP_JS_URL}></script>
    </Layout>
  );
}

export async function loginHandler(c: Context<{ Bindings: WebEnv }>) {
  const body = await c.req.parseBody();
  const token = body.token as string;

  if (!token || token !== c.env.SERVER_TOKEN) {
    return c.redirect('/pignal/login?error=Invalid+token');
  }

  const cookie = await createSessionCookie(c.env.SERVER_TOKEN);
  c.header('Set-Cookie', cookie);
  return c.redirect('/pignal');
}

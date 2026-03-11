import type { Context } from 'hono';
import type { WebEnv } from '../types';
import { Layout } from '../components/layout';
import { createSessionCookie } from '../lib/cookie';
import { APP_JS_URL } from '../lib/static-versions';

export function loginPage(c: Context<{ Bindings: WebEnv }>) {
  const error = c.req.query('error');

  return c.html(
    <Layout title="Login | pignal">
      <main class="container login-container">
        <article>
          <header>
            <h1>pignal</h1>
            <p>Enter your server token to continue.</p>
          </header>
          {error && <div class="flash flash-error">{error}</div>}
          <form method="post" action="/pignal/login">
            <label>
              Server Token
              <input
                type="password"
                name="token"
                required
                autofocus
                placeholder="Enter SERVER_TOKEN"
              />
            </label>
            <button type="submit">Login</button>
          </form>
        </article>
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

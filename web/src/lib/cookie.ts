const COOKIE_NAME = 'pignal_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Cache the imported HMAC key per isolate (deterministic for same secret)
let cachedHmacKey: CryptoKey | null = null;
let cachedHmacSecret: string | null = null;

async function getHmacKey(secret: string): Promise<CryptoKey> {
  if (cachedHmacKey && cachedHmacSecret === secret) return cachedHmacKey;
  const enc = new TextEncoder();
  cachedHmacKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  cachedHmacSecret = secret;
  return cachedHmacKey;
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await getHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(data, secret);
  if (expected.length !== signature.length) return false;
  // Timing-safe comparison: compute HMAC of both values with the secret
  // and compare the results -- prevents timing side-channel attacks
  const enc = new TextEncoder();
  const key = await getHmacKey(secret);
  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign('HMAC', key, enc.encode(expected)),
    crypto.subtle.sign('HMAC', key, enc.encode(signature)),
  ]);
  const a = new Uint8Array(sigA);
  const b = new Uint8Array(sigB);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

export async function createSessionCookie(secret: string): Promise<string> {
  const expiry = Date.now() + SESSION_DURATION_MS;
  const sig = await hmacSign(String(expiry), secret);
  const value = `${expiry}:${sig}`;
  const expires = new Date(expiry).toUTCString();
  return `${COOKIE_NAME}=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Expires=${expires}`;
}

export async function verifySessionCookie(
  cookieHeader: string | undefined,
  secret: string
): Promise<boolean> {
  if (!cookieHeader) return false;

  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;

  const [expiryStr, sig] = match[1].split(':');
  if (!expiryStr || !sig) return false;

  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry) || Date.now() > expiry) return false;

  return hmacVerify(expiryStr, sig, secret);
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export { COOKIE_NAME };

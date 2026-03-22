/**
 * Timing-safe string comparison using HMAC double-compute pattern.
 * Prevents timing side-channel attacks when comparing secrets like tokens.
 *
 * Works on Cloudflare Workers (no Node.js crypto.timingSafeEqual needed).
 */
export async function timingSafeEqual(a: string, b: string, secret: string): Promise<boolean> {
  // No early length check — that would leak length information via timing.
  // HMAC produces fixed-size digests regardless of input length, so the
  // constant-time XOR comparison below handles length mismatches correctly.
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign('HMAC', key, enc.encode(a)),
    crypto.subtle.sign('HMAC', key, enc.encode(b)),
  ]);

  const bytesA = new Uint8Array(sigA);
  const bytesB = new Uint8Array(sigB);
  if (bytesA.length !== bytesB.length) return false;

  let diff = 0;
  for (let i = 0; i < bytesA.length; i++) {
    diff |= bytesA[i] ^ bytesB[i];
  }
  return diff === 0;
}

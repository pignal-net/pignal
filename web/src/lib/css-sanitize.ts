/**
 * Sanitize user-provided custom CSS to prevent XSS and external resource loading.
 *
 * Blocks:
 * - </style> escape sequences
 * - @import rules (external resource loading)
 * - expression() (legacy IE script execution)
 * - behavior: property (legacy IE script execution)
 * - -moz-binding: property (legacy Firefox script execution)
 * - url() with non-https/relative schemes (data:, javascript:, etc.)
 */
export function sanitizeCss(input: string): string {
  let css = input;

  // Block breaking out of <style> context
  css = css.replace(/<\/style\s*>/gi, '/* blocked */');

  // Block @import rules (can load external CSS / exfiltrate data)
  css = css.replace(/@import\s+[^;]*;?/gi, '/* @import blocked */');

  // Block expression() — legacy IE CSS expressions
  css = css.replace(/expression\s*\(/gi, '/* expression blocked */(');

  // Block behavior: property — legacy IE HTC
  css = css.replace(/behavior\s*:/gi, '/* behavior blocked */:');

  // Block -moz-binding: property — legacy Firefox XBL
  css = css.replace(/-moz-binding\s*:/gi, '/* -moz-binding blocked */:');

  // Block url() with dangerous schemes (allow https:, http:, relative, and fragment refs)
  css = css.replace(
    /url\s*\(\s*(['"]?)\s*((?:data|javascript|vbscript)\s*:)/gi,
    'url($1/* blocked:$2 */'
  );

  return css;
}

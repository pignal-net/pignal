import type { Template } from './types';
import { resolvedTemplate } from './_resolved';

/**
 * Returns the build-time resolved template.
 *
 * In the self-hosted server, only one template is active per deployment.
 * The resolve-template script generates _resolved.ts with the selected template.
 */
export function getTemplate(_templateName: string): Template {
  return resolvedTemplate;
}

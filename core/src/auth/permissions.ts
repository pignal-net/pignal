/**
 * Flat API key permission definitions and enforcement.
 *
 * Each permission maps directly to a specific API/tool capability.
 * No resource:action grouping — users select exactly which operations they need.
 *
 * Special permission:
 * - `admin`: Full access (granted to SERVER_TOKEN only, not exposed in UI)
 */

export const VALID_PERMISSIONS = [
  'save_item',
  'list_items',
  'edit_item',
  'delete_item',
  'validate_item',
  'get_metadata',
  'manage_types',
  'manage_workspaces',
  'manage_settings',
] as const;

export type Permission = (typeof VALID_PERMISSIONS)[number];

/**
 * Parse and validate a comma-separated permission string.
 * Silently drops invalid permissions.
 */
export function parsePermissions(str: string): string[] {
  const valid = new Set<string>(VALID_PERMISSIONS);
  return str
    .split(',')
    .map((s) => s.trim())
    .filter((s) => valid.has(s));
}

/**
 * Check if a set of permissions includes the required one.
 * `admin` permission grants everything.
 */
export function hasPermission(permissions: readonly string[], required: string): boolean {
  if (permissions.includes('admin')) return true;
  return permissions.includes(required);
}

/**
 * Validate that all permissions in a list are valid.
 * Returns invalid permission names if any.
 */
export function validatePermissions(perms: string[]): { valid: boolean; invalid: string[] } {
  const validSet = new Set<string>(VALID_PERMISSIONS);
  const invalid = perms.filter((s) => !validSet.has(s));
  return { valid: invalid.length === 0, invalid };
}

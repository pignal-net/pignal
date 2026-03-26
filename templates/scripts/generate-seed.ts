/**
 * Generates a SQL seed file from a template's TemplateSeedData profile.
 *
 * Usage: pnpm seed:generate <template-name>
 *
 * Reads the TemplateConfig for the given template and writes a SQL file
 * to templates/seeds/<name>.sql with deterministic UUIDs.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import type { TemplateSeedData, TemplateTypeSeed, TemplateWorkspaceSeed, TemplateSettingsSeed } from '../src/config';
import { getTemplateConfig } from '../src/all-configs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a deterministic UUID v5-like hash from a namespace + name */
function deterministicUuid(namespace: string, name: string): string {
  const hash = crypto.createHash('sha256').update(`${namespace}:${name}`).digest('hex');
  // Format as UUID v4-like (8-4-4-4-12)
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    '8' + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-');
}

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

function die(message: string): never {
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
}

const now = new Date().toISOString();

// ---------------------------------------------------------------------------
// SQL generators
// ---------------------------------------------------------------------------

function generateTypeSql(templateId: string, type: TemplateTypeSeed, sortOrder: number): string {
  const typeId = deterministicUuid(templateId, `type:${type.name}`);
  const guidance = JSON.stringify(type.guidance);

  const lines: string[] = [];

  // Insert type
  lines.push(
    `INSERT OR IGNORE INTO \`item_types\` (\`id\`, \`name\`, \`description\`, \`color\`, \`icon\`, \`guidance\`, \`is_system\`, \`sort_order\`, \`created_at\`, \`updated_at\`) VALUES ('${typeId}', '${escapeSql(type.name)}', '${escapeSql(type.description)}', '${type.color}', '${type.icon}', '${escapeSql(guidance)}', 1, ${sortOrder}, '${now}', '${now}');`,
  );

  // Insert actions
  for (let i = 0; i < type.actions.length; i++) {
    const actionId = deterministicUuid(templateId, `action:${type.name}:${type.actions[i]}`);
    lines.push(
      `INSERT OR IGNORE INTO \`type_actions\` (\`id\`, \`type_id\`, \`label\`, \`sort_order\`, \`created_at\`) VALUES ('${actionId}', '${typeId}', '${escapeSql(type.actions[i])}', ${i}, '${now}');`,
    );
  }

  return lines.join('\n');
}

function generateWorkspaceSql(templateId: string, ws: TemplateWorkspaceSeed): string {
  const wsId = deterministicUuid(templateId, `workspace:${ws.name}`);
  return `INSERT OR IGNORE INTO \`workspaces\` (\`id\`, \`name\`, \`description\`, \`visibility\`, \`is_default\`, \`created_at\`, \`updated_at\`) VALUES ('${wsId}', '${escapeSql(ws.name)}', '${escapeSql(ws.description)}', '${ws.visibility}', 1, '${now}', '${now}');`;
}

function generateSettingsSql(settings: TemplateSettingsSeed): string {
  const lines: string[] = [];

  lines.push(
    `INSERT OR IGNORE INTO \`settings\` (\`key\`, \`value\`, \`updated_at\`) VALUES ('source_title', '${escapeSql(settings.sourceTitle)}', datetime('now'));`,
  );
  lines.push(
    `INSERT OR IGNORE INTO \`settings\` (\`key\`, \`value\`, \`updated_at\`) VALUES ('source_description', '${escapeSql(settings.sourceDescription)}', datetime('now'));`,
  );

  const guidelines = JSON.stringify(settings.qualityGuidelines);
  lines.push(
    `INSERT OR IGNORE INTO \`settings\` (\`key\`, \`value\`, \`updated_at\`) VALUES ('quality_guidelines', '${escapeSql(guidelines)}', datetime('now'));`,
  );

  const limits = JSON.stringify({
    keySummary: settings.validationLimits.keySummary,
    content: settings.validationLimits.content,
    sourceAi: { min: 1, max: 100 },
  });
  lines.push(
    `INSERT OR IGNORE INTO \`settings\` (\`key\`, \`value\`, \`updated_at\`) VALUES ('validation_limits', '${escapeSql(limits)}', datetime('now'));`,
  );

  return lines.join('\n');
}

function generateSeedSql(templateId: string, seedData: TemplateSeedData): string {
  const vocab = getTemplateConfig(templateId).vocabulary;

  const sections: string[] = [];

  // Header
  sections.push(`-- Seed data for ${templateId} template: ${vocab.typePlural}, validation actions, ${vocab.workspacePlural}, settings`);

  // Types
  sections.push(`\n-- Item types (${templateId}: ${seedData.types.map((t) => t.name).join(', ')})`);
  for (let i = 0; i < seedData.types.length; i++) {
    sections.push(generateTypeSql(templateId, seedData.types[i], i));
  }

  // Workspaces
  sections.push(`\n-- ${vocab.workspacePlural.charAt(0).toUpperCase() + vocab.workspacePlural.slice(1)} (${templateId})`);
  for (const ws of seedData.workspaces) {
    sections.push(generateWorkspaceSql(templateId, ws));
  }

  // Settings
  sections.push(`\n-- ${templateId}-specific settings`);
  sections.push(generateSettingsSql(seedData.settings));

  return sections.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const templateName = process.argv[2];

if (!templateName) {
  die('Template name required.\n\nUsage: pnpm seed:generate <template-name>\nExample: pnpm seed:generate wiki');
}

const config = getTemplateConfig(templateName);
if (!config.profile) {
  die(`Template "${templateName}" does not have a profile defined in config.ts.`);
}

const sql = generateSeedSql(templateName, config.profile.seedData);
const outPath = path.resolve(import.meta.dirname, '..', 'seeds', `${templateName}.sql`);
fs.writeFileSync(outPath, sql);

process.stdout.write(`Seed SQL generated: ${outPath}\n`);

-- Migration: Settings branding rework
-- Migrate source_color_primary -> source_color_accent (theme system rework)
UPDATE settings SET key = 'source_color_accent', updated_at = datetime('now')
WHERE key = 'source_color_primary' AND value != ''
AND NOT EXISTS (SELECT 1 FROM settings WHERE key = 'source_color_accent');

-- Migrate source_url -> source_social_website (social links consolidation)
UPDATE settings SET key = 'source_social_website', updated_at = datetime('now')
WHERE key = 'source_url' AND value != ''
AND NOT EXISTS (SELECT 1 FROM settings WHERE key = 'source_social_website');

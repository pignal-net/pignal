-- Site Actions (forms, lead capture)
CREATE TABLE IF NOT EXISTS site_actions (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  fields TEXT NOT NULL,
  settings TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  submission_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_actions_slug ON site_actions (slug);
CREATE INDEX IF NOT EXISTS idx_site_actions_status ON site_actions (status);

-- Form Submissions
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY NOT NULL,
  action_id TEXT NOT NULL REFERENCES site_actions(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  ip_hash TEXT,
  referrer TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_submissions_action ON submissions (action_id, created_at);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions (action_id, status);

-- Page Views (analytics)
CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  slug TEXT,
  referrer TEXT,
  country TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_views_path_date ON page_views (path, created_at);
CREATE INDEX IF NOT EXISTS idx_views_slug ON page_views (slug);

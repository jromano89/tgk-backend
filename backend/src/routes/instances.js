const express = require('express');
const { getDb } = require('../database');
const { DEFAULT_INSTANCES } = require('../instance-configs');
const { VERTICALS, STORYLINE_PRESETS, PRESETS_BY_KEY, buildConfigFromPreset } = require('../storyline-presets');
const { createError, normalizeSlug, route } = require('../utils');

const router = express.Router();

function ensureSeeded(db) {
  const count = db.prepare('SELECT COUNT(*) as n FROM instances').get().n;
  if (count === 0) {
    const insert = db.prepare('INSERT OR IGNORE INTO instances (slug, config) VALUES (?, ?)');
    for (const [slug, config] of Object.entries(DEFAULT_INSTANCES)) {
      insert.run(slug, JSON.stringify(config));
    }
  }
}

function parseRow(row) {
  if (!row) return null;
  return { slug: row.slug, config: JSON.parse(row.config), createdAt: row.created_at, updatedAt: row.updated_at };
}

// GET /api/instances — list all instances
router.get('/', route((req, res) => {
  const db = getDb();
  ensureSeeded(db);
  const rows = db.prepare('SELECT * FROM instances ORDER BY created_at').all();
  res.json(rows.map(parseRow));
}));

// GET /api/instances/presets — verticals + preset summaries for wizard
router.get('/presets', route((req, res) => {
  const presets = STORYLINE_PRESETS.map(p => ({
    key: p.key,
    vertical: p.vertical,
    title: p.title,
    description: p.description,
    highlightedProducts: p.highlightedProducts,
    brandColor: p.brandColor,
    portalName: p.portalName,
    terminology: p.terminology
  }));
  res.json({ verticals: VERTICALS, presets });
}));

// POST /api/instances/from-preset — create instance from a preset
router.post('/from-preset', route((req, res) => {
  const db = getDb();
  ensureSeeded(db);
  const { slug: rawSlug, presetKey, overrides } = req.body || {};
  const slug = normalizeSlug(rawSlug);
  if (!slug) throw createError(400, 'Missing or invalid slug.');
  if (!presetKey) throw createError(400, 'Missing presetKey.');

  const preset = PRESETS_BY_KEY[presetKey];
  if (!preset) throw createError(400, `Unknown preset "${presetKey}".`);

  const existing = db.prepare('SELECT slug FROM instances WHERE slug = ?').get(slug);
  if (existing) throw createError(409, `Instance "${slug}" already exists.`);

  const config = buildConfigFromPreset(preset, overrides || {});
  db.prepare('INSERT INTO instances (slug, config) VALUES (?, ?)').run(slug, JSON.stringify(config));
  const row = db.prepare('SELECT * FROM instances WHERE slug = ?').get(slug);
  res.status(201).json(parseRow(row));
}));

// GET /api/instances/:slug — get one instance
router.get('/:slug', route((req, res) => {
  const db = getDb();
  ensureSeeded(db);
  const slug = normalizeSlug(req.params.slug);
  if (!slug) throw createError(400, 'Invalid instance slug.');
  const row = db.prepare('SELECT * FROM instances WHERE slug = ?').get(slug);
  if (!row) throw createError(404, `Instance "${slug}" not found.`);
  res.json(parseRow(row));
}));

// POST /api/instances — create a new instance
router.post('/', route((req, res) => {
  const db = getDb();
  ensureSeeded(db);
  const { slug: rawSlug, config } = req.body || {};
  const slug = normalizeSlug(rawSlug);
  if (!slug) throw createError(400, 'Missing or invalid slug.');
  if (!config || typeof config !== 'object') throw createError(400, 'Missing config object.');

  const existing = db.prepare('SELECT slug FROM instances WHERE slug = ?').get(slug);
  if (existing) throw createError(409, `Instance "${slug}" already exists.`);

  db.prepare('INSERT INTO instances (slug, config) VALUES (?, ?)').run(slug, JSON.stringify(config));
  const row = db.prepare('SELECT * FROM instances WHERE slug = ?').get(slug);
  res.status(201).json(parseRow(row));
}));

// PUT /api/instances/:slug — update an instance
router.put('/:slug', route((req, res) => {
  const db = getDb();
  ensureSeeded(db);
  const slug = normalizeSlug(req.params.slug);
  if (!slug) throw createError(400, 'Invalid instance slug.');

  const existing = db.prepare('SELECT slug FROM instances WHERE slug = ?').get(slug);
  if (!existing) throw createError(404, `Instance "${slug}" not found.`);

  const { config } = req.body || {};
  if (!config || typeof config !== 'object') throw createError(400, 'Missing config object.');

  db.prepare('UPDATE instances SET config = ?, updated_at = CURRENT_TIMESTAMP WHERE slug = ?').run(JSON.stringify(config), slug);
  const row = db.prepare('SELECT * FROM instances WHERE slug = ?').get(slug);
  res.json(parseRow(row));
}));

module.exports = router;

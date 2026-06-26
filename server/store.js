// Tiny zero-dependency JSON document store.
// Each entity type is persisted as server/data/<Entity>.json holding an array of records.
// This replaces base44's hosted entity database for the standalone build.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
} catch {
  /* read-only fs (e.g. Vercel) — store falls back to in-memory only */
}

// Simple per-entity in-memory cache + lazy file persistence.
const cache = new Map();

function fileFor(entity) {
  // Guard against path traversal; allow only safe identifier characters.
  const safe = String(entity).replace(/[^a-zA-Z0-9_]/g, '');
  return path.join(DATA_DIR, `${safe}.json`);
}

function load(entity) {
  if (cache.has(entity)) return cache.get(entity);
  const f = fileFor(entity);
  let rows = [];
  if (fs.existsSync(f)) {
    try {
      rows = JSON.parse(fs.readFileSync(f, 'utf-8'));
      if (!Array.isArray(rows)) rows = [];
    } catch {
      rows = [];
    }
  }
  cache.set(entity, rows);
  return rows;
}

function persist(entity) {
  const rows = cache.get(entity) || [];
  try {
    fs.writeFileSync(fileFor(entity), JSON.stringify(rows, null, 2));
  } catch {
    /* read-only fs — keep in-memory only */
  }
}

function uid() {
  return (
    Date.now().toString(36) +
    '_' +
    Math.random().toString(36).slice(2, 10)
  );
}

function nowIso() {
  return new Date().toISOString();
}

// Apply a base44-style equality filter object to a row.
function matches(row, query) {
  if (!query || typeof query !== 'object') return true;
  return Object.entries(query).every(([k, v]) => {
    if (v === undefined) return true;
    // Support array "in" semantics if the caller passes an array.
    if (Array.isArray(v)) return v.includes(row[k]);
    return row[k] === v;
  });
}

// Sort by a base44-style sort string: "field" asc, "-field" desc.
function applySort(rows, sort) {
  if (!sort) return rows;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...rows].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    if (av < bv) return desc ? 1 : -1;
    return desc ? -1 : 1;
  });
}

export const store = {
  list(entity, { sort, limit } = {}) {
    let rows = applySort(load(entity), sort);
    if (limit) rows = rows.slice(0, limit);
    return rows;
  },

  filter(entity, query, { sort, limit } = {}) {
    let rows = load(entity).filter((r) => matches(r, query));
    rows = applySort(rows, sort);
    if (limit) rows = rows.slice(0, limit);
    return rows;
  },

  read(entity, id) {
    return load(entity).find((r) => r.id === id) || null;
  },

  create(entity, data, createdBy) {
    const rows = load(entity);
    const record = {
      id: uid(),
      ...data,
      created_by: data.created_by || createdBy || 'local@proofly.app',
      created_date: data.created_date || nowIso(),
      updated_date: nowIso(),
    };
    rows.push(record);
    persist(entity);
    return record;
  },

  bulkCreate(entity, items, createdBy) {
    const rows = load(entity);
    const created = items.map((data) => ({
      id: uid(),
      ...data,
      created_by: data.created_by || createdBy || 'local@proofly.app',
      created_date: data.created_date || nowIso(),
      updated_date: nowIso(),
    }));
    rows.push(...created);
    persist(entity);
    return created;
  },

  update(entity, id, data) {
    const rows = load(entity);
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...data, id, updated_date: nowIso() };
    persist(entity);
    return rows[idx];
  },

  remove(entity, id) {
    const rows = load(entity);
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    rows.splice(idx, 1);
    persist(entity);
    return true;
  },
};

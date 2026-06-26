// Document store with two backends:
//   - Postgres (when POSTGRES_URL is set, e.g. on Vercel) -> persistent
//   - JSON files in server/data (local dev) -> zero-config
// All methods are async and share the same interface.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const USE_PG = !!process.env.POSTGRES_URL;

export const usingDatabase = USE_PG;

try {
  if (!USE_PG && !fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
} catch {
  /* read-only fs */
}

function uid() {
  return Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}
function nowIso() {
  return new Date().toISOString();
}
function safeField(f) {
  return String(f).replace(/[^a-zA-Z0-9_]/g, '') || 'created_date';
}
function finalizeRecord(data, createdBy) {
  const id = data.id || uid();
  return {
    ...data,
    id,
    created_by: data.created_by || createdBy || 'local@proofly.app',
    created_date: data.created_date || nowIso(),
    updated_date: nowIso(),
  };
}

/* ============================================================
   Postgres backend
   ============================================================ */
let _sql = null;
let _schema = null;
async function pg() {
  if (!_sql) {
    const mod = await import('@vercel/postgres');
    _sql = mod.sql;
  }
  if (!_schema) {
    _schema = _sql.query(
      `CREATE TABLE IF NOT EXISTS documents (
         entity text NOT NULL,
         id text NOT NULL,
         doc jsonb NOT NULL,
         created_date timestamptz NOT NULL DEFAULT now(),
         PRIMARY KEY (entity, id)
       )`
    );
  }
  await _schema;
  return _sql;
}
function orderClause(sort) {
  if (!sort) return '';
  const desc = sort.startsWith('-');
  const field = safeField(desc ? sort.slice(1) : sort);
  return ` ORDER BY doc->>'${field}' ${desc ? 'DESC' : 'ASC'}`;
}

const pgStore = {
  async list(entity, { sort, limit } = {}) {
    const s = await pg();
    const params = [entity];
    let q = `SELECT doc FROM documents WHERE entity = $1${orderClause(sort)}`;
    if (limit) {
      params.push(limit);
      q += ` LIMIT $${params.length}`;
    }
    const { rows } = await s.query(q, params);
    return rows.map((r) => r.doc);
  },
  async filter(entity, query, { sort, limit } = {}) {
    const s = await pg();
    const params = [entity, JSON.stringify(query || {})];
    let q = `SELECT doc FROM documents WHERE entity = $1 AND doc @> $2${orderClause(sort)}`;
    if (limit) {
      params.push(limit);
      q += ` LIMIT $${params.length}`;
    }
    const { rows } = await s.query(q, params);
    return rows.map((r) => r.doc);
  },
  async read(entity, id) {
    const s = await pg();
    const { rows } = await s.query(`SELECT doc FROM documents WHERE entity = $1 AND id = $2`, [entity, id]);
    return rows[0]?.doc || null;
  },
  async create(entity, data, createdBy) {
    const s = await pg();
    const record = finalizeRecord(data, createdBy);
    await s.query(
      `INSERT INTO documents (entity, id, doc, created_date) VALUES ($1, $2, $3, $4)
       ON CONFLICT (entity, id) DO UPDATE SET doc = EXCLUDED.doc`,
      [entity, record.id, JSON.stringify(record), record.created_date]
    );
    return record;
  },
  async bulkCreate(entity, items, createdBy) {
    const out = [];
    for (const item of items) out.push(await this.create(entity, item, createdBy));
    return out;
  },
  async update(entity, id, data) {
    const existing = await this.read(entity, id);
    if (!existing) return null;
    const merged = { ...existing, ...data, id, updated_date: nowIso() };
    const s = await pg();
    await s.query(`UPDATE documents SET doc = $3 WHERE entity = $1 AND id = $2`, [
      entity,
      id,
      JSON.stringify(merged),
    ]);
    return merged;
  },
  async remove(entity, id) {
    const s = await pg();
    const { rowCount } = await s.query(`DELETE FROM documents WHERE entity = $1 AND id = $2`, [entity, id]);
    return rowCount > 0;
  },
};

/* ============================================================
   JSON-file backend (local dev)
   ============================================================ */
const cache = new Map();
function fileFor(entity) {
  return path.join(DATA_DIR, `${String(entity).replace(/[^a-zA-Z0-9_]/g, '')}.json`);
}
function load(entity) {
  if (cache.has(entity)) return cache.get(entity);
  let rows = [];
  try {
    const f = fileFor(entity);
    if (fs.existsSync(f)) rows = JSON.parse(fs.readFileSync(f, 'utf-8'));
    if (!Array.isArray(rows)) rows = [];
  } catch {
    rows = [];
  }
  cache.set(entity, rows);
  return rows;
}
function persist(entity) {
  try {
    fs.writeFileSync(fileFor(entity), JSON.stringify(cache.get(entity) || [], null, 2));
  } catch {
    /* read-only fs */
  }
}
function matches(row, query) {
  if (!query) return true;
  return Object.entries(query).every(([k, v]) => {
    if (v === undefined) return true;
    if (Array.isArray(v)) return v.includes(row[k]);
    return row[k] === v;
  });
}
function applySort(rows, sort) {
  if (!sort) return rows;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...rows].sort((a, b) => {
    const av = a[field], bv = b[field];
    if (av === bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (av < bv) return desc ? 1 : -1;
    return desc ? -1 : 1;
  });
}
const jsonStore = {
  async list(entity, { sort, limit } = {}) {
    let rows = applySort(load(entity), sort);
    return limit ? rows.slice(0, limit) : rows;
  },
  async filter(entity, query, { sort, limit } = {}) {
    let rows = applySort(load(entity).filter((r) => matches(r, query)), sort);
    return limit ? rows.slice(0, limit) : rows;
  },
  async read(entity, id) {
    return load(entity).find((r) => r.id === id) || null;
  },
  async create(entity, data, createdBy) {
    const rows = load(entity);
    const record = finalizeRecord(data, createdBy);
    rows.push(record);
    persist(entity);
    return record;
  },
  async bulkCreate(entity, items, createdBy) {
    const rows = load(entity);
    const created = items.map((d) => finalizeRecord(d, createdBy));
    rows.push(...created);
    persist(entity);
    return created;
  },
  async update(entity, id, data) {
    const rows = load(entity);
    const i = rows.findIndex((r) => r.id === id);
    if (i === -1) return null;
    rows[i] = { ...rows[i], ...data, id, updated_date: nowIso() };
    persist(entity);
    return rows[i];
  },
  async remove(entity, id) {
    const rows = load(entity);
    const i = rows.findIndex((r) => r.id === id);
    if (i === -1) return false;
    rows.splice(i, 1);
    persist(entity);
    return true;
  },
};

export const store = USE_PG ? pgStore : jsonStore;

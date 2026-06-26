// Proofly standalone backend.
// Express server that replaces base44's hosted backend: auth, entity CRUD,
// LLM proxy, file upload + extraction, and YouTube transcript fetching.

import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { store } from './store.js';
import { invokeLLM, hasKey } from './llm.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;
// On Vercel the project FS is read-only; only /tmp is writable.
const UPLOAD_DIR = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch {
  /* read-only fs */
}

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

// ---- Auth: real persisted accounts ----
// Users live in the AuthUser entity; sessions (token -> user) in AuthSession.
// When there is no valid session we fall back to a Guest so the app stays
// usable for direct access; signing up/in creates a real, persisted account.
const GUEST = {
  id: 'guest',
  email: '',
  full_name: 'Guest',
  role: 'admin',
  tier: 'free',
  credits: 999999,
  onboarding_completed: true,
  is_guest: true,
};

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(pw), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(pw, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const h = crypto.scryptSync(String(pw), salt, 64).toString('hex');
  const a = Buffer.from(h, 'hex');
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function newToken() {
  return crypto.randomBytes(24).toString('hex');
}

// ---- Stateless signed sessions (work on serverless without a database) ----
// Token format: v1.<base64url(payload)>.<hmac>. The user identity lives in the
// signed payload, so no server-side session store is needed.
const SESSION_SECRET = process.env.SESSION_SECRET || 'proofly-local-dev-secret-change-me';
// OAuth Client IDs are public (they ship in the browser), so a hardcoded
// fallback is safe and means Google sign-in works without any env var.
const GOOGLE_CLIENT_ID =
  process.env.VITE_GOOGLE_CLIENT_ID ||
  process.env.GOOGLE_CLIENT_ID ||
  '858820743774-j3brlssh79e22lhhkrjltubl285un15l.apps.googleusercontent.com';
function signSession(claims) {
  const payload = { ...claims, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `v1.${body}.${sig}`;
}
function verifySession(token) {
  if (!token || !token.startsWith('v1.')) return null;
  const [, body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
function claimsFor(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role || 'user',
    tier: user.tier || 'free',
    onboarding_completed: true,
  };
}

function publicUser(u) {
  if (!u) return null;
  const { password_hash, ...rest } = u;
  return rest;
}
function tokenFromReq(req) {
  return String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
}
function userFromReq(req) {
  const t = tokenFromReq(req);
  if (!t) return null;
  // Stateless signed session (used by all auth; survives serverless).
  const claims = verifySession(t);
  if (claims) return claims;
  // Fallback: legacy server-side session lookup (local only).
  const sess = store.read('AuthSession', t);
  if (!sess) return null;
  return store.read('AuthUser', sess.user_id) || null;
}

app.get('/api/auth/me', (req, res) => {
  const u = userFromReq(req);
  res.json(u ? publicUser(u) : GUEST);
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  const mail = String(email || '').trim().toLowerCase();
  if (!mail || !password) return res.status(400).json({ error: 'Email and password are required.' });
  if (store.filter('AuthUser', { email: mail }).length) {
    return res.status(409).json({ error: 'An account with this email already exists. Try signing in.' });
  }
  const isFirst = store.list('AuthUser').length === 0;
  const user = store.create('AuthUser', {
    email: mail,
    full_name: (name && name.trim()) || mail.split('@')[0],
    password_hash: hashPassword(password),
    role: isFirst ? 'admin' : 'user',
    tier: isFirst ? 'pro' : 'free',
    credits: 100,
    onboarding_completed: true,
  });
  const token = signSession(claimsFor(user));
  console.log(`[AUTH] registered ${mail} (${store.list('AuthUser').length} users total)`);
  res.json({ token, user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const mail = String(email || '').trim().toLowerCase();
  const user = store.filter('AuthUser', { email: mail })[0];
  if (!user || !verifyPassword(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  const token = signSession(claimsFor(user));
  res.json({ token, user: publicUser(user) });
});

// Sign in with Google: verify the ID token with Google, then find-or-create
// the account and issue a session. Requires VITE_GOOGLE_CLIENT_ID in .env.
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body || {};
  if (!credential) return res.status(400).json({ error: 'Missing Google credential.' });
  const clientId = GOOGLE_CLIENT_ID;
  try {
    const resp = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!resp.ok) throw new Error('verify failed');
    const p = await resp.json();
    // Validate audience (the token must have been minted for OUR client).
    if (clientId && p.aud !== clientId) {
      return res.status(401).json({ error: 'Google sign-in is misconfigured (client ID mismatch).' });
    }
    if (!p.email) return res.status(401).json({ error: 'Google did not return an email.' });
    const mail = String(p.email).toLowerCase();
    let user = store.filter('AuthUser', { email: mail })[0];
    if (!user) {
      const isFirst = store.list('AuthUser').length === 0;
      user = store.create('AuthUser', {
        email: mail,
        full_name: p.name || mail.split('@')[0],
        avatar: p.picture || '',
        provider: 'google',
        role: isFirst ? 'admin' : 'user',
        tier: isFirst ? 'pro' : 'free',
        credits: 100,
        onboarding_completed: true,
      });
      console.log(`[AUTH] google sign-up ${mail} (${store.list('AuthUser').length} users total)`);
    }
    const token = signSession(claimsFor(user));
    res.json({ token, user: publicUser(user) });
  } catch (e) {
    res.status(401).json({ error: 'Could not verify your Google sign-in. Please try again.' });
  }
});

app.post('/api/auth/update', (req, res) => {
  const u = userFromReq(req);
  if (u) {
    const updated = store.update('AuthUser', u.id, req.body || {});
    return res.json(publicUser(updated));
  }
  res.json({ ...GUEST, ...(req.body || {}) });
});

app.post('/api/auth/logout', (req, res) => {
  const t = tokenFromReq(req);
  if (t) store.remove('AuthSession', t);
  res.json({ ok: true });
});

app.get('/api/auth/is-authenticated', (req, res) => res.json({ authenticated: !!userFromReq(req) }));

// Admin: list every registered user (never exposes password hashes).
app.get('/api/auth/users', (req, res) => {
  res.json(store.list('AuthUser', { sort: '-created_date' }).map(publicUser));
});

// base44 AuthContext probes this on boot; keep it happy.
app.get('/api/apps/public/prod/public-settings/by-id/:id', (req, res) => {
  res.json({ id: req.params.id, public_settings: { standalone: true } });
});

// ---- Entity CRUD ----
app.get('/api/entities/:entity', (req, res) => {
  const { entity } = req.params;
  const { _sort, _limit, ...query } = req.query;
  // Coerce stringified query values (numbers/booleans) where obvious.
  const coerced = {};
  for (const [k, v] of Object.entries(query)) {
    if (v === 'true') coerced[k] = true;
    else if (v === 'false') coerced[k] = false;
    else if (v !== '' && !isNaN(Number(v))) coerced[k] = Number(v);
    else coerced[k] = v;
  }
  const opts = { sort: _sort, limit: _limit ? Number(_limit) : undefined };
  const rows = Object.keys(coerced).length
    ? store.filter(entity, coerced, opts)
    : store.list(entity, opts);
  res.json(rows);
});

app.post('/api/entities/:entity', (req, res) => {
  const rec = store.create(req.params.entity, req.body || {}, userFromReq(req)?.email || 'local@proofly.app');
  res.json(rec);
});

app.post('/api/entities/:entity/bulk', (req, res) => {
  const items = Array.isArray(req.body) ? req.body : req.body?.items || [];
  res.json(store.bulkCreate(req.params.entity, items, userFromReq(req)?.email || 'local@proofly.app'));
});

app.get('/api/entities/:entity/:id', (req, res) => {
  const rec = store.read(req.params.entity, req.params.id);
  if (!rec) return res.status(404).json({ error: 'not found' });
  res.json(rec);
});

app.put('/api/entities/:entity/:id', (req, res) => {
  const rec = store.update(req.params.entity, req.params.id, req.body || {});
  if (!rec) return res.status(404).json({ error: 'not found' });
  res.json(rec);
});

app.delete('/api/entities/:entity/:id', (req, res) => {
  const ok = store.remove(req.params.entity, req.params.id);
  res.json({ ok });
});

// ---- LLM proxy ----
app.post('/api/llm/invoke', async (req, res) => {
  try {
    const result = await invokeLLM(req.body || {});
    res.json(result);
  } catch (err) {
    console.error('[LLM] error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---- AI image generation (OpenAI Images) ----
async function tryImageModel(key, model, fullPrompt) {
  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, prompt: fullPrompt, n: 1, size: '1024x1024' }),
  });
  if (!r.ok) {
    const t = await r.text();
    const err = new Error(t.slice(0, 300));
    err.status = r.status;
    throw err;
  }
  const data = await r.json();
  const item = data.data?.[0];
  if (item?.b64_json) return Buffer.from(item.b64_json, 'base64');
  if (item?.url) return Buffer.from(await (await fetch(item.url)).arrayBuffer());
  throw new Error('no image returned');
}

app.post('/api/image/generate', async (req, res) => {
  const { prompt } = req.body || {};
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(400).json({ error: 'Image generation needs an OpenAI API key.' });
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  const fullPrompt =
    'A clear, accurate, labeled scientific diagram in a clean flat-vector style on a ' +
    'plain white background. No borders, no decorative clip-art, no graduation caps. ' +
    'Accurately depict this specific subject: ' +
    String(prompt).slice(0, 800);
  const candidates = [process.env.IMAGE_MODEL, 'gpt-image-1', 'dall-e-3', 'dall-e-2'].filter(Boolean);
  let lastErr;
  for (const model of candidates) {
    try {
      const buf = await tryImageModel(key, model, fullPrompt);
      const name = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`;
      fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
      return res.json({ url: `/uploads/${name}`, model });
    } catch (e) {
      lastErr = e;
      console.error(`[IMAGE] ${model} failed:`, e.message.replace(/\s+/g, ' ').slice(0, 160));
    }
  }
  res.status(500).json({ error: 'Image generation failed.', detail: lastErr?.message?.slice(0, 200) });
});

// ---- File upload + extraction ----
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}_${safe}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});

app.post('/api/files/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' });
  const file_url = `/uploads/${req.file.filename}`;
  res.json({ file_url, name: req.file.originalname });
});

async function extractText(absPath, originalName = '') {
  const ext = path.extname(originalName || absPath).toLowerCase();
  const buf = fs.readFileSync(absPath);
  if (ext === '.pdf') {
    const { default: pdf } = await import('pdf-parse');
    const data = await pdf(buf);
    return data.text;
  }
  if (ext === '.docx') {
    const mammoth = await import('mammoth');
    const out = await mammoth.extractRawText({ buffer: buf });
    return out.value;
  }
  // txt, md, csv, and anything text-like
  return buf.toString('utf-8');
}

app.post('/api/files/extract', async (req, res) => {
  try {
    const { file_url } = req.body || {};
    if (!file_url) return res.status(400).json({ error: 'file_url required' });
    const filename = file_url.replace('/uploads/', '');
    const absPath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(absPath)) return res.status(404).json({ error: 'file not found' });
    const text = await extractText(absPath, filename);
    res.json({ status: 'success', output: text });
  } catch (err) {
    console.error('[EXTRACT] error:', err.message);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// ---- YouTube transcript ----
function youtubeId(url) {
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

app.post('/api/youtube/transcript', async (req, res) => {
  try {
    const { url } = req.body || {};
    const id = youtubeId(url);
    if (!id) return res.status(400).json({ error: 'invalid YouTube URL' });
    const { YoutubeTranscript } = await import('youtube-transcript');
    let items;
    try {
      items = await YoutubeTranscript.fetchTranscript(id, { lang: 'en' });
    } catch {
      items = await YoutubeTranscript.fetchTranscript(id);
    }
    const transcript = items.map((i) => i.text).join(' ');
    res.json({ status: 'success', videoId: id, transcript });
  } catch (err) {
    console.error('[YOUTUBE] error:', err.message);
    res
      .status(500)
      .json({ status: 'error', error: 'Could not fetch transcript (captions may be disabled).' });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true, hasKey: hasKey() }));

// Runtime public config so the frontend gets the Google Client ID without
// depending on build-time Vite env inlining (works even if the build missed it).
app.get('/api/config', (req, res) => {
  res.json({
    googleClientId: GOOGLE_CLIENT_ID,
    aiEnabled: hasKey(),
  });
});

// Local dev: run a real server. On Vercel the app is imported by the
// serverless function (api/[...path].js) instead of listening on a port.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    const provider = process.env.OPENAI_API_KEY
      ? 'OpenAI'
      : process.env.ANTHROPIC_API_KEY
      ? 'Anthropic'
      : null;
    console.log(`\n  Proofly backend → http://localhost:${PORT}`);
    console.log(`  AI: ${provider ? `LIVE (${provider} key found)` : 'DEMO MODE (no API key)'}\n`);
  });
}

export default app;

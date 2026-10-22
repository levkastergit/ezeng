'use strict';
// EzEng account & progress API. Plain Node.js (no dependencies), HTTPS with a pinned self-signed certificate.
// Storage: JSON files under DATA_DIR (users.json + progress/<id>.json). Suitable for a small user base.

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA = process.env.DATA_DIR || '/data';
const PORT = Number(process.env.PORT || 8443);
const TOKEN_DAYS = 90;
const MAX_BODY = 2 * 1024 * 1024;
const USERS_FILE = path.join(DATA, 'users.json');
const PROGRESS_DIR = path.join(DATA, 'progress');

fs.mkdirSync(PROGRESS_DIR, { recursive: true });

// ---------------------------------------------------------------- helpers

function log(...a) {
  console.log(new Date().toISOString(), ...a);
}

function writeAtomic(file, data) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, file);
}

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

const secretFile = path.join(DATA, 'secret');
let SECRET;
try {
  SECRET = fs.readFileSync(secretFile, 'utf8').trim();
  if (SECRET.length < 32) throw new Error('short secret');
} catch {
  SECRET = crypto.randomBytes(32).toString('hex');
  writeAtomic(secretFile, SECRET);
}

const users = loadJson(USERS_FILE, { byLogin: {}, byId: {} });
function saveUsers() {
  writeAtomic(USERS_FILE, JSON.stringify(users));
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
}

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

function issueToken(id) {
  const exp = Date.now() + TOKEN_DAYS * 86_400_000;
  const payload = `${id}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  const expected = sign(`${id}.${exp}`);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  if (Number(exp) < Date.now()) return null;
  return users.byId[id] ? id : null;
}

function publicUser(u) {
  return { id: u.id, login: u.login, createdAt: u.createdAt, showInLeaderboard: u.showInLeaderboard !== false };
}

// ---------------------------------------------------------------- rate limiting (login/register)

const attempts = new Map();
function limited(ip) {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 10 * 60_000 });
    return false;
  }
  rec.count += 1;
  return rec.count > 12;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of attempts) if (rec.resetAt < now) attempts.delete(ip);
}, 60_000).unref();

// ---------------------------------------------------------------- http plumbing

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new HttpError(413, 'body too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, 'invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function auth(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const id = verifyToken(token);
  if (!id) throw new HttpError(401, 'unauthorized');
  return users.byId[id];
}

const LOGIN_RE = /^[a-zA-Z0-9_.-]{3,24}$/;

function validateCredentials(body) {
  const login = String(body.login || '').trim();
  const password = String(body.password || '');
  if (!LOGIN_RE.test(login)) throw new HttpError(400, 'login must be 3–24 latin letters, digits, _ . -');
  if (password.length < 6 || password.length > 100) throw new HttpError(400, 'password must be 6–100 characters');
  return { login, password };
}

function progressFile(id) {
  return path.join(PROGRESS_DIR, `${id}.json`);
}

function summarize(progress) {
  const words = progress && progress.words && typeof progress.words === 'object' ? Object.keys(progress.words).length : 0;
  const lessons = progress && progress.lessons && typeof progress.lessons === 'object' ? Object.keys(progress.lessons).length : 0;
  const xp = progress && Number.isFinite(progress.xp) ? Math.max(0, Math.floor(progress.xp)) : 0;
  return { xp, words, lessons };
}

// ---------------------------------------------------------------- routes

const routes = {
  'GET /api/v1/health': async () => ({ ok: true, time: Date.now() }),

  'POST /api/v1/register': async (req, body, ip) => {
    if (limited(ip)) throw new HttpError(429, 'too many attempts, try later');
    const { login, password } = validateCredentials(body);
    const key = login.toLowerCase();
    if (users.byLogin[key]) throw new HttpError(409, 'login already taken');
    const id = crypto.randomBytes(8).toString('hex');
    const salt = crypto.randomBytes(16).toString('hex');
    const user = { id, login, salt, hash: hashPassword(password, salt), createdAt: Date.now(), lastLogin: Date.now(), showInLeaderboard: true, stats: { xp: 0, words: 0, lessons: 0 } };
    users.byId[id] = user;
    users.byLogin[key] = id;
    saveUsers();
    log('register', login);
    return { token: issueToken(id), user: publicUser(user) };
  },

  'POST /api/v1/login': async (req, body, ip) => {
    if (limited(ip)) throw new HttpError(429, 'too many attempts, try later');
    const login = String(body.login || '').trim();
    const password = String(body.password || '');
    const id = users.byLogin[login.toLowerCase()];
    const user = id && users.byId[id];
    if (!user) throw new HttpError(401, 'wrong login or password');
    const hash = hashPassword(password, user.salt);
    if (hash.length !== user.hash.length || !crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(user.hash))) {
      throw new HttpError(401, 'wrong login or password');
    }
    user.lastLogin = Date.now();
    saveUsers();
    const p = loadJson(progressFile(id), null);
    return { token: issueToken(id), user: publicUser(user), progressUpdatedAt: p ? p.updatedAt : 0 };
  },

  'GET /api/v1/me': async (req) => {
    const user = auth(req);
    const p = loadJson(progressFile(user.id), null);
    return { user: publicUser(user), progressUpdatedAt: p ? p.updatedAt : 0 };
  },

  'GET /api/v1/progress': async (req) => {
    const user = auth(req);
    const p = loadJson(progressFile(user.id), null);
    return p ? { progress: p.progress, updatedAt: p.updatedAt } : { progress: null, updatedAt: 0 };
  },

  'PUT /api/v1/progress': async (req, body) => {
    const user = auth(req);
    if (!body.progress || typeof body.progress !== 'object') throw new HttpError(400, 'progress object required');
    const updatedAt = Number.isFinite(body.updatedAt) ? body.updatedAt : Date.now();
    const current = loadJson(progressFile(user.id), null);
    if (current && current.updatedAt > updatedAt) {
      // The server copy is newer: hand it back instead of overwriting it.
      return { stored: false, progress: current.progress, updatedAt: current.updatedAt };
    }
    writeAtomic(progressFile(user.id), JSON.stringify({ progress: body.progress, updatedAt }));
    user.stats = summarize(body.progress);
    saveUsers();
    return { stored: true, updatedAt };
  },

  'POST /api/v1/password': async (req, body) => {
    const user = auth(req);
    const oldPassword = String(body.oldPassword || '');
    const newPassword = String(body.newPassword || '');
    if (hashPassword(oldPassword, user.salt) !== user.hash) throw new HttpError(401, 'wrong current password');
    if (newPassword.length < 6 || newPassword.length > 100) throw new HttpError(400, 'password must be 6–100 characters');
    user.salt = crypto.randomBytes(16).toString('hex');
    user.hash = hashPassword(newPassword, user.salt);
    saveUsers();
    return { ok: true, token: issueToken(user.id) };
  },

  'POST /api/v1/leaderboard-visibility': async (req, body) => {
    const user = auth(req);
    user.showInLeaderboard = Boolean(body.show);
    saveUsers();
    return { ok: true, showInLeaderboard: user.showInLeaderboard };
  },

  'GET /api/v1/leaderboard': async () => {
    const rows = Object.values(users.byId)
      .filter((u) => u.showInLeaderboard !== false && u.stats && u.stats.xp > 0)
      .sort((a, b) => b.stats.xp - a.stats.xp)
      .slice(0, 50)
      .map((u, i) => ({ rank: i + 1, login: u.login, xp: u.stats.xp, words: u.stats.words, lessons: u.stats.lessons }));
    return { rows, total: Object.keys(users.byId).length };
  },
};

async function handle(req, res) {
  const ip = req.socket.remoteAddress || '';
  const url = new URL(req.url, 'https://localhost');
  const key = `${req.method} ${url.pathname}`;
  const route = routes[key];
  try {
    if (!route) throw new HttpError(404, 'not found');
    const body = req.method === 'GET' ? {} : await readBody(req);
    const result = await route(req, body, ip);
    send(res, 200, result);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) log('error', key, err && err.stack);
    send(res, status, { error: err.message || 'error' });
  }
}

const tls = {
  key: fs.readFileSync(path.join(DATA, 'tls', 'key.pem')),
  cert: fs.readFileSync(path.join(DATA, 'tls', 'cert.pem')),
};

https.createServer(tls, (req, res) => void handle(req, res)).listen(PORT, '0.0.0.0', () => {
  log(`EzEng API listening on ${PORT}, users: ${Object.keys(users.byId).length}`);
});

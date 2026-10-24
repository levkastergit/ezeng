const { app, BrowserWindow, shell, Menu, protocol, net, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { Readable } = require('stream');

// ---------------------------------------------------------------- account API (pinned self-signed certificate)

const API_HOST = process.env.EZENG_API_HOST || '217.28.220.146';
const API_PORT = Number(process.env.EZENG_API_PORT || 8443);
const API_CA = fs.readFileSync(path.join(__dirname, 'server-ca.pem'));

function apiRequest({ method, path: apiPath, body, token }) {
  return new Promise((resolve) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const headers = { Accept: 'application/json' };
    if (data) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(data);
    }
    if (token) headers.Authorization = `Bearer ${token}`;
    const req = https.request(
      { host: API_HOST, port: API_PORT, method, path: apiPath, headers, ca: [API_CA], timeout: 20_000 },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          } catch {
            json = null;
          }
          resolve({ status: res.statusCode || 0, json });
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', (err) => resolve({ status: 0, json: null, error: err.message }));
    if (data) req.write(data);
    req.end();
  });
}

function authFile() {
  return path.join(app.getPath('userData'), 'auth.json');
}

ipcMain.handle('api:request', (_e, req) => apiRequest(req || {}));
ipcMain.handle('auth:get', () => {
  try {
    return JSON.parse(fs.readFileSync(authFile(), 'utf8'));
  } catch {
    return null;
  }
});
ipcMain.handle('auth:set', (_e, data) => {
  fs.writeFileSync(authFile(), JSON.stringify(data));
});
ipcMain.handle('auth:clear', () => {
  try {
    fs.unlinkSync(authFile());
  } catch {
    // nothing to clear
  }
});

// ---------------------------------------------------------------- karaoke: user audio files and synced lyrics

const KARAOKE_ID = /^[a-z0-9_-]{4,40}$/;
const KARAOKE_EXT = /^(mp3|m4a|aac|ogg|oga|opus|wav|flac|webm)$/;
const KARAOKE_MAX_BYTES = 80 * 1024 * 1024;

function karaokeDir() {
  const dir = path.join(app.getPath('userData'), 'karaoke');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function karaokeFile(id) {
  if (!KARAOKE_ID.test(String(id))) return null;
  const name = fs.readdirSync(karaokeDir()).find((n) => n.startsWith(`${id}.`));
  return name ? path.join(karaokeDir(), name) : null;
}

ipcMain.handle('karaoke:save', (_e, { id, ext, data } = {}) => {
  if (!KARAOKE_ID.test(String(id)) || !KARAOKE_EXT.test(String(ext))) return { ok: false, error: 'bad file name' };
  const buf = Buffer.from(data);
  if (buf.length > KARAOKE_MAX_BYTES) return { ok: false, error: 'file too large' };
  const old = karaokeFile(id);
  if (old) fs.unlinkSync(old);
  fs.writeFileSync(path.join(karaokeDir(), `${id}.${ext}`), buf);
  return { ok: true, file: `${id}.${ext}` };
});
ipcMain.handle('karaoke:file', (_e, id) => {
  const f = karaokeFile(id);
  return f ? path.basename(f) : null;
});
ipcMain.handle('karaoke:delete', (_e, id) => {
  const f = karaokeFile(id);
  if (f) fs.unlinkSync(f);
  return true;
});

/** Synced lyrics from LRCLIB (https://lrclib.net), an open lyrics database; only on the user's request. */
ipcMain.handle('lyrics:search', async (_e, query = {}) => {
  const params = new URLSearchParams();
  if (query.q) params.set('q', String(query.q));
  else {
    params.set('track_name', String(query.title || ''));
    if (query.artist) params.set('artist_name', String(query.artist));
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await net.fetch(`https://lrclib.net/api/search?${params}`, {
      headers: { 'User-Agent': `EzEng/${app.getVersion()} (https://github.com/levkastergit/ezeng)` },
      signal: ctrl.signal,
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const list = await res.json();
    return {
      ok: true,
      results: (Array.isArray(list) ? list : []).slice(0, 25).map((r) => ({
        id: r.id,
        artist: r.artistName,
        title: r.trackName,
        album: r.albumName,
        duration: r.duration,
        synced: r.syncedLyrics || null,
        plain: r.plainLyrics || null,
        instrumental: Boolean(r.instrumental),
      })),
    };
  } catch (err) {
    return { ok: false, error: err.name === 'AbortError' ? 'timeout' : err.message };
  } finally {
    clearTimeout(timer);
  }
});

const APP_SCHEME = 'app';
const DIST_DIR = path.join(__dirname, '..', 'dist');
const RELEASES_URL = 'https://github.com/levkastergit/ezeng/releases/latest';
const LATEST_YML_URL = 'https://github.com/levkastergit/ezeng/releases/latest/download/latest.yml';
const CHECK_TIMEOUT_MS = 25_000;

let autoUpdater = null;
try {
  ({ autoUpdater } = require('electron-updater'));
} catch {
  autoUpdater = null;
}

let mainWin = null;

// Tests can point the app at a throw-away profile so real progress is never touched.
if (process.env.EZENG_USERDATA) app.setPath('userData', process.env.EZENG_USERDATA);

app.setAppUserModelId('com.levkaster.ezeng');

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
  },
]);

function registerAppProtocol() {
  protocol.handle(APP_SCHEME, (request) => {
    const url = new URL(request.url);
    let rel = decodeURIComponent(url.pathname);
    if (rel === '/' || rel === '') rel = '/index.html';
    if (rel.startsWith('/user-media/')) {
      const name = path.basename(rel);
      if (!/^[a-z0-9_-]{4,40}\.[a-z0-9]{2,5}$/.test(name)) return new Response('Forbidden', { status: 403 });
      const media = path.join(app.getPath('userData'), 'karaoke', name);
      if (!fs.existsSync(media)) return new Response('Not found', { status: 404 });
      return serveFile(media, request.headers.get('range'));
    }
    const file = path.normalize(path.join(DIST_DIR, rel));
    if (!file.startsWith(DIST_DIR)) {
      return new Response('Forbidden', { status: 403 });
    }
    if (!fs.existsSync(file)) {
      return new Response('Not found', { status: 404 });
    }
    return serveFile(file, request.headers.get('range'));
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.oga': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.webm': 'audio/webm',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/**
 * Serves a file with Content-Length and HTTP range support: Chromium's media pipeline needs both
 * to play larger audio files (the song recordings) and to seek inside them.
 */
function serveFile(file, rangeHeader) {
  const size = fs.statSync(file).size;
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const base = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
  const m = rangeHeader ? /^bytes=(\d*)-(\d*)$/.exec(rangeHeader) : null;
  if (m && (m[1] || m[2])) {
    let start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
    let end = m[1] && m[2] ? Number(m[2]) : size - 1;
    if (end >= size) end = size - 1;
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { ...base, 'Content-Range': `bytes */${size}` } });
    }
    const stream = Readable.toWeb(fs.createReadStream(file, { start, end }));
    return new Response(stream, {
      status: 206,
      headers: { ...base, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1) },
    });
  }
  const stream = Readable.toWeb(fs.createReadStream(file));
  return new Response(stream, { status: 200, headers: { ...base, 'Content-Length': String(size) } });
}

// ---------------------------------------------------------------- logging

function logPath() {
  return path.join(app.getPath('userData'), 'updater.log');
}

function log(level, ...args) {
  const line = `${new Date().toISOString()} [${level}] ${args.map((a) => (a instanceof Error ? a.stack || a.message : String(a))).join(' ')}\n`;
  try {
    fs.appendFileSync(logPath(), line);
  } catch {
    // logging must never break the app
  }
}

// ---------------------------------------------------------------- updates

function updateSupport() {
  if (!app.isPackaged) return { ok: false, reason: 'dev' };
  if (process.env.PORTABLE_EXECUTABLE_DIR) return { ok: false, reason: 'portable' };
  if (!autoUpdater) return { ok: false, reason: 'missing' };
  return { ok: true };
}

/** Returns > 0 when a is newer than b. Handles "1.2.3" and "1.2.3-beta". */
function compareVersions(a, b) {
  const parse = (v) => {
    const [core, pre] = String(v).split('-');
    return { nums: core.split('.').map((n) => parseInt(n, 10) || 0), pre: pre || '' };
  };
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < 3; i++) {
    const d = (pa.nums[i] || 0) - (pb.nums[i] || 0);
    if (d !== 0) return d;
  }
  if (pa.pre && !pb.pre) return -1;
  if (!pa.pre && pb.pre) return 1;
  return pa.pre.localeCompare(pb.pre);
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}: нет ответа за ${Math.round(ms / 1000)} с`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function send(channel, payload) {
  if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send(channel, payload);
}

function setupUpdater() {
  if (!autoUpdater) return;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.logger = {
    info: (...a) => log('info', ...a),
    warn: (...a) => log('warn', ...a),
    error: (...a) => log('error', ...a),
    debug: (...a) => log('debug', ...a),
  };
  autoUpdater.on('download-progress', (p) => {
    send('update:progress', { percent: p.percent, transferred: p.transferred, total: p.total });
  });
  autoUpdater.on('update-downloaded', (info) => {
    log('info', 'update downloaded', info.version);
    send('update:downloaded', { version: info.version });
  });
  autoUpdater.on('error', (err) => {
    log('error', 'autoUpdater error', err);
    send('update:error', { message: String((err && err.message) || err) });
  });
}

/** Reads the version of the latest GitHub release without electron-updater (works for portable/dev builds too). */
async function fetchLatestVersion() {
  const res = await net.fetch(LATEST_YML_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`GitHub ответил HTTP ${res.status}`);
  const text = await res.text();
  const m = text.match(/^version:\s*(\S+)/m);
  if (!m) throw new Error('latest.yml не содержит версии');
  return m[1];
}

async function checkForUpdate() {
  const current = app.getVersion();
  const support = updateSupport();
  log('info', `check: current=${current} support=${support.ok ? 'yes' : support.reason}`);
  try {
    if (!support.ok) {
      const latest = await withTimeout(fetchLatestVersion(), CHECK_TIMEOUT_MS, 'Проверка версии');
      log('info', `latest on GitHub: ${latest}`);
      if (compareVersions(latest, current) > 0) {
        return { status: 'manual', version: latest, current, reason: support.reason };
      }
      return { status: 'none', current, latest: current, reason: support.reason };
    }
    const result = await withTimeout(autoUpdater.checkForUpdates(), CHECK_TIMEOUT_MS, 'Проверка обновлений');
    const latest = result && result.updateInfo && result.updateInfo.version;
    log('info', `electron-updater latest: ${latest}`);
    if (latest && compareVersions(latest, current) > 0) {
      return { status: 'available', version: latest, current };
    }
    return { status: 'none', current, latest: current };
  } catch (err) {
    log('error', 'check failed', err);
    return { status: 'error', message: String((err && err.message) || err), current, logPath: logPath() };
  }
}

ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('update:check', () => checkForUpdate());
ipcMain.handle('update:download', async () => {
  if (!updateSupport().ok) return { ok: false, message: 'unsupported' };
  try {
    log('info', 'download started');
    await autoUpdater.downloadUpdate();
    return { ok: true };
  } catch (err) {
    log('error', 'download failed', err);
    return { ok: false, message: String((err && err.message) || err) };
  }
});
ipcMain.handle('update:install', () => {
  if (!updateSupport().ok) return false;
  log('info', 'quitAndInstall');
  setImmediate(() => autoUpdater.quitAndInstall(false, true));
  return true;
});
ipcMain.handle('update:open-releases', () => shell.openExternal(RELEASES_URL));
ipcMain.handle('update:open-log', () => shell.showItemInFolder(logPath()));

// ---------------------------------------------------------------- window

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 800,
    minWidth: 940,
    minHeight: 640,
    title: 'EzEng',
    backgroundColor: '#f6f7f8',
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  mainWin = win;

  win.once('ready-to-show', () => win.show());
  win.on('closed', () => {
    if (mainWin === win) mainWin = null;
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && !app.isPackaged) {
      win.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Development helper: EZENG_SCREENSHOT=<file.png> captures the window and quits.
  const shot = process.env.EZENG_SCREENSHOT;
  if (shot) {
    win.webContents.once('did-finish-load', async () => {
      try {
        const js = process.env.EZENG_SCREENSHOT_JS;
        if (js) await win.webContents.executeJavaScript(js);
        await new Promise((r) => setTimeout(r, 1200));
        const img = await win.webContents.capturePage();
        fs.writeFileSync(shot, img.toPNG());
      } catch (e) {
        console.error(e);
      }
      app.quit();
    });
  }

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadURL(`${APP_SCHEME}://ezeng/`);
  }

  // Silent check a few seconds after start; the renderer shows a banner if something is new.
  if (app.isPackaged && !shot) {
    setTimeout(async () => {
      const r = await checkForUpdate();
      if (r.status === 'available' || r.status === 'manual') {
        send('update:available', { version: r.version, manual: r.status === 'manual', reason: r.reason });
      }
    }, 6000);
  }
}

Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  log('info', `start v${app.getVersion()} packaged=${app.isPackaged} portable=${Boolean(process.env.PORTABLE_EXECUTABLE_DIR)}`);
  registerAppProtocol();
  setupUpdater();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

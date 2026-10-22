const { app, BrowserWindow, shell, Menu, protocol, net, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const APP_SCHEME = 'app';
const DIST_DIR = path.join(__dirname, '..', 'dist');
const RELEASES_URL = 'https://github.com/levkastergit/ezeng/releases/latest';

let autoUpdater = null;
try {
  ({ autoUpdater } = require('electron-updater'));
} catch {
  autoUpdater = null;
}

let mainWin = null;

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
    const file = path.normalize(path.join(DIST_DIR, rel));
    if (!file.startsWith(DIST_DIR)) {
      return new Response('Forbidden', { status: 403 });
    }
    if (!fs.existsSync(file)) {
      return new Response('Not found', { status: 404 });
    }
    return net.fetch(pathToFileURL(file).toString());
  });
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

function send(channel, payload) {
  if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send(channel, payload);
}

function setupUpdater() {
  if (!autoUpdater) return;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.logger = null;
  autoUpdater.on('download-progress', (p) => {
    send('update:progress', { percent: p.percent, transferred: p.transferred, total: p.total });
  });
  autoUpdater.on('update-downloaded', (info) => {
    send('update:downloaded', { version: info.version });
  });
  autoUpdater.on('error', (err) => {
    send('update:error', { message: String((err && err.message) || err) });
  });
}

async function checkForUpdate() {
  const support = updateSupport();
  const current = app.getVersion();
  if (!support.ok) return { status: 'unsupported', reason: support.reason, current };
  try {
    const result = await autoUpdater.checkForUpdates();
    const latest = result && result.updateInfo && result.updateInfo.version;
    if (latest && compareVersions(latest, current) > 0) {
      return { status: 'available', version: latest, current };
    }
    return { status: 'none', current, latest: latest || current };
  } catch (err) {
    return { status: 'error', message: String((err && err.message) || err), current };
  }
}

ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('update:check', () => checkForUpdate());
ipcMain.handle('update:download', async () => {
  if (!updateSupport().ok) return { ok: false, message: 'unsupported' };
  try {
    await autoUpdater.downloadUpdate();
    return { ok: true };
  } catch (err) {
    return { ok: false, message: String((err && err.message) || err) };
  }
});
ipcMain.handle('update:install', () => {
  if (!updateSupport().ok) return false;
  setImmediate(() => autoUpdater.quitAndInstall(false, true));
  return true;
});
ipcMain.handle('update:open-releases', () => shell.openExternal(RELEASES_URL));

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
  if (updateSupport().ok && !shot) {
    setTimeout(async () => {
      const r = await checkForUpdate();
      if (r.status === 'available') send('update:available', { version: r.version });
    }, 6000);
  }
}

Menu.setApplicationMenu(null);

app.whenReady().then(() => {
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

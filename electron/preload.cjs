const { contextBridge, ipcRenderer } = require('electron');

function subscribe(channel) {
  return (cb) => {
    const handler = (_event, payload) => cb(payload);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  };
}

contextBridge.exposeInMainWorld('ezeng', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
  getVersion: () => ipcRenderer.invoke('app:version'),
  api: {
    request: (req) => ipcRenderer.invoke('api:request', req),
    getAuth: () => ipcRenderer.invoke('auth:get'),
    setAuth: (data) => ipcRenderer.invoke('auth:set', data),
    clearAuth: () => ipcRenderer.invoke('auth:clear'),
  },
  update: {
    check: () => ipcRenderer.invoke('update:check'),
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.invoke('update:install'),
    openReleases: () => ipcRenderer.invoke('update:open-releases'),
    openLog: () => ipcRenderer.invoke('update:open-log'),
    onAvailable: subscribe('update:available'),
    onProgress: subscribe('update:progress'),
    onDownloaded: subscribe('update:downloaded'),
    onError: subscribe('update:error'),
  },
});

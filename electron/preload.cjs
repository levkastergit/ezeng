const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('ezeng', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
});

// Renders the EzEng star mascot to build/icon.png (512px) and build/icon.ico.
// Run with: npx electron scripts/make-icon.cjs
const { app, BrowserWindow, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

const SIZE = 512;
const OUT_DIR = path.join(__dirname, '..', 'build');

function starPath(cx, cy, outer, inner, points = 5) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  const n = pts.length;
  const mid = (i) => {
    const a = pts[i % n];
    const b = pts[(i + 1) % n];
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  };
  let d = `M ${mid(0)[0].toFixed(2)} ${mid(0)[1].toFixed(2)}`;
  for (let i = 1; i <= n; i++) {
    const c = pts[i % n];
    const m = mid(i);
    d += ` Q ${c[0].toFixed(2)} ${c[1].toFixed(2)} ${m[0].toFixed(2)} ${m[1].toFixed(2)}`;
  }
  return d + ' Z';
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${SIZE}" height="${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9AD3FF"/>
      <stop offset="1" stop-color="#3C8BFF"/>
    </linearGradient>
    <linearGradient id="st" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFE36A"/>
      <stop offset="1" stop-color="#FFC531"/>
    </linearGradient>
    <clipPath id="clip"><rect x="2" y="2" width="96" height="96" rx="22"/></clipPath>
  </defs>
  <rect x="2" y="2" width="96" height="96" rx="22" fill="url(#bg)"/>
  <g clip-path="url(#clip)" fill="#fff">
    <ellipse cx="14" cy="92" rx="24" ry="11"/>
    <ellipse cx="42" cy="97" rx="26" ry="12"/>
    <ellipse cx="70" cy="93" rx="22" ry="10"/>
    <ellipse cx="96" cy="98" rx="24" ry="12"/>
    <circle cx="80" cy="18" r="1.6" opacity=".8"/>
    <circle cx="20" cy="26" r="1.2" opacity=".8"/>
    <circle cx="88" cy="40" r="1.1" opacity=".7"/>
  </g>
  <ellipse cx="50" cy="83" rx="22" ry="3" fill="#000" opacity=".12"/>
  <path d="${starPath(50, 47, 35, 19)}" fill="url(#st)" stroke="#F2B21C" stroke-width="1.4" stroke-linejoin="round"/>
  <ellipse cx="42.8" cy="46.5" rx="4.6" ry="5.4" fill="#fff"/>
  <ellipse cx="57.2" cy="46.5" rx="4.6" ry="5.4" fill="#fff"/>
  <circle cx="44" cy="47.3" r="2.5" fill="#2B2B2B"/>
  <circle cx="58.4" cy="47.3" r="2.5" fill="#2B2B2B"/>
  <circle cx="44.8" cy="46.2" r=".85" fill="#fff"/>
  <circle cx="59.2" cy="46.2" r=".85" fill="#fff"/>
  <circle cx="36.3" cy="54" r="2.7" fill="#FF8C7A" opacity=".55"/>
  <circle cx="63.7" cy="54" r="2.7" fill="#FF8C7A" opacity=".55"/>
  <path d="M44 55.5 Q50 63.8 56 55.5 Q50 59 44 55.5 Z" fill="#2B2B2B"/>
</svg>`;

function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  const dir = [];
  const blobs = [];
  let offset = 6 + 16 * entries.length;
  for (const { size, buf } of entries) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    dir.push(e);
    blobs.push(buf);
    offset += buf.length;
  }
  return Buffer.concat([header, ...dir, ...blobs]);
}

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: SIZE,
    height: SIZE,
    useContentSize: true,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: { offscreen: true },
  });
  const html = `<!doctype html><html><body style="margin:0;background:transparent;overflow:hidden">${svg}</body></html>`;
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  await new Promise((r) => setTimeout(r, 800));
  let img = await win.webContents.capturePage();
  const { width } = img.getSize();
  if (width !== SIZE) img = img.resize({ width: SIZE, height: SIZE, quality: 'best' });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const png512 = img.toPNG();
  fs.writeFileSync(path.join(OUT_DIR, 'icon.png'), png512);

  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const entries = sizes.map((s) => ({ size: s, buf: img.resize({ width: s, height: s, quality: 'best' }).toPNG() }));
  fs.writeFileSync(path.join(OUT_DIR, 'icon.ico'), buildIco(entries));

  console.log(`icon.png (${png512.length} bytes) and icon.ico written to ${OUT_DIR}`);
  app.quit();
});

// Иконка приложения из frontend/src/ui/gopher.js: build/appicon.svg, build/appicon.png (1024),
// frontend/src/ds/logo.svg и PNG-кадры для build/windows/icon.ico (16–256; .ico собирает Python Pillow).
// Запуск: node tools/icon.cjs && python3 tools/ico.py
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const { appIconSVG } = await import(path.join(root, 'frontend/src/ui/gopher.js'));
  const svg = appIconSVG(1024);
  fs.writeFileSync(path.join(root, 'build/appicon.svg'), svg + '\n');
  fs.writeFileSync(path.join(root, 'frontend/src/ds/logo.svg'), svg + '\n');
  const out = path.join(root, 'build/.icon-frames');
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const s of [1024, 256, 128, 64, 48, 32, 24, 16]) {
    await p.setViewportSize({ width: s, height: s });
    await p.setContent(`<html><body style="margin:0;background:transparent">${appIconSVG(s)}</body></html>`);
    const file = s === 1024 ? path.join(root, 'build/appicon.png') : path.join(out, s + '.png');
    await p.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();

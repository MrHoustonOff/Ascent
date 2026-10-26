// Скриншоты экранов без Wails: поднимает devserver, наполняет демо-данными и снимает маршруты.
// Запуск: node tools/shots.cjs <папка> [--demo|--fresh] [--theme=light|dark|both] [--size=1200x800] [маршруты...]
const { chromium } = require('playwright');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const out = args.find((a) => !a.startsWith('--') && !a.startsWith('#')) || 'shots';
const flag = (n, d) => (args.find((a) => a.startsWith('--' + n + '=')) || '').split('=')[1] || d;
const routes = args.filter((a) => a.startsWith('#'));
const fresh = args.includes('--fresh');
const full = args.includes('--full');
const themes = flag('theme', 'both') === 'both' ? ['light', 'dark'] : [flag('theme', 'light')];
const [W, H] = flag('size', '1200x800').split('x').map(Number);
const bin = process.env.DEVSERVER || '/tmp/claude-0/w/devserver';
const port = 8700 + Math.floor(Math.random() * 200);

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const data = fs.mkdtempSync('/tmp/ascent-shot-');
  const srv = spawn(bin, ['-addr', '127.0.0.1:' + port, '-data', data, '-front', path.resolve(__dirname, '../frontend'), '-now', '2026-10-25T21:07:00+03:00'], { stdio: 'inherit' });
  await new Promise((r) => setTimeout(r, 1200));
  const rpc = (m, a = []) => fetch(`http://127.0.0.1:${port}/rpc/${m}`, { method: 'POST', body: JSON.stringify(a) }).then((r) => r.json());
  if (!fresh) { const r = await rpc('FillDemo'); if (r.error) console.log('demo:', r.error); }
  else await rpc('SetSetting', ['onboarded', '1']);
  const browser = await chromium.launch();
  const problems = [];
  for (const theme of themes) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, colorScheme: theme });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => problems.push('JS: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
    await rpc('SetSetting', ['theme', theme]);
    for (const r of (routes.length ? routes : ['#/today'])) {
      await page.goto(`http://127.0.0.1:${port}/${r.includes('|') ? r.split('|')[0] : r}`);
      await page.waitForSelector('.as-screen', { timeout: 8000 });
      await page.waitForTimeout(500);
      for (const act of r.split('|').slice(1)) {
        if (act.startsWith('click:')) { await page.getByText(act.slice(6), { exact: true }).first().click(); await page.waitForTimeout(500); }
        if (act.startsWith('key:')) { await page.keyboard.press(act.slice(4)); await page.waitForTimeout(500); }
        if (act.startsWith('wait:')) await page.waitForTimeout(+act.slice(5));
      }
      const name = r.replace(/[#/|:]+/g, '_').replace(/^_/, '').replace(/[^\wа-яА-Я._-]/g, '') || 'today';
      if (full) {
        const hgt = await page.evaluate(() => { const m = document.querySelector('.as-window__main'); return m.scrollHeight + 40 + 8; });
        await page.setViewportSize({ width: W, height: Math.max(H, Math.min(hgt, 4000)) });
        await page.waitForTimeout(400);
      }
      await page.screenshot({ path: path.join(out, `${name}.${theme}.png`) });
      if (full) await page.setViewportSize({ width: W, height: H });
      const bad = await page.evaluate(() => {
        const res = [];
        const m = document.querySelector('.as-window__main');
        if (m.scrollWidth > m.clientWidth + 1) res.push('main: горизонтальный скролл ' + m.scrollWidth + '>' + m.clientWidth);
        const mr = m.getBoundingClientRect();
        for (const el of m.querySelectorAll('*')) {
          const cs = getComputedStyle(el);
          if (cs.display === 'none') continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0) continue;
          if (r.right > window.innerWidth + 1 && !el.closest('.as-heat-wrap,.as-table-wrap,.as-prose table,pre')) res.push('вылез за окно: ' + el.tagName + '.' + el.className + ' "' + (el.textContent || '').slice(0, 40) + '"');
          if ((cs.overflowX === 'hidden') && cs.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 1 && el.children.length === 0 && el.textContent.trim())
            res.push('обрезан текст: ' + el.tagName + '.' + el.className + ' "' + el.textContent.slice(0, 40) + '"');
        }
        return res.slice(0, 8);
      });
      if (bad.length) problems.push(`[${theme} ${r} ${W}x${H}] ` + bad.join(' | '));
    }
    await ctx.close();
  }
  await browser.close();
  srv.kill();
  console.log(problems.length ? 'ПРОБЛЕМЫ:\n' + problems.join('\n') : 'проверка переполнения: чисто');
  process.exit(0);
})();

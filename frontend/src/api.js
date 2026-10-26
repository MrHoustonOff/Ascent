// Обёртка над методами Go. В Wails — window.go.app.App; в браузере (dev) — HTTP-мост devserver.
async function call(name, args) {
  const bound = window.go && window.go.app && window.go.app.App && window.go.app.App[name];
  if (bound) return bound(...args);
  const r = await fetch('/rpc/' + name, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

export const api = new Proxy({}, { get: (_, name) => (...args) => call(String(name), args) });

// Окно: runtime Wails, если есть.
const rt = () => window.runtime || {};
export const win = {
  minimise: () => rt().WindowMinimise && rt().WindowMinimise(),
  toggleMaximise: () => rt().WindowToggleMaximise && rt().WindowToggleMaximise(),
  isMaximised: async () => (rt().WindowIsMaximised ? rt().WindowIsMaximised() : false),
  quit: () => rt().Quit && rt().Quit(),
  openURL: (u) => (rt().BrowserOpenURL ? rt().BrowserOpenURL(u) : window.open(u, '_blank', 'noopener')),
};

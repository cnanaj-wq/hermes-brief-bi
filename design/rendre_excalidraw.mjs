// Rend les fichiers .excalidraw en PNG avec la bibliothèque officielle (@excalidraw/utils) dans Edge sans interface.
// node design/rendre_excalidraw.mjs  ->  img/<nom>.png
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const IMG = path.join(ICI, '..', 'img');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9334, attendre = ms => new Promise(r => setTimeout(r, ms));
const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'vx-excalidraw-'));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profil}`, 'about:blank']);
let cible; for (let i = 0; i < 40 && !cible; i++) { await attendre(500); try { cible = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find(t => t.type === 'page'); } catch { } }
const ws = new WebSocket(cible.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r, { once: true }));
let n = 0; const att = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); att.get(m.id)?.(m.result); att.delete(m.id); });
const cdp = (method, params = {}) => new Promise(r => { att.set(++n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const evaluer = async expr => (await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.value;

for (const f of fs.readdirSync(ICI).filter(f => f.endsWith('.excalidraw'))) {
  const doc = fs.readFileSync(path.join(ICI, f), 'utf8');
  const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#fff;overflow:hidden}</style><script src="https://unpkg.com/@excalidraw/utils@0.1.2/dist/excalidraw-utils.min.js"></script><body><script>
    const d=${doc};
    window.pret=ExcalidrawUtils.exportToSvg({elements:d.elements,appState:{exportBackground:true,viewBackgroundColor:'#ffffff',exportWithDarkMode:false},files:{}}).then(svg=>{document.body.appendChild(svg);return [svg.getAttribute('width'),svg.getAttribute('height')].map(Number)});
  </script>`;
  const fichier = path.join(profil, f + '.html'); fs.writeFileSync(fichier, html);
  await cdp('Page.navigate', { url: 'file:///' + fichier.replaceAll('\\', '/') });
  await attendre(2500);
  const [w, h] = await evaluer('window.pret');
  await cdp('Emulation.setDeviceMetricsOverride', { width: Math.ceil(w), height: Math.ceil(h), deviceScaleFactor: 1.5, mobile: false });
  await attendre(2500); // police manuscrite
  const r = await cdp('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(IMG, f.replace('.excalidraw', '.png')), Buffer.from(r.data, 'base64'));
  console.log(f, Math.round(w), 'x', Math.round(h));
}
ws.close(); edge.kill(); process.exit(0);

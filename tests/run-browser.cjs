'use strict';
// Serve generated files on loopback only; no persistent preview process.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '../public');
const types = { '.html':'text/html; charset=utf-8', '.js':'application/javascript', '.json':'application/json', '.css':'text/css', '.xml':'application/xml', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg' };
const server = http.createServer((req, res) => {
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
  let file;
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep) && file !== root) throw new Error('outside root');
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    else if (!fs.existsSync(file) && !path.extname(file)) file += '.html';
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(file);
    res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
    if (/[/\\]rate[/\\]admin[/\\]/.test(file)) res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(400); res.end('Bad request'); }
});
if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error('Run npm run build before test:browser');
server.listen(0, '127.0.0.1', () => {
  const env = { ...process.env, TEST_URL: `http://127.0.0.1:${server.address().port}` };
  const localBrowsers = path.resolve(__dirname, '../node_modules/.cache/ms-playwright');
  if (!env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync(localBrowsers)) env.PLAYWRIGHT_BROWSERS_PATH = localBrowsers;
  const child = spawn(process.execPath, [path.join(__dirname, 'browser.cjs')], { env, stdio:'inherit' });
  const finish = code => { server.close(); process.exitCode = code; };
  child.once('error', error => { console.error(error); finish(1); });
  child.once('exit', code => finish(code ?? 1));
  for (const signal of ['SIGINT','SIGTERM']) process.once(signal, () => { child.kill(); server.close(); });
});

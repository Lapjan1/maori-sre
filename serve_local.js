const http = require('http'), fs = require('fs'), path = require('path');
const root = 'C:/Users/dshan/Downloads/Maori';
const port = 8080;
const mime = { '.js': 'application/javascript', '.html': 'text/html', '.mp3': 'audio/mpeg', '.webm': 'audio/webm', '.json': 'application/json', '.yaml': 'text/yaml', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
http.createServer((q, w) => {
  if (q.url === '/') { w.writeHead(302, { Location: '/apps/river-world/' }); w.end(); return; }
  if (q.url === '/apps/river-world/' || q.url === '/apps/river-world') { q.url = '/apps/river-world/index.html'; }
  let url = q.url.split('?')[0];
  let f = path.join(root, url.replace(/\\/g, '/').replace(/^\/+/, ''));
  try {
    let d = fs.readFileSync(f);
    let ext = path.extname(f);
    w.writeHead(200, {'Content-Type': mime[ext] || 'application/octet-stream'});
    w.end(d);
  } catch(e) {
    w.writeHead(404);
    w.end('404: ' + url);
  }
}).listen(port, () => console.log('http://localhost:' + port));

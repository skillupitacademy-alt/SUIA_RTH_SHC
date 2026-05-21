import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'out');
const port = Number(process.env.PORT || 3005);
const host = process.env.HOSTNAME || '0.0.0.0';

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0] || '/');
  const cleanPath = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const withoutLeadingSlash = cleanPath.replace(/^[/\\]+/, '');
  const basePath = join(root, withoutLeadingSlash);
  const candidates = [
    basePath,
    join(basePath, 'index.html'),
    `${basePath}.html`,
    join(root, '404.html'),
  ];

  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
}

createServer((request, response) => {
  const filePath = resolveFile(request.url || '/');

  if (!filePath) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const extension = extname(filePath);
  response.writeHead(filePath.endsWith('404.html') ? 404 : 200, {
    'content-type': mimeTypes[extension] || 'application/octet-stream',
  });
  createReadStream(filePath).pipe(response);
}).listen(port, host, () => {
  console.log(`SkillUp IT Academy site serving static export on ${host}:${port}`);
});

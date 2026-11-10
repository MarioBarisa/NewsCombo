import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import cors from 'cors';
const source = await readFile(new URL('../index.js', import.meta.url), 'utf8');
const config = source.slice(source.indexOf('const allowedOrigins'), source.indexOf('const PORT'));
function preflight(origin, environment) {
  let middleware;
  const configure = new Function('process', 'cors', 'app', config);
  configure({ env: environment }, cors, { use(value) { middleware = value; } });
  const headers = new Map();
  const response = { setHeader(key, value) { headers.set(key.toLowerCase(), value); }, getHeader(key) { return headers.get(key.toLowerCase()); }, end() {} };
  middleware({ method: 'OPTIONS', headers: { origin, 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type' } }, response, error => { if (error) throw error; });
  return { headers, status: response.statusCode };
}
for (const origin of ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5180']) {
  const result = preflight(origin, { NODE_ENV: 'development' });
  assert.equal(result.headers.get('access-control-allow-origin'), origin);
  assert.equal(result.status, 204);
}
for (const environment of ['development', 'production']) {
  assert.equal(preflight('http://localhost.evil.test:5174', { NODE_ENV: environment }).headers.get('access-control-allow-origin'), undefined);
}
assert.equal(preflight('http://localhost:5174', { NODE_ENV: 'production', FRONTEND_URL: 'https://newscombo.example' }).headers.get('access-control-allow-origin'), undefined);
assert.equal(preflight('https://newscombo.example', { NODE_ENV: 'production', FRONTEND_URL: 'https://newscombo.example' }).headers.get('access-control-allow-origin'), 'https://newscombo.example');
console.log('PASS: lokalni CORS i produkcijska ograničenja.');

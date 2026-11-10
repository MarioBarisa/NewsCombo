import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
const dist = new URL('../dist/', import.meta.url);
const worker = await readFile(new URL('sw.js', dist), 'utf8');
const assets = await readdir(new URL('assets/', dist));
assert.ok(worker.includes('index.html'));
for (const asset of assets) {
  if (!/\.(js|css)$/.test(asset)) continue;
  assert.ok(worker.includes(`assets/${asset}`), `Nedostaje precache: ${asset}`);
}
assert.ok(assets.some(asset => asset.startsWith('TermsOfService-')));
assert.ok(assets.some(asset => asset.startsWith('PrivacyPolicy-')));
assert.ok(worker.includes('registerRoute'));
console.log('PASS: PWA precache uključuje HTML, sve JS/CSS datoteke i pravne stranice.');

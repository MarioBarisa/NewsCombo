import assert from 'node:assert/strict';

const { default: createAuthRoutes } = await import('../routes/authRoutes.js');
let writes = 0;
let stored;
const db = { collection() { return {
  async findOne() { return null; },
  async insertOne(user) { writes++; user._id = 'legal-test'; stored = user; }
}; } };
const router = createAuthRoutes(db);
const route = router.stack.find(layer => layer.route?.path === '/auth/register');
const handler = route.route.stack[0].handle;
async function register(extra) {
  const response = { code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
  await handler({ body: { email: 'test@example.com', password: 'example-password', name: 'Test', ...extra } }, response);
  return response;
}
for (const body of [{}, { acceptedTerms: true }, { acceptedPrivacy: true }, { acceptedTerms: 'true', acceptedPrivacy: true }, { acceptedTerms: true, acceptedPrivacy: false }]) {
  const res = await register(body);
  assert.equal(res.code, 400);
  assert.equal(writes, 0);
}
const res = await register({ acceptedTerms: true, acceptedPrivacy: true });
assert.equal(res.code, 200);
assert.ok(res.data.token);
assert.equal(writes, 1);
assert.equal(stored.legalAcceptance.termsVersion, '2026-11-10');
assert.equal(stored.legalAcceptance.privacyVersion, '2026-11-10');
assert.ok(stored.legalAcceptance.acceptedAt instanceof Date);
assert.notEqual(stored.password, 'example-password');
console.log('PASS: registracija zahtijeva oba prihvaćanja i pohranjuje verzije i datum uz hash lozinke.');

import assert from 'node:assert/strict';
import { articleText, sanitizeArticleHtml } from '../services/articleHtml.js';
assert.equal(articleText('<p>Članak &amp; &#x1F600; &lt;RSS&gt;</p>'), 'Članak & 😀 <RSS>');
const unsafeEventHandler = 'onerror="alert(2)"';
const clean = sanitizeArticleHtml(`<p>Vijest</p><script>alert(1)</script><img src="https://example.com/image.jpg" alt="" ${unsafeEventHandler}><a href="javascript:alert(3)">Link</a>`, 'https://example.com/news');
assert.ok(clean.includes('Vijest'));
assert.ok(!/script|onerror|javascript:/.test(clean));
console.log('PASS: dekodiranje entiteta i sanitizacija članaka.');

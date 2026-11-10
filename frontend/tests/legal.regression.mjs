import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { compileComponent, node, renderer, all, text, button, click, asModule, vueUrl } from './helpers/vueRenderer.mjs';
const { h, nextTick } = await import(vueUrl);
const source = (await readFile(new URL('../src/composables/useLegalLanguage.js', import.meta.url), 'utf8')).replace("'vue'", JSON.stringify(vueUrl));
for (const [browser, expected] of [['hr', 'hr'], ['hr-HR', 'hr'], ['HR-ba', 'hr'], ['en-US', 'en'], ['de-DE', 'en'], ['', 'en']]) {
  Object.defineProperty(globalThis, 'navigator', { value: { language: browser }, configurable: true });
  const language = (await import(asModule(source + '\n;void ' + JSON.stringify(browser)))).useLegalLanguage();
  assert.equal(language.value, expected);
}
const languageUrl = asModule(source);
const { useLegalLanguage } = await import(languageUrl);
for (const [name, english, croatian] of [['TermsOfService', 'Terms of Service', 'Uvjeti korištenja'], ['PrivacyPolicy', 'Privacy Policy', 'Pravila privatnosti']]) {
  const page = await compileComponent(`src/views/${name}.vue`, { '../composables/useLegalLanguage': languageUrl });
  const root = node('root');
  const app = renderer.createApp(page.component);
  app.component('router-link', { setup(props, { slots }) { return () => h('a', slots.default?.()); } });
  app.mount(root);
  for (const [lang, title] of [['hr', croatian], ['en', english]]) {
    await click(button(root, lang.toUpperCase()));
    await nextTick();
    assert.equal(useLegalLanguage().value, lang);
    assert.equal(all(root, element => element.type === 'main')[0].props.lang, lang);
    assert.ok(text(all(root, element => element.type === 'h1')[0]).includes(title));
    const lastSection = name === 'TermsOfService' ? 13 : 12;
    assert.ok(text(root).includes(`${lastSection}. ${lang === 'hr' ? 'Kontakt' : 'Contact'}`));
  }
  app.unmount();
}
console.log('PASS: zadani jezik preglednika, HR/EN prekidač i obje potpune verzije pravnih dokumenata.');

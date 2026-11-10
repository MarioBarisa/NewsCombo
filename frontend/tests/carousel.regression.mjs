import assert from 'node:assert/strict';
import { compileComponent, node, renderer, all, text, asModule, vueUrl } from './helpers/vueRenderer.mjs';
const { ref, reactive, nextTick } = await import(vueUrl);
const articles = [
  { guid: 'feed_1:shared', link: 'https://shared.example/news', title: 'FIRST SOURCE' },
  { guid: 'feed_2:other', link: 'https://other.example/news', title: 'OTHER' },
  { guid: 'feed_2:shared', link: 'https://shared.example/news', title: 'SECOND SOURCE' }
];
const service = { cachedNews: ref(articles), isLoading: ref(false), error: ref(null), loadingProgress: ref(100), async fetchNews() { return { items: this.cachedNews.value }; } };
const theme = reactive({ timelineAnimations: true });
globalThis.__carouselService = service;
globalThis.__carouselTheme = theme;
const listeners = new Map();
globalThis.window = { innerWidth: 1024, addEventListener(name, fn) { listeners.set(name, fn); }, removeEventListener(name) { listeners.delete(name); }, matchMedia() { return { matches: false }; } };
const originalInterval = globalThis.setInterval;
const originalClear = globalThis.clearInterval;
let tick;
globalThis.setInterval = fn => { tick = fn; return 1; };
globalThis.clearInterval = () => {};
const banner = await compileComponent('src/components/GlobalVijestiBanner.vue', {
  '../Services/NewsGlobal.js': asModule('export function useNewsGlobal(){return globalThis.__carouselService;}'),
  '../Services/articleHtml.js': asModule('export function plainText(value){return value || "";}'),
  '../stores/theme': asModule('export function useThemeStore(){return globalThis.__carouselTheme;}'),
  './NewsModal.vue': asModule('export default {render(){return null;}};')
});
let ui;
const setup = banner.component.setup;
banner.component.setup = (...args) => { ui = setup(...args); return ui; };
const root = node('root');
const app = renderer.createApp(banner.component);
const warnings = [];
app.config.warnHandler = message => warnings.push(message);
try {
  app.mount(root);
  await nextTick();
  await nextTick();
  const titles = () => all(root, element => element.type === 'h3').map(text);
  for (let index = 0; index < 4; index++) {
    service.cachedNews.value = [...service.cachedNews.value].reverse();
    await nextTick();
    assert.deepEqual(titles(), service.cachedNews.value.map(item => item.title));
  }
  service.cachedNews.value = [{ guid: 'new', link: 'https://new.example/news', title: 'ONLY NEW' }];
  await nextTick();
  assert.deepEqual(titles(), ['ONLY NEW']);
  service.cachedNews.value = articles;
  await nextTick();
  ui.goToPrevious(); assert.equal(ui.currentIndex.value, 2);
  ui.goToNext(); assert.equal(ui.currentIndex.value, 0);
  tick(); assert.equal(ui.currentIndex.value, 1);
  window.innerWidth = 375;
  listeners.get('resize')();
  let scroll;
  ui.scrollContainer.value = { children: [{ offsetLeft: 20 }, { offsetLeft: 280 }, { offsetLeft: 540 }], scrollLeft: 500, scrollTo(options) { scroll = options; } };
  ui.goToSlide(2); assert.equal(scroll.left, 520); assert.equal(scroll.behavior, 'smooth');
  theme.timelineAnimations = false;
  ui.goToSlide(1); assert.equal(scroll.behavior, 'instant');
  theme.timelineAnimations = true;
  window.matchMedia = () => ({ matches: true });
  ui.goToSlide(0); assert.equal(scroll.behavior, 'instant');
  ui.onMobileScroll(); assert.equal(ui.currentIndex.value, 2); assert.equal(ui.currentNews.value.guid, articles[2].guid);
  assert.deepEqual(warnings, []);
  console.log('PASS: carousel podnosi zajedničke URL-ove, zamjene podataka, navigaciju i postavke kretanja.');
} finally {
  app.unmount();
  globalThis.setInterval = originalInterval;
  globalThis.clearInterval = originalClear;
}

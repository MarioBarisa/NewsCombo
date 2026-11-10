import assert from 'node:assert/strict';
import { compileComponent, node, renderer, all, text, find, button, click, asModule, vueUrl, algorithmUrl, fetchCalls } from './helpers/vueRenderer.mjs';
const { nextTick } = await import(vueUrl);
const { reactive, ref } = await import(vueUrl);
const { createEmptyProfile, applySignal, rankFeed } = await import(algorithmUrl);
const profile = createEmptyProfile();
const groupA = [
 { link:'https://science.example/one',title:'Science news',category:'Science',feedId:1,pubDate:'2026-11-10T11:00:00Z' },
 { link:'https://tech.example/two',title:'Open source tools',category:'Tech',feedId:2,pubDate:'2026-11-10T10:00:00Z' },
 { link:'https://tech.example/three',title:'Open source community',category:'Tech',feedId:2,pubDate:'2026-11-10T09:00:00Z' }
];
applySignal(profile,'heart',groupA[1]);
const service = { isLoading:ref(false),error:ref(null),partialInfo:reactive({failed:0}),snapshot:ref({stale:false}),cachedNews:ref(groupA),loadingProgress:ref(100),async fetchNews(){return {items:this.cachedNews.value};},async refreshNews(){},getMockNews(){return groupA;} };
const feeds = reactive({isLoading:false,error:null,initialized:true,selectedCategoryId:'group-a',selectedFeeds:[{id:1,name:'Science',url:'https://science.example/rss'},{id:2,name:'Tech',url:'https://tech.example/rss'}],async ensureReady(){}});
const theme = reactive({timelineAnimations:true});
const taste = { hydrated:true,hasEnoughData:true,async init(){},rankArticles(items){return rankFeed(items,profile);} };
globalThis.__service=service; globalThis.__feeds=feeds; globalThis.__theme=theme;globalThis.__taste=taste;
globalThis.window = { matchMedia() { return { matches: false }; } };
globalThis.IntersectionObserver=class {observe(){}disconnect(){}};
const dummy = asModule('export default { render(){return null;} };');
const replacements={
 '../Services/NewsGlobal':asModule("export function useNewsGlobal(){return globalThis.__service;}export function cacheKeyFor(id,feeds){return id+JSON.stringify(feeds);}export function cancelCategoryRequest(){}"),
 '../stores/feedStore':asModule("export function useFeedsStore(){return globalThis.__feeds;}"),
 '../stores/theme':asModule("export function useThemeStore(){return globalThis.__theme;}"),
 '../stores/tasteStore':asModule("export function useTasteStore(){return globalThis.__taste;}"),
 './NewsCardCompact.vue':asModule(`import {h} from ${JSON.stringify(vueUrl)};export default {props:['news','showScore'],setup(p){return()=>h('span',{'data-link':p.news.link,'data-score':p.showScore},p.news.title);}}`),
 './NewsModal.vue':dummy
};

const switcher = await compileComponent('src/components/FeedSwitcher.vue', {
  '../stores/feedStore': replacements['../stores/feedStore']
});
replacements['./FeedSwitcher.vue'] = switcher.url;
const timeline = await compileComponent('src/components/NewsTimeline.vue', replacements);
theme.timelineAnimations = false;
const duplicateNews = [
  { ...groupA[0], guid: 'feed_1:shared', link: 'https://shared.example/news', title: 'SHARED ONE', pubDate: '2026-11-10T12:00:00Z' },
  { ...groupA[1], guid: 'feed_2:other', link: 'https://other.example/news', title: 'OTHER', pubDate: '2026-11-10T11:00:00Z' },
  { ...groupA[2], guid: 'feed_2:shared', link: 'https://shared.example/news', title: 'SHARED TWO', pubDate: '2026-11-10T10:00:00Z' },
  { ...groupA[0], guid: 'feed_1:last', link: 'https://last.example/news', title: 'LAST', pubDate: '2026-11-10T09:00:00Z' }
];
service.cachedNews.value = duplicateNews;
const root = node('root');
const app = renderer.createApp(timeline.component);
app.component('RouterLink', { render() { return null; } });
const warnings = [];
app.config.warnHandler = message => warnings.push(message);
app.mount(root);
await nextTick();
await nextTick();
const rows = () => all(root, element => element.props['data-link']).map(text);
const sourceButton = name => find(root, element => element.type === 'button' && element.props.title === `Prikaži samo vijesti iz ${name}`);
const expectedNewest = ['SHARED ONE', 'OTHER', 'SHARED TWO', 'LAST'];
assert.deepEqual(rows(), expectedNewest);
for (let repetition = 0; repetition < 4; repetition++) {
  await click(button(root, 'Najstarije'));
  assert.deepEqual(rows(), [...expectedNewest].reverse());
  await click(button(root, 'Najnovije'));
  assert.deepEqual(rows(), expectedNewest);
  await click(button(root, 'Za tebe'));
  assert.equal(rows().length, 4);
}
assert.equal(warnings.length, 0);
console.log('PASS: duplicirani URL-ovi imaju odvojene retke; ponovljeno sortiranje ne ostavlja višak DOM redaka.');

await click(sourceButton('Tech'));
assert.equal(sourceButton('Tech').props['aria-pressed'], true);
assert.equal(rows().length, 2);
await click(button(root, 'Najstarije'));
feeds.selectedFeeds = feeds.selectedFeeds.map(feed => ({ ...feed, name: feed.id === 2 ? 'Tech renamed' : feed.name }));
await nextTick();
await nextTick();
assert.equal(sourceButton('Tech renamed').props['aria-pressed'], true);
assert.equal(button(root, 'Najstarije').props['aria-pressed'], true);
assert.deepEqual(rows(), ['SHARED TWO', 'OTHER']);
feeds.selectedFeeds = feeds.selectedFeeds.filter(feed => feed.id !== 2);
service.cachedNews.value = duplicateNews.filter(article => article.feedId === 1);
await nextTick();
await nextTick();
assert.deepEqual(rows(), ['LAST', 'SHARED ONE']);
assert.equal(sourceButton('Science').props['aria-pressed'], false);
assert.equal(button(root, 'Najstarije').props['aria-pressed'], true);
const sourceSelect = find(root, element => element.type === 'select');
await sourceSelect.props.onChange({ target: { value: '1' } });
await nextTick();
assert.equal(sourceButton('Science').props['aria-pressed'], true);
assert.equal(sourceSelect.props.value, 1);
await sourceSelect.props.onChange({ target: { value: '' } });
await nextTick();
assert.equal(sourceButton('Science').props['aria-pressed'], false);
assert.equal(sourceSelect.props.value, '');
console.log('PASS: mobilni select i desktop gumbi koriste isti odabrani izvor.');
console.log('PASS: promjena metapodataka čuva sortiranje i odabrani izvor; uklonjeni izvor čisti filter.');

for (let index = 0; index < 5; index++) {
  feeds.selectedCategoryId = `group-${index}`;
  feeds.selectedFeeds = [{ id: index + 10, name: `Source ${index}`, url: `https://source${index}.example/rss` }];
  service.cachedNews.value = [{ ...groupA[0], guid: `group-${index}:one`, feedId: index + 10, title: `GROUP ${index} ONLY` }];
  await nextTick();
  await nextTick();
  assert.deepEqual(rows(), [`GROUP ${index} ONLY`]);
  assert.equal(button(root, 'Najnovije').props['aria-pressed'], true);
}
console.log('PASS: promjena grupe uklanja prethodne retke i resetira sortiranje.');

const animationRecords = [];
globalThis.__timelineAnimate = (frames, options) => {
  let resolve;
  let reject;
  const finished = new Promise((done, failed) => { resolve = done; reject = failed; });
  const record = { frames, options, cancelled: false, resolve };
  animationRecords.push(record);
  return { finished, cancel() { record.cancelled = true; reject(new Error('cancelled')); } };
};
async function finishAnimations() {
  for (const record of animationRecords) record.resolve();
  await nextTick();
  await nextTick();
}
theme.timelineAnimations = true;
const pendingSort = button(root, 'Najstarije').props.onClick({});
await nextTick();
await nextTick();
assert.ok(animationRecords.length > 0);
const firstSort = [...animationRecords];
await click(sourceButton('Source 4'));
await pendingSort;
assert.ok(firstSort.every(animation => animation.cancelled));
assert.equal(sourceButton('Source 4').props['aria-pressed'], true);
await finishAnimations();

// Svaki način dobiva isti kratak prijelaz.
for (const label of ['Najnovije', 'Za tebe', 'Najstarije', 'Za tebe', 'Najnovije']) {
  const before = animationRecords.length;
  const pending = button(root, label).props.onClick({});
  await nextTick();
  await nextTick();
  assert.ok(animationRecords.length > before);
  assert.equal(animationRecords.at(-1).frames[0].opacity, 0.65);
  await finishAnimations();
  await pending;
}

const pendingGroupSort = button(root, 'Najstarije').props.onClick({});
await nextTick();
await nextTick();
const oldGroupAnimations = animationRecords.filter(record => !record.cancelled);
feeds.selectedCategoryId = 'waiting';
feeds.selectedFeeds = [];
service.cachedNews.value = [];
await nextTick();
await pendingGroupSort;
assert.ok(oldGroupAnimations.at(-1).cancelled);
assert.deepEqual(rows(), []);

// Dolazak podataka nakon praznog prikaza.
const beforeArrival = animationRecords.length;
service.cachedNews.value = duplicateNews;
await nextTick();
await nextTick();
const entrance = animationRecords.slice(beforeArrival);
assert.equal(entrance.length, 4);
for (let index = 0; index < entrance.length; index++) {
  assert.equal(entrance[index].frames[0].opacity, 0);
  assert.equal(entrance[index].frames[0].transform, 'translateY(8px)');
  assert.equal(entrance[index].options.duration, 300);
  assert.equal(entrance[index].options.delay, index * 14);
}
assert.deepEqual(rows(), expectedNewest);
await finishAnimations();

// Cache druge kategorije s istim brojem vijesti.
const beforeCached = animationRecords.length;
feeds.selectedCategoryId = 'cached';
service.cachedNews.value = duplicateNews.map(article => ({ ...article, guid: 'cached:' + article.guid }));
await nextTick();
await nextTick();
assert.equal(animationRecords.length - beforeCached, 4);
assert.deepEqual(rows(), expectedNewest);
await finishAnimations();

theme.timelineAnimations = false;
await nextTick();
const beforeDisabled = animationRecords.length;
await click(button(root, 'Najstarije'));
feeds.selectedCategoryId = 'disabled';
await nextTick();
await nextTick();
assert.equal(animationRecords.length, beforeDisabled);
theme.timelineAnimations = true;
window.matchMedia = () => ({ matches: true });
await click(button(root, 'Za tebe'));
assert.equal(animationRecords.length, beforeDisabled);
assert.equal(warnings.length, 0);
assert.equal(fetchCalls, 0);
app.unmount();
console.log('PASS: prekid starih animacija, svi načini sortiranja, postupan ulaz nove kategorije iz cachea ili nakon učitavanja, bez promjene podataka.');
console.log('PASS: postavka animacija i smanjeno kretanje sustava isključuju sve nove prijelaze.');

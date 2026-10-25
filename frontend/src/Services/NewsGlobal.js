import { ref, computed } from 'vue';
import { useFeedsStore } from '../stores/feedStore';
import { API_URL } from '../config.js';
import { hashLink } from './recommender.js';
import { sessionUserId } from './sessionStorage.js';
import { plainText, safeArticleUrl, sanitizeContent } from './articleHtml.js';

const snapshots = ref({});
const jobs = new Map();
const CACHE_PREFIX = 'newsCombo_rss_v2';
const CACHE_DURATION = 5 * 60 * 1000;
const BATCH_SIZE = 4;
let sessionGeneration = 0;

function serviceCategory(categoryId) {
  if (categoryId === 'combo') return 'all';
  if (categoryId == null) return 'all';
  if (typeof categoryId !== 'string') throw new Error('Neispravna kategorija');
  return categoryId;
}

function feedsForCategory(categoryId) {
  const store = useFeedsStore();
  if (categoryId === 'all') return store.availableFeeds;
  return store.categories.find(category => category.id === categoryId)?.feeds || [];
}

export function cacheKeyFor(categoryId, feeds) {
  const sources = [];
  for (const feed of feeds || []) sources.push([feed.id, feed.url, feed.name, feed.category, feed.domain].join('|'));
  sources.sort();
  return `${CACHE_PREFIX}:${sessionUserId()}:${serviceCategory(categoryId)}:${hashLink(sources.join('\n'))}`;
}

function emptySnapshot(key) {
  return { key, items: [], status: 'idle', error: null, failedSources: [], total: 0, progress: 0, stale: false, timestamp: 0 };
}

function readCache(key) {
  try {
    const snapshot = JSON.parse(localStorage.getItem(key));
    if (snapshot?.key === key && Array.isArray(snapshot.items) && Date.now() - snapshot.timestamp < CACHE_DURATION) return snapshot;
    localStorage.removeItem(key);
  } catch {}
  return null;
}

function saveCache(snapshot) {
  try {
    localStorage.setItem(snapshot.key, JSON.stringify(snapshot));
    const indexKey = `${CACHE_PREFIX}:${sessionUserId()}:index`;
    let index = JSON.parse(localStorage.getItem(indexKey) || '[]');
    if (!Array.isArray(index)) index = [];
    index = index.filter(key => key !== snapshot.key);
    index.push(snapshot.key);
    while (index.length > 4) localStorage.removeItem(index.shift());
    localStorage.setItem(indexKey, JSON.stringify(index));
  } catch {}
}

function normalizeItem(item, feed, categoryId, feedImage) {
  const content = item.content || item.encodedContent || item.originalContent || item.description || item.contentSnippet || '';
  const link = safeArticleUrl(item.link, feed.url);
  const title = plainText(item.title) || 'Bez naslova';
  const description = plainText(item.description || item.contentSnippet || content).slice(0, 300);
  const identity = String(item.guid || item.id || link || hashLink(`${title}|${item.pubDate || ''}|${description}`));
  const guid = `${feed.id}:${identity}`;
  let image = safeArticleUrl(item.thumbnail, feed.url);
  if (!image && item.enclosure?.type?.startsWith('image/')) image = safeArticleUrl(item.enclosure.url, feed.url);
  if (!image) image = safeArticleUrl(feedImage, feed.url);
  const timestamp = Date.parse(item.pubDate || item.isoDate);
  return {
    title, description, link, guid,
    content: sanitizeContent(content, link || feed.url),
    hasFullContent: item.hasFullContent === true || Boolean(item.encodedContent || item.originalContent),
    author: plainText(item.author || item.creator || ''),
    pubDate: Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null,
    source: feed.name, domain: feed.domain, category: feed.category,
    feedId: feed.id, categoryId, sourceUrl: feed.url,
    thumbnail: image,
    fetchedAt: new Date().toISOString()
  };
}

async function fetchRssBatch(urls, force, signal) {
  const token = localStorage.getItem('token');
  for (let attempt = 0; attempt < 2; attempt++) {
    signal.throwIfAborted();
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(`${API_URL}/rss/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ urls, force }),
        signal: controller.signal
      });
      if (!response.ok) {
        const error = new Error(`Dohvat nije uspio (${response.status})`);
        error.retryable = response.status >= 500;
        throw error;
      }
      const data = await response.json();
      if (!Array.isArray(data.feeds)) throw new Error('Neispravan odgovor izvora');
      return data.feeds;
    } catch (error) {
      if (signal.aborted) throw error;
      if (attempt === 1 || error.retryable === false) throw error;
    } finally {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
    }
  }
}

async function loadNews(categoryId, force, priorityFeedId) {
  categoryId = serviceCategory(categoryId);
  const generation = sessionGeneration;
  const store = useFeedsStore();
  await store.ensureReady();
  if (generation !== sessionGeneration) return emptySnapshot(null);
  const feeds = [...feedsForCategory(categoryId)];
  const key = cacheKeyFor(categoryId, feeds);
  const currentJob = jobs.get(key);
  if (currentJob && !force) return currentJob.promise;
  if (currentJob) currentJob.controller.abort();
  if (!force) {
    const cached = readCache(key);
    if (cached) {
      snapshots.value[key] = cached;
      return cached;
    }
  }
  if (priorityFeedId) feeds.sort((a, b) => Number(b.id === priorityFeedId) - Number(a.id === priorityFeedId));
  const previous = snapshots.value[key];
  const snapshot = { ...emptySnapshot(key), status: 'loading', total: feeds.length };
  if (previous?.items.length) {
    snapshot.items = previous.items;
    snapshot.stale = true;
  }
  const allKey = cacheKeyFor('all', store.availableFeeds);
  if (jobs.size >= 4) {
    for (const [oldKey, oldJob] of jobs) {
      if (oldKey === allKey || oldKey === key) continue;
      oldJob.controller.abort();
      jobs.delete(oldKey);
      delete snapshots.value[oldKey];
      break;
    }
  }
  const controller = new AbortController();
  const job = { controller, promise: null };
  jobs.set(key, job);
  const ownsRequest = () => generation === sessionGeneration && jobs.get(key) === job && !controller.signal.aborted;
  const publish = () => {
    if (ownsRequest()) snapshots.value[key] = { ...snapshot, items: [...snapshot.items], failedSources: [...snapshot.failedSources] };
  };
  publish();
  job.promise = (async () => {
    const items = [];
    const seen = new Set();
    let succeeded = 0;
    try {
      const urls = [...new Set(feeds.map(feed => feed.url))];
      for (let offset = 0; offset < urls.length; offset += BATCH_SIZE) {
        const chunk = urls.slice(offset, offset + BATCH_SIZE);
        let results;
        try {
          results = await fetchRssBatch(chunk, force, controller.signal);
        } catch (error) {
          if (controller.signal.aborted) throw error;
          results = chunk.map(url => ({ url, success: false, error: error.message }));
        }
        if (!ownsRequest()) return { ...emptySnapshot(key), status: 'cancelled' };
        for (const feed of feeds) {
          if (!chunk.includes(feed.url)) continue;
          const result = results.find(result => result?.url === feed.url);
          if (!result?.success || !Array.isArray(result.items)) {
            snapshot.failedSources.push(feed.name);
            continue;
          }
          succeeded++;
          for (const raw of result.items) {
            if (!raw || typeof raw !== 'object') continue;
            const item = normalizeItem(raw, feed, categoryId, result.feedImage);
            if (seen.has(item.guid)) continue;
            seen.add(item.guid);
            items.push(item);
          }
        }
        items.sort((a, b) => (Date.parse(b.pubDate) || 0) - (Date.parse(a.pubDate) || 0));
        if (succeeded > 0) {
          snapshot.items = items.slice(0, 300);
          snapshot.stale = false;
        }
        snapshot.progress = Math.round(Math.min(offset + chunk.length, urls.length) / urls.length * 100);
        publish();
      }
      snapshot.status = feeds.length === 0 || succeeded > 0 ? (snapshot.failedSources.length ? 'partial' : 'ready') : 'error';
      snapshot.error = snapshot.status === 'error' ? 'Nije moguće učitati vijesti. Pokušajte ponovno.' : null;
      snapshot.progress = 100;
      snapshot.timestamp = Date.now();
      publish();
      if (ownsRequest() && snapshot.status === 'ready') saveCache(snapshot);
      const keys = Object.keys(snapshots.value);
      for (const oldKey of keys) {
        if (Object.keys(snapshots.value).length <= 6) break;
        if (oldKey !== key && oldKey !== allKey && !jobs.has(oldKey)) delete snapshots.value[oldKey];
      }
      return { ...snapshot };
    } catch (error) {
      if (!ownsRequest()) return { ...emptySnapshot(key), status: 'cancelled' };
      snapshot.status = 'error';
      snapshot.error = 'Greška pri dohvaćanju vijesti';
      publish();
      return { ...snapshot };
    } finally {
      if (jobs.get(key) === job) jobs.delete(key);
    }
  })();
  return job.promise;
}

export function fetchNews(categoryId = 'all', priorityFeedId = null) {
  return loadNews(categoryId, false, priorityFeedId);
}

export function refreshNews(categoryId = 'all', priorityFeedId = null) {
  return loadNews(categoryId, true, priorityFeedId);
}

export function cancelCategoryRequest(key) {
  const store = useFeedsStore();
  if (key === cacheKeyFor('all', store.availableFeeds)) return;
  const job = jobs.get(key);
  if (!job) return;
  job.controller.abort();
  jobs.delete(key);
  if (snapshots.value[key]) snapshots.value[key] = { ...snapshots.value[key], status: 'idle' };
}

export function resetNewsSession() {
  sessionGeneration++;
  for (const job of jobs.values()) job.controller.abort();
  jobs.clear();
  snapshots.value = {};
}

export function getMockNews() {
  return [{ title: 'Demo vijest', description: 'Primjer prikaza vijesti.', pubDate: new Date().toISOString(), guid: 'demo', link: 'https://example.com/', source: 'Demo', categoryId: 'all' }];
}

export function useNewsGlobal(category = () => useFeedsStore().selectedCategoryId) {
  const snapshot = computed(() => {
    const categoryId = serviceCategory(category());
    const key = cacheKeyFor(categoryId, feedsForCategory(categoryId));
    return snapshots.value[key] || emptySnapshot(key);
  });
  const newsBySource = computed(() => {
    const sources = {};
    for (const item of snapshot.value.items) {
      if (!sources[item.source]) sources[item.source] = [];
      sources[item.source].push(item);
    }
    return sources;
  });
  return {
    snapshot,
    cachedNews: computed(() => snapshot.value.items),
    isLoading: computed(() => snapshot.value.status === 'loading'),
    error: computed(() => snapshot.value.error),
    loadingProgress: computed(() => snapshot.value.progress),
    partialInfo: computed(() => ({ failed: snapshot.value.failedSources.length, total: snapshot.value.total })),
    publishedCacheKey: computed(() => snapshot.value.key),
    newsBySource,
    fetchNews, refreshNews, getMockNews
  };
}

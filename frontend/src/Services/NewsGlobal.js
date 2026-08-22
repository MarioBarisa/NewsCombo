import { ref, computed } from 'vue';
import { useFeedsStore } from '../stores/feedStore';
import { hashLink } from '../Services/recommender.js';

const isLoading = ref(false);
const error = ref(null);
const cachedNews = ref([]);
const newsBySource = ref({});
const loadingProgress = ref(0);
// Djelomično učitavanje: koliko izvora je palo (chip umjesto lažne greške)
const partialInfo = ref({ failed: 0, total: 0 });
// Ključ kategorije kojoj TRENUTNI cachedNews sadržaj pripada (guard protiv cross-category prikaza)
const publishedCacheKey = ref(null);
let inFlightFetchPromise = null;
let fetchGeneration = 0;
// aktivni AbortController — novi switch prekine stari fetch odmah (trenutno prebacivanje)
let fetchAbortController = null;
// ključ trenutno aktivnog cache zapisa (postavlja fetchNews/fetchNewsFresh)
let currentCacheKey = null;
// meta aktivnog fetcha (za dedupe istog ključa: npr. Timeline + Banner istovremeno)
let inFlightKey = null;
let inFlightForce = false;

// prekini pokrenuti fetch i preuzmi vlasništvo (novi generation)
const invalidateInFlight = () => {
  fetchGeneration++;
  if (fetchAbortController) {
    fetchAbortController.abort();
    fetchAbortController = null;
  }
  inFlightFetchPromise = null;
  inFlightKey = null;
  inFlightForce = false;
};

// cache — ključ po kategoriji + hash liste feedova URL-ova
const CACHE_PREFIX = 'newsCombo_rss_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5min
const CACHE_MAX_ENTRIES = 4;          // max kategorija u cacheu istovremeno
const FETCH_TIMEOUT_MS = 12_000;
const BATCH_SIZE = 20;

const cacheKeyFor = (categoryId, feeds) => {
  const urls = (feeds || []).map((f) => f.url).sort().join('|');
  return `${CACHE_PREFIX}::${categoryId || 'all'}::${hashLink(urls)}`;
};

const cacheIndexStorageKey = () => `${CACHE_PREFIX}__index`;

const readCacheIndex = () => {
  try {
    const raw = localStorage.getItem(cacheIndexStorageKey());
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((e) => e && typeof e.key === 'string') : [];
  } catch {
    return [];
  }
};

const writeCacheIndex = (index) => {
  try { localStorage.setItem(cacheIndexStorageKey(), JSON.stringify(index)); } catch { /* pusti */ }
};

const getCachedData = (key) => {
  if (!key) return null;
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (!data || !Array.isArray(data.items)) return null;
    if (Date.now() - timestamp >= CACHE_DURATION) {
      localStorage.removeItem(key);
      writeCacheIndex(readCacheIndex().filter((e) => e.key !== key));
      return null;
    }
    return data.items;
  } catch {
    return null;
  }
};

const setCachedData = (key, data) => {
  if (!key || !Array.isArray(data)) return;
  try {
    localStorage.setItem(key, JSON.stringify({ data: { items: data }, timestamp: Date.now() }));
    const now = Date.now();
    let index = readCacheIndex()
      .filter((e) => e.key !== key && now - e.ts < CACHE_DURATION);
    index.push({ key, ts: now });
    index = index.sort((a, b) => b.ts - a.ts);
    while (index.length > CACHE_MAX_ENTRIES) {
      const evicted = index.pop();
      try { localStorage.removeItem(evicted.key); } catch { /* pusti */ }
    }
    writeCacheIndex(index);
  } catch (err) {
    console.warn('Ne mogu save-at u cache:', err);
  }
};

const clearCachedData = (key) => {
  if (!key) return;
  try {
    localStorage.removeItem(key);
    writeCacheIndex(readCacheIndex().filter((e) => e.key !== key));
  } catch { /* pusti */ }
};

// helperi za parsiranje

  const STYLE_TAG_REGEX = /<style[^>]*>[\s\S]*?<\/style>/gi;
  const SCRIPT_TAG_REGEX = /<script[^>]*>[\s\S]*?<\/script>/gi;
  const HTML_TAG_REGEX = /<\/?[^>]+(>|$)/g;
  const HTML_ENTITIES = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'"
  };

  const cleanDescription = (text) => {
    if (!text) return '';
    
    let cleaned = text
      .replace(STYLE_TAG_REGEX, '')
      .replace(SCRIPT_TAG_REGEX, '')
      .replace(HTML_TAG_REGEX, '');
    
    for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
      cleaned = cleaned.replaceAll(entity, char);
    }
    
    return cleaned.trim().substring(0, 300);
  };

const getText = (element, selectors) => {
  if (!element) return null;
  for (const selector of selectors) {
    const el = element.querySelector(selector);
    const text = el?.textContent?.trim();
    if (text) return text;
  }
  return null;
};

// ekstrakcija atributa
const getAttr = (element, selector, attrs = ['url', 'href']) => {
  if (!element) return null;
  const el = selector ? element.querySelector(selector) : element;
  if (!el) return null;
  
  for (const attr of attrs) {
    const value = el.getAttribute(attr);
    if (value) return value;
  }
  return null;
};

const extractThumbnail = (item, rawContent) => {
  // 1. Enclosure
  // noinspection JSValidateTypes
  const enclosure = item.querySelector('enclosure');
  if (enclosure) {
    const type = enclosure.getAttribute('type')?.toLowerCase() || '';
    const url = getAttr(enclosure, null);
    if (url && (!type || type.includes('image'))) {
      return url;
    }
  }

  // 2. Media namespace
  const mediaSelectors = [
    'media\\:content[url]',
    'media\\:thumbnail[url]', 
    'media\\:group media\\:content[url]',
    'content[url]',
    'image[url]',
    'thumbnail[url]'
  ];
  
  for (const selector of mediaSelectors) {
    const url = getAttr(item, selector);
    if (url) return url;
  }

  // 3. content:encoded specificno
  const contentEncoded = item.querySelector('content\\:encoded');
  if (contentEncoded) {
    const html = contentEncoded.textContent || contentEncoded.innerHTML || '';
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1].replace(/&amp;/g, '&');
    }
  }

  // 4. description fallback
  // noinspection JSValidateTypes
  const description = item.querySelector('description');
  if (description) {
    const html = description.textContent || description.innerHTML || '';
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1].replace(/&amp;/g, '&');
    }
  }

  // 5. rawContent kao string
  if (rawContent && typeof rawContent === 'string') {
    const imgMatch = rawContent.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1].replace(/&amp;/g, '&');
    }
  }

  return null;
};


const extractImageFromItem = (item) => {
  if (item.enclosure && item.enclosure.url) return item.enclosure.url;

  const mediaKeys = ['media:thumbnail', 'media:content', 'media:group'];
  for (const key of mediaKeys) {
    const val = item[key];
    if (!val) continue;
    if (val.url) return val.url;
    if (val.$ && val.$.url) return val.$.url; 
    if (Array.isArray(val)) { 
      const found = val.find(v => v.url || (v.$ && v.$.url));
      if (found) return found.url || found.$.url;
    }
  }

  const htmlContent = item.content || item.description || item.contentSnippet || '';
  if (typeof htmlContent === 'string') {
    const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1].replace(/&amp;/g, '&');
    }
  }

  return null;
};

// sadržaj članka
const getBestContent = (item) => {
  const content = item.content || item.encodedContent || item.originalContent || '';
  const description = item.description || item.contentSnippet || '';
  
  if (content.length > description.length + 50) {
     return content;
  }
  return description || content; 
};

// Safari-friendly parsiranje datuma
const parseDateSafe = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  const normalized = trimmed
    // Safari ne parsira "... 12:00:00 Z"
    .replace(/\s+Z$/i, ' GMT')
    // +0000 -> +00:00
    .replace(/\s([+-]\d{2})(\d{2})$/, ' $1:$2');

  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  // RFC822 fallback
  const match = trimmed.match(/^[A-Za-z]{3},\s(\d{1,2})\s([A-Za-z]{3})\s(\d{4})\s(\d{2}):(\d{2})(?::(\d{2}))?\sZ$/);
  if (match) {
    const months = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };
    const month = months[match[2]];
    if (month !== undefined) {
      const date = new Date(Date.UTC(
        Number(match[3]),
        month,
        Number(match[1]),
        Number(match[4]),
        Number(match[5]),
        Number(match[6] || '0')
      ));
      if (!Number.isNaN(date.getTime())) return date.toISOString();
    }
  }

  return null;
};

const getTimestampOrOldest = (dateStr) => {
  if (!dateStr) return Number.NEGATIVE_INFINITY;
  const ts = new Date(dateStr).getTime();
  return Number.isNaN(ts) ? Number.NEGATIVE_INFINITY : ts;
};

const getSourceFavicon = (domain) => {
  if (!domain) return null;
  const clean = String(domain).replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
  return `https://icons.duckduckgo.com/ip3/${clean}.ico`;
};


const parseRSSFeed = (xmlText, feed) => {
  try {
    if (xmlText && xmlText.isBackendFormat) {
      const feedFallbackImage = xmlText.feedImage || getSourceFavicon(feed.domain);
      return xmlText.items.map(item => ({
        title: item.title || 'Bez naslova',
        description: cleanDescription(getBestContent(item)),
        link: item.link || '#',
        pubDate: parseDateSafe(item.pubDate || item.isoDate),
        source: feed.name,
        domain: feed.domain || 'unknown',
        category: feed.category || 'general',
        feedId: feed.id,
        thumbnail: extractImageFromItem(item) || item.feedImage || feedFallbackImage,
        guid: item.guid || item.id || item.link || `${feed.name}-${Date.now()}-${Math.random()}`
      }));
    }

    // Legacy CORS proxy format 
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    
    // check parse greške
    // noinspection JSValidateTypes
    if (xml.querySelector('parsererror')) {
      console.warn(`XML parse greška za ${feed.name}`);
      return [];
    }
    
    // ATOM ili RSS vrsta?
    // noinspection JSValidateTypes
    const isAtom = xml.querySelector('feed') !== null;
    const itemSelector = isAtom ? 'entry' : 'item';
    const items = xml.querySelectorAll(itemSelector);
    
    if (items.length === 0) {
      console.warn(`Nema items za ${feed.name}`);
      return [];
    }

    // map bolji od set 
    const titleSelectors = ['title'];
    const linkSelectors = isAtom ? ['link[href]', 'link'] : ['link'];
    const dateSelectors = isAtom ? ['updated', 'published'] : ['pubDate', 'dc\\:date'];
    const contentSelectors = isAtom 
  ? ['content', 'summary'] 
  : ['content\\:encoded', 'content', 'description', 'summary'];
    const guidSelectors = ['guid', 'id'];

    return Array.from(items).slice(0, 20).map(item => {
      const title = getText(item, titleSelectors) || 'Bez naslova';
      
      // link extract ( posebno za Atom )
      let link = getText(item, linkSelectors);
      if (!link && isAtom) {
        link = getAttr(item, 'link', ['href']) || getAttr(item, 'link[rel="alternate"]', ['href']);
      }
      link = link || '#';
      
      const pubDate = parseDateSafe(getText(item, dateSelectors));
      const rawContent = getText(item, contentSelectors) || '';
      const guid = getText(item, guidSelectors) || link || `${feed.name}-${Date.now()}-${Math.random()}`;
      
      const thumbnail = extractThumbnail(item, rawContent) || getSourceFavicon(feed.domain);
      const description = cleanDescription(rawContent);

      return {
        title,
        description,
        link,
        pubDate,
        source: feed.name,
        domain: feed.domain || 'unknown',
        category: feed.category || 'general',
        feedId: feed.id,
        thumbnail,
        guid
      };
    });
    
  } catch (err) {
    console.error(`Parse greška za ${feed.name}:`, err.message);
    return [];
  }
};

/**
 * Batch dohvat: jedan POST sa SVIM URL-ovima chunka (backend paralelno skida).
 * Timeout 12s (AbortController) + 1 automatski retry (osim ako je vanjski signal abortan).
 */
async function fetchRssBatch(urls, externalSignal = null) {
  const doFetch = async () => {
    const { API_URL } = await import('../config.js');
    const token = localStorage.getItem('token');
    const controller = new AbortController();
    const onExternalAbort = () => controller.abort();
    if (externalSignal) {
      if (externalSignal.aborted) throw Object.assign(new Error('aborted'), { name: 'AbortError' });
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(`${API_URL}/rss/fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ urls }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timer);
      if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
    }
  };

  try {
    return await doFetch();
  } catch (err) {
    // Retry preskoči SAMO kad je korisnik switchao kategoriju (vanjski abort).
    // Timeout (interni AbortError) ide u retry granu.
    if (externalSignal?.aborted) {
      console.log('RSS batch prekinut (switch kategorije).');
      return null;
    }
    console.warn(`RSS batch greška (${err.message}), pokušavam ponovno...`);
    try {
      return await doFetch();
    } catch (retryErr) {
      console.error('RSS batch retry neuspješan:', retryErr.message);
      return null;
    }
  }
}


function convertBackendFeedToXML(feedData) {
  const items = feedData.items.map(item => ({
    title: item.title,
    link: item.link,
    pubDate: item.pubDate || item.isoDate,
    description: item.contentSnippet || item.content || '',
    content: item.originalContent || item.encodedContent || item.content || item.contentSnippet || '',
    guid: item.guid || item.link,
    enclosure: item.enclosure,
    'media:thumbnail': item['media:thumbnail'],
    'media:content': item['media:content'],
    feedImage: feedData.feedImage || null
  }));

  return { items, isBackendFormat: true, feedImage: feedData.feedImage || null };
}




// razriješi listu feedova za kategoriju (čeka store ako treba)
const resolveFeedsForCategory = async (categoryId) => {
  const feedsStore = useFeedsStore();
  if (feedsStore.availableFeeds.length === 0) {
    await feedsStore.ensureReady().catch(() => {});
  }
  if (categoryId === 'all' || !categoryId) {
    return feedsStore.availableFeeds;
  }
  const category = feedsStore.categories.find((c) => c.id === categoryId);
  return category ? category.feeds : [];
};

const chunkArray = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

  const fetchNews = async (categoryId = null, priorityFeedId = null) => {
    const feeds = await resolveFeedsForCategory(categoryId);
    const key = cacheKeyFor(categoryId, feeds);

    // Dedupe: isti ključ je već u letu (npr. Timeline + Banner istovremeno) → dijeli poziv
    if (inFlightFetchPromise && inFlightKey === key && !inFlightForce) {
      console.log('fetchNews: isti ključ već se dohvaća, čekam postojeći zahtjev.');
      return await inFlightFetchPromise;
    }

    const cached = getCachedData(key);
    if (cached && cached.length > 0) {
      console.log(`fetched vijesti (cache) -> ${cached.length}`);
      // cache-hit preuzima vlasništvo — stari fetch više ne smije publishati
      invalidateInFlight();
      isLoading.value = false;
      loadingProgress.value = 100;
      partialInfo.value = { failed: 0, total: 0 };
      error.value = null;

      currentCacheKey = key;
      publishedCacheKey.value = key;
      cachedNews.value = cached;
      return cached;
    }

    console.log('Nema cachea, dohvaćam fresh');
    return await fetchNewsFresh(categoryId, false, priorityFeedId, feeds);
  };
  

// batched dohvat: jedan POST po chunku od 20 feedova; initial paint čeka prvi chunk
const fetchNewsFresh = async (categoryId = null, forceRefresh = false, priorityFeedId = null, preResolvedFeeds = null) => {
  fetchGeneration++;
  const generation = fetchGeneration;

  let resolveInitialBatch;
  let initialBatchResolved = false;
  const initialBatchPromise = new Promise(resolve => {
    resolveInitialBatch = resolve;
  });

  inFlightFetchPromise = (async () => {
    isLoading.value = true;
    error.value = null;
    loadingProgress.value = 0;
    partialInfo.value = { failed: 0, total: 0 };

    // prekini zahtjev prethodne generacije (brz switch kategorija)
    if (fetchAbortController) fetchAbortController.abort();
    fetchAbortController = new AbortController();
    const signal = fetchAbortController.signal;

    const tempNewsBySource = {};
    const failedFeeds = [];

    try {
      let feedsToFetch = preResolvedFeeds;
      if (!feedsToFetch || feedsToFetch.length === 0) {
        feedsToFetch = await resolveFeedsForCategory(categoryId);
      }

      if (!feedsToFetch || feedsToFetch.length === 0) {
        console.warn('Nema feedova za dohvaćanje');
        error.value = 'Nema konfiguriranih feedova';
        return [];
      }

      currentCacheKey = cacheKeyFor(categoryId, feedsToFetch);
      inFlightKey = currentCacheKey;
      inFlightForce = !!forceRefresh;

      const startTime = performance.now();
      const totalFeeds = feedsToFetch.length;
      const feedByUrl = new Map(feedsToFetch.map((feed) => [feed.url, feed]));
      const allResults = [];
      let completedCount = 0;

      const publishCurrentResults = () => {
        if (allResults.length === 0) return;
        if (generation !== fetchGeneration) {
          console.log('Zaostala generacija, odbacujem rezultate.');
          return;
        }

        const seen = new Set();
        const unique = allResults.filter(item => {
          const key = item.guid || item.link;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        unique.sort((a, b) => getTimestampOrOldest(b.pubDate) - getTimestampOrOldest(a.pubDate));

        cachedNews.value = unique.slice(0, 300);
        newsBySource.value = { ...tempNewsBySource };
        publishedCacheKey.value = currentCacheKey;
        setCachedData(currentCacheKey, cachedNews.value);
      };

      const processFeedResult = (feedData) => {
        if (!feedData || typeof feedData !== 'object' || !feedData.url) return;
        const feed = feedByUrl.get(feedData.url);
        if (!feed) return;

        completedCount++;
        loadingProgress.value = Math.round((completedCount / totalFeeds) * 100);

        if (!feedData.success) {
          failedFeeds.push(feed.name);
          console.warn(`${feed.name}: ${feedData.error || 'Neuspješan dohvat'}`);
          return;
        }

        try {
          const xmlLike = convertBackendFeedToXML(feedData);
          const items = parseRSSFeed(xmlLike, feed);

          items.forEach(item => {
            item.categoryId = categoryId || 'all';
            item.sourceUrl = feed.url;
            item.fetchedAt = new Date().toISOString();
          });

          if (items.length > 0) {
            allResults.push(...items);
            tempNewsBySource[feed.name] = items;
          } else {
            failedFeeds.push(feed.name);
          }
        } catch (err) {
          failedFeeds.push(feed.name);
          console.error(`${feed.name}:`, err.message);
        }
      };

      const urlChunks = chunkArray(feedsToFetch.map((feed) => feed.url), BATCH_SIZE);

      for (let i = 0; i < urlChunks.length; i++) {
        const data = await fetchRssBatch(urlChunks[i], signal);

        if (generation !== fetchGeneration) {
          console.log('Zaostala generacija, odbacujem rezultate.');
          return cachedNews.value;
        }

        if (data && Array.isArray(data.feeds)) {
          data.feeds.forEach(processFeedResult);
        } else {
          // cijeli chunk pao (mreža/timeout) — zabiljezi sve feedove chunka
          urlChunks[i].forEach((url) => {
            const feed = feedByUrl.get(url);
            if (feed) failedFeeds.push(feed.name);
            completedCount++;
          });
          loadingProgress.value = Math.round((completedCount / totalFeeds) * 100);
        }

        publishCurrentResults();

        if (!initialBatchResolved) {
          initialBatchResolved = true;
          resolveInitialBatch(cachedNews.value);
        }
      }

      partialInfo.value = { failed: failedFeeds.length, total: totalFeeds };

      if (cachedNews.value.length > 0) {
        error.value = null;
        const okCount = totalFeeds - failedFeeds.length;
        const totalTime = Math.round(performance.now() - startTime);
        console.log(`UKUPNO: ${cachedNews.value.length} vijesti iz ${okCount}/${totalFeeds} izvora (${totalTime}ms)`);
      } else {
        error.value = `Nije moguće učitati vijesti (0/${totalFeeds} izvora)`;
        if (generation === fetchGeneration) {
          cachedNews.value = getMockNews();
        }
      }

      return cachedNews.value;
    } catch (err) {
      console.error('Kritična greška:', err);
      error.value = 'Greška pri dohvaćanju vijesti';
      if (generation === fetchGeneration && cachedNews.value.length === 0) {
        cachedNews.value = getMockNews();
      }
      return cachedNews.value;
    } finally {
      if (!initialBatchResolved) {
        initialBatchResolved = true;
        resolveInitialBatch(cachedNews.value);
      }
      if (generation === fetchGeneration) {
        isLoading.value = false;
        loadingProgress.value = 100;
        inFlightFetchPromise = null;
        inFlightKey = null;
        inFlightForce = false;
        if (fetchAbortController) fetchAbortController = null;
      }
    }
  })();

  return await initialBatchPromise;
};



const getNewsByCategory = (category) => {
  if (!category || category === 'all') {
    return cachedNews.value;
  }
  return cachedNews.value.filter(news => news.category === category);
};

const refreshNews = async (categoryId = null, priorityFeedId = null) => {
  console.log('REFRESH zapocet');

  // obriši cache za ovu kategoriju + listu feedova
  try {
    const feeds = await resolveFeedsForCategory(categoryId);
    clearCachedData(cacheKeyFor(categoryId, feeds));
  } catch { /* pusti */ }

  // reset cachea
  cachedNews.value = [];
  newsBySource.value = {};

  return await fetchNewsFresh(categoryId, true, priorityFeedId);
};


const getMockNews = () => {
  return [
    {
      title: 'Demo Vijest 1 - Tehnologija',
      description: 'Ovo je demo članak o tehnologiji. RSS feedovi trenutno nisu dostupni.',
      pubDate: new Date().toISOString(),
      link: 'https://example.com/1',
      source: 'Demo izvora',
      domain: 'example.com',
      category: 'tech',
      thumbnail: null,
      categoryId: 'all',
      guid: 'demo-1'
    },
    {
      title: 'Demo Vijest 2 - Svjetske Vijesti',
      description: 'Drugi demo članak o svjetskim vijestima.',
      pubDate: new Date(Date.now() - 3600000).toISOString(),
      link: 'https://example.com/2',
      source: 'Demo izvora',
      domain: 'example.com',
      category: 'world',
      thumbnail: null,
      categoryId: 'all',
      guid: 'demo-2'
    },
  ];
};

const getSourceStats = computed(() => {
  return Object.keys(newsBySource.value).map(source => ({
    name: source,
    count: newsBySource.value[source].length
  }));
});

const getCategoryStats = computed(() => {
  const stats = {};
  cachedNews.value.forEach(news => {
    const cat = news.category || 'other';
    stats[cat] = (stats[cat] || 0) + 1;
  });
  return stats;
});

export function useNewsGlobal() {
  return {
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    cachedNews: computed(() => cachedNews.value),
    newsBySource: computed(() => newsBySource.value),
    loadingProgress: computed(() => loadingProgress.value),
    partialInfo: computed(() => partialInfo.value),
    publishedCacheKey: computed(() => publishedCacheKey.value),
    getSourceStats,
    getCategoryStats,
    fetchNews,
    refreshNews,
    getNewsByCategory,
    getMockNews
  };
}

export { fetchNews, refreshNews, getMockNews, getNewsByCategory, cacheKeyFor, invalidateInFlight };
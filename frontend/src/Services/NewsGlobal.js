import { ref, computed } from 'vue';
import { useFeedsStore } from '../stores/feedStore';

const isLoading = ref(false);
const error = ref(null);
const cachedNews = ref([]);
const newsBySource = ref({});
const loadingProgress = ref(0);
let inFlightFetchPromise = null;
let fetchGeneration = 0;

/*
// više proxija
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://thingproxy.freeboard.io/fetch/',
];

let currentProxyIndex = 0;

const getProxyUrl = (feedUrl, addCacheBust = false) => {
  const proxy = CORS_PROXIES[currentProxyIndex];
  let urlToFetch = feedUrl;
  if (addCacheBust) {
    const separator = feedUrl.includes('?') ? '&' : '?';
    urlToFetch = `${feedUrl}${separator}_cb=${Date.now()}`;
  }
  return `${proxy}${encodeURIComponent(urlToFetch)}`;
};

const rotateProxy = () => {
  currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
};
*/

// cache
const CACHE_KEY = 'newsCombo_rss_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5min

const getCachedData = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      if (now - timestamp < CACHE_DURATION) {
        console.log('USE keširane vijesti');
        return data;
      }
    }
  } catch (err) {
    console.warn('Cache greška:', err);
  }
  return null;
};

const setCachedData = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (err) {
    console.warn('Ne mogu save-at u cache:', err);
  }
};

// OPTIMIZIRANE HELPER FUNKCIJE - browser-native

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

// bolja ekstrakcija teksta -> jedna funkcija umjesto više istih
const getText = (element, selectors) => {
  if (!element) return null;
  for (const selector of selectors) {
    const el = element.querySelector(selector);
    const text = el?.textContent?.trim();
    if (text) return text;
  }
  return null;
};

// bolja ekstrakcija atributa
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

// helper za određivanje pravog dijela članka
const getBestContent = (item) => {
  const content = item.content || item.encodedContent || item.originalContent || '';
  const description = item.description || item.contentSnippet || '';
  
  if (content.length > description.length + 50) {
     return content;
  }
  return description || content; 
};

// helper za datume (Safari-friendly)
const parseDateSafe = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  const normalized = trimmed
    // Neki feedovi šalju "... 12:00:00 Z" što Safari često ne parsira dobro.
    .replace(/\s+Z$/i, ' GMT')
    // Normalizacija timezone formata +0000 -> +00:00
    .replace(/\s([+-]\d{2})(\d{2})$/, ' $1:$2');

  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  // Fallback za RFC822-like format: "Sun, 29 Mar 2026 12:00:00 Z"
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
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
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

async function fetchRSSFeed(feedUrl, feedName) {
  try {
    const { API_URL } = await import('../config.js');
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/rss/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ urls: [feedUrl] })
    });

    if (!response.ok) {
      console.error(`${feedName}: Backend error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const feedData = data.feeds[0];
    
    if (!feedData || !feedData.success) {
      console.warn(`${feedName}: ${feedData?.error || 'Unknown error'}`);
      return null;
    }

    return convertBackendFeedToXML(feedData);

  } catch (error) {
    console.error(`${feedName}: ${error.message}`);
    return null;
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




  const fetchNews = async (categoryId = null, priorityFeedId = null) => {
    const cached = getCachedData();
    if (cached && cached.length > 0) {
      console.log(`fetched vijesti -> ${cached.length} `);
      cachedNews.value = cached;
      return cached;
    }
    
    console.log('Nema cachea, dohvaćam fresh');
    return await fetchNewsFresh(categoryId, false, priorityFeedId);
  };
  

// paralelno učitavanje
const fetchNewsFresh = async (categoryId = null, forceRefresh = false, priorityFeedId = null) => {
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

    const tempNewsBySource = {};
    const failedFeeds = [];

    console.log(`Fetch vijesti${forceRefresh ? ' (FORCE REFRESH)' : ''}...`);

    try {
      const feedsStore = useFeedsStore();
      if (feedsStore.availableFeeds.length === 0) {
        await feedsStore.initializeStore();
      }

      let feedsToFetch;
      if (categoryId === 'all' || !categoryId) {
        feedsToFetch = feedsStore.availableFeeds;
      } else {
        const category = feedsStore.categories.find(c => c.id === categoryId);
        feedsToFetch = category ? category.feeds : [];
      }

      if (feedsToFetch.length === 0) {
        console.warn('Nema feedova za dohvaćanje');
        error.value = 'Nema konfiguriranih feedova';
        return [];
      }

      let successCount = 0;
      let completedCount = 0;
      const totalFeeds = feedsToFetch.length;
      const startTime = performance.now();

      const allResults = [];

      const publishCurrentResults = () => {
        if (allResults.length === 0) return;
        if (generation !== fetchGeneration) {
          console.log('Zaostala gen, odbaci rezultate.');
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
        setCachedData(cachedNews.value);
      };

      const fetchSingleFeed = async (feed) => {
        const feedStartTime = performance.now();

        try {
          const xmlText = await fetchRSSFeed(feed.url, feed.name, 3, forceRefresh);

          if (!xmlText) {
            failedFeeds.push(feed.name);
            console.warn(`${feed.name}: No response`);
            return;
          }

          const items = parseRSSFeed(xmlText, feed);

          if (items.length > 0) {
            items.forEach(item => {
              item.categoryId = categoryId || 'all';
              item.sourceUrl = feed.url;
              item.fetchedAt = new Date().toISOString();
            });

            allResults.push(...items);
            tempNewsBySource[feed.name] = items;
            successCount++;

            const feedTime = Math.round(performance.now() - feedStartTime);
            console.log(`${feed.name}: ${items.length} članaka (${feedTime}ms)`);
          } else {
            failedFeeds.push(feed.name);
          }
        } catch (err) {
          failedFeeds.push(feed.name);
          console.error(`${feed.name}:`, err.message);
        } finally {
          completedCount++;
          loadingProgress.value = Math.round((completedCount / totalFeeds) * 100);
        }
      };

      const priorityFeed =
        feedsToFetch.find(feed => feed.id === priorityFeedId) || feedsToFetch[0] || null;
      const remainingFeeds = priorityFeed
        ? feedsToFetch.filter(feed => feed.id !== priorityFeed.id)
        : feedsToFetch;

      if (priorityFeed) {
        console.log(`⚡ Prioritetno učitavam ${priorityFeed.name}`);
        await fetchSingleFeed(priorityFeed);
        if (allResults.length > 0) {
          publishCurrentResults();
        }
      }

      if (!initialBatchResolved) {
        initialBatchResolved = true;
        resolveInitialBatch(cachedNews.value);
      }

      console.log(`📡 Učitavam ${remainingFeeds.length} preostalih izvora paralelno...`);

      await Promise.allSettled(remainingFeeds.map(fetchSingleFeed));

      if (allResults.length > 0) {
        publishCurrentResults();
        error.value = failedFeeds.length > 0
          ? `Djelomično učitano (${successCount}/${totalFeeds} izvora)`
          : null;

        const totalTime = Math.round(performance.now() - startTime);
        console.log(`UKUPNO: ${cachedNews.value.length} vijesti iz ${successCount}/${totalFeeds} izvora (${totalTime}ms)`);
      } else {
        error.value = `Nije moguće učitati vijesti (0/${totalFeeds} izvora)`;
        if (generation === fetchGeneration && cachedNews.value.length === 0) {
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
  
  // brisanje local storeg-a
  localStorage.removeItem(CACHE_KEY);
  
  // reset chache
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
    getSourceStats,
    getCategoryStats,
    fetchNews,
    refreshNews,
    getNewsByCategory,
    getMockNews
  };
}

export { fetchNews, refreshNews, getMockNews, getNewsByCategory };
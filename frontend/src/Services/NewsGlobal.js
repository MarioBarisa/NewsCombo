import { ref, computed } from 'vue';
import { useFeedsStore } from '../stores/feedStore';

const isLoading = ref(false);
const error = ref(null);
const cachedNews = ref([]);
const newsBySource = ref({});
const loadingProgress = ref(0);

// više proxija
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://thingproxy.freeboard.io/fetch/',
];

let currentProxyIndex = 0;

const getProxyUrl = (feedUrl) => {
  const proxy = CORS_PROXIES[currentProxyIndex];
  return `${proxy}${encodeURIComponent(feedUrl)}`;
};

const rotateProxy = () => {
  currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
};

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

const cleanDescription = (text) => {
  if (!text) return '';
  return text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim()
    .substring(0, 300);
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
  const enclosure = item.querySelector('enclosure');
  if (enclosure) {
    const type = enclosure.getAttribute('type')?.toLowerCase() || '';
    const url = getAttr(enclosure, null);
    if (url && (!type || type.includes('image'))) {
      return url;
    }
  }

  // 2. Media namespace tagovi -> porblatika je i dalje pristuna jer se slika vijesti ne učitavaju uvjek??????????
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

  // 3. Fallback: prva slika iz HTML content-a -> SCUFFED
  if (rawContent) {
    const imgMatch = rawContent.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch?.[1]) return imgMatch[1];
  }

  return null;
};

const parseRSSFeed = (xmlText, feed) => {
  try {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    
    // check parse greške
    if (xml.querySelector('parsererror')) {
      console.warn(`XML parse greška za ${feed.name}`);
      return [];
    }
    
    // ATOM ili RSS vrsta?
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

    return Array.from(items).slice(0, 10).map(item => {
      const title = getText(item, titleSelectors) || 'Bez naslova';
      
      // link extract ( posebno za Atom )
      let link = getText(item, linkSelectors);
      if (!link && isAtom) {
        link = getAttr(item, 'link', ['href']) || getAttr(item, 'link[rel="alternate"]', ['href']);
      }
      link = link || '#';
      
      const pubDate = getText(item, dateSelectors) || new Date().toISOString();
      const rawContent = getText(item, contentSelectors) || '';
      const guid = getText(item, guidSelectors) || link || `${feed.name}-${Date.now()}-${Math.random()}`;
      
      const thumbnail = extractThumbnail(item, rawContent);
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

const fetchRSSFeed = async (feedUrl, feedName, retries = 3, forceRefresh = false) => {
  const finalUrl = forceRefresh ? getCacheBustingUrl(feedUrl) : feedUrl;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const proxyUrl = getProxyUrl(finalUrl);
      
      console.log(`REFRESH[${feedName}] Pokušaj ${attempt + 1}/${retries}${forceRefresh ? ' (FORCE REFRESH)' : ''}`);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: { 
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        signal: controller.signal,
        mode: 'cors',
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const text = await response.text();
      
      if (!text || text.length < 50) {
        throw new Error('Invalid response length');
      }
      
      if (!text.includes('<?xml') && !text.includes('<rss') && !text.includes('<feed')) {
        throw new Error('LOŠ XML format');
      }
      
      console.log(`[${feedName}] Uspješno dohvaćeno ${text.length} bytes`);
      return text;
      
    } catch (err) {
      clearTimeout(timeoutId);
      
      console.warn(` ${feedName} pokušaj ${attempt + 1}/${retries}: ${err.message}`);
      
      if (attempt < retries - 1) {
        rotateProxy();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  throw new Error(`Failed after ${retries} attempts`);
};

  const sortAndUpdateNews = () => {
  const allItems = Object.values(newsBySource.value).flat();
  
  if (allItems.length === 0) return;
  
  const uniqueMap = new Map();
  allItems.forEach(item => {
    const key = item.guid || item.link;
    if (key && !uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  });
  
  const unique = Array.from(uniqueMap.values());
  unique.sort((a, b) => {
    return new Date(b.pubDate || 0) - new Date(a.pubDate || 0);
  });
  
  cachedNews.value = unique.slice(0, 150);
  };


  //helper function za force brisanje cache-a za dobar refresh
  const getCacheBustingUrl = (url) => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_cb=${Date.now()}_${Math.random().toString(36).substring(7)}`;
  };

  const fetchNews = async (categoryId = null) => {
    const cached = getCachedData();
    if (cached && cached.length > 0) {
      console.log(`fetched vijesti -> ${cached.length} `);
      cachedNews.value = cached;
      return cached;
    }
    
    console.log('Nema cachea, dohvaćam fresh');
    return await fetchNewsFresh(categoryId, false);
  };
  

// paralelno učitavanje
const fetchNewsFresh = async (categoryId = null, forceRefresh = false) => {
  if (isLoading.value) {
    console.log('Fetch se izvodi');
    return cachedNews.value;
  }
  
  isLoading.value = true;
  error.value = null;
  newsBySource.value = {}; 
  loadingProgress.value = 0;
  
  console.log(`Fetch vijesti${forceRefresh ? ' (FORCE REFRESH)' : ''}...`);
  try {
    const feedsStore = useFeedsStore();
    feedsStore.loadFromLocalStorage();
    
    let feedsToFetch;
    if (categoryId === 'all' || !categoryId) {
      feedsToFetch = feedsStore.availableFeeds;
    } else {
      const category = feedsStore.categories.find(c => c.id === categoryId);
      feedsToFetch = category ? category.feeds : [];
    }

    if (feedsToFetch.length === 0) {
      console.warn('⚠️ Nema feedova za dohvaćanje');
      error.value = 'Nema konfiguriranih feedova';
      return [];
    }

    let successCount = 0;
    let completedCount = 0;
    const totalFeeds = feedsToFetch.length;

    const fetchSingleFeed = async (feed) => {
      try {
        const xmlText = await fetchRSSFeed(feed.url, feed.name, 3, forceRefresh);
        const items = parseRSSFeed(xmlText, feed);
        
        if (items.length > 0) {
          items.forEach(item => {
            item.categoryId = categoryId || 'all';
            item.sourceUrl = feed.url;
            item.fetchedAt = new Date().toISOString();
          });
          
          newsBySource.value[feed.name] = items;
          successCount++;
          sortAndUpdateNews();
          
         
        } else {
        }
      } catch (err) {
        console.error(`${feed.name}: ${err.message}`);
      } finally {
        completedCount++;
        loadingProgress.value = Math.round((completedCount / totalFeeds) * 100);
      }
    };

    console.log(`📡 Učitavam ${totalFeeds} izvora paralelno...`);
    await Promise.allSettled(feedsToFetch.map(fetchSingleFeed));

    sortAndUpdateNews();

    if (cachedNews.value.length > 0) {
      setCachedData(cachedNews.value);
      error.value = null;
      
      // DETALJNIJI LOG
      const latestNews = cachedNews.value[0];
      console.log(`UKUPNO: ${cachedNews.value.length} vijesti iz ${successCount}/${totalFeeds} izvora`);
    } else {
      error.value = `Nije moguće učitati vijesti (0/${totalFeeds} izvora)`;
      cachedNews.value = getMockNews();
    }

    return cachedNews.value;

  } catch (err) {
    console.error(err);
    error.value = 'Greška pri dohvaćanju vijesti';
    cachedNews.value = getMockNews();
    return cachedNews.value;
  } finally {
    isLoading.value = false;
    loadingProgress.value = 100;
  }
};


const getNewsByCategory = (category) => {
  if (!category || category === 'all') {
    return cachedNews.value;
  }
  return cachedNews.value.filter(news => news.category === category);
};

const refreshNews = async (categoryId = null) => {
  console.log('REFRESH zapocet');
  
  // brisanje local storeg-a
  localStorage.removeItem(CACHE_KEY);
  
  // reset chache
  cachedNews.value = [];
  newsBySource.value = {};
  
  // reset proxy-a na prvi iz array-a
  currentProxyIndex = 0;
  return await fetchNewsFresh(categoryId, true);
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
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
        console.log('📦 Koristim keširane vijesti');
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
    console.warn('Ne mogu spremiti u cache:', err);
  }
};

// pomocnici za parsing RSS-a ( xml )
const takeText = (item, selectors = [], fallback = '') => {
  for (const selector of selectors) {
    const value = item.querySelector(selector)?.textContent?.trim();
    if (value) return value;
  }
  return fallback;
};

const takeLink = (item) => {
  const linkText = takeText(item, ['link']);
  if (linkText) return linkText;
  const linkEl = item.querySelector('link[href]');
  return linkEl?.getAttribute('href') || '#';
};

// ?
const cleanDescription = (text) => {
  return (text || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?.*?>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .substring(0, 300);
};

const firstAttr = (el, names = ['url', 'href']) => {
  if (!el) return null;
  for (const name of names) {
    const val = el.getAttribute(name);
    if (val) return val;
  }
  return null;
};

const extractThumbnail = (item, rawDescription) => {
  // prvo se treba pronaci enclosure s image content-type
  const enclosure = item.querySelector('enclosure');
  const enclosureType = enclosure?.getAttribute('type')?.toLowerCase() || '';
  const enclosureUrl = firstAttr(enclosure);
  if (enclosureUrl && (!enclosureType || enclosureType.includes('image'))) {
    return enclosureUrl;
  }

  // ostali media tagovi koje neki feedovi koriste
  const mediaCandidate = item.querySelector(
    'media\\:content[url], media\\:thumbnail[url], media\\:group media\\:content, content[url], image[url], thumbnail[url]'
  );
  const mediaUrl = firstAttr(mediaCandidate);
  if (mediaUrl) return mediaUrl;

  // fallback: prva slika iz HTML opisa > ( da ne bude empty )
  const imgMatch = rawDescription?.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }

  return null;
};

// rss parsing
const parseRSSFeed = (xmlText, feed) => {
  try {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    
    const parseError = xml.querySelector('parsererror');
    if (parseError) {
      console.warn(`Parse greška za ${feed.name}`);
      return [];
    }
    
    let items = Array.from(xml.querySelectorAll('item'));
    if (items.length === 0) {
      items = Array.from(xml.querySelectorAll('entry')); // atom format?
    }
    
    return items.slice(0, 10).map(item => {
      const title = takeText(item, ['title'], 'Bez naslova');
      const link = takeLink(item);
      const pubDate = takeText(item, ['pubDate', 'updated', 'published'], new Date().toISOString());
      const rawDescription = takeText(item, ['description', 'summary', 'content'], '');
      const thumbnail = extractThumbnail(item, rawDescription);
      const description = cleanDescription(rawDescription);
      const guid = takeText(item, ['guid'], '') || link || `${feed.name}-${Date.now()}-${Math.random()}`;

      return {
        title,
        description,
        link,
        pubDate: pubDate || new Date().toISOString(),
        source: feed.name,
        domain: feed.domain || 'unknown',
        category: feed.category || 'general',
        feedId: feed.id, // Dodan feedId
        thumbnail,
        guid
      };
    });
    
  } catch (err) {
    console.error(`Parse greška za ${feed.name}:`, err.message);
    return [];
  }
};

const fetchRSSFeed = async (feedUrl, feedName, retries = 3) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const proxyUrl = getProxyUrl(feedUrl);
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: { 
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
        },
        signal: controller.signal,
        mode: 'cors'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const text = await response.text();
      
      // dobar xml?
      if (text.includes('<?xml') || text.includes('<rss') || text.includes('<feed')) {
        return text;
      } else {
        throw new Error('Invalid XML response');
      }
      
    } catch (err) {
      clearTimeout(timeoutId);
      
      console.warn(`⚠️ ${feedName} pokušaj ${attempt + 1}/${retries}: ${err.message}`);
      
      // drugi proxy
      if (attempt < retries - 1) {
        rotateProxy();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  throw new Error(`Failed after ${retries} attempts`);
};

// sortiraj i update
const sortAndUpdateNews = () => {
  const allItems = Object.values(newsBySource.value).flat();
  
  // ukloni duplikate
  const seen = new Set();
  const unique = [];
  allItems.forEach(item => {
    const key = item.guid || item.link;
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  });
  
  // kronologija
  unique.sort((a, b) => {
    const dateA = new Date(a.pubDate || 0);
    const dateB = new Date(b.pubDate || 0);
    return dateB - dateA; // Descending (najnovije prvo)
  });
  
  cachedNews.value = unique.slice(0, 150);
};

// main fn
const fetchNews = async (categoryId = null) => {
  const cached = getCachedData();
  if (cached && cached.length > 0) {
    cachedNews.value = cached;
    
    // pozainski refrash
    setTimeout(() => {
      if (!isLoading.value) {
        console.log('🔄 news refresh');
        fetchNewsFresh(categoryId);
      }
    }, 500);
    
    return cached;
  }
  
  return await fetchNewsFresh(categoryId);
};

// novo učitavanje -> sve paralenllo
const fetchNewsFresh = async (categoryId = null) => {
  if (isLoading.value) {
    return cachedNews.value;
  }
  
  isLoading.value = true;
  error.value = null;
  newsBySource.value = {};
  loadingProgress.value = 0;

  try {
    // dohvati feedove iz store-a ( promjena na mongo kasnije )
    const feedsStore = useFeedsStore();
    feedsStore.loadFromLocalStorage();
    
    // odaberi feedove ovisno o kategoriji
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

    const fetchSingleFeed = async (feed) => {
      try {
        const xmlText = await fetchRSSFeed(feed.url, feed.name, 3);
        const items = parseRSSFeed(xmlText, feed);
        
        if (items.length > 0) {
          items.forEach(item => {
            item.categoryId = categoryId || 'all';
            item.sourceUrl = feed.url;
          });
          
          newsBySource.value[feed.name] = items;
          successCount++;
          sortAndUpdateNews();
        } else {
          console.warn(` ${feed.name}: 0 news -> makni iz RSS array jer ne radi`);
        }
      } catch (err) {
        console.warn(`❌ ${feed.name}: ${err.message}`);
      } finally {
        completedCount++;
        loadingProgress.value = Math.round((completedCount / totalFeeds) * 100);
      }
    };

    console.log(`⚡ Load ->>> ${totalFeeds} izvora paralelno...`);
    await Promise.allSettled(feedsToFetch.map(fetchSingleFeed));

    // Finalno sortiranje
    sortAndUpdateNews();

    if (cachedNews.value.length > 0) {
      setCachedData(cachedNews.value);
      error.value = null;
      console.log(`Ukupno: ${cachedNews.value.length} vijesti iz ${successCount}/${totalFeeds} izvora`);
    } else {
      error.value = `Nije moguće učitati vijesti (0/${totalFeeds} izvora)`;
      cachedNews.value = getMockNews();
    }

    return cachedNews.value;

  } catch (err) {
    console.error('❌ Kritična greška:', err);
    error.value = 'Greška pri dohvaćanju vijesti';
    cachedNews.value = getMockNews();
    return cachedNews.value;
  } finally {
    isLoading.value = false;
    loadingProgress.value = 100;
  }
};

// filtriraj -> nije implementirano
const getNewsByCategory = (category) => {
  if (!category || category === 'all') {
    return cachedNews.value;
  }
  return cachedNews.value.filter(news => news.category === category);
};

// korisnik force refresh
const refreshNews = async (categoryId = null) => {
  localStorage.removeItem(CACHE_KEY);
  return await fetchNewsFresh(categoryId);
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

import { ref, computed } from 'vue';

const isLoading = ref(false);
const error = ref(null);
const cachedNews = ref([]);
const newsBySource = ref({});
const loadingProgress = ref(0);

const RSS_FEEDS = [
  // hr
  { name: 'Index.hr', url: 'https://www.index.hr/rss', domain: 'index.hr', category: 'hrvatska' },
  { name: 'Večernji list', url: 'https://www.vecernji.hr/rss', domain: 'vecernji.hr', category: 'hrvatska' },
  { name: '24sata', url: 'https://www.24sata.hr/feeds/najnovije.xml', domain: '24sata.hr', category: 'hrvatska' },
  { name: 'Bug.hr', url: 'https://www.bug.hr/rss', domain: 'bug.hr', category: 'tech' },
  { name: 'Netokracija', url: 'https://www.netokracija.com/feed', domain: 'netokracija.com', category: 'tech' },
  
  // world
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', domain: 'bbc.co.uk', category: 'world' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', domain: 'aljazeera.com', category: 'world' },
  { name: 'Associated Press', url: 'https://feeds.apnews.com/rss/topnews', domain: 'apnews.com', category: 'world' },
  
  // it
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', domain: 'techcrunch.com', category: 'tech' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', domain: 'arstechnica.com', category: 'tech' },
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage', domain: 'news.ycombinator.com', category: 'tech' },
  { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', domain: 'technologyreview.com', category: 'tech' },
  
  // znanost
  { name: 'Aeon', url: 'https://aeon.co/feed.rss', domain: 'aeon.co', category: 'science' },
  
  // posao
  { name: 'Financial Times', url: 'https://www.ft.com/?format=rss', domain: 'ft.com', category: 'business' },
];

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

// rss parsing
const parseRSSFeed = (xmlText, feedName, feedDomain, feedCategory) => {
  try {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, 'text/xml');
    
    const parseError = xml.querySelector('parsererror');
    if (parseError) {
      console.warn(`Parse greška za ${feedName}`);
      return [];
    }
    
    let items = Array.from(xml.querySelectorAll('item'));
    if (items.length === 0) {
      items = Array.from(xml.querySelectorAll('entry')); // atom format?
    }
    
    return items.slice(0, 10).map(item => {
      const title = item.querySelector('title')?.textContent?.trim() || 'Bez naslova';
      let description = item.querySelector('description')?.textContent?.trim() || '';
      let link = item.querySelector('link')?.textContent?.trim() || '';
      let pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
      let thumbnail = null;
      
      if (!link) {
        const linkEl = item.querySelector('link[href]');
        link = linkEl?.getAttribute('href') || '#';
      }
      if (!pubDate) {
        pubDate = item.querySelector('updated, published')?.textContent?.trim() || new Date().toISOString();
      }
      if (!description) {
        description = item.querySelector('summary, content')?.textContent?.trim() || '';
      }
  
      const enclosure = item.querySelector('enclosure[url]');
      if (enclosure) {
        thumbnail = enclosure.getAttribute('url');
      } else {
        const mediaContent = item.querySelector('media\\:content, content[url]');
        if (mediaContent) {
          thumbnail = mediaContent.getAttribute('url');
        }
      }
      
      // miči smeče
      description = description
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .substring(0, 300);
      
      return {
        title,
        description,
        link,
        pubDate: pubDate || new Date().toISOString(),
        source: feedName,
        domain: feedDomain,
        category: feedCategory,
        thumbnail,
        guid: link || `${feedName}-${Date.now()}-${Math.random()}`
      };
    });
    
  } catch (err) {
    console.error(`Parse greška za ${feedName}:`, err.message);
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
  const unique = allItems.reduce((acc, item) => {
    if (!acc.find(i => i.link === item.link)) {
      acc.push(item);
    }
    return acc;
  }, []);
  
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
    let successCount = 0;
    let completedCount = 0;
    const totalFeeds = RSS_FEEDS.length;

    const fetchSingleFeed = async (feed) => {
      try {
        const xmlText = await fetchRSSFeed(feed.url, feed.name, 3);
        const items = parseRSSFeed(xmlText, feed.name, feed.domain, feed.category);
        
        if (items.length > 0) {
          items.forEach(item => {
            item.categoryId = categoryId || 'all';
            item.sourceUrl = feed.url;
          });
          
          newsBySource.value[feed.name] = items;
          successCount++;
          sortAndUpdateNews();
          
          console.log(`✅ ${feed.name}: ${items.length} NEWS`);
        } else {
          console.warn(` ${feed.name}: 0 news -> makni iz RSS array jer ne dela`);
        }
      } catch (err) {
        console.warn(`❌ ${feed.name}: ${err.message}`);
      } finally {
        completedCount++;
        loadingProgress.value = Math.round((completedCount / totalFeeds) * 100);
      }
    };

    console.log(`⚡ Load ->>> ${totalFeeds} izvora paralelno...`);
    await Promise.allSettled(RSS_FEEDS.map(fetchSingleFeed));

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

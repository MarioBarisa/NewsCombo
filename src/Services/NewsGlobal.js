import { ref, computed } from 'vue';

const RSS_FEEDS = [
{ name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml', domain: 'bbc.co.uk' },
{ name: 'Reuters', url: 'http://feeds.reuters.com/reuters/topNews', domain: 'reuters.com' },
{ name: 'CNN', url: 'http://rss.cnn.com/rss/edition.rss', domain: 'cnn.com' },
{ name: 'The New York Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', domain: 'nytimes.com' },
{ name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', domain: 'theguardian.com' },
{ name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', domain: 'aljazeera.com' },
{ name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml', domain: 'npr.org' },
{ name: 'ABC News', url: 'https://abcnews.go.com/abcnews/topstories', domain: 'abcnews.go.com' },
{ name: 'CBS News', url: 'https://www.cbsnews.com/latest/rss/main', domain: 'cbsnews.com' },
{ name: 'Fox News', url: 'http://feeds.foxnews.com/foxnews/latest', domain: 'foxnews.com' }
];

const isLoading = ref(false);
const error = ref(null);
const cachedNews = ref([]);

const fetchNews = async () => {
isLoading.value = true;
error.value = null;

try {
    const allNews = [];

    for (const feed of RSS_FEEDS) {
        try {
            const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || '';

            const apiUrl = NEWS_API_KEY
                ? `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&api_key=${NEWS_API_KEY}&count=4`
                : `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=4`;

            const response = await fetch(apiUrl);

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'ok' && data.items) {
                    data.items.forEach(item => {
                        allNews.push({
                            ...item,
                            source: feed.name,
                            domain: feed.domain,
                            sourceUrl: data.feed?.link || '#'
                        });
                    });
                }
            }
        } catch (feedError) {
            console.warn(`Greška s feedom ${feed.name}:`, feedError);
        }
    }

    allNews.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));
    cachedNews.value = allNews.slice(0, 20);
    return cachedNews.value;
} catch (err) {
    error.value = err.message || 'Greška pri dohvaćanju vijesti';
    console.error('News API error:', err);
    return [];
} finally {
    isLoading.value = false;
}
};

const getMockNews = () => {
return [
{
title: 'Svjetske vijesti - Demo članak 1',
description: 'Ovo je demo članak za prikaz. Kliknite za više informacija.',
pubDate: new Date().toISOString(),
link: 'https://example.com',
source: 'Demo vijesti',
domain: 'example.com',
thumbnail: 'https://via.placeholder.com/150?text=Demo+News+1'
},
{
title: 'Svjetske vijesti - Demo članak 2',
description: 'Drugi demo članak za testiranje karusela. Provjerite funkcionalnost.',
pubDate: new Date(Date.now() - 3600000).toISOString(),
link: 'https://example.com',
source: 'Demo vijesti',
domain: 'example.com',
thumbnail: 'https://via.placeholder.com/150?text=Demo+News+2'
},
{
title: 'Svjetske vijesti - Demo članak 3',
description: 'Treći demo članak. Sve je u redu s karuselom.',
pubDate: new Date(Date.now() - 7200000).toISOString(),
link: 'https://example.com',
source: 'Demo vijesti',
domain: 'example.com',
thumbnail: 'https://via.placeholder.com/150?text=Demo+News+3'
}
];
};

export function useNewsGlobal() {
return {
isLoading: computed(() => isLoading.value),
error: computed(() => error.value),
fetchNews,
getMockNews
};
}

export { fetchNews, getMockNews };
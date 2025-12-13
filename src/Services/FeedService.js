import { FEED_SOURCES, FEED_CATEGORIES } from "@/config/feedSources";
import StorageService from "./StorageService";

const RSS2JSON_API = "https://api.rss2json.com/v1/api.json";
const RSS2JSON_KEY = import.meta.env.VITE_NEWS_API_KEY || "";

class FeedService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5min
  }

  // uzmi sve feedove
  getAllFeeds() {
    return [...FEED_SOURCES];
  }

  // uzmi isključivo uključene feedove
  getEnabledFeeds() {
    const config = StorageService.loadFeedConfig();

    if (config) {
      //vrati uključene feedove
      return FEED_SOURCES.map((feed) => ({
        ...feed,
        enabled: config[feed.id]?.enabled ?? feed.enabled,
      })).filter((feed) => feed.enabled);
    }

    // vrati def feedove
    return FEED_SOURCES.filter((feed) => feed.enabled);
  }

  // feedovi po kategoriji
  getFeedsByCategory(category) {
    if (category === FEED_CATEGORIES.ALL) {
      return this.getEnabledFeeds();
    }

    return this.getEnabledFeeds().filter((feed) => feed.category === category);
  }

  async fetchFeedNews(feed, count = 10) {
    const cacheKey = `${feed.id}_${count}`;

    //cache provjera
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`📦 Cache hit: ${feed.name}`);
        return cached.data;
      }
    }

    try {
      const url = `${RSS2JSON_API}?rss_url=${encodeURIComponent(
        feed.url
      )}&api_key=${RSS2JSON_KEY}&count=${count}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "ok" && data.items) {
        const articles = data.items.map((item) => ({
          ...item,
          feedId: feed.id,
          feedName: feed.name,
          feedCategory: feed.category,
          feedIcon: feed.icon,
          source: item.source || feed.name,
          domain: this.extractDomain(item.link),
        }));

        // cache res
        this.cache.set(cacheKey, {
          data: articles,
          timestamp: Date.now(),
        });

        console.log(`✅ Fetched ${articles.length} articles from ${feed.name}`);
        return articles;
      } else {
        console.warn(`⚠️ ${feed.name}: ${data.message || "No items"}`);
        return [];
      }
    } catch (error) {
      console.error(`❌ Error fetching ${feed.name}:`, error.message);
      return [];
    }
  }

  // uzmi vijesti iz više feedova
  async fetchNewsByCategory(category, count = 10) {
    const feeds = this.getFeedsByCategory(category);

    if (feeds.length === 0) {
      console.warn(`No enabled feeds for category: ${category}`);
      return [];
    }

    console.log(
      `🔄 Fetching news from ${feeds.length} feeds in category: ${category}`
    );

    // paralel fetch
    const results = await Promise.allSettled(
      feeds.map((feed) => this.fetchFeedNews(feed, count))
    );

    // skujpi i sortiraj po datumu
    const allArticles = results
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value)
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    console.log(`✅ Total articles fetched: ${allArticles.length}`);
    return allArticles;
  }

  updateFeedConfig(feedId, enabled) {
    const config = StorageService.loadFeedConfig() || {};

    config[feedId] = {
      enabled,
      updatedAt: new Date().toISOString(),
    };

    return StorageService.saveFeedConfig(config);
  }

  // mega feed updejter
  bulkUpdateFeeds(updates) {
    const config = StorageService.loadFeedConfig() || {};

    updates.forEach(({ feedId, enabled }) => {
      config[feedId] = {
        enabled,
        updatedAt: new Date().toISOString(),
      };
    });

    return StorageService.saveFeedConfig(config);
  }

  // očisti chache
  clearCache() {
    this.cache.clear();
    console.log("🗑️ Cache cleared");
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return "";
    }
  }

  //stats po kategoriji feedfova
  getCategoryStats() {
    const feeds = this.getAllFeeds();
    const enabled = this.getEnabledFeeds();

    const stats = {};

    Object.values(FEED_CATEGORIES).forEach((category) => {
      if (category === FEED_CATEGORIES.ALL) return;

      const totalInCategory = feeds.filter(
        (f) => f.category === category
      ).length;
      const enabledInCategory = enabled.filter(
        (f) => f.category === category
      ).length;

      stats[category] = {
        total: totalInCategory,
        enabled: enabledInCategory,
      };
    });

    return stats;
  }
}

export default new FeedService();

import Parser from 'rss-parser';
import { createHash } from 'node:crypto';
import { fetchPublicText, parsePublicUrl } from './publicFetch.js';
import { articleUrl, articleText, sanitizeArticleHtml } from './articleHtml.js';

const parserOptions = {
  customFields: {
    feed: ['logo', 'icon', ['$', 'attributes', { keepArray: true }]],
    item: [
      ['content:encoded', 'encodedContent'],
      ['media:content', 'media:content', { keepArray: true }],
      ['media:thumbnail', 'media:thumbnail', { keepArray: true }],
      ['media:group', 'media:group', { keepArray: true }],
      ['$', 'attributes', { keepArray: true }]
    ]
  }
};

function mediaImage(value, base, thumbnail = false) {
  if (!value) return null;
  const entries = Array.isArray(value) ? value : [value];
  for (const entry of entries) {
    const attributes = entry.$ || entry;
    const type = attributes.type || '';
    const medium = attributes.medium || '';
    if ((thumbnail || (!type || type.startsWith('image/')) && (!medium || medium === 'image')) && attributes.url) {
      const url = articleUrl(attributes.url, base);
      if (url) return url;
    }
    const nested = mediaImage(entry['media:thumbnail'], base, true) || mediaImage(entry['media:content'], base);
    if (nested) return nested;
  }
  return null;
}

function itemImage(item, content, base) {
  const enclosure = item.enclosure;
  if (enclosure?.type?.startsWith('image/')) {
    const url = articleUrl(enclosure.url, base);
    if (url) return url;
  }
  const media = mediaImage(item['media:thumbnail'], base, true) || mediaImage(item['media:content'], base) || mediaImage(item['media:group'], base);
  if (media) return media;
  const htmlImage = content.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  return articleUrl(htmlImage?.replaceAll('&amp;', '&'), base);
}

function safeDate(value) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export function normalizeFeed(feed, sourceUrl) {
  const base = articleUrl(feed.attributes?.['xml:base'], sourceUrl) || sourceUrl;
  let image = feed.image?.url || feed.image || feed.logo || feed.icon;
  if (Array.isArray(image)) image = image[0];
  const feedImage = articleUrl(image, base);
  const items = [];
  for (const item of (feed.items || []).slice(0, 30)) {
    const itemBase = articleUrl(item.attributes?.['xml:base'], base) || base;
    const rawContent = item.encodedContent || item['content:encoded'] || item.content || item.summary || item.description || '';
    const content = sanitizeArticleHtml(rawContent, itemBase);
    const link = articleUrl(item.link, itemBase);
    const title = articleText(item.title) || 'Bez naslova';
    const description = articleText(item.contentSnippet || item.summary || rawContent).slice(0, 500);
    const guid = String(item.guid || item.id || link || createHash('sha256').update(`${title}|${item.pubDate || item.isoDate || ''}|${description}`).digest('hex'));
    items.push({
      title,
      description,
      content,
      hasFullContent: Boolean(item.encodedContent || item['content:encoded'] || item.content && articleText(item.content).length > 500),
      link,
      guid,
      pubDate: safeDate(item.pubDate) || safeDate(item.isoDate),
      author: articleText(item.creator || item.author || ''),
      thumbnail: itemImage(item, content, itemBase) || feedImage,
      enclosure: item.enclosure?.type?.startsWith('image/') ? { ...item.enclosure, url: articleUrl(item.enclosure.url, itemBase) } : null
    });
  }
  return { title: articleText(feed.title), description: articleText(feed.description), feedImage, items };
}

export function createRssService({ fetchText = fetchPublicText, now = Date.now } = {}) {
  const cache = new Map();
  const inFlight = new Map();
  const waiting = [];
  let active = 0;

  async function runLimited(task) {
    if (waiting.length >= 200) throw new Error('Previše zahtjeva, pokušajte ponovno');
    if (active >= 6) await new Promise(resolve => waiting.push(resolve));
    else active++;
    try {
      return await task();
    } finally {
      const next = waiting.shift();
      if (next) next();
      else active--;
    }
  }

  async function getFeed(value, { force = false } = {}) {
    const url = parsePublicUrl(value).href;
    if (inFlight.has(url)) return inFlight.get(url);
    const cached = cache.get(url);
    if (!force && cached && now() - cached.timestamp < 60000) return cached.data;
    const task = runLimited(async () => {
      const response = await fetchText(url, { timeout: 10000 });
      if (/<!DOCTYPE|<!ENTITY/i.test(response.text)) throw new Error('Nedozvoljene XML deklaracije');
      const parser = new Parser(parserOptions);
      const feed = await parser.parseString(response.text);
      const data = normalizeFeed(feed, response.finalUrl);
      cache.delete(url);
      cache.set(url, { timestamp: now(), data });
      if (cache.size > 500) cache.delete(cache.keys().next().value);
      return data;
    });
    inFlight.set(url, task);
    try {
      return await task;
    } finally {
      if (inFlight.get(url) === task) inFlight.delete(url);
    }
  }

  return { getFeed };
}

export const rssService = createRssService();

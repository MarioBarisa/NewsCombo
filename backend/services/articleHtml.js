import sanitizeHtml from 'sanitize-html';
import { decodeHTML } from 'entities';

export function articleUrl(value, base) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, base);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function sanitizeArticleHtml(value, base) {
  if (typeof value !== 'string') return '';
  return sanitizeHtml(value, {
    allowedTags: ['p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'pre', 'code'],
    allowedAttributes: { a: ['href', 'title', 'rel'], img: ['src', 'alt', 'title'] },
    allowedSchemes: ['http', 'https'],
    allowProtocolRelative: false,
    transformTags: {
      a(tagName, attributes) {
        const href = articleUrl(attributes.href, base);
        return { tagName, attribs: { href: href || '', title: attributes.title || '', rel: 'noopener noreferrer' } };
      },
      img(tagName, attributes) {
        const src = articleUrl(attributes.src, base);
        return { tagName, attribs: { src: src || '', alt: attributes.alt || '' } };
      }
    }
  });
}

export function articleText(value) {
  if (typeof value !== 'string') return '';
  return decodeHTML(sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })).replace(/\s+/g, ' ').trim();
}

import DOMPurify from 'dompurify';

export function safeArticleUrl(value, base) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, base);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function sanitizeContent(value, base) {
  const fragment = DOMPurify.sanitize(typeof value === 'string' ? value : '', {
    ALLOWED_TAGS: ['p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'pre', 'code'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
    ALLOW_DATA_ATTR: false,
    RETURN_DOM_FRAGMENT: true
  });
  for (const element of fragment.querySelectorAll('a, img')) {
    const attribute = element.tagName === 'A' ? 'href' : 'src';
    const url = safeArticleUrl(element.getAttribute(attribute), base);
    if (url) element.setAttribute(attribute, url);
    else element.removeAttribute(attribute);
    if (element.tagName === 'A') element.setAttribute('rel', 'noopener noreferrer');
  }
  const container = document.createElement('div');
  container.append(fragment);
  return container.innerHTML;
}

export function plainText(value) {
  const safe = DOMPurify.sanitize(typeof value === 'string' ? value : '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [], RETURN_DOM_FRAGMENT: true });
  return safe.textContent.trim();
}

export function escapeHtml(value) {
  const element = document.createElement('span');
  element.textContent = String(value || '');
  return element.innerHTML;
}

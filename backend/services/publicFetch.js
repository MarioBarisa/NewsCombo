import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import { isIP } from 'node:net';
import { createGunzip, createInflate, createBrotliDecompress } from 'node:zlib';
import ipaddr from 'ipaddr.js';

export function isPublicAddress(address) {
  try {
    let parsed = ipaddr.parse(address);
    if (parsed.kind() === 'ipv6' && parsed.isIPv4MappedAddress()) parsed = parsed.toIPv4Address();
    return parsed.range() === 'unicast';
  } catch {
    return false;
  }
}

export function parsePublicUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) throw new Error('Neispravan URL');
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Nedozvoljen URL');
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw new Error('Nedozvoljen URL');
  }
  if (isIP(hostname) && !isPublicAddress(hostname)) throw new Error('Nedozvoljena IP adresa');
  return url;
}

export async function resolvePublicAddress(url, signal) {
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  signal.throwIfAborted();
  let addresses;
  if (isIP(hostname)) {
    addresses = [{ address: hostname, family: isIP(hostname) }];
  } else {
    addresses = await new Promise((resolve, reject) => {
      const aborted = () => reject(signal.reason);
      signal.addEventListener('abort', aborted, { once: true });
      dns.lookup(hostname, { all: true, verbatim: true }).then(resolve, reject).finally(() => {
        signal.removeEventListener('abort', aborted);
      });
    });
  }
  signal.throwIfAborted();
  if (!addresses.length || addresses.some(entry => !isPublicAddress(entry.address))) {
    throw new Error('Nedozvoljena IP adresa');
  }
  return addresses.find(entry => entry.family === 4) || addresses[0];
}

function requestUrl(url, address, signal) {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === 'https:' ? https : http;
    const request = transport.get(url, {
      agent: false,
      signal,
      headers: {
        'User-Agent': 'NewsCombo/1.0',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/html;q=0.9, */*;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br'
      },
      // Spoj koristi prethodno provjerenu adresu.
      lookup(hostname, options, callback) {
        if (options.all) callback(null, [address]);
        else callback(null, address.address, address.family);
      }
    }, resolve);
    request.on('error', reject);
  });
}

export async function fetchPublicText(value, options = {}) {
  const timeout = options.timeout || 10000;
  const maxBytes = options.maxBytes || 2 * 1024 * 1024;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('Isteklo vrijeme dohvata')), timeout);
  const signal = options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal;
  let response;
  let stream;
  try {
    let url = parsePublicUrl(value);
    for (let redirect = 0; redirect <= 3; redirect++) {
      const address = await resolvePublicAddress(url, signal);
      response = await requestUrl(url, address, signal);
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        const location = response.headers.location;
        response.destroy();
        if (!location || redirect === 3) throw new Error('Previše preusmjeravanja');
        url = parsePublicUrl(new URL(location, url).href);
        continue;
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error(`Izvor vratio status ${response.statusCode}`);
      }
      if (Number(response.headers['content-length']) > maxBytes) throw new Error('Odgovor izvora je prevelik');
      stream = response;
      const encoding = response.headers['content-encoding'];
      if (encoding === 'gzip') stream = response.pipe(createGunzip());
      else if (encoding === 'deflate') stream = response.pipe(createInflate());
      else if (encoding === 'br') stream = response.pipe(createBrotliDecompress());
      else if (encoding && encoding !== 'identity') throw new Error('Nepodržano kodiranje odgovora');
      const aborted = () => stream.destroy(signal.reason);
      signal.addEventListener('abort', aborted, { once: true });
      response.on('error', error => stream.destroy(error));
      let length = 0;
      const chunks = [];
      try {
        for await (const chunk of stream) {
          signal.throwIfAborted();
          length += chunk.length;
          if (length > maxBytes) throw new Error('Odgovor izvora je prevelik');
          chunks.push(chunk);
        }
      } finally {
        signal.removeEventListener('abort', aborted);
      }
      const contentType = response.headers['content-type'] || '';
      const buffer = Buffer.concat(chunks);
      const declared = contentType.match(/charset=["']?([^;"'\s]+)/i)?.[1];
      const xmlEncoding = buffer.subarray(0, 200).toString().match(/<\?xml[^>]*encoding=["']([^"']+)/i)?.[1];
      const text = new TextDecoder(declared || xmlEncoding || 'utf-8').decode(buffer);
      return { text, finalUrl: url.href, contentType };
    }
    throw new Error('Previše preusmjeravanja');
  } finally {
    clearTimeout(timer);
    stream?.destroy();
    response?.destroy();
  }
}

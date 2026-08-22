// NewsCombo personalizacija — čisti modul (bez Vue/DOM ovisnosti).
// Profil interesa: EMA težine po izvoru/temi/kategoriji + rangiranje u kronološkim kanticama.
// Na server ide samo profil (agregati), nikad članci ili povijest čitanja.

export const COMBO_CONFIG = {
  // težine ocjene članka (zbroj = 1)
  weights: { src: 0.4, top: 0.45, cat: 0.15 },

  // EMA faktor učenja po signalu
  alpha: { heart: 0.35, dislike: 0.5, open: 0.08, bookmark: 0.25 },

  // vrijednost signala
  value: { heart: 1.0, unheart: -1.0, dislike: -1.0, undislike: 1.0, open: 0.2, bookmark: 0.5 },

  // pola snage interesa izgubi se nakon halfLifeMs
  halfLifeMs: 14 * 24 * 60 * 60 * 1000, // 14 dana

  bucketSize: 10,
  demoteBelow: -0.4,      // ispod ove ocjene članak pada na dno kantice
  jitter: 0.05,           // deterministički šum za istraživanje novih tema

  caps: { src: 60, top: 250, cat: 15, hb: 150 },

  // badge s postotkom tek od ovoliko interakcija
  minInteractionsForBadge: 5,

  maxTokensPerTitle: 8,
  minTokenLen: 3,
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ---------- Stop-riječi (bez dijakritike, lowercase) ----------
const HR_STOPWORDS = [
  'i','a','ali','ili','te','pa','da','li','ne','je','su','se','si','sam','smo','ste',
  'bio','bila','bilo','bili','biti','cu','ce','bi','moze','mora','treba','ima','imaju',
  'nema','nisu','nije','ih','mu','ga','joj','njih','nam','vam','mi','ti','vi','on','ona',
  'ono','oni','one','ovaj','ova','ovo','ove','taj','ta','tom','tome','koja','koje','koji',
  'koju','svi','sve','svaki','jos','vec','tek','samo','tako','vrlo','jako','mnogo','malo',
  'vise','manje','kod','za','na','u','iz','od','do','po','prije','poslije','nakon','tokom',
  'kroz','bez','pod','nad','uz','prema','protiv','zbog','radi','preko','ispod','iznad',
  'medju','medutim','ipak','zato','jer','posto','kako','sto','tko','gdje','kada','kad',
  'zasto','koliko','evo','eto','neka','bar','makar','dakle','znaci','naravno','danas',
  'jucer','sino','godine','novi','nova','novo','video','foto','znate','evo','ovako','sat',
  'sata','sati','minuta','dana','tek','sad','opa','hej','ok'
];
const EN_STOPWORDS = [
  'the','and','for','are','but','not','you','all','any','can','had','her','was','one',
  'our','out','day','get','has','him','his','how','man','new','now','old','see','two',
  'way','who','its','did','yes','this','that','with','from','have','they','will','would',
  'there','their','what','about','which','when','your','said','each','she','them','then',
  'than','were','been','more','some','into','over','only','after','before','just','also'
];
const STOPWORDS = new Set([...HR_STOPWORDS, ...EN_STOPWORDS]);

// ---------- Tokenizacija ----------
export function tokenizeTitle(title) {
  if (!title || typeof title !== 'string') return [];
  // NFD skida dijakritike (č->c) da se HR i EN spoje
  const normalized = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const out = [];
  for (const w of normalized.split(/[^a-z]+/)) {
    if (w.length < COMBO_CONFIG.minTokenLen) continue;
    if (STOPWORDS.has(w)) continue;
    out.push(w);
    if (out.length >= COMBO_CONFIG.maxTokensPerTitle) break;
  }
  return out;
}

// FNV-1a 32-bit hash, base36 izlaz
function fnv1a(str) {
  let h = 0x811c9dc5;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function hashLink(link) {
  return fnv1a(link).toString(36);
}

// ---------- Profil interesa ----------
export function createEmptyProfile(now = Date.now()) {
  return {
    v: 1,
    updatedAt: now,
    src: {},                                  // domain -> { s, n, t }
    top: {},                                  // token  -> { s, t }
    cat: {},                                  // kategorija -> { s, t }
    st: { likes: 0, dislikes: 0, opens: 0 },  // brojači samo
    hb: [],                                   // hashovi lajkanih linkova (ring buffer)
  };
}

export function extractDomain(domainOrLink) {
  if (!domainOrLink) return '';
  const val = String(domainOrLink);
  if (val.includes('://') || val.includes('www.')) {
    try {
      return new URL(val.includes('://') ? val : `https://${val}`).hostname.replace(/^www\./, '');
    } catch { /* nastavi */ }
  }
  return val.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
}

const decayFactor = (entryT, now) => Math.pow(2, -Math.max(0, now - entryT) / COMBO_CONFIG.halfLifeMs);

const effScore = (entry, now) => (entry ? clamp(entry.s * decayFactor(entry.t, now), -1, 1) : 0);

// lazy zaboravljanje cijelog profila (mutira, t -> now)
export function decayProfile(profile, now = Date.now()) {
  if (!profile) return profile;
  for (const map of [profile.src, profile.top, profile.cat]) {
    for (const key of Object.keys(map)) {
      const e = map[key];
      e.s = clamp(e.s * decayFactor(e.t, now), -1, 1);
      e.t = now;
    }
  }
  return profile;
}

// EMA update ključa
function bump(map, key, value, alpha, now, trackCount) {
  if (!key) return;
  const e = map[key];
  if (e) {
    e.s = clamp((1 - alpha) * e.s + alpha * value, -1, 1);
    e.t = now;
    if (trackCount && typeof e.n === 'number') e.n += 1;
  } else {
    map[key] = { s: clamp(alpha * value, -1, 1), t: now, ...(trackCount ? { n: 1 } : {}) };
  }
}

function enforceCap(map, cap) {
  const keys = Object.keys(map);
  if (keys.length <= cap) return;
  keys.sort((a, b) => map[a].t - map[b].t); // najstariji prvo
  for (let i = 0; i < keys.length - cap; i++) delete map[keys[i]];
}

// zabilježi signal: heart | unheart | dislike | undislike | open | bookmark (mutira profil)
export function applySignal(profile, type, article, now = Date.now()) {
  const value = COMBO_CONFIG.value[type];
  if (value === undefined || !article || !profile) return profile;

  const alpha = COMBO_CONFIG.alpha[type.replace(/^un/, '')] ?? COMBO_CONFIG.alpha[type];
  const domain = extractDomain(article.domain || article.link);
  const category = article.category || 'ostalo';
  const tokens = tokenizeTitle(article.title);

  bump(profile.src, domain, value, alpha, now, true);
  bump(profile.cat, category, value, alpha, now, false);
  for (const t of tokens) bump(profile.top, t, value, alpha, now, false);

  if (type === 'heart') profile.st.likes += 1;
  else if (type === 'unheart') profile.st.likes = Math.max(0, profile.st.likes - 1);
  else if (type === 'dislike') profile.st.dislikes += 1;
  else if (type === 'undislike') profile.st.dislikes = Math.max(0, profile.st.dislikes - 1);
  else if (type === 'open') profile.st.opens += 1;

  const key = hashLink(article.link || article.title || '');
  if (type === 'heart' && !profile.hb.includes(key)) profile.hb.push(key);
  if (type === 'unheart') {
    const idx = profile.hb.indexOf(key);
    if (idx !== -1) profile.hb.splice(idx, 1);
  }

  enforceCap(profile.src, COMBO_CONFIG.caps.src);
  enforceCap(profile.top, COMBO_CONFIG.caps.top);
  enforceCap(profile.cat, COMBO_CONFIG.caps.cat);
  while (profile.hb.length > COMBO_CONFIG.caps.hb) profile.hb.shift();

  profile.updatedAt = now;
  return profile;
}

// ---------- Ocjena članka ----------
// vrati { final (-1..1), pct (0..100), src, topic, cat, matched }
export function scoreArticle(profile, article, now = Date.now()) {
  if (!profile || !article) return { final: 0, pct: 50, src: 0, topic: 0, cat: 0, matched: [] };

  const domain = extractDomain(article.domain || article.link);
  const category = article.category || 'ostalo';

  const srcS = effScore(profile.src[domain], now);
  const catS = effScore(profile.cat[category], now);

  const matched = [];
  for (const tok of tokenizeTitle(article.title)) {
    const entry = profile.top[tok];
    if (entry) matched.push({ tok, s: effScore(entry, now) });
  }
  // najjači 3 tokena (po |s|), prosjek predznacnih vrijednosti
  matched.sort((x, y) => Math.abs(y.s) - Math.abs(x.s));
  const top3 = matched.slice(0, 3);
  const topicS = top3.length ? top3.reduce((acc, m) => acc + m.s, 0) / top3.length : 0;

  const raw = COMBO_CONFIG.weights.src * srcS + COMBO_CONFIG.weights.top * topicS + COMBO_CONFIG.weights.cat * catS;
  const final = Math.tanh(raw);
  const pct = Math.round(((final + 1) / 2) * 100);

  return { final, pct, src: srcS, topic: topicS, cat: catS, matched: top3.map((m) => m.tok) };
}

const pubTimestamp = (dateStr) => {
  const ts = new Date(dateStr || 0).getTime();
  return Number.isNaN(ts) ? Number.NEGATIVE_INFINITY : ts;
};

// Deterministički šum ±CONFIG.jitter (isti link -> isti šum, stabilan redoslijed)
const jitterFor = (link) => ((fnv1a(`j:${link}`) % 1000) / 1000 - 0.5) * 2 * COMBO_CONFIG.jitter;

// kronološki feed + personalizacija unutar kantica; dodaje _combo na svaki članak.
// Cold start (0 interakcija): identično kronološkom sortu.
export function rankFeed(articles, profile, now = Date.now()) {
  if (!Array.isArray(articles)) return [];

  const items = articles.map((article) => ({
    article,
    ts: pubTimestamp(article.pubDate),
    combo: scoreArticle(profile, article, now),
  }));

  for (const item of items) {
    item.article._combo = {
      final: item.combo.final,
      pct: item.combo.pct,
      src: item.combo.src,
      topic: item.combo.topic,
      cat: item.combo.cat,
      matched: item.combo.matched,
    };
  }

  items.sort((a, b) => b.ts - a.ts); // kronologija, najnovije prvo

  // cold start: personalizacija od prve interakcije
  const st = profile?.st;
  if (!st || st.likes + st.dislikes + st.opens === 0) {
    return items.map((item) => item.article);
  }

  const B = COMBO_CONFIG.bucketSize;
  const result = [];
  for (let i = 0; i < items.length; i += B) {
    const bucket = items.slice(i, i + B);
    for (const item of bucket) item.eff = item.combo.final + jitterFor(item.article.link);

    const normal = bucket.filter((item) => item.eff > COMBO_CONFIG.demoteBelow);
    const demoted = bucket.filter((item) => item.eff <= COMBO_CONFIG.demoteBelow);
    const cmp = (a, b) => b.eff - a.eff || b.ts - a.ts;
    normal.sort(cmp);
    demoted.sort(cmp);
    result.push(...normal, ...demoted);
  }

  return result.map((item) => item.article);
}

// ---------- Pomoćnici za UI ----------
export function hasEnoughData(profile) {
  if (!profile || !profile.st) return false;
  return profile.st.likes + profile.st.dislikes + profile.st.opens >= COMBO_CONFIG.minInteractionsForBadge;
}

// top N unosa po efektivnoj ocjeni (stranica "Moji interesi")
export function topEntries(profile, mapName, n = 10, now = Date.now()) {
  const map = profile?.[mapName] || {};
  return Object.entries(map)
    .map(([key, entry]) => ({ key, s: effScore(entry, now), n: entry.n }))
    .sort((a, b) => b.s - a.s)
    .slice(0, n);
}

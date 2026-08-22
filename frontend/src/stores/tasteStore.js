import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { API_URL } from '../config.js';
// Algoritam: čiste funkcije u Services/recommender.js
import {
  createEmptyProfile,
  applySignal,
  decayProfile,
  rankFeed,
  scoreArticle,
  hasEnoughData as algoHasEnoughData,
  topEntries,
  hashLink,
} from '../Services/recommender.js';

// tasteStore — profil interesa: localStorage ogledalo + debounced sync na /api/profile

const LOCAL_KEY = 'newsCombo_taste_profile';
const MIGRATED_KEY = 'newsCombo_taste_migrated_v1';
const LEGACY_PREFS_KEY = 'newsPreferences';
const SYNC_DEBOUNCE_MS = 12_000;
// ruta je montirana s /api prefiksom na backendu
const PROFILE_API = `${API_URL}/api/profile`;

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const toMs = (v) => {
  if (typeof v === 'number') return v;
  const t = Date.parse(v);
  return Number.isNaN(t) ? 0 : t;
};

// Server dok -> klijentski oblik profila (defenzivno)
const normalizeServerDoc = (doc) => {
  if (!doc || typeof doc !== 'object') return null;
  return {
    v: doc.v || 1,
    updatedAt: toMs(doc.updatedAt),
    src: doc.src && typeof doc.src === 'object' ? doc.src : {},
    top: doc.top && typeof doc.top === 'object' ? doc.top : {},
    cat: doc.cat && typeof doc.cat === 'object' ? doc.cat : {},
    st: {
      likes: Number(doc.st?.likes) || 0,
      dislikes: Number(doc.st?.dislikes) || 0,
      opens: Number(doc.st?.opens) || 0,
    },
    hb: Array.isArray(doc.hb) ? doc.hb : [],
  };
};

// migracija starog newsPreferences -> hb (srca vidljiva cross-device)
const migrateLegacyPrefs = () => {
  try {
    if (localStorage.getItem(MIGRATED_KEY)) return null;
    const raw = localStorage.getItem(LEGACY_PREFS_KEY);
    if (!raw) return null;
    const prefs = JSON.parse(raw);
    const profile = createEmptyProfile();
    for (const [link, val] of Object.entries(prefs)) {
      const key = hashLink(link);
      if (val === 'like') {
        if (!profile.hb.includes(key)) profile.hb.push(key);
        profile.st.likes += 1;
      } else if (val === 'dislike') {
        profile.st.dislikes += 1;
      }
    }
    localStorage.setItem(MIGRATED_KEY, String(Date.now()));
    localStorage.removeItem(LEGACY_PREFS_KEY);
    return profile.st.likes || profile.st.dislikes ? profile : null;
  } catch {
    return null;
  }
};

export const useTasteStore = defineStore('taste', () => {
  const profile = ref(createEmptyProfile());
  const hydrated = ref(false);
  const syncState = ref('idle'); // idle | dirty | saving | saved | error

  // runtime stanje — ne ide na server
  const dislikedRuntime = ref(new Set());   // prikaz ✕ samo za sesiju
  const openedRuntime = ref(new Set());     // open signal jednom po članku

  let syncTimer = null;
  let listenersBound = false;

  // ---------- Getteri ----------
  const likedSet = computed(() => new Set(profile.value.hb));
  const hasEnoughData = computed(() => algoHasEnoughData(profile.value));
  const stats = computed(() => ({ ...profile.value.st }));
  const totalInteractions = computed(
    () => profile.value.st.likes + profile.value.st.dislikes + profile.value.st.opens
  );

  const sortedEntries = (mapName) => topEntries(profile.value, mapName, Infinity);

  // ---------- Lokalno spremište ----------
  const persistLocal = () => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(profile.value));
    } catch (e) {
      console.warn('tasteStore: ne mogu spremiti lokalni profil:', e);
    }
  };

  const afterSignal = () => {
    persistLocal();
    syncState.value = 'dirty';
    scheduleSync();
  };

  // ---------- Sync ----------
  function scheduleSync() {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => { syncTimer = null; void syncNow(); }, SYNC_DEBOUNCE_MS);
  }

  async function syncNow() {
    if (!localStorage.getItem('token')) return;
    if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; }
    syncState.value = 'saving';
    try {
      const response = await fetch(`${PROFILE_API}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ profile: JSON.parse(JSON.stringify(profile.value)) }),
        keepalive: true,
      });
      syncState.value = response.ok ? 'saved' : 'error';
    } catch {
      syncState.value = 'error'; // ponovni signal okida novi sync
    }
  }

  // flush pri napuštanju stranice
  const flushSync = () => {
    if (syncState.value !== 'dirty') return;
    try {
      fetch(`${PROFILE_API}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ profile: JSON.parse(JSON.stringify(profile.value)) }),
        keepalive: true,
      });
      syncState.value = 'saved';
    } catch { /* pusti */ }
  };

  const bindLifecycleListeners = () => {
    if (listenersBound) return;
    listenersBound = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushSync();
    });
    window.addEventListener('pagehide', flushSync);
  };

  // ---------- Inicijalizacija ----------
  let initPromise = null;

  async function doInit() {
    bindLifecycleListeners();

    // 1) Lokalna kopija (instant UI)
    let local = null;
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') local = normalizeServerDoc(parsed);
      }
    } catch { /* pokvaren cache -> ignoriraj */ }

    const migrated = migrateLegacyPrefs();
    if (!local && migrated) {
      local = migrated;
      persistLocal();
    }

    // 2) Server (cross-device) — LWW merge po updatedAt
    if (localStorage.getItem('token')) {
      try {
        const response = await fetch(`${PROFILE_API}`, { headers: authHeaders() });
        if (response.ok) {
          const data = await response.json();
          const server = normalizeServerDoc(data?.profile);
          if (server && toMs(server.updatedAt) > toMs(local?.updatedAt)) {
            local = server;
          }
        }
      } catch (e) {
        console.warn('tasteStore: server profil nedostupan, koristim lokalni.', e);
      }
    }

    profile.value = decayProfile(local || createEmptyProfile());
    persistLocal();
    hydrated.value = true;
  }

  // jednom po sesiji; na grešku dopušta retry
  function init() {
    if (!initPromise) {
      initPromise = doInit().catch((e) => {
        console.warn('tasteStore init:', e);
        initPromise = null;
      });
    }
    return initPromise;
  }

  // ---------- Signali ----------
  const toggleHeart = (article) => {
    const key = hashLink(article.link);
    if (likedSet.value.has(key)) {
      applySignal(profile.value, 'unheart', article);
      dislikedRuntime.value.delete(key);
    } else {
      applySignal(profile.value, 'heart', article);
      dislikedRuntime.value.delete(key);
    }
    afterSignal();
  };

  const toggleDislike = (article) => {
    const key = hashLink(article.link);
    if (dislikedRuntime.value.has(key)) {
      applySignal(profile.value, 'undislike', article);
      dislikedRuntime.value.delete(key);
    } else {
      applySignal(profile.value, 'dislike', article);
      // dislike poništava eventualno srce (mutual exclusion)
      if (likedSet.value.has(key)) applySignal(profile.value, 'unheart', article);
      dislikedRuntime.value.add(key);
    }
    afterSignal();
  };

  const recordOpen = (article) => {
    if (!article?.link) return;
    const key = hashLink(article.link);
    if (openedRuntime.value.has(key)) return; // jednom po sesiji
    openedRuntime.value.add(key);
    applySignal(profile.value, 'open', article);
    afterSignal();
  };

  const recordBookmark = (article) => {
    applySignal(profile.value, 'bookmark', article);
    afterSignal();
  };

  // ---------- Rangiranje / ocjena ----------
  const rankArticles = (articles, now = Date.now()) => rankFeed(articles, profile.value, now);
  const scoreFor = (article, now = Date.now()) => scoreArticle(profile.value, article, now);

  const isLiked = (link) => likedSet.value.has(hashLink(link));
  const isDisliked = (link) => dislikedRuntime.value.has(hashLink(link));

  // ---------- Reset (stranica "Moji interesi" / privatnost) ----------
  async function resetProfile() {
    try {
      await fetch(`${PROFILE_API}`, { method: 'DELETE', headers: authHeaders() });
    } catch { /* lokalno čišćenje ionako radimo */ }
    profile.value = createEmptyProfile();
    dislikedRuntime.value = new Set();
    openedRuntime.value = new Set();
    persistLocal();
    syncState.value = 'saved';
  }

  return {
    profile,
    hydrated,
    syncState,
    likedSet,
    hasEnoughData,
    stats,
    totalInteractions,
    init,
    syncNow,
    flushSync,
    toggleHeart,
    toggleDislike,
    recordOpen,
    recordBookmark,
    rankArticles,
    scoreFor,
    isLiked,
    isDisliked,
    sortedEntries,
    resetProfile,
  };
});

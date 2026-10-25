import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { API_URL } from '../config.js';
import { userStorageKey } from '../Services/sessionStorage.js';
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

export const useTasteStore = defineStore('taste', () => {
  const profile = ref(createEmptyProfile());
  const hydrated = ref(false);
  const syncState = ref('idle'); // idle | dirty | saving | saved | error

  // runtime stanje — ne ide na server
  const dislikedRuntime = ref(new Set());   // prikaz ✕ samo za sesiju
  const openedRuntime = ref(new Set());     // open signal jednom po članku

  let syncTimer = null;
  let listenersBound = false;
  let generation = 0;
  let controller = new AbortController();

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
      localStorage.setItem(userStorageKey(LOCAL_KEY), JSON.stringify(profile.value));
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
    const current = generation;
    try {
      const response = await fetch(`${PROFILE_API}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ profile: JSON.parse(JSON.stringify(profile.value)) }),
        keepalive: true,
        signal: controller.signal,
      });
      if (current === generation) syncState.value = response.ok ? 'saved' : 'error';
    } catch {
      if (current === generation) syncState.value = 'error'; // ponovni signal okida novi sync
    }
  }

  // flush pri napuštanju stranice
  const flushSync = () => {
    if (syncState.value !== 'dirty' || !localStorage.getItem('token')) return;
    try {
      fetch(`${PROFILE_API}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ profile: JSON.parse(JSON.stringify(profile.value)) }),
        keepalive: true,
        signal: controller.signal,
      }).catch(() => {});
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
    const current = generation;
    bindLifecycleListeners();

    // 1) Lokalna kopija (instant UI)
    let local = null;
    try {
      const raw = localStorage.getItem(userStorageKey(LOCAL_KEY));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') local = normalizeServerDoc(parsed);
      }
    } catch { /* pokvaren cache -> ignoriraj */ }

    // 2) Server (cross-device) — LWW merge po updatedAt
    if (localStorage.getItem('token')) {
      try {
        const response = await fetch(`${PROFILE_API}`, { headers: authHeaders(), signal: controller.signal });
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

    if (current !== generation) return;
    profile.value = decayProfile(local || createEmptyProfile());
    persistLocal();
    hydrated.value = true;
  }

  // jednom po sesiji; na grešku dopušta retry
  function init() {
    const current = generation;
    if (!initPromise) {
      initPromise = doInit().catch((e) => {
        console.warn('tasteStore init:', e);
        if (current === generation) initPromise = null;
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

  const resetSession = () => {
    generation++;
    controller.abort();
    controller = new AbortController();
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = null;
    initPromise = null;
    profile.value = createEmptyProfile();
    hydrated.value = false;
    syncState.value = 'idle';
    dislikedRuntime.value = new Set();
    openedRuntime.value = new Set();
  };

  // Reset profila na korisnikov zahtjev.
  async function resetProfile() {
    const current = generation;
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = null;
    const response = await fetch(`${PROFILE_API}`, { method: 'DELETE', headers: authHeaders(), signal: controller.signal });
    if (!response.ok) throw new Error('Brisanje profila nije uspjelo');
    if (current !== generation) return;
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
    resetSession,
  };
});

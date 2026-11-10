<template>
  <section class="rounded-box bg-primary/8 border border-primary/20 p-2 sm:p-5" aria-labelledby="showcase-title">
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <h2 id="showcase-title" class="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Isprobaj NewsCombo</h2>
      </div>
    </div>

    <div class="rounded-box bg-base-100 overflow-hidden">
      <div class="grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div class="p-3 sm:p-5 flex flex-col gap-5 lg:border-r border-base-300">
          <div class="grid grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-1 gap-2" role="group" aria-label="Isprobaj značajke">
            <button v-for="feature in features" :key="feature.id" type="button"
              class="btn h-auto min-h-12 lg:min-h-20 justify-start gap-2 lg:gap-3 p-2.5 sm:p-3 lg:p-4 text-xs sm:text-sm text-left whitespace-normal"
              :class="activeFeature === feature.id ? feature.buttonClass : 'btn-ghost'"
              :aria-label="feature.label" :aria-pressed="activeFeature === feature.id" @click="activeFeature = feature.id">
              <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <path :d="feature.icon" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span class="min-w-0 flex-1">
                <span class="block">{{ feature.label }} <span v-if="feature.id === 'saved' && savedIds.length" class="badge badge-xs">{{ savedIds.length }}</span></span>
                <span class="hidden lg:block text-xs font-normal leading-relaxed mt-1 opacity-75">{{ feature.summary }}</span>
              </span>
              <span class="hidden lg:block" aria-hidden="true">{{ activeFeature === feature.id ? '→' : '' }}</span>
            </button>
          </div>
        </div>

        <div class="min-w-0 h-128 sm:h-132 flex flex-col">
          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2" tabindex="0" role="region" :aria-label="currentFeature.previewTitle">
            <div class="flex items-center justify-between flex-wrap gap-2 px-3 sm:px-5 py-3 bg-base-200/60 border-y border-base-300 min-h-16">
              <span class="text-xs text-base-content/60">Primjer vijesti</span>
              <div v-if="activeFeature === 'timeline'" class="join" role="group" aria-label="Redoslijed vijesti">
                <button type="button" class="btn btn-sm join-item" :class="newestFirst ? 'btn-neutral' : 'btn-ghost'"
                  :aria-pressed="newestFirst" @click="newestFirst = true">Najnovije</button>
                <button type="button" class="btn btn-sm join-item" :class="!newestFirst ? 'btn-neutral' : 'btn-ghost'"
                  :aria-pressed="!newestFirst" @click="newestFirst = false">Najstarije</button>
              </div>
              <span v-else-if="activeFeature === 'combo'" class="badge badge-secondary badge-soft badge-sm">Reakcije: {{ reactionCount }}</span>
              <span v-else-if="activeFeature === 'ai'" class="badge badge-ghost badge-sm">Primjer sažetka</span>
              <span v-else class="badge badge-ghost badge-sm">{{ savedIds.length }} spremljeno</span>
            </div>

            <div v-if="activeFeature === 'ai'" class="p-4 sm:p-5 space-y-5">
              <div class="flex items-center gap-2 text-primary text-sm font-semibold">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path :d="features[2].icon" stroke-linecap="round" stroke-linejoin="round" /></svg>
                AI Daily Spotlight
              </div>
              <h5 class="font-bold text-xl">Tehnologija, gradovi i nove ideje</h5>
              <div class="border-l-4 border-primary pl-4 space-y-2">
                <p class="text-sm font-semibold text-primary">Tehnologija</p>
                <p class="text-sm text-base-content/75">Otvoreni kod povezuje programere, a novi alati olakšavaju razvoj weba.</p>
                <button type="button" class="link link-hover text-sm text-left" @click="openArticle(articles[1])">Otvoreni kod: alati za razvoj weba ↗</button>
              </div>
              <div class="border-l-4 border-secondary pl-4 space-y-2">
                <p class="text-sm font-semibold text-secondary">Znanost</p>
                <p class="text-sm text-base-content/75">Zeleni prostori mijenjaju svakodnevicu u gradovima.</p>
                <button type="button" class="link link-hover text-sm text-left" @click="openArticle(articles[0])">Kako gradovi postaju zeleniji ↗</button>
              </div>
            </div>

            <div v-else class="min-h-full">
              <div v-if="activeFeature === 'saved' && !savedIds.length" class="flex flex-col items-center justify-center text-center min-h-full p-6 gap-3">
                <svg class="h-10 w-10 text-primary/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path :d="features[3].icon" stroke-linecap="round" stroke-linejoin="round" /></svg>
                <p class="font-semibold">Nema spremljenih članaka.</p>
                <button type="button" class="btn btn-sm btn-outline" @click="activeFeature = 'timeline'">Odaberi članak i spremi ga</button>
              </div>
              <TransitionGroup v-else tag="ol" class="p-2 sm:p-4" aria-label="Primjer vijesti" move-class="motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out">
                <li v-for="article in visibleArticles" :key="article.id" class="p-3 sm:p-4 flex gap-3 transition-colors hover:bg-base-200/50"
                  :class="{ 'bg-secondary/15': activeFeature === 'combo' && article.category === lastReactedCategory, 'bg-base-200/70': activeFeature === 'combo' && dislikedIds.includes(article.id) }">
                  <div class="flex flex-col items-center gap-2 pt-1 shrink-0 w-10">
                    <time class="font-mono text-xs font-bold tabular-nums" :datetime="article.pubDate">{{ article.time }}</time>
                    <span class="text-[10px] text-base-content/60">8. 11.</span>
                    <svg class="h-4 w-4 text-primary shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" /></svg>
                    <span class="w-px grow bg-base-300" aria-hidden="true"></span>
                  </div>
                  <div class="card bg-base-200 shadow-lg m-0! min-w-0 flex-1">
                    <div class="p-3 sm:p-4 flex gap-3">
                      <button type="button" class="shrink-0 w-16 sm:w-28 self-start rounded-lg overflow-hidden" :aria-label="`Otvori članak: ${article.title}`" @click="openArticle(article)">
                        <img :src="article.imageUrl" alt="" width="112" height="96" loading="lazy" class="w-16 h-20 sm:w-28 sm:h-24 object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:scale-105" />
                      </button>
                      <div class="min-w-0 flex-1">
                    <div class="flex items-center flex-wrap gap-2 mb-1.5">
                      <span class="badge badge-outline badge-xs">{{ article.source }}</span>
                      <span v-if="activeFeature === 'combo' && hasEnoughData(demoProfile)" class="badge badge-soft badge-xs" :class="scoreBadge(article._combo.pct)">{{ article._combo.pct }}%</span>
                    </div>
                    <button type="button" class="text-left font-semibold text-sm leading-snug hover:text-primary" @click="openArticle(article)">{{ article.title }}</button>
                    <p class="text-sm opacity-70 line-clamp-2 mt-2 mb-3">{{ article.description }}</p>
                    <div class="flex flex-wrap items-center justify-between gap-2 mt-2">
                      <div class="flex gap-1">
                        <button type="button" class="btn btn-xs btn-circle min-h-9 min-w-9 sm:min-h-0 sm:min-w-0"
                          :class="likedIds.includes(article.id) ? 'btn-error' : 'btn-ghost'"
                          :aria-pressed="likedIds.includes(article.id)" :aria-label="`Sviđa mi se: ${article.title}`" @click="toggleLike(article)">
                          <svg class="h-4 w-4" viewBox="0 0 24 24" :fill="likedIds.includes(article.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </button>
                        <button type="button" class="btn btn-xs btn-circle min-h-9 min-w-9 sm:min-h-0 sm:min-w-0"
                          :class="dislikedIds.includes(article.id) ? 'btn-neutral' : 'btn-ghost'"
                          :aria-pressed="dislikedIds.includes(article.id)" :aria-label="`Ne sviđa mi se: ${article.title}`" @click="toggleDislike(article)">
                          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <button type="button" class="btn btn-xs btn-circle min-h-9 min-w-9 sm:min-h-0 sm:min-w-0"
                          :class="savedIds.includes(article.id) ? 'btn-primary' : 'btn-ghost'"
                          :aria-pressed="savedIds.includes(article.id)" :aria-label="`Spremi članak: ${article.title}`" @click="toggleSave(article)">
                          <svg class="h-4 w-4" viewBox="0 0 24 24" :fill="savedIds.includes(article.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        </button>
                      </div>
                      <button type="button" class="btn btn-xs btn-primary btn-outline" @click="openArticle(article)">Čitaj <span aria-hidden="true">›</span></button>
                    </div>
                      </div>
                    </div>
                  </div>
                </li>
              </TransitionGroup>
            </div>
          </div>
          <div class="flex justify-end items-center h-11 shrink-0 px-3 border-t border-base-300">
            <p class="sr-only" role="status">{{ feedback }}</p>
            <button v-if="hasInteractions" type="button" class="btn btn-ghost btn-sm" @click="resetDemo">Vrati primjer na početak</button>
          </div>
        </div>
      </div>
    </div>

    <dialog ref="articleDialog" class="modal" aria-labelledby="demo-article-title">
      <div class="modal-box max-w-4xl w-[96%] max-h-[92dvh] p-0 flex flex-col overflow-hidden rounded-2xl shadow-2xl">
        <form method="dialog"><button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 z-10 bg-base-200/80" aria-label="Zatvori članak">✕</button></form>
        <template v-if="selectedArticle">
          <div class="min-h-0 overflow-y-auto flex-1">
            <article class="px-5 sm:px-8 md:px-12 py-8 md:py-10">
              <img :src="selectedArticle.imageUrl" :alt="selectedArticle.title" width="1000" height="560" class="w-full max-h-80 object-cover rounded-xl mb-6" />
              <header class="mb-6">
                <h3 id="demo-article-title" class="text-2xl sm:text-4xl font-bold leading-snug tracking-tight">{{ selectedArticle.title }}</h3>
                <div class="flex flex-wrap items-center gap-3 text-sm text-base-content/60 mt-4">
                  <span class="font-semibold">{{ selectedArticle.source }}</span>
                  <span>{{ selectedArticle.time }}</span>
                  <span class="badge badge-info badge-soft badge-sm">Primjer članka</span>
                </div>
              </header>
              <p class="text-lg font-medium text-base-content/80 mb-6 p-4 bg-primary/5 border-l-4 border-primary rounded-r">{{ selectedArticle.description }}</p>
              <p class="text-lg leading-relaxed">{{ selectedArticle.body }}</p>
              <div class="border-t border-base-300 mt-8 pt-5"><span class="badge badge-outline">{{ selectedArticle.category }}</span></div>
            </article>
          </div>
          <div class="shrink-0 bg-base-100 border-t border-base-300 px-5 py-3 flex items-center justify-between gap-3">
                      <div class="flex gap-1">
                        <button type="button" class="btn btn-xs btn-circle min-h-9 min-w-9 sm:min-h-0 sm:min-w-0"
                          :class="likedIds.includes(selectedArticle.id) ? 'btn-error' : 'btn-ghost'"
                          :aria-pressed="likedIds.includes(selectedArticle.id)" :aria-label="`Sviđa mi se: ${selectedArticle.title}`" @click="toggleLike(selectedArticle)">
                          <svg class="h-4 w-4" viewBox="0 0 24 24" :fill="likedIds.includes(selectedArticle.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        </button>
                        <button type="button" class="btn btn-xs btn-circle min-h-9 min-w-9 sm:min-h-0 sm:min-w-0"
                          :class="dislikedIds.includes(selectedArticle.id) ? 'btn-neutral' : 'btn-ghost'"
                          :aria-pressed="dislikedIds.includes(selectedArticle.id)" :aria-label="`Ne sviđa mi se: ${selectedArticle.title}`" @click="toggleDislike(selectedArticle)">
                          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <button type="button" class="btn btn-xs btn-circle min-h-9 min-w-9 sm:min-h-0 sm:min-w-0"
                          :class="savedIds.includes(selectedArticle.id) ? 'btn-primary' : 'btn-ghost'"
                          :aria-pressed="savedIds.includes(selectedArticle.id)" :aria-label="`Spremi članak: ${selectedArticle.title}`" @click="toggleSave(selectedArticle)">
                          <svg class="h-4 w-4" viewBox="0 0 24 24" :fill="savedIds.includes(selectedArticle.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        </button>
                      </div>
            <span class="text-xs text-base-content/60 hidden sm:inline">ESC za zatvaranje</span>
          </div>
        </template>
      </div>
      <form method="dialog" class="modal-backdrop"><button aria-label="Zatvori članak">Zatvori</button></form>
    </dialog>
  </section>
</template>

<script setup>
import { computed, ref, onBeforeUnmount, TransitionGroup } from 'vue';
import { applySignal, createEmptyProfile, hasEnoughData, rankFeed } from '../Services/recommender.js';

const emit = defineEmits(['algorithm-update']);
const activeFeature = ref('timeline');
const newestFirst = ref(true);
const likedIds = ref([]);
const dislikedIds = ref([]);
const savedIds = ref([]);
const openedIds = new Set();
const feedback = ref('');
const lastReactedCategory = ref('');
let highlightTimer;
onBeforeUnmount(() => clearTimeout(highlightTimer));

function highlightCategory(category) {
  clearTimeout(highlightTimer);
  lastReactedCategory.value = category;
  highlightTimer = setTimeout(() => { lastReactedCategory.value = ''; }, 1000);
}
const articleDialog = ref(null);
const selectedArticle = ref(null);
const demoTime = Date.parse('2026-11-08T11:00:00+01:00');
const demoProfile = ref(createEmptyProfile(demoTime));

const features = [
  {
    id: 'timeline', label: 'Kronologija', title: 'Vijesti po vremenu objave', previewTitle: 'Najnovije vijesti',
    summary: 'Svi izvori. Redom po vremenu objave.',
    buttonClass: 'btn-neutral', iconClass: 'bg-base-200 text-base-content',
    icon: 'M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  {
    id: 'combo', label: 'NewsCombo', title: 'NewsCombo', previewTitle: 'NewsCombo',
    summary: 'Srce podiže slične članke. Dislike ih spušta.',
    buttonClass: 'btn-secondary btn-soft', iconClass: 'bg-secondary/15 text-secondary',
    icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z'
  },
  {
    id: 'ai', label: 'AI sažetak', title: 'AI Daily Spotlight', previewTitle: 'AI sažetak',
    summary: 'Glavne teme s poveznicama na članke.',
    buttonClass: 'btn-accent btn-soft', iconClass: 'bg-accent/15 text-accent',
    icon: 'm9 3 2.3 5.7L17 11l-5.7 2.3L9 19l-2.3-5.7L1 11l5.7-2.3L9 3zm10-2 1.1 2.9L23 5l-2.9 1.1L19 9l-1.1-2.9L15 5l2.9-1.1L19 1z'
  },
  {
    id: 'saved', label: 'Spremljeno', title: 'Spremljeni članci', previewTitle: 'Spremljeni članci',
    summary: 'Zanimljivi članci za kasnije čitanje.',
    buttonClass: 'btn-warning btn-soft', iconClass: 'bg-warning/15 text-warning',
    icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z'
  },
];

const articles = [
  { id: 1, imageUrl: '/landing/green-spaces.jpg', body: 'Zelene površine povezuju gradske četvrti i stvaraju prostor za odmor i susrete. Pri planiranju parkova važni su hlad, pristupačne staze i očuvanje postojećeg drveća.', title: 'Kako gradovi postaju zeleniji', source: 'Znanost', category: 'Znanost', time: '10:42', pubDate: '2026-11-08T10:42:00+01:00', link: 'https://znanost.example/gradovi', description: 'Više zelenih prostora znači više mjesta za šetnju, odmor i susrete. Ovaj ilustrativni članak prikazuje kako NewsCombo okuplja sadržaj, izvor i vrijeme objave na jednom mjestu.' },
  { id: 2, imageUrl: '/landing/development.jpg', body: 'Javno dostupan kod omogućuje zajednici da prouči kako alati rade i sudjeluje u njihovu razvoju. Dokumentacija, razmjena iskustava i male promjene pomažu održavanju zajedničkih projekata.', title: 'Otvoreni kod: alati za razvoj weba', source: 'Tech', category: 'Tehnologija', time: '10:35', pubDate: '2026-11-08T10:35:00+01:00', link: 'https://tech.example/otvoreni-kod', description: 'Zajednica otvorenog koda dijeli alate i znanje za razvoj weba. Označi ovaj primjer srcem: postojeći NewsCombo algoritam prepoznat će izvor, kategoriju i ključne riječi iz naslova.' },
  { id: 3, imageUrl: '/landing/culture.jpg', body: 'Izložbe otvaraju prostor za susrete različitih ideja i pogleda. Kulturne ustanove predstavljaju radove umjetnika kroz stalne zbirke, gostujuće postave i razgovore s posjetiteljima.', title: 'Nove priče iz svijeta kulture', source: 'Kultura', category: 'Kultura', time: '10:28', pubDate: '2026-11-08T10:28:00+01:00', link: 'https://kultura.example/price', description: 'Knjige, izložbe i događanja mogu biti dio tvoje osobne grupe izvora. U aplikaciji dodaješ RSS feedove i organiziraš ih prema vlastitim interesima.' },
  { id: 4, imageUrl: '/landing/programmers.jpg', body: 'Javno dostupan kod omogućuje zajednici da prouči kako alati rade i sudjeluje u njihovu razvoju. Dokumentacija, razmjena iskustava i male promjene pomažu održavanju zajedničkih projekata.', title: 'Otvoreni kod povezuje programere', source: 'Web', category: 'Tehnologija', time: '10:16', pubDate: '2026-11-08T10:16:00+01:00', link: 'https://web.example/otvoreni-kod', description: 'Otvoreni kod povezuje programere oko zajedničkih projekata. Zajedničke ključne riječi i kategorija pomažu algoritmu da prepozna sličnost s drugim tehnološkim člancima.' },
];

const currentFeature = computed(() => {
  for (const feature of features) {
    if (feature.id === activeFeature.value) return feature;
  }
  return features[0];
});

const reactionCount = computed(() => demoProfile.value.st.likes + demoProfile.value.st.dislikes + demoProfile.value.st.opens + savedIds.value.length);
const hasInteractions = computed(() => Object.keys(demoProfile.value.src).length > 0);

const visibleArticles = computed(() => {
  const result = [];
  for (const article of articles) {
    if (activeFeature.value === 'saved' && !savedIds.value.includes(article.id)) continue;
    result.push({ ...article });
  }
  if (activeFeature.value === 'combo') return rankFeed(result, demoProfile.value, demoTime);
  if (activeFeature.value === 'timeline' && !newestFirst.value) result.reverse();
  return result;
});

function updateAlgorithm(article, signal) {
  const copies = [];
  for (const item of articles) copies.push({ ...item });
  const ranked = rankFeed(copies, demoProfile.value, demoTime);
  emit('algorithm-update', {
    title: article.title,
    category: article.category,
    signal,
    firstTitle: ranked[0].title,
  });
}

function scoreBadge(pct) {
  if (pct >= 65) return 'badge-success';
  if (pct >= 40) return 'badge-warning';
  return 'badge-ghost';
}

function toggleLike(article) {
  highlightCategory(article.category);
  const dislikeIndex = dislikedIds.value.indexOf(article.id);
  if (dislikeIndex !== -1) {
    dislikedIds.value.splice(dislikeIndex, 1);
    applySignal(demoProfile.value, 'undislike', article, demoTime);
  }
  const index = likedIds.value.indexOf(article.id);
  if (index === -1) {
    likedIds.value.push(article.id);
    applySignal(demoProfile.value, 'heart', article, demoTime);
    feedback.value = `Više interesa za temu: ${article.category}.`;
  } else {
    likedIds.value.splice(index, 1);
    applySignal(demoProfile.value, 'unheart', article, demoTime);
    feedback.value = 'Srce je uklonjeno.';
  }
  if (activeFeature.value === 'timeline') activeFeature.value = 'combo';
  updateAlgorithm(article, likedIds.value.includes(article.id) ? 'heart' : 'undo');
}

function toggleDislike(article) {
  highlightCategory(article.category);
  const index = dislikedIds.value.indexOf(article.id);
  if (index === -1) {
    dislikedIds.value.push(article.id);
    applySignal(demoProfile.value, 'dislike', article, demoTime);
    const likeIndex = likedIds.value.indexOf(article.id);
    if (likeIndex !== -1) {
      likedIds.value.splice(likeIndex, 1);
      applySignal(demoProfile.value, 'unheart', article, demoTime);
    }
    feedback.value = `Manje interesa za temu: ${article.category}.`;
  } else {
    dislikedIds.value.splice(index, 1);
    applySignal(demoProfile.value, 'undislike', article, demoTime);
    feedback.value = 'Dislike je uklonjen.';
  }
  if (activeFeature.value === 'timeline') activeFeature.value = 'combo';
  updateAlgorithm(article, dislikedIds.value.includes(article.id) ? 'dislike' : 'undo');
}

function toggleSave(article) {
  const index = savedIds.value.indexOf(article.id);
  if (index === -1) {
    savedIds.value.push(article.id);
    applySignal(demoProfile.value, 'bookmark', article, demoTime);
    feedback.value = 'Članak je spremljen. Pronađi ga u prikazu „Spremljeno”.';
  } else {
    savedIds.value.splice(index, 1);
    feedback.value = 'Članak je uklonjen iz spremljenih.';
  }
  updateAlgorithm(article, savedIds.value.includes(article.id) ? 'bookmark' : 'undo');
}

function openArticle(article) {
  selectedArticle.value = article;
  if (!openedIds.has(article.id)) {
    openedIds.add(article.id);
    applySignal(demoProfile.value, 'open', article, demoTime);
    updateAlgorithm(article, 'open');
  }
  articleDialog.value.showModal();
}

function resetDemo() {
  clearTimeout(highlightTimer);
  lastReactedCategory.value = '';
  likedIds.value = [];
  dislikedIds.value = [];
  savedIds.value = [];
  openedIds.clear();
  newestFirst.value = true;
  demoProfile.value = createEmptyProfile(demoTime);
  feedback.value = 'Primjer je vraćen na početak.';
  emit('algorithm-update', null);
}
</script>

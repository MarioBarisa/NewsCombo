<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useNewsGlobal, cacheKeyFor } from '../Services/NewsGlobal'
import { useFeedsStore } from '../stores/feedStore'
import { useTasteStore } from '../stores/tasteStore'
import NewsCardCompact from './NewsCardCompact.vue'
import NewsModal from './NewsModal.vue'
import FeedSwitcher from './FeedSwitcher.vue'

const newsService = useNewsGlobal()
const feedsStore = useFeedsStore()
const tasteStore = useTasteStore()

const allNews = ref([])
const displayedNews = ref([])
const currentPage = ref(1)
const itemsPerPage = 15
const sortOrder = ref('desc')
const loadMoreTrigger = ref(null)
const observer = ref(null)
const loadingMore = ref(false)
const selectedNews = ref(null)
const isModalOpen = ref(false)
const activeFeedId = ref(null)
const loading = computed(() => newsService.isLoading.value)
const error = computed(() => newsService.error.value)

// NewsCombo način rada — personalizirani kronološki feed
const isComboMode = computed(() => feedsStore.selectedCategoryId === 'combo')

// očekivani cache ključ — guard protiv cross-category prikaza
const expectedKey = ref(null)
const computeExpectedKey = (categoryId) => {
  const serviceCatId = categoryId === 'combo' ? 'all' : (categoryId || 'all');
  let feeds;
  if (!serviceCatId || serviceCatId === 'all') {
    feeds = feedsStore.availableFeeds;
  } else {
    const cat = feedsStore.categories.find((c) => c.id === serviceCatId);
    feeds = cat ? cat.feeds : [];
  }
  return cacheKeyFor(serviceCatId, feeds);
}

const sortedNews = computed(() => {
  const sorted = [...filteredNews.value]
  return sorted.sort((a, b) => {
    const tsA = Number.isNaN(new Date(a.pubDate).getTime()) ? Number.NEGATIVE_INFINITY : new Date(a.pubDate).getTime()
    const tsB = Number.isNaN(new Date(b.pubDate).getTime()) ? Number.NEGATIVE_INFINITY : new Date(b.pubDate).getTime()
    return sortOrder.value === 'desc' ? tsB - tsA : tsA - tsB
  })
})

// personalizacija unutar kantica (samo combo način)
const rankedNews = computed(() => {
  if (!isComboMode.value) return sortedNews.value
  return tasteStore.rankArticles(sortedNews.value)
})

const hasMore = computed(() => {
  const totalAvailable = rankedNews.value.length
  return totalAvailable > 0 && displayedNews.value.length < totalAvailable
})

// filtriraj po odabranom feedu
const filteredNews = computed(() => {
  if (!activeFeedId.value) {
    return allNews.value;
  }
  return allNews.value.filter(news => news.feedId === activeFeedId.value);
});

const syncDisplayedNews = (items, resetPage = false) => {
  if (!Array.isArray(items)) return
  allNews.value = items

  if (resetPage) {
    currentPage.value = 1
    displayedNews.value = rankedNews.value.slice(0, itemsPerPage)
    return
  }

  const currentVisibleCount = displayedNews.value.length || itemsPerPage
  displayedNews.value = rankedNews.value.slice(0, Math.max(itemsPerPage, currentVisibleCount))
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleTimeString('hr-HR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    return ''
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - d)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Danas'
    } else if (diffDays === 1) {
      return 'Jučer'
    } else if (diffDays < 7) {
      return `Prije ${diffDays} dana`
    }

    return d.toLocaleDateString('hr-HR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch (e) {
    return dateString
  }
}

const getTimelineColorClass = (dateString) => {
  if (!dateString) return 'text-base-300';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'text-base-300';

  const diffHours = (new Date() - d) / (1000 * 60 * 60);

  if (diffHours < 2) return 'text-error'; // vrlo svježe
  if (diffHours < 6) return 'text-warning'; // svježe
  if (diffHours < 24) return 'text-primary'; // danas
  return 'text-base-300';
};

const loadMore = () => {
  if (loadingMore.value || !hasMore.value) return

  loadingMore.value = true
  const start = displayedNews.value.length
  const end = Math.min(start + itemsPerPage, rankedNews.value.length)
  const newItems = rankedNews.value.slice(start, end)

  setTimeout(() => {
    displayedNews.value.push(...newItems)
    loadingMore.value = false
  }, 300)
}

const refreshNews = async (categoryId = null) => {
  try {
    const catId = categoryId || feedsStore.selectedCategoryId;
    // combo dohvaća sve feedove
    const serviceCatId = catId === 'combo' ? 'all' : catId;
    console.log('Refresham vijesti za kategoriju:', catId);
    expectedKey.value = computeExpectedKey(catId);
    const fetchedNews = await newsService.refreshNews(serviceCatId, activeFeedId.value);

    // stale-check: korisnik je u međuvremenu switchao — ne diraj novi prikaz
    if (feedsStore.selectedCategoryId !== catId) return;

    if (fetchedNews && fetchedNews.length > 0) {
      console.log('Učitano', fetchedNews.length, 'vijesti');
      syncDisplayedNews(fetchedNews, true)
    } else {
      console.warn('Nema vijesti za ovu kategoriju');
      if (allNews.value.length === 0) {
        displayedNews.value = [];
      }
    }
  } catch (err) {
    console.error('Error refreshing news:', err);
  }
};


const loadDemoNews = () => {
  console.log('demo vijesti')
  allNews.value = newsService.getMockNews()
  displayedNews.value = rankedNews.value.slice(0, itemsPerPage)
  currentPage.value = 1
}

const openModal = (news) => {
  selectedNews.value = news
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  setTimeout(() => {
    selectedNews.value = null
  }, 300)
}

// promjena aktivnog feeda
const handleFeedChange = (feedId) => {
  activeFeedId.value = feedId;
  displayedNews.value = rankedNews.value.slice(0, itemsPerPage);
  currentPage.value = 1;
};

const setupIntersectionObserver = () => {
  if (observer.value) observer.value.disconnect(); // clear stari ako postoji

  const options = {
    root: null,
    rootMargin: '100px',
    threshold: 0.1
  };

  observer.value = new IntersectionObserver((entries) => {
    const entry = entries[0];
    if (entry.isIntersecting && hasMore.value && !loadingMore.value) {
      console.log('Infinite scroll upaljen'); 
      loadMore();
    }
  }, options);

  // čekaj render
  setTimeout(() => {
    if (loadMoreTrigger.value) {
      observer.value.observe(loadMoreTrigger.value);
    }
  }, 100);
}


// promjena kategorije
watch(
  () => feedsStore.selectedCategoryId,
  async (newCategoryId) => {
    console.log('Kategorija se promijenila na:', newCategoryId)
    displayedNews.value = []
    currentPage.value = 1
    allNews.value = []
    activeFeedId.value = null
    expectedKey.value = computeExpectedKey(newCategoryId)

    // cache-first: switch je trenutan i moguć i tijekom fetchanja
    try {
      const serviceCatId = newCategoryId === 'combo' ? 'all' : newCategoryId;
      const fetchedNews = await newsService.fetchNews(serviceCatId);

      // stale-check: korisnik je u međuvremenu switchao dalje — ne diraj noviji prikaz
      if (feedsStore.selectedCategoryId !== newCategoryId) return;

      if (fetchedNews && fetchedNews.length > 0) {
        syncDisplayedNews(fetchedNews, true)
      } else {
        if (allNews.value.length === 0) {
          displayedNews.value = [];
        }
      }
    } catch (err) {
      console.error('Error switching category:', err);
    }
  }
)


watch(
  () => filteredNews.value.length,
  () => {
    setTimeout(() => {
      setupIntersectionObserver();
    }, 100);
  }
);

// cachedNews je globalni — primijeni samo publikaciju ove kategorije
watch(
  () => newsService.cachedNews.value,
  (latestNews) => {
    if (!Array.isArray(latestNews) || latestNews.length === 0) return
    if (!expectedKey.value || newsService.publishedCacheKey !== expectedKey.value) {
      console.log('Ignoriram publikaciju druge kategorije (guard).');
      return
    }
    syncDisplayedNews(latestNews, false)
  }
)

// sortiranje: čisti klijentski re-rank, bez mreže
watch(sortOrder, () => {
  if (allNews.value.length > 0) {
    syncDisplayedNews(allNews.value, true)
  }
})


const setSortNewest = () => {
  sortOrder.value = 'desc';
};

const setSortOldest = () => {
  sortOrder.value = 'asc';
};

onMounted(async () => {
  await feedsStore.ensureReady()
  // profil interesa za NewsCombo i srca
  tasteStore.init().catch((e) => console.warn('tasteStore init:', e))

  const categoryId = feedsStore.selectedCategoryId;
  expectedKey.value = computeExpectedKey(categoryId);
  const serviceCategoryId = categoryId === 'combo' ? 'all' : categoryId;
  const fetchedNews = await newsService.fetchNews(serviceCategoryId, activeFeedId.value);

  if (fetchedNews && fetchedNews.length > 0) {
    syncDisplayedNews(fetchedNews, true)
  } else if (newsService.cachedNews.value.length > 0) {
    syncDisplayedNews(newsService.cachedNews.value, true)
  }

  setTimeout(() => {
    setupIntersectionObserver()
  }, 500)
})

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
})
</script>

 <template>
    <div class="w-full max-w-4xl mx-auto px-0 sm:px-4 py-2 sm:py-8">
    <!-- Feed Switcher — skriven u NewsCombo načinu (rangiraju se svi izvori) -->
    <div v-if="!isComboMode" class="px-3 sm:px-0">
      <FeedSwitcher @feed-changed="handleFeedChange" />
    </div>

    <!-- NewsCombo: traka dok algoritam još uči (trajna dok nema dovoljno podataka) -->
    <div v-if="isComboMode && tasteStore.hydrated && !tasteStore.hasEnoughData"
         class="alert alert-info py-3 px-4 mx-3 sm:mx-0 mb-4 text-sm">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" class="h-5 w-5 shrink-0">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>
        NewsCombo još uči što te zanima — za sada prikazujem sve vijesti kronološki.
        Označi nekoliko članaka srcem ili ih otvori.
      </span>
      <RouterLink to="/taste" class="btn btn-xs btn-ghost whitespace-nowrap shrink-0">Kako učim?</RouterLink>
    </div>

    <!-- head -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 px-3 sm:px-0">
      <h2 class="text-xl font-semibold">{{ isComboMode ? 'Za tebe' : 'Najnovije vijesti' }}</h2>
      <div class="join w-full sm:w-auto">
        <button @click="setSortNewest" class="btn btn-xs sm:btn-sm flex-1 sm:flex-none join-item"
                :class="sortOrder === 'desc' ? 'btn-primary' : 'btn-ghost'">
          Najnovije
        </button>
        <button v-if="!isComboMode" @click="setSortOldest" class="btn btn-xs sm:btn-sm flex-1 sm:flex-none join-item"
                :class="sortOrder === 'asc' ? 'btn-primary' : 'btn-ghost'">
          Najstarije
        </button>
        <button @click="refreshNews" class="btn btn-xs sm:btn-sm flex-none join-item btn-outline">
          <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 sm:h-4 sm:w-4" fill="none"
               viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="loading loading-spinner loading-xs sm:loading-sm" v-else></span>
        </button>
      </div>
    </div>

    <!-- djelomično učitavanje: chip umjesto lažne greške -->
    <div v-if="!loading && newsService.partialInfo.failed > 0 && displayedNews.length > 0"
         class="flex justify-center mb-3 px-3 sm:px-0">
      <div class="badge badge-warning badge-outline gap-1.5 text-xs py-2.5">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" class="h-3.5 w-3.5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        Djelomično učitano — {{ newsService.partialInfo.total - newsService.partialInfo.failed }}/{{ newsService.partialInfo.total }} izvora
      </div>
    </div>

    <!-- skeleton kartice tijekom učitavanja -->
    <div v-if="loading && displayedNews.length === 0" class="space-y-3 px-3 sm:px-0">
      <div v-for="n in 6" :key="n" class="card card-compact bg-base-200 shadow animate-pulse w-full">
        <div class="card-body p-4 flex gap-3 flex-row items-start">
          <div class="w-20 h-20 sm:w-32 sm:h-24 rounded-lg bg-base-300/70 flex-shrink-0"></div>
          <div class="flex-1 space-y-2 py-1 min-w-0">
            <div class="h-3 w-24 bg-base-300/70 rounded"></div>
            <div class="h-4 w-full bg-base-300/70 rounded"></div>
            <div class="h-4 w-2/3 bg-base-300/70 rounded"></div>
            <div class="h-6 w-32 bg-base-300/70 rounded mt-3"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- greška -->
    <div v-else-if="error && displayedNews.length === 0" class="text-center py-16">
      <div class="alert alert-error max-w-md mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ error }}</span>
      </div>
      <div class="flex gap-2 justify-center mt-4">
        <button @click="refreshNews" class="btn btn-sm btn-primary">Pokušaj ponovno</button>
        <button @click="loadDemoNews" class="btn btn-sm btn-secondary">Prikaži demo vijesti</button>
      </div>
    </div>

    <!-- vremenska crta -->
    <ul v-else-if="displayedNews.length > 0" class="timeline timeline-vertical timeline-compact max-w-full">
      <li v-for="(news, index) in displayedNews" :key="news.link || index">
        <hr v-if="index > 0" class="bg-base-300" />

        <!-- datum i vrijeme -->
        <div class="timeline-start text-end pr-2 sm:pr-4 py-3 sm:py-6">
          <time class="font-mono text-xs sm:text-sm font-bold block">
            {{ formatTime(news.pubDate) }}
          </time>
          <time class="font-mono text-[10px] sm:text-xs opacity-60 block mt-0.5 sm:mt-1">
            {{ formatDate(news.pubDate) }}
          </time>
        </div>

        <!-- vremenska crta sredina -->
        <div class="timeline-middle">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-500" :class="getTimelineColorClass(news.pubDate)">
            <path fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clip-rule="evenodd" />
          </svg>
        </div>
        <div class="timeline-end pl-1 sm:pl-4 py-2 sm:py-4 w-full" style="max-width: calc(100% - 1rem);">
          <div class="w-full">
            <NewsCardCompact :news="news" :color-class="getTimelineColorClass(news.pubDate)" :show-score="isComboMode" @open-modal="openModal" />
          </div>
        </div>


        <hr v-if="index < displayedNews.length - 1" class="bg-base-300" />
      </li>
    </ul>

    <!-- učitaj više -->
    <div ref="loadMoreTrigger" v-if="hasMore && displayedNews.length > 0" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-md" v-if="loadingMore"></span>
      <p v-else class="text-sm opacity-60">Scrollaj za više vijesti...</p>
    </div>

    <!-- prazno -->
    <div v-else-if="displayedNews.length === 0" class="text-center py-16">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-24 h-24 mx-auto mb-4 text-base-content opacity-20" fill="none"
        viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
      <p class="text-xl opacity-60 mb-4">Nema dostupnih vijesti</p>
      <div class="flex gap-2 justify-center">
        <button @click="refreshNews" class="btn btn-sm btn-primary">Osvježi</button>
        <button @click="loadDemoNews" class="btn btn-sm btn-secondary">Demo vijesti</button>
      </div>
    </div>

    <NewsModal :news-item="selectedNews" :is-open="isModalOpen" @close="closeModal" />
  </div>
</template>
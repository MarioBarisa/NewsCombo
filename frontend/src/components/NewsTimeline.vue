<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, TransitionGroup } from 'vue'
import { useNewsGlobal, cacheKeyFor, cancelCategoryRequest } from '../Services/NewsGlobal'
import { useFeedsStore } from '../stores/feedStore'
import { useThemeStore } from '../stores/theme'
import { useTasteStore } from '../stores/tasteStore'
import NewsCardCompact from './NewsCardCompact.vue'
import NewsModal from './NewsModal.vue'
import FeedSwitcher from './FeedSwitcher.vue'

const themeStore = useThemeStore()
const newsService = useNewsGlobal()
const feedsStore = useFeedsStore()
const tasteStore = useTasteStore()
const itemsPerPage = 15
const visibleCount = ref(itemsPerPage)
const sortOrder = ref('desc')
const loadMoreTrigger = ref(null)
const timelineElement = ref(null)
let sortAnimations = []
const isChangingSort = ref(false)
let sortAnimationGeneration = 0
let pendingEntrance = false
let observer = null
let requestKey = null
const selectedNews = ref(null)
const isModalOpen = ref(false)
const activeFeedId = ref(null)
const demoNews = ref(null)
const loading = computed(() => feedsStore.isLoading || newsService.isLoading.value)
const error = computed(() => feedsStore.error || newsService.error.value)
const partialInfo = newsService.partialInfo
const stale = computed(() => newsService.snapshot.value.stale)
const allNews = computed(() => demoNews.value || newsService.cachedNews.value)
const isComboMode = computed(() => feedsStore.selectedCategoryId === 'combo')
const isPersonalized = computed(() => isComboMode.value || sortOrder.value === 'personal')
const expectedKey = computed(() => cacheKeyFor(feedsStore.selectedCategoryId, feedsStore.selectedFeeds))
const filteredNews = computed(() => {
  if (!activeFeedId.value) return allNews.value
  return allNews.value.filter(news => news.feedId === activeFeedId.value)
})
const sortedNews = computed(() => {
  const sorted = [...filteredNews.value]
  sorted.sort((a, b) => {
    const aTime = Date.parse(a.pubDate) || 0
    const bTime = Date.parse(b.pubDate) || 0
    return sortOrder.value !== 'asc' ? bTime - aTime : aTime - bTime
  })
  return sorted
})
const rankedNews = computed(() => {
  if (!isPersonalized.value) return sortedNews.value
  const articles = []
  for (const article of sortedNews.value) articles.push({ ...article })
  return tasteStore.rankArticles(articles)
})
const displayedNews = computed(() => rankedNews.value.slice(0, visibleCount.value))
const hasMore = computed(() => displayedNews.value.length < rankedNews.value.length)

const loadMore = () => {
  visibleCount.value += itemsPerPage
}

const refreshNews = async () => {
  demoNews.value = null
  visibleCount.value = itemsPerPage
  try {
    await newsService.refreshNews(feedsStore.selectedCategoryId, activeFeedId.value)
  } catch {}
}

const loadDemoNews = () => {
  demoNews.value = newsService.getMockNews()
  visibleCount.value = itemsPerPage
}

const openModal = news => {
  selectedNews.value = news
  isModalOpen.value = true
}
const closeModal = () => {
  isModalOpen.value = false
  selectedNews.value = null
}
const handleFeedChange = feedId => {
  sortAnimationGeneration++
  cancelSortAnimations()
  pendingEntrance = true
  isChangingSort.value = true
  closeModal()
  activeFeedId.value = feedId
  visibleCount.value = itemsPerPage
}

watch([expectedKey, () => feedsStore.initialized, () => feedsStore.selectedCategoryId], async (
  [key, initialized, categoryId], previous
) => {
  const previousCategoryId = previous?.[2]
  sortAnimationGeneration++
  cancelSortAnimations()
  pendingEntrance = true
  isChangingSort.value = true
  if (requestKey && requestKey !== key) cancelCategoryRequest(requestKey)
  requestKey = key
  demoNews.value = null
  visibleCount.value = itemsPerPage
  if (categoryId !== previousCategoryId) {
    activeFeedId.value = null
    sortOrder.value = 'desc'
  } else if (activeFeedId.value && !feedsStore.selectedFeeds.some(feed => feed.id === activeFeedId.value)) {
    activeFeedId.value = null
  }
  closeModal()
  if (!initialized) return
  try { await newsService.fetchNews(categoryId) } catch {}
}, { immediate: true })
watch(sortOrder, () => { visibleCount.value = itemsPerPage })
watch([loadMoreTrigger, () => displayedNews.value.length], () => {
  observer?.disconnect()
  if (!loadMoreTrigger.value || !hasMore.value) return
  observer = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && hasMore.value) loadMore()
  }, { rootMargin: '100px', threshold: 0.1 })
  observer.observe(loadMoreTrigger.value)
}, { flush: 'post' })

function cancelSortAnimations() {
  for (const animation of sortAnimations) animation.cancel()
  sortAnimations = []
  isChangingSort.value = false
}

async function animateTimelineRows(mode, generation) {
  await nextTick()
  if (generation !== sortAnimationGeneration) return
  if (!themeStore.timelineAnimations || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    isChangingSort.value = false
    return
  }
  const rows = timelineElement.value?.querySelectorAll('ul.timeline > li') || []
  for (let index = 0; index < rows.length; index++) {
    if (!rows[index].animate) continue
    const animation = rows[index].animate(
      [
        { opacity: mode === 'enter' ? 0 : 0.65, transform: mode === 'enter' ? 'translateY(8px)' : 'translateY(3px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      { duration: mode === 'enter' ? 300 : 220, delay: Math.min(index, 8) * 14, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)', fill: 'backwards' }
    )
    sortAnimations.push(animation)
  }
  const completions = []
  for (const animation of sortAnimations) completions.push(animation.finished)
  await Promise.allSettled(completions)
  if (generation === sortAnimationGeneration) {
    sortAnimations = []
    isChangingSort.value = false
  }
}

// Prvi prikaz nakon promjene konteksta.
watch([() => displayedNews.value.length, expectedKey, () => feedsStore.selectedCategoryId, activeFeedId], () => {
  if (!pendingEntrance || !displayedNews.value.length) return
  pendingEntrance = false
  animateTimelineRows('enter', sortAnimationGeneration)
}, { flush: 'post' })

async function setSortOrder(order) {
  if (sortOrder.value === order) return
  const generation = ++sortAnimationGeneration
  cancelSortAnimations()
  pendingEntrance = displayedNews.value.length === 0
  isChangingSort.value = true
  sortOrder.value = order
  await animateTimelineRows('sort', generation)
}

watch(() => themeStore.timelineAnimations, enabled => {
  if (!enabled) {
    sortAnimationGeneration++
    cancelSortAnimations()
  }
})

const setSortNewest = () => setSortOrder('desc')
const setSortOldest = () => setSortOrder('asc')
const setSortPersonal = () => setSortOrder('personal')
const formatTime = date => Number.isFinite(Date.parse(date)) ? new Date(date).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' }) : ''
const formatDate = date => {
  if (!Number.isFinite(Date.parse(date))) return ''
  const published = new Date(date)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (published.toDateString() === today.toDateString()) return 'Danas'
  if (published.toDateString() === yesterday.toDateString()) return 'Jučer'
  return published.toLocaleDateString('hr-HR', { day: 'numeric', month: 'short', year: 'numeric' })
}
const getTimelineColorClass = date => {
  if (!Number.isFinite(Date.parse(date))) return 'text-base-300'
  const hours = (Date.now() - Date.parse(date)) / 3600000
  if (hours < 2) return 'text-error'
  if (hours < 6) return 'text-warning'
  if (hours < 24) return 'text-primary'
  return 'text-base-300'
}

onMounted(async () => {
  try {
    await feedsStore.ensureReady()
    await tasteStore.init()
  } catch {}
})
onUnmounted(() => {
  sortAnimationGeneration++
  cancelSortAnimations()
  observer?.disconnect()
  cancelCategoryRequest(requestKey)
})
</script>

 <template>
    <div class="w-full max-w-4xl mx-auto px-0 sm:px-4 py-2 sm:py-8">
    <!-- Feed Switcher — skriven u NewsCombo načinu (rangiraju se svi izvori) -->
    <div v-if="!isComboMode" class="px-3 sm:px-0">
      <FeedSwitcher :active-feed-id="activeFeedId" @feed-changed="handleFeedChange" />
    </div>

    <!-- NewsCombo: traka dok algoritam još uči (trajna dok nema dovoljno podataka) -->
    <div v-if="isPersonalized && tasteStore.hydrated && !tasteStore.hasEnoughData"
         class="alert alert-info py-3 px-4 mx-3 sm:mx-0 mb-4 text-sm">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" class="h-5 w-5 shrink-0">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>
        Algoritam još uči što te zanima — za sada prikazujem sve vijesti kronološki.
        Označi nekoliko članaka srcem ili ih otvori.
      </span>
      <RouterLink to="/taste" class="btn btn-xs btn-ghost whitespace-nowrap shrink-0">Kako učim?</RouterLink>
    </div>

    <!-- head -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 px-3 sm:px-0">
      <h2 class="text-xl font-semibold">{{ isComboMode ? 'NewsCombo' : 'Vijesti' }}</h2>
      <div class="flex items-center gap-1 w-full sm:w-auto rounded-box bg-base-200/70 border border-base-300 p-1" role="group" aria-label="Sortiranje i osvježavanje vijesti">
        <button v-if="!isComboMode" aria-label="Najnovije" title="Najnovije" @click="setSortNewest" class="btn btn-sm h-8 min-h-8 min-w-8 border shadow-none flex-1 sm:flex-none"
                :class="sortOrder === 'desc' ? 'btn-primary' : 'bg-base-100 border-base-300'" :aria-pressed="sortOrder === 'desc'">
          <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4h9M3 8h7M3 12h5M17 4v16m-4-4 4 4 4-4" /></svg>
          <span class="hidden sm:inline">Najnovije</span>
        </button>
        <button v-if="!isComboMode" aria-label="Najstarije" title="Najstarije" @click="setSortOldest" class="btn btn-sm h-8 min-h-8 min-w-8 border shadow-none flex-1 sm:flex-none"
                :class="sortOrder === 'asc' ? 'btn-primary' : 'bg-base-100 border-base-300'" :aria-pressed="sortOrder === 'asc'">
          <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4h5M3 8h7M3 12h9M17 20V4m-4 4 4-4 4 4" /></svg>
          <span class="hidden sm:inline">Najstarije</span>
        </button>
        <button v-if="!isComboMode && feedsStore.selectedCategoryId !== 'all'" aria-label="Za tebe" title="Za tebe" @click="setSortPersonal" class="btn btn-sm h-8 min-h-8 min-w-8 border shadow-none flex-1 sm:flex-none"
                :class="sortOrder === 'personal' ? 'btn-primary' : 'bg-base-100 border-base-300'" :aria-pressed="sortOrder === 'personal'">
          <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
        </button>
        <button aria-label="Osvježi vijesti" title="Osvježi vijesti" @click="refreshNews()" class="btn btn-sm btn-square h-8 min-h-8 w-8 border border-base-300 bg-base-100 shadow-none shrink-0">
          <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
               viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="loading loading-spinner loading-sm" v-else></span>
        </button>
      </div>
    </div>

    <!-- djelomično učitavanje: chip umjesto lažne greške -->
    <div v-if="!loading && partialInfo.failed > 0 && displayedNews.length > 0"
         class="flex justify-center mb-3 px-3 sm:px-0">
      <div class="badge badge-warning badge-outline gap-1.5 text-xs py-2.5">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" class="h-3.5 w-3.5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        Djelomično učitano — {{ partialInfo.total - partialInfo.failed }}/{{ partialInfo.total }} izvora
      </div>
    </div>

    <div v-if="stale && displayedNews.length" class="alert alert-warning mb-4 text-sm">
      Prikazane su ranije učitane vijesti. {{ error || 'Osvježavanje je u tijeku.' }}
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
        <button @click="refreshNews()" class="btn btn-sm btn-primary">Pokušaj ponovno</button>
        <button @click="loadDemoNews" class="btn btn-sm btn-secondary">Prikaži demo vijesti</button>
      </div>
    </div>

    <!-- vremenska crta -->
    <div v-else-if="displayedNews.length > 0" :key="feedsStore.selectedCategoryId" ref="timelineElement">
    <TransitionGroup tag="ul"
      class="timeline timeline-vertical timeline-compact max-w-full"
      :css="themeStore.timelineAnimations && !isChangingSort"
      :enter-active-class="themeStore.timelineAnimations ? 'motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out' : ''"
      enter-from-class="motion-safe:opacity-0 motion-safe:translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      :move-class="themeStore.timelineAnimations && !isChangingSort ? 'motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out' : 'transition-none'">
      <li v-for="(news, index) in displayedNews" :key="news.guid || `${news.feedId}:${news.link}`">
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
            <NewsCardCompact :news="news" :color-class="getTimelineColorClass(news.pubDate)" :show-score="isPersonalized" @open-modal="openModal" />
          </div>
        </div>


        <hr v-if="index < displayedNews.length - 1" class="bg-base-300" />
      </li>
    </TransitionGroup>
    </div>

    <!-- učitaj više -->
    <div ref="loadMoreTrigger" v-if="hasMore && displayedNews.length > 0" class="flex justify-center py-8">
      <p class="text-sm opacity-60">Scrollaj za više vijesti...</p>
    </div>

    <!-- prazno -->
    <div v-else-if="!loading && !error && displayedNews.length === 0" class="text-center py-16">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-24 h-24 mx-auto mb-4 text-base-content opacity-20" fill="none"
        viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
      <p class="text-xl opacity-60 mb-4">Nema dostupnih vijesti</p>
      <div class="flex gap-2 justify-center">
        <button @click="refreshNews()" class="btn btn-sm btn-primary">Osvježi</button>
        <button @click="loadDemoNews" class="btn btn-sm btn-secondary">Demo vijesti</button>
      </div>
    </div>

    <NewsModal :news-item="selectedNews" :is-open="isModalOpen" @close="closeModal" />
  </div>
</template>

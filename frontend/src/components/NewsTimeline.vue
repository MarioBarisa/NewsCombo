<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useNewsGlobal } from '../Services/NewsGlobal'
import { useFeedsStore } from '../stores/feedStore'
import NewsCardCompact from './NewsCardCompact.vue'
import NewsModal from './NewsModal.vue'
import FeedSwitcher from './FeedSwitcher.vue'

const newsService = useNewsGlobal()
const feedsStore = useFeedsStore()

const allNews = ref([])
const displayedNews = ref([])
const currentPage = ref(1)
const itemsPerPage = 15
const sortOrder = ref('desc')
const userPreferences = ref({})
const loadMoreTrigger = ref(null)
const observer = ref(null)
const loadingMore = ref(false)
const selectedNews = ref(null)
const isModalOpen = ref(false)
const activeFeedId = ref(null)
const loading = computed(() => newsService.isLoading.value)
const error = computed(() => newsService.error.value)
const hasMore = computed(() => displayedNews.value.length < sortedNews.value.length)

// FILTRIRAJ VIJESTI PO ODABRANOM FEED-U
const filteredNews = computed(() => {
  if (!activeFeedId.value) {
    return allNews.value;
  }
  return allNews.value.filter(news => news.feedId === activeFeedId.value);
});

const sortedNews = computed(() => {
  const sorted = [...filteredNews.value]
  return sorted.sort((a, b) => {
    const dateA = new Date(a.pubDate || 0)
    const dateB = new Date(b.pubDate || 0)
    return sortOrder.value === 'desc' ? dateB - dateA : dateA - dateB
  })
})

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

const loadMore = () => {
  if (loadingMore.value || !hasMore.value) return

  loadingMore.value = true
  const start = displayedNews.value.length
  const end = Math.min(start + itemsPerPage, sortedNews.value.length)
  const newItems = sortedNews.value.slice(start, end)

  setTimeout(() => {
    displayedNews.value.push(...newItems)
    loadingMore.value = false
  }, 300)
}

// refresh po odabranoj kategoriji
const refreshNews = async () => {
  if (loading.value) {
    console.log('Refresh vec u procesu');
    return;
  }
  try {
    const categoryId = feedsStore.selectedCategoryId;
    console.log('Refresham vijesti za kategoriju:', categoryId);
    const fetchedNews = await newsService.refreshNews(categoryId);
    
    if (fetchedNews && fetchedNews.length > 0) {
      console.log('Učitano', fetchedNews.length, 'vijesti');
      allNews.value = fetchedNews;
      displayedNews.value = sortedNews.value.slice(0, itemsPerPage);
      currentPage.value = 1;
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
  const mockNews = newsService.getMockNews()
  allNews.value = mockNews
  displayedNews.value = sortedNews.value.slice(0, itemsPerPage)
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

const handleLike = (newsLink, liked) => {
  if (liked) {
    userPreferences.value[newsLink] = 'like'
  } else {
    delete userPreferences.value[newsLink]
  }
  localStorage.setItem('newsPreferences', JSON.stringify(userPreferences.value))
}

const handleDislike = (newsLink, disliked) => {
  if (disliked) {
    userPreferences.value[newsLink] = 'dislike'
  } else {
    delete userPreferences.value[newsLink]
  }
  localStorage.setItem('newsPreferences', JSON.stringify(userPreferences.value))
}

const loadPreferences = () => {
  try {
    const saved = localStorage.getItem('newsPreferences')
    if (saved) {
      userPreferences.value = JSON.parse(saved)
    }
  } catch (e) {
    console.error('Error loading preferences:', e)
  }
}

// HANLDER za promjenu aktivnog feeda
const handleFeedChange = (feedId) => {
  activeFeedId.value = feedId;
  displayedNews.value = sortedNews.value.slice(0, itemsPerPage);
  currentPage.value = 1;
};

const setupIntersectionObserver = () => {
  if (observer.value) observer.value.disconnect(); // clear stari ako postoji

  const options = {
    root: null, // prozor preglednika
    rootMargin: '100px', // Okida 100px prije nego element dođe na ekran
    threshold: 0.1 // Okida čim se vidi 10% elementa
  };

  observer.value = new IntersectionObserver((entries) => {
    const entry = entries[0];
    // safety provjera
    if (entry.isIntersecting && hasMore.value && !loadingMore.value) {
      console.log('Infinite scroll upaljen'); 
      loadMore();
    }
  }, options);

  // dodan timeout da se dobro izrenderira
  setTimeout(() => {
    if (loadMoreTrigger.value) {
      observer.value.observe(loadMoreTrigger.value);
    }
  }, 100);
}


//gledaj promjene kategorije
watch(
  () => feedsStore.selectedCategoryId,
  async (newCategoryId) => {
    console.log('Kategorija se promijenila na:', newCategoryId)
    displayedNews.value = []
    currentPage.value = 1
    allNews.value = []
    activeFeedId.value = null
    await refreshNews()
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


const setSortNewest = async () => {
  sortOrder.value = 'desc';
  await refreshNews();
};

const setSortOldest = async () => {
  sortOrder.value = 'asc';
  await refreshNews();
};

onMounted(async () => {
  loadPreferences()
  await feedsStore.initializeStore()
  
  const categoryId = feedsStore.selectedCategoryId;
  const fetchedNews = await newsService.fetchNews(categoryId);
  
  if (fetchedNews && fetchedNews.length > 0) {
    allNews.value = fetchedNews;
    displayedNews.value = sortedNews.value.slice(0, itemsPerPage);
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
   <div class="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8 overflow-x-hidden">
    <!-- Info o trenutnoj kategoriji
      <div v-if="feedsStore.selectedCategory" class="mb-6 p-4 bg-base-200 rounded-lg">
        <p class="text-sm">
          <strong>📂 Kategorija:</strong> {{ feedsStore.selectedCategory.name }}
          <span v-if="feedsStore.selectedCategoryId !== 'all'" class="ml-3 opacity-75">
            ({{ feedsStore.selectedFeeds.length }} feedova)
          </span>
        </p>
      </div>-->

    <!-- Feed Switcher -->
    <FeedSwitcher @feed-changed="handleFeedChange" />

    <!-- head -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <h2 class="text-3xl font-bold">Najnovije vijesti</h2>
      <div class="flex flex-wrap gap-2">
        <button @click="setSortNewest" :class="sortOrder === 'desc' ? 'btn-primary' : 'btn-ghost'"class="btn btn-xs sm:btn-sm"
          :disabled="loading">
          Najnovije
        </button>
        <button @click="setSortOldest" :class="sortOrder === 'asc' ? 'btn-primary' : 'btn-ghost'" class="btn btn-xs sm:btn-sm"
          :disabled="loading">
          Najstarije
        </button>
        <button 
  @click="refreshNews" 
  class="btn btn-sm btn-outline"
  :class="{ 'loading': loading }"
  :disabled="loading"
>
  <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
  <span v-if="!loading">Refresh</span>
  <span v-else>Učitavam...</span>
</button>
      </div>
    </div>

    <!--učitavanje state -->
    <div v-if="loading && displayedNews.length === 0" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg"></span>
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
    <ul v-else-if="displayedNews.length > 0" class="timeline timeline-vertical timeline-compact">
      <li v-for="(news, index) in displayedNews" :key="news.link || index">
        <hr v-if="index > 0" class="bg-primary" />

        <!-- datum i vrijeme -->
        <div class="timeline-start text-end pr-4 py-6">
          <time class="font-mono text-sm font-bold block">
            {{ formatTime(news.pubDate) }}
          </time>
          <time class="font-mono text-xs opacity-60 block mt-1">
            {{ formatDate(news.pubDate) }}
          </time>
        </div>

        <!-- vremenska crta sredina -->
        <div class="timeline-middle">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-primary">
            <path fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clip-rule="evenodd" />
          </svg>
        </div>
        <div class="timeline-end pl-4 py-4 w-full">
          <div class="w-full w-full">
            <NewsCardCompact :news="news" @like="handleLike" @dislike="handleDislike" @open-modal="openModal" />
          </div>
        </div>


        <hr v-if="index < displayedNews.length - 1" class="bg-primary" />
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

    <NewsModal :news-item="selectedNews" :is-open="isModalOpen" @close="closeModal" @like="handleLike"
      @dislike="handleDislike" />
  </div>
</template>
<template>
  <div class="news-carousel bg-base-200 rounded-box p-3 sm:p-4">
    <h2 class="text-lg font-semibold mb-3">Najbitnije vijesti</h2>

    <div v-if="loading && news.length === 0" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Desktop: Carousel with arrows, Mobile: Native horizontal scroll -->
    <div v-else-if="news.length > 0" class="relative group">
      <!-- idi lijevo -->
      <button
        v-if="news.length > 1"
        @click="goToPrevious"
        class="hidden sm:flex absolute left-0 top-1/2 transform -translate-y-1/2 z-10 btn btn-circle btn-sm btn-neutral shadow-xl hover:scale-105 transition-transform"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- idi desno -->
      <button
        v-if="news.length > 1"
        @click="goToNext"
        class="hidden sm:flex absolute right-0 top-1/2 transform -translate-y-1/2 z-10 btn btn-circle btn-sm btn-neutral shadow-xl hover:scale-105 transition-transform"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <!-- Sadržaj -->
      <div class="flex sm:block overflow-x-auto sm:overflow-x-visible snap-x sm:snap-none hide-scrollbar gap-4 pb-2 sm:pb-0" @scroll.passive="onMobileScroll" ref="scrollContainer">
        <template v-for="(item, index) in news" :key="index">
          <div
            v-show="isMobile || index === currentIndex"
            class="flex-shrink-0 w-[85vw] sm:w-full snap-center cursor-pointer hover:bg-base-300 rounded-box p-3 sm:py-4 sm:px-12 transition-all duration-300 mx-0 overflow-hidden"
            @click="openNewsDetail(item)"
          >
            <div class="flex flex-row gap-3 sm:gap-4 items-center text-left">
              <div v-if="item.enclosure?.link || item.thumbnail" class="shrink-0 w-24 h-24 sm:w-28 sm:h-28">
                <img
                  :src="item.enclosure?.link || item.thumbnail"
                  :alt="item.title"
                  class="w-full h-full object-cover rounded-lg shadow-sm"
                  @error="onImageError"
                />
              </div>
              <div class="flex-1 w-full min-w-0 flex flex-col justify-center py-1">
                <h3 class="font-bold text-base sm:text-lg mb-1 line-clamp-2 leading-tight" :title="item.title">{{ item.title }}</h3>
                <p class="text-sm opacity-70 mb-2 line-clamp-2 hidden sm:block" :title="stripHtml(item.description)">{{ stripHtml(item.description) }}</p>

                <div class="flex flex-row items-center gap-2 text-xs opacity-60 mt-auto">
                  <span class="badge badge-sm badge-outline">{{ item.source || 'Vijesti' }}</span>
                  <span class="whitespace-nowrap">{{ formatDate(item.pubDate) }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- indikacijski krugovi za galeriju -->
      <div class="flex justify-center mt-2 gap-2" v-if="news.length > 1">
        <div
          v-for="(_, index) in news"
          :key="index"
          :class="['w-2 h-2 rounded-full transition-all duration-300 cursor-pointer', index === currentIndex ? 'bg-primary' : 'bg-base-content opacity-30']"
          @click="goToSlide(index)"
        ></div>
      </div>
    </div>

    <div v-else-if="error" class="text-center text-error py-8">
      <div class="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>{{ error }}</span>
      </div>
      <div class="flex gap-2 justify-center mt-4">
        <button @click="fetchNews" class="btn btn-sm btn-primary">Pokušaj ponovno</button>
        <button @click="loadMockNews" class="btn btn-sm btn-secondary">Prikaži demo vijesti</button>
      </div>
    </div>

    <div v-else class="text-center py-8 opacity-70">
      <div class="flex flex-col items-center gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <p>Nema dostupnih vijesti</p>
        <div class="flex gap-2">
          <button @click="fetchNews" class="btn btn-sm btn-primary">Osvježi</button>
          <button @click="loadMockNews" class="btn btn-sm btn-secondary">Demo vijesti</button>
        </div>
      </div>
    </div>

    <NewsModal
      :news-item="selectedNews"
      :is-open="isNewsModalOpen"
      @close="closeNewsModal"
    />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useNewsGlobal } from '../Services/NewsGlobal.js';
import NewsModal from './NewsModal.vue';

export default {
  components: { NewsModal },
  setup() {
    const newsService = useNewsGlobal();

    const news = ref([]);
    const currentIndex = ref(0);
    const currentNews = ref(null);
    const intervalId = ref(null);
    const scrollContainer = ref(null);
    const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth < 640 : false);
    const retryCount = ref(0);
    const selectedNews = ref(null);
    const isNewsModalOpen = ref(false);
    const maxRetries = 3;

    const loading = computed(() => newsService.isLoading.value);
    const error = computed(() => newsService.error.value);
    const loadingProgress = computed(() => newsService.loadingProgress.value || 0);
    const isBackgroundLoading = computed(() => loading.value && news.value.length > 0 && loadingProgress.value < 100);

    const isAllCategoryNews = (items) => {
      if (!Array.isArray(items) || items.length === 0) return false;
      return items.every(item => (item.categoryId || 'all') === 'all');
    };

    const applyNews = (incomingNews) => {
      if (!incomingNews || incomingNews.length === 0) return;
      const previousLink = currentNews.value?.link;
      news.value = incomingNews.slice(0, 7);

      if (!previousLink) {
        currentIndex.value = 0;
        currentNews.value = news.value[0];
        startCarousel();
        return;
      }

      const sameItemIndex = news.value.findIndex(item => item.link === previousLink);
      currentIndex.value = sameItemIndex >= 0 ? sameItemIndex : 0;
      currentNews.value = news.value[currentIndex.value] || news.value[0];
    };

    const fetchNews = async () => {
    try {
      retryCount.value++;
      const fetchedNews = await newsService.fetchNews('all');

      if (fetchedNews && fetchedNews.length > 0) {
        applyNews(fetchedNews);
        retryCount.value = 0;
        startCarousel();
      } else if (retryCount.value < maxRetries) {
        setTimeout(() => fetchNews(), 2000 * retryCount.value);
      } else {
        loadMockNews();
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      if (retryCount.value < maxRetries) {
        setTimeout(() => fetchNews(), 2000 * retryCount.value);
      } else {
        loadMockNews();
      }
    }
  };

    const loadMockNews = () => {
      const mockNews = newsService.getMockNews();
      news.value = mockNews;
      currentIndex.value = 0;
      currentNews.value = mockNews[0];
      startCarousel();
    };

    const startCarousel = () => {
      if (intervalId.value) clearInterval(intervalId.value);

      if (news.value.length > 1 && !isMobile.value) {
        intervalId.value = setInterval(() => {
          currentIndex.value = (currentIndex.value + 1) % news.value.length;
          currentNews.value = news.value[currentIndex.value];
        }, 5000);
      }
    };

    const openNewsDetail = (newsItem) => {
      selectedNews.value = newsItem;
      isNewsModalOpen.value = true;
    };

    const closeNewsModal = () => {
      isNewsModalOpen.value = false;
      setTimeout(() => {
        selectedNews.value = null;
      }, 200);
    };

    const stripHtml = (html) => {
      if (!html) return '';
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      try {
        return new Date(dateString).toLocaleDateString('hr-HR', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return '';
      }
    };

    const goToSlide = (index) => {
      currentIndex.value = index;
      currentNews.value = news.value[index];
      startCarousel();
      if (isMobile.value && scrollContainer.value) {
          const elements = scrollContainer.value.children;
          if (elements && elements[index]) {
              elements[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
      }
    };

    const goToNext = () => {
      const nextIndex = (currentIndex.value + 1) % news.value.length;
      goToSlide(nextIndex);
    };

    const goToPrevious = () => {
      const prevIndex = currentIndex.value === 0 ? news.value.length - 1 : currentIndex.value - 1;
      goToSlide(prevIndex);
    };

    const onImageError = (event) => {
      event.target.style.display = 'none';
    };

    const onMobileScroll = () => {
      if (!isMobile.value || !scrollContainer.value) return;
      const container = scrollContainer.value;
      const scrollPosition = container.scrollLeft;
      const itemWidth = container.clientWidth;
      const newIndex = Math.round(scrollPosition / itemWidth);
      if (newIndex !== currentIndex.value && newIndex >= 0 && newIndex < news.value.length) {
          currentIndex.value = newIndex;
      }
    };

    const checkMobile = () => {
      const mobile = window.innerWidth < 640;
      if (mobile !== isMobile.value) {
          isMobile.value = mobile;
          if (mobile) {
              if (intervalId.value) clearInterval(intervalId.value);
          } else {
              startCarousel();
          }
      }
    };

    onMounted(() => {
      fetchNews();
      window.addEventListener('resize', checkMobile);
    });

    watch(
      () => newsService.cachedNews.value,
      (latestNews) => {
        if (isAllCategoryNews(latestNews)) {
          applyNews(latestNews);
        }
      }
    );

    onUnmounted(() => {
      if (intervalId.value) {
        clearInterval(intervalId.value);
      }
      window.removeEventListener('resize', checkMobile);
    });

    return {
      loading,
      error,
      currentNews,
      currentIndex,
      news,
      selectedNews,
      isNewsModalOpen,
      loadingProgress,
      isBackgroundLoading,
      scrollContainer,
      isMobile,
      openNewsDetail,
      closeNewsModal,
      stripHtml,
      formatDate,
      goToSlide,
      goToNext,
      goToPrevious,
      onImageError,
      fetchNews,
      loadMockNews,
      onMobileScroll
    };
  }
};
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>


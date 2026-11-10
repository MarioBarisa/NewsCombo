<template>
  <div class="bg-base-200 rounded-box p-3 sm:p-4">
    <h2 class="text-lg font-semibold mb-3">Najbitnije vijesti</h2>

    <div v-if="loading && news.length === 0" class="flex justify-center py-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Desktop: Carousel with arrows, Mobile: Native horizontal scroll -->
    <div v-else-if="news.length > 0" class="relative group">
      <!-- idi lijevo -->
      <button
          v-if="news.length > 1"
          @click="goToPrevious" aria-label="Prethodna vijest"
          class="hidden sm:flex absolute left-0 top-1/2 transform -translate-y-1/2 z-10 btn btn-circle btn-sm btn-neutral shadow-xl hover:scale-105 transition-transform"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <!-- idi desno -->
      <button
          v-if="news.length > 1"
          @click="goToNext" aria-label="Sljedeća vijest"
          class="hidden sm:flex absolute right-0 top-1/2 transform -translate-y-1/2 z-10 btn btn-circle btn-sm btn-neutral shadow-xl hover:scale-105 transition-transform"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>

      <!-- Sadržaj -->
      <div
          class="carousel sm:grid w-full overflow-x-auto sm:overflow-x-hidden snap-x sm:snap-none touch-pan-x gap-4 sm:gap-0 pb-2 sm:pb-0"
          @scroll.passive="onMobileScroll" ref="scrollContainer"
          style="overscroll-behavior-x: contain;"
      >
        <template v-for="(item, index) in news" :key="item.guid || `${item.feedId}:${item.link}`">
          <div
              class="carousel-item block! shrink-0 w-[85%] sm:w-full sm:col-start-1 sm:row-start-1 snap-center cursor-pointer hover:bg-base-300 rounded-box p-3 sm:py-4 sm:px-12 mx-0"
              :class="[!isMobile && index !== currentIndex ? 'opacity-0 pointer-events-none' : 'opacity-100', themeStore.timelineAnimations ? 'motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out' : 'transition-none']"
              :inert="!isMobile && index !== currentIndex" :aria-hidden="!isMobile && index !== currentIndex"
              role="button" tabindex="0" @keydown.enter="openNewsDetail(item)" @keydown.space.prevent="openNewsDetail(item)"
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
                <h3 class="font-bold text-base sm:text-lg mb-1 line-clamp-2 leading-tight" :title="item.title">
                  {{ item.title }}</h3>
                <p class="text-sm opacity-70 mb-2 line-clamp-2 hidden sm:block" :title="stripHtml(item.description)">
                  {{ stripHtml(item.description) }}</p>

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
        <button type="button" :aria-label="`Prikaži vijest ${index + 1}`" :aria-pressed="index === currentIndex"
            v-for="(item, index) in news"
            :key="item.guid || `${item.feedId}:${item.link}`"
            :class="['w-2 h-2 rounded-full transition-all duration-300 cursor-pointer', index === currentIndex ? 'bg-primary' : 'bg-base-content opacity-30']"
            @click="goToSlide(index)"
        ></button>
      </div>
    </div>

    <div v-else-if="error" class="text-center text-error py-8">
      <div class="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>{{ error }}</span>
      </div>
      <div class="flex gap-2 justify-center mt-4">
        <button @click="fetchNews" class="btn btn-sm btn-primary">Pokušaj ponovno</button>
        <button @click="loadMockNews" class="btn btn-sm btn-secondary">Prikaži demo vijesti</button>
      </div>
    </div>

    <div v-else class="text-center py-8 opacity-70">
      <div class="flex flex-col items-center gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 opacity-50" fill="none" viewBox="0 0 24 24"
             stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
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
import {ref, onMounted, onUnmounted, computed, watch} from 'vue';
import { plainText } from '../Services/articleHtml.js';
import {useNewsGlobal} from '../Services/NewsGlobal.js';
import NewsModal from './NewsModal.vue';
import { useThemeStore } from '../stores/theme';

export default {
  components: {NewsModal},
  setup() {
    const themeStore = useThemeStore();
    const newsService = useNewsGlobal(() => 'all');

    const news = ref([]);
    const currentIndex = ref(0);
    const currentNews = ref(null);
    const intervalId = ref(null);
    const scrollContainer = ref(null);
    const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth < 640 : false);
    const selectedNews = ref(null);
    const isNewsModalOpen = ref(false);

    const loading = computed(() => newsService.isLoading.value);
    const error = computed(() => newsService.error.value);
    const loadingProgress = computed(() => newsService.loadingProgress.value || 0);
    const isBackgroundLoading = computed(() => loading.value && news.value.length > 0 && loadingProgress.value < 100);

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
        const result = await newsService.fetchNews('all');
        if (result.items.length) applyNews(result.items);
      } catch {}
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
      selectedNews.value = null;
    };

    const stripHtml = plainText;

    const formatDate = (dateString) => {
      if (!dateString) return '';
      try {
        return new Date(dateString).toLocaleDateString('hr-HR', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return '';
      }
    };

    const goToSlide = (index) => {
      currentIndex.value = index;
      currentNews.value = news.value[index];
      startCarousel();
      if (isMobile.value && scrollContainer.value) {
        const container = scrollContainer.value;
        const item = container.children[index];
        if (!item) return;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const left = item.offsetLeft - container.children[0].offsetLeft;
        container.scrollTo({ left, behavior: themeStore.timelineAnimations && !reducedMotion ? 'smooth' : 'instant' });
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
      let newIndex = 0;
      let nearestDistance = Infinity;
      const firstOffset = container.children[0]?.offsetLeft || 0;
      for (let index = 0; index < container.children.length; index++) {
        const distance = Math.abs(container.children[index].offsetLeft - firstOffset - container.scrollLeft);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          newIndex = index;
        }
      }
      if (newIndex !== currentIndex.value && newIndex >= 0 && newIndex < news.value.length) {
        currentIndex.value = newIndex;
        currentNews.value = news.value[newIndex];
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
          if (latestNews.length) applyNews(latestNews);
          else {
            news.value = [];
            currentNews.value = null;
            currentIndex.value = 0;
            if (intervalId.value) clearInterval(intervalId.value);
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
      themeStore,
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
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

</style>


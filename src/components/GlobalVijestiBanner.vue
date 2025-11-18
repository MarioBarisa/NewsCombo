<template>
    <div class="news-carousel bg-base-200 rounded-lg p-6">
      <h2 class="text-2xl font-bold mb-4">Najbitnije vijesti</h2>
      
      <div v-if="loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
      
      <div v-else-if="currentNews" class="relative">
        <!-- idi lijevo -->
        <button 
          v-if="news.length > 1"
          @click="goToPrevious"
          class="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 btn btn-circle btn-sm btn-ghost hover:btn-primary transition-all duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
  
        <!-- idi desno -->
        <button 
          v-if="news.length > 1"
          @click="goToNext"
          class="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 btn btn-circle btn-sm btn-ghost hover:btn-primary transition-all duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
  
        <div 
          @click="openNewsDetail(currentNews)"
          class="cursor-pointer hover:bg-base-300 rounded-lg p-4 transition-all duration-300 mx-8"
        >
          <div class="flex gap-4">
            <div v-if="currentNews.enclosure?.link || currentNews.thumbnail" class="shrink-0">
              <img 
                :src="currentNews.enclosure?.link || currentNews.thumbnail" 
                :alt="currentNews.title"
                class="w-24 h-24 object-cover rounded-lg"
                @error="onImageError"
              />
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-lg mb-2 line-clamp-2">{{ currentNews.title }}</h3>
              <p class="text-sm opacity-70 mb-2 line-clamp-3">{{ stripHtml(currentNews.description) }}</p>
              <div class="flex justify-between items-center text-xs opacity-60">
                <span class="badge badge-sm badge-outline">{{ currentNews.source }}</span>
                <span>{{ formatDate(currentNews.pubDate) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- indikacijski krugovi za galeriju -->
        <div class="flex justify-center mt-4 gap-2" v-if="news.length > 1">
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
    </div>
  </template>
  
  <script>
  import { ref, onMounted, onUnmounted, computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { useNewsGlobal } from '../Services/NewsGlobal.js';
  
  export default {
    setup() {
      const router = useRouter();
      const newsService = useNewsGlobal();
      
      const news = ref([]);
      const currentIndex = ref(0);
      const currentNews = ref(null);
      const intervalId = ref(null);
      const retryCount = ref(0);
      const maxRetries = 3;
      
      const loading = computed(() => newsService.isLoading.value);
      const error = computed(() => newsService.error.value);
  
      const fetchNews = async () => {
        try {
          retryCount.value++;
          const fetchedNews = await newsService.fetchNews();
          
          if (fetchedNews && fetchedNews.length > 0) {
            news.value = fetchedNews;
            currentIndex.value = 0;
            currentNews.value = fetchedNews[0];
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
        
        if (news.value.length > 1) {
          intervalId.value = setInterval(() => {
            currentIndex.value = (currentIndex.value + 1) % news.value.length;
            currentNews.value = news.value[currentIndex.value];
          }, 5000);
        }
      };
  
      const openNewsDetail = (newsItem) => {
        if (newsItem.link && newsItem.link !== '#') {
          window.open(newsItem.link, '_blank', 'noopener,noreferrer');
        } else {
          localStorage.setItem('selectedNews', JSON.stringify(newsItem));
          router.push('/news/' + encodeURIComponent(newsItem.title.substring(0, 50)));
        }
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
  
      onMounted(() => {
        fetchNews();
      });
  
      onUnmounted(() => {
        if (intervalId.value) {
          clearInterval(intervalId.value);
        }
      });
  
      return {
        loading,
        error,
        currentNews,
        currentIndex,
        news,
        openNewsDetail,
        stripHtml,
        formatDate,
        goToSlide,
        goToNext,
        goToPrevious,
        onImageError,
        fetchNews,
        loadMockNews
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
  
  .line-clamp-3 {
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  </style>
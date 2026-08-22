<script setup>
import {ref, onMounted, onUnmounted, computed} from 'vue';
import {useFeedsStore} from '../stores/feedStore';

const feedsStore = useFeedsStore();
const isSearchVisible = ref(false);
const isMobile = ref(false);
let mouseLeaveTimer = null;

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

const handleClick = () => {
  if (isMobile.value) {
    isSearchVisible.value = !isSearchVisible.value;
  }
};

const handleMouseEnter = () => {
  if (!isMobile.value) {
    if (mouseLeaveTimer) clearTimeout(mouseLeaveTimer);
    isSearchVisible.value = true;
  }
};

const handleMouseLeave = () => {
  if (!isMobile.value) {
    mouseLeaveTimer = setTimeout(() => {
      isSearchVisible.value = false;
    }, 200);
  }
};

const keepSearchOpen = () => {
  if (mouseLeaveTimer) clearTimeout(mouseLeaveTimer);
};

const customCategories = computed(() => {
  return feedsStore.categories.slice(1);
});

const selectCategory = (categoryId) => {
  feedsStore.selectCategory(categoryId);
  console.log(' Odabrana kategorija:', categoryId);
  if (isMobile.value) {
    isSearchVisible.value = false;
  }
};

onMounted(async () => {
  checkMobile();
  if (feedsStore.categories.length <= 1) {
    await feedsStore.initializeStore();
  }
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
  if (mouseLeaveTimer) clearTimeout(mouseLeaveTimer);
});
</script>

<template>
  <div class="navbar-center w-full items-center justify-center">
    <div class="hidden md:flex items-center gap-1 flex-wrap justify-center">
      <!-- NewsCombo personalizirani feed (logo) -->
      <button
          @click="selectCategory('combo')"
          :class="feedsStore.selectedCategoryId === 'combo' ? 'btn-primary' : 'btn-ghost'"
          class="btn btn-sm"
          title="NewsCombo — vijesti odabrane posebno za tebe, kronološki"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f7441f" stroke-width="2" class="h-4 w-4">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <span class="text-xs sm:text-sm">NewsCombo</span>
      </button>

      <!-- AI sažetak -->
      <button
          @click="selectCategory('ai-summary')"
          :class="feedsStore.selectedCategoryId === 'ai-summary' ? 'btn-primary' : 'btn-ghost'"
          class="btn btn-sm"
          title="AI personalizirani sažetak vijesti"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3.5 w-3.5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
        </svg>
        <span class="text-xs sm:text-sm">AI Sažetak</span>
      </button>

      <!-- SVI FEEDOVI -->
      <button
          @click="selectCategory('all')"
          :class="feedsStore.selectedCategoryId === 'all' ? 'btn-primary' : 'btn-ghost'"
          class="btn btn-sm"
          title="Sve vijesti iz svih feedova u kronološkom redoslijedu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        <span class="text-xs sm:text-sm">Svi feedovi</span>
      </button>

      <!-- CUSTOM KATEGORIJE -->
      <button
          v-for="category in customCategories"
          :key="category.id"
          @click="selectCategory(category.id)"
          :class="feedsStore.selectedCategoryId === category.id ? 'btn-primary' : 'btn-ghost'"
          class="btn btn-sm"
          :title="`${category.feeds.length} feedova u ovoj kategoriji`"
      >
        <span class="text-xs sm:text-sm">{{ category.name }}</span>
      </button>
    </div>

    <!-- mobilni -->
    <div
        class="md:hidden w-full overflow-x-auto scrollbar-hide touch-pan-x"
        style="overscroll-behavior-x: contain;"
    >
      <div class="flex items-center gap-2 px-3 py-2 min-w-max">
        <!-- NewsCombo personalizirani feed (logo) -->
        <button
            @click="selectCategory('combo')"
            :class="feedsStore.selectedCategoryId === 'combo' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'"
            class="btn btn-sm whitespace-nowrap flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f7441f" stroke-width="2" class="h-4 w-4">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          NewsCombo
        </button>

        <!-- AI sažetak -->
        <button
            @click="selectCategory('ai-summary')"
            :class="feedsStore.selectedCategoryId === 'ai-summary' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'"
            class="btn btn-sm whitespace-nowrap flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3.5 w-3.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
          </svg>
          AI Sažetak
        </button>

        <!-- SVI FEEDOVI -->
        <button
            @click="selectCategory('all')"
            :class="feedsStore.selectedCategoryId === 'all' ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'"
            class="btn btn-sm whitespace-nowrap flex-shrink-0"
        >
          Svi feedovi
        </button>

        <!-- CUSTOM KATEGORIJE -->
        <button
            v-for="category in customCategories"
            :key="category.id"
            @click="selectCategory(category.id)"
            :class="feedsStore.selectedCategoryId === category.id ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'"
            class="btn btn-sm whitespace-nowrap flex-shrink-0"
        >
          {{ category.name }}
          <span class="badge badge-xs ml-1">{{ category.feeds.length }}</span>
        </button>
      </div>
    </div>

    <!-- INFO badge (samo desktop) -->
    <div v-if="!['all', 'ai-summary', 'combo'].includes(feedsStore.selectedCategory.id)"
         class="ml-4 hidden sm:flex items-center gap-2 text-sm opacity-75">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>{{ feedsStore.selectedFeeds.length }} feedova</span>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>


<script setup>
  import { ref, onMounted, onUnmounted, computed } from 'vue';
  import { useFeedsStore } from '../stores/feedStore';
  
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
  
  // custom kategorije (bez Svi feedovi)
  const customCategories = computed(() => {
    return feedsStore.categories.slice(1);
  });
  
  const selectCategory = (categoryId) => {
    feedsStore.selectCategory(categoryId);
    console.log('✅ Odabrana kategorija:', categoryId);
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
    <div 
      class="navbar-center w-full items-center justify-center"
      @mouseleave="handleMouseLeave"
    >
      <!-- DESKTOP MENI -->
      <div class="hidden md:flex items-center gap-1 flex-wrap justify-center">
        <button
          @click="selectCategory('all')"
          :class="feedsStore.selectedCategoryId === 'all' ? 'btn-primary' : 'btn-ghost'"
          class="btn btn-sm"
          title="Sve vijesti iz svih feedova u kronološkom redoslijedu"
        >
          <span class="text-xs sm:text-sm">📰 Svi feedovi</span>
        </button>
  
        <!-- custom kategorije -->
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
  
      <!-- mobile -->
      <div class="md:hidden dropdown dropdown-bottom dropdown-end">
        <button 
          tabindex="0" 
          class="btn btn-ghost btn-sm"
          @click="handleClick"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
          <span class="ml-2">Kategorije</span>
        </button>
        <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 max-h-96 overflow-y-auto">
          <!-- svi feedovi -->
          <li>
            <a
              @click="selectCategory('all')"
              :class="feedsStore.selectedCategoryId === 'all' ? 'active' : ''"
            >
              📰 Svi feedovi
            </a>
          </li>
  
          <!-- custom kategorije -->
          <li v-for="category in customCategories" :key="category.id">
            <a
              @click="selectCategory(category.id)"
              :class="feedsStore.selectedCategoryId === category.id ? 'active' : ''"
            >
              {{ category.name }}
              <span class="badge badge-sm">{{ category.feeds.length }}</span>
            </a>
          </li>
        </ul>
      </div>
  
      <!-- info -->
      <div v-if="feedsStore.selectedCategory.id !== 'all'" class="ml-4 hidden sm:flex items-center gap-2 text-sm opacity-75">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ feedsStore.selectedFeeds.length }} feedova</span>
      </div>
    </div>
  </template>
  
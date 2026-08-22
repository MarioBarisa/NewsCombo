<script setup>
import { computed, ref, onMounted } from 'vue';
import { useFeedsStore } from '../stores/feedStore';
import { useNewsGlobal } from '../Services/NewsGlobal.js';
import GlobalVijestiBanner from '../components/GlobalVijestiBanner.vue';
import FeedSelect from '../components/FeedSelect.vue';
import NewsTimeline from '../components/NewsTimeline.vue';
import AISummaryView from '../views/AISummaryView.vue';

const feedsStore = useFeedsStore();
const newsService = useNewsGlobal();
const showSetupModal = ref(false);
const isSettingUp = ref(false);
const isPulling = ref(false);
const startY = ref(0);
const pullDistance = ref(0);

const isHorizontalScrollTarget = (el) => {
  return el?.closest('.overflow-x-auto, .touch-pan-x, [style*="overflow-x: auto"]');
};

const handleTouchStart = (e) => {
  if (isHorizontalScrollTarget(e.target)) return;
  if (window.scrollY === 0) {
    startY.value = e.touches[0].clientY;
  }
};

const handleTouchMove = (e) => {
  if (isHorizontalScrollTarget(e.target)) return;
  if (startY.value > 0) {
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.value;
    if (distance > 0 && window.scrollY === 0) {
      if (distance > 100) pullDistance.value = 100;
      else pullDistance.value = distance;
      isPulling.value = true;
    }
  }
};

const handleTouchEnd = async () => {
  if (isPulling.value && pullDistance.value > 60) {
    const categoryId = feedsStore.selectedCategoryId;
    // combo dohvaća sve feedove
    const serviceCatId = categoryId === 'combo' ? 'all' : categoryId;
    await newsService.refreshNews(serviceCatId);
  }
  isPulling.value = false;
  pullDistance.value = 0;
  startY.value = 0;
};


const isBackgroundLoading = computed(() => {
  return newsService.isLoading.value && newsService.cachedNews.value.length > 0 && (newsService.loadingProgress.value || 0) < 100;
});
const loadingProgress = computed(() => newsService.loadingProgress.value || 0);

const isAISummarySelected = computed(() => {
  return feedsStore.selectedCategoryId === 'ai-summary';
});


//inicjallizacija novih korisnika
onMounted(async () => {
  await feedsStore.ensureReady();
  // setup modal samo ako feedovi stvarno ne postoje
  if (!feedsStore.isLoading && feedsStore.needsInitialSetup) {
    showSetupModal.value = true;
  }
});

async function handleSetupDefaults() {
  isSettingUp.value = true;
  const success = await feedsStore.setupInitialData();
  isSettingUp.value = false;
  if (success) {
    showSetupModal.value = false;
  }
}

function handleSkipSetup() {
  showSetupModal.value = false;
}

</script>

<template>
  <main @touchstart.passive="handleTouchStart" @touchmove.passive="handleTouchMove" @touchend.passive="handleTouchEnd" class="transition-transform duration-200" :style="isPulling ? `transform: translateY(${pullDistance * 0.4}px)` : ''">
    <!-- pull-to-refresh -->
    <div v-if="pullDistance > 0 && !isBackgroundLoading" class="absolute top-0 left-0 w-full flex justify-center items-center pointer-events-none z-50 h-8" style="transform: translateY(-100%);">
      <div class="badge badge-primary gap-2" :class="{'opacity-50': pullDistance < 60, 'opacity-100 font-bold': pullDistance >= 60}">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        Pusti za osvježavanje
      </div>
    </div>

    <div v-if="isBackgroundLoading" class="fixed top-0 left-0 w-full z-50 h-0.5 bg-primary/20">
      <div class="h-full bg-primary transition-all duration-500" :style="{width: loadingProgress + '%'}"></div>
    </div>
    <dialog :class="['modal', { 'modal-open': showSetupModal }]">
      <div class="modal-box">
        <div class="text-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-primary opacity-70"
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0
                     01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
          </svg>
        </div>
        <h3 class="font-bold text-xl mb-4">Dobrodošao / dobrodošla u NewsCombo!</h3>
        <p class="mb-4">Nemaš još niti jedan RSS feed konfiguriran.</p>
        <p class="text-base-content/70 mb-6">
          Želiš li da automatski postavimo početne feedove i grupe s popularnim izvorima vijesti?
        </p>

        <div class="bg-base-200 rounded-lg p-4 mb-6">
          <p class="font-semibold mb-2">Uključuje:</p>
          <ul class="text-sm space-y-1 text-base-content/80">
            <li class="flex items-center gap-2"><span class="text-success">✓</span> Hrvatske vijesti (Index.hr, Večernji, 24sata)</li>
            <li class="flex items-center gap-2"><span class="text-success">✓</span> Svjetske vijesti (BBC, Al Jazeera)</li>
            <li class="flex items-center gap-2"><span class="text-success">✓</span> Tech vijesti (TechCrunch, Ars Technica, Hacker News)</li>
            <li class="flex items-center gap-2"><span class="text-success">✓</span> Unaprijed definirane grupe</li>
          </ul>
        </div>

        <div class="modal-action">
          <button @click="handleSkipSetup" class="btn btn-ghost" :disabled="isSettingUp">
            Preskoči
          </button>
          <button @click="handleSetupDefaults" class="btn btn-primary" :disabled="isSettingUp">
            <span v-if="isSettingUp" class="loading loading-spinner loading-sm"></span>
            {{ isSettingUp ? 'Postavljam...' : 'Postavi feedove' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="handleSkipSetup">close</button>
      </form>
    </dialog>
    <section class="px-1 sm:px-4 pt-4 pb-2">
      <GlobalVijestiBanner></GlobalVijestiBanner>
    </section>
    <div class="divider my-0 opacity-30"></div>
    <section class="px-1 sm:px-4 pb-4">
      <FeedSelect></FeedSelect>
      <AISummaryView v-if="isAISummarySelected"></AISummaryView>
      <NewsTimeline v-else></NewsTimeline>
    </section>
  </main>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useFeedsStore } from '../stores/feedStore';
import GlobalVijestiBanner from '../components/GlobalVijestiBanner.vue';
import FeedSelect from '../components/FeedSelect.vue';
import NewsTimeline from '../components/NewsTimeline.vue';
import AISummaryView from '../views/AISummaryView.vue';

const feedsStore = useFeedsStore();
const showSetupModal = ref(false);
const isSettingUp = ref(false);

const isAISummarySelected = computed(() => {
  return feedsStore.selectedCategoryId === 'ai-summary';
});


//inicjallizacija novih korisnika
onMounted(async () => {
  await feedsStore.initializeStore();
  if (feedsStore.needsInitialSetup) {
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
  <main>
    <dialog :class="['modal', { 'modal-open': showSetupModal }]">
      <div class="modal-box">
        <h3 class="font-bold text-xl mb-4">Dobrodošao / dobrodošla u NewsCombo!</h3>
        <p class="mb-4">Nemaš još niti jedan RSS feed konfiguriran.</p>
        <p class="text-base-content/70 mb-6">
          Želiš li da automatski postavimo početne feedove i grupe s popularnim izvorima vijesti?
        </p>
        
        <div class="bg-base-200 rounded-lg p-4 mb-6">
          <p class="font-semibold mb-2">Uključuje:</p>
          <ul class="text-sm space-y-1 text-base-content/80">
            <li>- Hrvatske vijesti (Index.hr, Večernji, 24sata)</li>
            <li>- Svjetske vijesti (BBC, Al Jazeera)</li>
            <li>- Tech vijesti (TechCrunch, Ars Technica, Hacker News)</li>
            <li>- Unaprijed definirane grupe</li>
          </ul>
        </div>

        <div class="modal-action">
          <button @click="handleSkipSetup" class="btn btn-ghost" :disabled="isSettingUp">
            Preskoči
          </button>
          <button @click="handleSetupDefaults" class="btn btn-primary" :disabled="isSettingUp">
            <span v-if="isSettingUp" class="loading loading-spinner loading-sm"></span>
            👍 {{ isSettingUp ? 'Postavljam...' : 'Postavi feedove' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="handleSkipSetup">close</button>
      </form>
    </dialog>
    <GlobalVijestiBanner></GlobalVijestiBanner>
    <div class="p-4">
      <FeedSelect></FeedSelect>
      <AISummaryView v-if="isAISummarySelected"></AISummaryView>
      <NewsTimeline v-else></NewsTimeline>
    </div>
  </main>
</template>

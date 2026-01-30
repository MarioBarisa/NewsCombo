<script setup>
import { computed } from 'vue';
import { useFeedsStore } from '../stores/feedStore';
import GlobalVijestiBanner from '../components/GlobalVijestiBanner.vue';
import FeedSelect from '../components/FeedSelect.vue';
import NewsTimeline from '../components/NewsTimeline.vue';
import AISummaryView from '../views/AISummaryView.vue';

const feedsStore = useFeedsStore();

const isAISummarySelected = computed(() => {
  return feedsStore.selectedCategoryId === 'ai-summary';
});


</script>

<template>
  <main>
    <GlobalVijestiBanner></GlobalVijestiBanner>
    <div class="p-4">
      <FeedSelect></FeedSelect>
      <AISummaryView v-if="isAISummarySelected"></AISummaryView>
      <NewsTimeline v-else></NewsTimeline>
    </div>
  </main>
</template>

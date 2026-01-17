<script setup>
import GlobalVijestiBanner from '../components/GlobalVijestiBanner.vue';
import FeedSelect from '../components/FeedSelect.vue';
import NewsTimeline from '../components/NewsTimeline.vue';

</script>

<template>
  <main>
    <GlobalVijestiBanner></GlobalVijestiBanner>
    <div class="p-4">
      <FeedSelect></FeedSelect>
      <NewsTimeline></NewsTimeline>
    </div>
  </main>
</template>

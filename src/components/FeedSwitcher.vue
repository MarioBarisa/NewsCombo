<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useFeedsStore } from '../stores/feedStore';

const feedsStore = useFeedsStore();

// Aktivni feed ID 
const activeFeedId = ref(null);

// Svi feedovi u trenutno odabranoj kategoriji
const categoryFeeds = computed(() => {
  return feedsStore.selectedFeeds;
});

// Aktivni feed objekt
const activeFeed = computed(() => {
  if (!activeFeedId.value) return null;
  return categoryFeeds.value.find(f => f.id === activeFeedId.value);
});

// Broj vijesti po feedu (može se koristiti kasnije -> vjv cu dodati mogucnost statistke da korisnik vidi koliko čita)
const feedCounts = ref({});

// Odaberi feed
const selectFeed = (feedId) => {
  activeFeedId.value = feedId;
  emit('feed-changed', feedId);
};

// Odaberi sve feedove
const selectAllFeeds = () => {
  activeFeedId.value = null;
  emit('feed-changed', null);
};

// Reset kad se promijeni kategorija
watch(() => feedsStore.selectedCategoryId, () => {
  activeFeedId.value = null;
});

const emit = defineEmits(['feed-changed']);

onMounted(() => {
  feedsStore.loadFromLocalStorage();
});
</script>

<template>
  <div v-if="categoryFeeds.length > 0" class="feed-switcher">
    <!-- Desktop verzija -->
    <div class="hidden md:flex items-center gap-2 flex-wrap justify-center mb-4">
      <button
        @click="selectAllFeeds"
        :class="activeFeedId === null ? 'btn-primary' : 'btn-ghost'"
        class="btn btn-xs"
        title="Prikaži sve feedove iz kategorije"
      >
        <span class="text-xs">📰 Svi ({{ categoryFeeds.length }})</span>
      </button>

      <div class="divider divider-horizontal mx-0"></div>

      <button
        v-for="feed in categoryFeeds"
        :key="feed.id"
        @click="selectFeed(feed.id)"
        :class="activeFeedId === feed.id ? 'btn-secondary' : 'btn-ghost'"
        class="btn btn-xs"
        :title="`Prikaži samo vijesti iz ${feed.name}`"
      >
        <span class="text-xs">{{ feed.name }}</span>
        <span v-if="feed.isCustom" class="badge badge-xs">custom</span>
      </button>
    </div>

    <!-- Mobile verzija -->
    <div class="md:hidden mb-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text">Odaberi feed izvor:</span>
        </label>
        <select 
          v-model="activeFeedId" 
          @change="emit('feed-changed', activeFeedId)"
          class="select select-bordered select-sm w-full"
        >
          <option :value="null">📰 Svi feedovi ({{ categoryFeeds.length }})</option>
          <option 
            v-for="feed in categoryFeeds" 
            :key="feed.id"
            :value="feed.id"
          >
            {{ feed.name }}{{ feed.isCustom ? ' (custom)' : '' }}
          </option>
        </select>
      </div>
    </div>

    <!-- Info o aktivnom feedu -->
    <div v-if="activeFeed" class="alert alert-info shadow-sm mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <div>
        <div class="font-semibold">{{ activeFeed.name }}</div>
        <div class="text-xs opacity-75">{{ activeFeed.domain }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feed-switcher {
  padding: 0.5rem;
  background: var(--fallback-b2, oklch(var(--b2) / 1));
  border-radius: 0.5rem;
}

.divider-horizontal {
  width: 1px;
  height: 1.5rem;
}
</style>

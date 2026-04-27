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

const getFeedDomain = (feed) => {
  const rawDomain = feed?.domain || feed?.url || '';
  if (!rawDomain) return '';
  try {
    const url = rawDomain.includes('://') ? rawDomain : `https://${rawDomain}`;
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
};

const getFaviconUrl = (feed) => {
  const domain = getFeedDomain(feed);
  return domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` : '';
};

const onFaviconError = (event) => {
  event.target.style.display = 'none';
};

onMounted(() => {
  feedsStore.loadFromLocalStorage();
});
</script>

<template>
  <div v-if="categoryFeeds.length > 0" class="feed-switcher">
    <!-- Desktop verzija -->
    <div class="hidden md:block mb-4">
      <button
        @click="selectAllFeeds"
        :class="activeFeedId === null ? 'btn-primary' : 'btn-ghost'"
        class="btn btn-xs mb-3"
        title="Prikaži sve feedove iz kategorije"
      > 
        <span class="text-xs">📰 Svi ({{ categoryFeeds.length }})</span>
      </button>

      <div class="desktop-source-grid">
        <button
          v-for="feed in categoryFeeds"
          :key="feed.id"
          @click="selectFeed(feed.id)"
          :class="activeFeedId === feed.id ? 'btn-secondary' : 'btn-ghost'"
          class="btn btn-sm justify-start normal-case h-auto min-h-0 py-2 px-3"
          :title="`Prikaži samo vijesti iz ${feed.name}`"
        >
          <img
            v-if="getFaviconUrl(feed)"
            :src="getFaviconUrl(feed)"
            :alt="`${feed.name} favicon`"
            class="w-4 h-4 rounded-sm flex-shrink-0"
            loading="lazy"
            @error="onFaviconError"
          >
          <span class="text-left leading-tight flex-1 min-w-0">
            <span class="block text-xs font-medium truncate">{{ feed.name }}</span>
            <span class="block text-[10px] opacity-60 truncate">{{ getFeedDomain(feed) }}</span>
          </span>
          <span v-if="feed.isCustom" class="badge badge-xs ml-1">custom</span>
        </button>
      </div>
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

.desktop-source-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.5rem;
  max-height: 14rem;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.divider-horizontal {
  width: 1px;
  height: 1.5rem;
}

@media (max-width: 375px) {
  .feed-switcher {
    padding: 0.25rem; 
  }
  .alert {
    padding: 0.5rem; 
    font-size: 0.875rem; 
  }
}
</style>

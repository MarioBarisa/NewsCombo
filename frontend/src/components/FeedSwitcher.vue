<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useFeedsStore } from '../stores/feedStore';

const feedsStore = useFeedsStore();

const activeFeedId = ref(null);

// feedovi trenutne kategorije
const categoryFeeds = computed(() => {
  return feedsStore.selectedFeeds;
});

const activeFeed = computed(() => {
  if (!activeFeedId.value) return null;
  return categoryFeeds.value.find(f => f.id === activeFeedId.value);
});

// broj vijesti po feedu (za buduće statistike)
const feedCounts = ref({});

const selectFeed = (feedId) => {
activeFeedId.value = activeFeedId.value === feedId ? null : feedId;
emit('feed-changed', activeFeedId.value);
};

const selectAllFeeds = () => {
  activeFeedId.value = null;
  emit('feed-changed', null);
};

// reset pri promjeni kategorije
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
  // DDG ip3 rijetko vraća 404 (za razliku od google s2/favicons redirecta)
  return domain ? `https://icons.duckduckgo.com/ip3/${domain}.ico` : '';
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
        </button>
      </div>
    </div>

    <!-- Mobile verzija -->
    <div class="md:hidden mb-4">
      <div class="form-control">
        <select
          v-model="activeFeedId"
          @change="emit('feed-changed', activeFeedId)"
          class="select select-bordered select-sm w-full font-semibold"
        >
          <option :value="null">Svi izvori ({{ categoryFeeds.length }})</option>
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

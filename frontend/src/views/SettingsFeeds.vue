<script setup>
import { ref, onMounted, computed } from 'vue';
import { useFeedsStore } from '../stores/feedStore';

const feedsStore = useFeedsStore();

const newCategoryName = ref('');
const selectedFeedsForNew = ref([]);
const editingCategoryId = ref(null);
const editingCategoryName = ref('');
const editingCategoryFeeds = ref([]);
const showAddForm = ref(false);

//provjera RSS linka
const isCheckingRss = ref(false);
const rssCheckStatus = ref(null);
const rssCheckMessage = ref('');


// prilgođen rss feed
const showCustomFeedForm = ref(false);
const customFeedName = ref('');
const customFeedUrl = ref('');
const customFeedCategory = ref('custom');

const allFeedsByDomain = computed(() => feedsStore.feedsByCategory);

onMounted(async () => {
  if (feedsStore.categories.length <= 1) {
    await feedsStore.initializeStore();
  }
});

const toggleFeedSelection = (feedId, isEditing = false) => {
  const targetArray = isEditing ? editingCategoryFeeds : selectedFeedsForNew;
  const index = targetArray.indexOf(feedId);
  if (index > -1) {
    targetArray.splice(index, 1);
  } else {
    targetArray.push(feedId);
  }
};

const startAddingCategory = () => {
  showAddForm.value = true;
  newCategoryName.value = '';
  selectedFeedsForNew.value = [];
};

const cancelAddingCategory = () => {
  showAddForm.value = false;
  newCategoryName.value = '';
  selectedFeedsForNew.value = [];
};

const confirmAddCategory = () => {
  if (newCategoryName.value.trim()) {
    feedsStore.addCategory(newCategoryName.value, selectedFeedsForNew.value); // može biti []
    cancelAddingCategory();
  }
};


const startEditingCategory = (category) => {
  if (category.isDefault) return;
  editingCategoryId.value = category.id;
  editingCategoryName.value = category.name;
  editingCategoryFeeds.value = category.feeds.map(f => f.id);
};

const cancelEditingCategory = () => {
  editingCategoryId.value = null;
  editingCategoryName.value = '';
  editingCategoryFeeds.value = [];
};

const confirmEditCategory = () => {
  if (editingCategoryId.value && editingCategoryName.value.trim() && editingCategoryFeeds.value.length > 0) {
    feedsStore.updateCategory(editingCategoryId.value, editingCategoryName.value, editingCategoryFeeds.value);
    cancelEditingCategory();
  }
};

const confirmDeleteCategory = (categoryId) => {
  if (confirm('Jeste li sigurni da želite obrisati ovu kategoriju?')) {
    feedsStore.deleteCategory(categoryId);
  }
};

// custom feed funkcije
const startAddingCustomFeed = () => {
  showCustomFeedForm.value = true;
  customFeedName.value = '';
  customFeedUrl.value = '';
  customFeedCategory.value = 'custom';
};

const cancelAddingCustomFeed = () => {
  showCustomFeedForm.value = false;
  customFeedName.value = '';
  customFeedUrl.value = '';
  customFeedCategory.value = 'custom';
};


//provjera ako je feed koji zapravo dela
const checkRssValidity = async () => {
  if (!customFeedUrl.value.trim()) {
    return;
  }

  isCheckingRss.value = true;
  rssCheckStatus.value = null;
  rssCheckMessage.value = '';
  const token = localStorage.getItem('token');
  try {
    // provjera URL formata ( nije toliko bitno )
    new URL(customFeedUrl.value);

    // poziv na backend za provjeru RSS-a
    const response = await fetch(`http://localhost:3005/rss/validate?url=${encodeURIComponent(customFeedUrl.value)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    if (response.ok && data.valid) {
      rssCheckStatus.value = 'valid';
      rssCheckMessage.value = `✓ RSS feed je validan! Pronađeno: ${data.itemCount || 0} vijesti`;
    } else {
      rssCheckStatus.value = 'invalid';
      rssCheckMessage.value = '✗ Link nije validan RSS feed';
    }
  } catch (error) {
    rssCheckStatus.value = 'invalid';
    rssCheckMessage.value = '✗ Neisprav URL ili RSS feed nije dostupan';
  } finally {
    isCheckingRss.value = false;
  }
};

// novi url -> reset varijabli
const onUrlChange = () => {
  rssCheckStatus.value = null;
  rssCheckMessage.value = '';
};



const confirmAddCustomFeed = async () => {
  if (customFeedName.value.trim() && customFeedUrl.value.trim()) {
    try {
      // validacija URL-a
      new URL(customFeedUrl.value);
      await feedsStore.addCustomFeed(customFeedName.value, customFeedUrl.value, customFeedCategory.value);
      cancelAddingCustomFeed();
    } catch (error) {
      alert('Molimo unesite ispravan URL (npr. https://example.com/feed)');
    }
  }
};



const confirmDeleteCustomFeed = (feedId) => {
  if (confirm('Jeste li sigurni da želite obrisati ovaj custom feed?')) {
    feedsStore.removeCustomFeed(feedId);
  }
};



import AISpotlightSettings from '../components/AISpotlightSettings.vue';


</script>

<template>
  <div class="min-h-screen bg-base-200 py-8 px-4">
    <div class="max-w-4xl mx-auto space-y-6">
      
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold">Postavke Feedova</h1>
        <p class="text-base-content/60 mt-2">Upravljaj RSS izvorima i kategorijama vijesti</p>
      </div>

      <!-- Statistika -->
      <div class="stats stats-vertical sm:stats-horizontal shadow w-full bg-base-100">
        <div class="stat">
          <div class="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </div>
          <div class="stat-title">Ukupno feedova</div>
          <div class="stat-value text-primary">{{ feedsStore.availableFeeds.length }}</div>
        </div>
        <div class="stat">
          <div class="stat-figure text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div class="stat-title">Kategorija</div>
          <div class="stat-value text-secondary">{{ feedsStore.categories.length }}</div>
        </div>
        <div class="stat">
          <div class="stat-figure text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div class="stat-title">Custom feedova</div>
          <div class="stat-value text-accent">{{ feedsStore.customFeeds.length }}</div>
        </div>
      </div>

      <!-- Custom RSS Feedovi -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex justify-between items-center mb-4">
            <h3 class="card-title flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Custom RSS Feedovi
            </h3>
            <button v-if="!showCustomFeedForm" @click="startAddingCustomFeed" class="btn btn-secondary btn-sm gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Dodaj Feed
            </button>
          </div>

          <!-- Forma za dodavanje -->
          <div v-if="showCustomFeedForm" class="bg-base-200 rounded-xl p-4 mb-4">
            <div class="grid gap-4">
              <div class="form-control">
                <label class="label"><span class="label-text font-medium">Naziv izvora</span></label>
                <input v-model="customFeedName" type="text" placeholder="npr. Moj Blog" class="input input-bordered" maxlength="50" />
                <label class="label"><span class="label-text-alt">{{ customFeedName.length }}/50</span></label>
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text font-medium">RSS URL</span></label>
                <div class="join w-full">
                  <input v-model="customFeedUrl" @input="onUrlChange" type="url" placeholder="https://example.com/feed" class="input input-bordered join-item flex-1" />
                  <button @click="checkRssValidity" :disabled="!customFeedUrl.trim() || isCheckingRss" class="btn join-item" :class="{
                    'btn-success': rssCheckStatus === 'valid',
                    'btn-error': rssCheckStatus === 'invalid',
                    'btn-neutral': !rssCheckStatus
                  }">
                    <span v-if="isCheckingRss" class="loading loading-spinner loading-sm"></span>
                    <span v-else>{{ rssCheckStatus === 'valid' ? '✓' : 'Provjeri' }}</span>
                  </button>
                </div>
                <label class="label" v-if="rssCheckMessage">
                  <span class="label-text-alt" :class="{ 'text-success': rssCheckStatus === 'valid', 'text-error': rssCheckStatus === 'invalid' }">
                    {{ rssCheckMessage }}
                  </span>
                </label>
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text font-medium">Kategorija</span></label>
                <select v-model="customFeedCategory" class="select select-bordered">
                  <option value="custom">Custom</option>
                  <option value="hrvatska">Hrvatska</option>
                  <option value="world">Svijet</option>
                  <option value="tech">Tehnologija</option>
                  <option value="science">Znanost</option>
                  <option value="business">Posao</option>
                </select>
              </div>

              <div class="flex justify-end gap-2 pt-2">
                <button @click="cancelAddingCustomFeed" class="btn btn-ghost">Otkaži</button>
                <button @click="confirmAddCustomFeed" :disabled="!customFeedName.trim() || !customFeedUrl.trim()" class="btn btn-secondary">
                  Dodaj Feed
                </button>
              </div>
            </div>
          </div>

          <!-- LIST CUSTOM feedova (Dropdown) -->
          <div v-if="feedsStore.customFeeds.length > 0" class="collapse collapse-arrow bg-base-200 mt-4 rounded-xl border border-base-300">
            <input type="checkbox" /> 
            
            <!-- Naslov Dropdowna -->
            <div class="collapse-title flex items-center gap-3 font-medium">
              <div class="indicator">
                <span class="indicator-item badge badge-secondary badge-xs"></span> 
                <div class="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
              <span>Moji Feedovi ({{ feedsStore.customFeeds.length }})</span>
            </div>

            <!-- Sadržaj Dropdowna -->
            <div class="collapse-content">
              <div class="space-y-2 pt-2">
                <div v-for="feed in feedsStore.customFeeds" :key="feed.id" class="flex items-center justify-between p-3 bg-base-100 rounded-lg border border-base-200 hover:border-secondary/30 transition-colors">
                  
                  <div class="flex items-center gap-3 overflow-hidden">
                    <div class="min-w-0">
                      <h4 class="font-semibold text-sm truncate">{{ feed.name }}</h4>
                      <p class="text-xs text-base-content/50 truncate max-w-[150px] sm:max-w-xs">{{ feed.url }}</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 flex-shrink-0">
                    <span class="badge badge-ghost badge-sm hidden sm:inline-flex">{{ feed.category }}</span>
                    <button @click.stop="confirmDeleteCustomFeed(feed.id)" class="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>


          <div v-else-if="!showCustomFeedForm" class="text-center py-8 text-base-content/50">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p>Još nemaš custom feedova</p>
            <p class="text-sm">Klikni "Dodaj Feed" za početak</p>
          </div>
        </div>
      </div>

      <!-- DEF kategorija -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h3 class="card-title flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Obavezna Kategorija
          </h3>
          <div class="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
            <div>
              <h4 class="font-semibold text-lg">{{ feedsStore.categories[0]?.name }}</h4>
              <p class="text-sm text-base-content/60">{{ feedsStore.categories[0]?.description }}</p>
              <p class="text-xs text-base-content/40 mt-1">Sadrži {{ feedsStore.availableFeeds.length }} izvora</p>
            </div>
            <div class="badge badge-primary badge-lg">Default</div>
          </div>
        </div>
      </div>

      <!-- KORISNIKOVE kategorije -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="flex justify-between items-center mb-4">
            <h3 class="card-title flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Tvoje custom Kategorije
            </h3>
            <button v-if="!showAddForm" @click="startAddingCategory" :disabled="feedsStore.availableFeeds.length === 0" class="btn btn-primary btn-sm gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Nova Kategorija
            </button>
          </div>

          <!-- FORM za novu kategoriju -->
          <div v-if="showAddForm" class="bg-base-200 rounded-xl p-4 mb-4">
            <h4 class="font-semibold mb-4">Kreiraj Novu Kategoriju</h4>
            <div class="form-control mb-4">
              <label class="label"><span class="label-text font-medium">Ime Kategorije</span></label>
              <input v-model="newCategoryName" type="text" placeholder="npr. Tehnologija i AI" class="ml-2 input input-bordered" maxlength="50" />
              <label class="label"><span class="label-text-alt ml-2">{{ newCategoryName.length }}/50</span></label>
            </div>

            <div class="mb-4">
              <label class="label"><span class="label-text font-medium">Odaberite Feedove</span></label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto p-2 bg-base-100 rounded-lg">
                <div v-for="(feeds, domain) in allFeedsByDomain" :key="domain">
                  <h5 class="font-semibold text-xs mb-2 text-primary uppercase tracking-wide">{{ domain }}</h5>
                  <div class="space-y-1">
                    <label v-for="feed in feeds" :key="feed.id" class="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-base-200 transition-colors">
                      <input type="checkbox" :value="feed.id" v-model="selectedFeedsForNew" class="checkbox checkbox-primary checkbox-sm" />
                      <span class="text-sm">{{ feed.name }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-2">
              <button @click="cancelAddingCategory" class="btn btn-ghost">Otkaži</button>
              <button @click="confirmAddCategory" :disabled="!newCategoryName.trim()" class="btn btn-primary">Kreiraj</button>
            </div>
          </div>

          <!-- LIST kategorija -->
          <div v-if="feedsStore.categories.length > 1" class="space-y-3">
            <div v-for="category in feedsStore.categories.slice(1)" :key="category.id" class="border border-base-300 rounded-xl overflow-hidden">
              <div v-if="editingCategoryId !== category.id" class="p-4">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <h4 class="font-semibold text-lg">{{ category.name }}</h4>
                    <p class="text-sm text-base-content/60">{{ category.feeds.length }} feedova</p>
                  </div>
                  <div class="flex gap-2">
                    <button @click="startEditingCategory(category)" class="btn btn-ghost btn-sm gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Uredi
                    </button>
                    <button @click="confirmDeleteCategory(category.id)" class="btn btn-ghost btn-sm text-error gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Obriši
                    </button>
                  </div>
                </div>
                <div class="flex flex-wrap gap-2">
                  <span v-for="feed in category.feeds" :key="feed.id" class="badge badge-outline">{{ feed.name }}</span>
                </div>
              </div>

              <!-- Edit mode -->
              <div v-else class="p-4 bg-base-200">
                <h4 class="font-semibold mb-4">Uredi Kategoriju</h4>
                <div class="form-control mb-4">
                  <label class="label"><span class="label-text font-medium">Ime Kategorije</span></label>
                  <input v-model="editingCategoryName" type="text" class="input input-bordered" maxlength="50" />
                </div>

                <div class="mb-4">
                  <label class="label"><span class="label-text font-medium">Feedovi</span></label>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-48 overflow-y-auto p-2 bg-base-100 rounded-lg">
                    <div v-for="(feeds, domain) in allFeedsByDomain" :key="domain">
                      <h5 class="font-semibold text-xs mb-2 text-primary uppercase tracking-wide">{{ domain }}</h5>
                      <div class="space-y-1">
                        <label v-for="feed in feeds" :key="feed.id" class="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-base-200 text-sm">
                          <input type="checkbox" :value="feed.id" v-model="editingCategoryFeeds" class="checkbox checkbox-primary checkbox-sm" />
                          <span>{{ feed.name }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end gap-2">
                  <button @click="cancelEditingCategory" class="btn btn-ghost btn-sm">Otkaži</button>
                  <button @click="confirmEditCategory" :disabled="!editingCategoryName.trim() || editingCategoryFeeds.length === 0" class="btn btn-primary btn-sm">Spremi</button>
                </div>
              </div>
            </div>
          </div>
          

          <div v-else-if="!showAddForm" class="text-center py-8 text-base-content/50">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <p>Još nemate custom kategorija</p>
            <p class="text-sm">Kombinirajte feedove u vlastite kategorije</p>
          </div>
        </div>
      </div>
            <!-- Tip -> možda maknut jer previše?? -->
            <div class="alert shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <div>
          <h4 class="font-semibold">Savjet</h4>
          <p class="text-sm">Kreirajte kategorije prema interesima, zatim ih odaberite u glavnom izborniku za filtrirane vijesti.</p>
        </div>
      </div>

      <AISpotlightSettings />

    </div>
  </div>
  <footer class="footer footer-center p-6 bg-base-200 text-base-content/60">
      <div class="flex flex-col items-center gap-2">
        <p>NewsCombo © 2026</p>
        <a href="https://barisa.me/" target="_blank" class="link link-hover flex items-center gap-2">Made with ♥️ by Mario Bariša</a>
        <a href="https://github.com/MarioBarisa/NewsCombo" target="_blank"
          class="link link-hover flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </a>
      </div>
    </footer>
</template>

<style>
</style>
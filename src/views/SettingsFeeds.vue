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
    
    // prilgođen rss feed
    const showCustomFeedForm = ref(false);
    const customFeedName = ref('');
    const customFeedUrl = ref('');
    const customFeedCategory = ref('custom');
    
    const allFeedsByDomain = computed(() => feedsStore.feedsByCategory);
    
    onMounted(() => {
      feedsStore.loadFromLocalStorage();
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
      if (newCategoryName.value.trim() && selectedFeedsForNew.value.length > 0) {
        feedsStore.addCategory(newCategoryName.value, selectedFeedsForNew.value);
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

    const confirmAddCustomFeed = () => {
      if (customFeedName.value.trim() && customFeedUrl.value.trim()) {
        try {
          // validacija URL-a
          new URL(customFeedUrl.value);
          feedsStore.addCustomFeed(customFeedName.value, customFeedUrl.value, customFeedCategory.value);
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
    </script>
    
    <template>
      <div class="container mx-auto px-4 py-8 max-w-6xl">
        <h1 class="text-4xl font-bold mb-2">Postavke Feedova</h1>
        <p class="text-lg opacity-70 mb-8">Kreirajte i upravljajte svojim kategorijama vijesti</p>
    
        <!-- Sekcija za Custom RSS Feedove -->
        <div class="mb-8">
          <div class="flex justify-between items-center mb-4">
            <div>
              <h2 class="text-2xl font-semibold">Custom RSS Feedovi</h2>
              <p class="text-sm opacity-70 mt-1">Dodajte svoje prilagođene RSS izvore</p>
            </div>
            <button 
              v-if="!showCustomFeedForm"
              @click="startAddingCustomFeed"
              class="btn btn-secondary"
            >
              + Dodaj Custom Feed
            </button>
          </div>

          <!-- Forma za dodavanje custom feeda -->
          <div v-if="showCustomFeedForm" class="card bg-base-200 shadow mb-4">
            <div class="card-body">
              <h3 class="card-title mb-4">Dodaj Custom RSS Feed</h3>
              
              <div class="form-control mb-4">
                <label class="label">
                  <span class="label-text">Naziv izvora</span>
                </label>
                <input 
                  v-model="customFeedName"
                  type="text" 
                  placeholder="npr. Moj Blog"
                  class="input input-bordered"
                  maxlength="50"
                />
                <label class="label">
                  <span class="label-text-alt">{{ customFeedName.length }}/50</span>
                </label>
              </div>

              <div class="form-control mb-4">
                <label class="label">
                  <span class="label-text">RSS URL</span>
                </label>
                <input 
                  v-model="customFeedUrl"
                  type="url" 
                  placeholder="https://example.com/feed"
                  class="input input-bordered"
                />
                <label class="label">
                  <span class="label-text-alt">Unesite pun URL RSS feeda</span>
                </label>
              </div>

              <div class="form-control mb-4">
                <label class="label">
                  <span class="label-text">Kategorija</span>
                </label>
                <select v-model="customFeedCategory" class="select select-bordered">
                  <option value="custom">Custom</option>
                  <option value="hrvatska">Hrvatska</option>
                  <option value="world">Svijet</option>
                  <option value="tech">Tehnologija</option>
                  <option value="science">Znanost</option>
                  <option value="business">Posao</option>
                </select>
              </div>

              <div class="card-actions justify-end gap-2">
                <button 
                  @click="cancelAddingCustomFeed"
                  class="btn btn-ghost"
                >
                  Otkaži
                </button>
                <button 
                  @click="confirmAddCustomFeed"
                  :disabled="!customFeedName.trim() || !customFeedUrl.trim()"
                  class="btn btn-secondary"
                >
                  Dodaj Feed
                </button>
              </div>
            </div>
          </div>

          <!-- Lista custom feedova -->
          <div v-if="feedsStore.customFeeds.length > 0" class="grid gap-2">
            <div 
              v-for="feed in feedsStore.customFeeds" 
              :key="feed.id"
              class="card bg-base-100 shadow-sm"
            >
              <div class="card-body py-3 px-4">
                <div class="flex justify-between items-center">
                  <div>
                    <h4 class="font-semibold">{{ feed.name }}</h4>
                    <p class="text-xs opacity-60">{{ feed.url }}</p>
                    <span class="badge badge-sm badge-outline mt-1">{{ feed.category }}</span>
                  </div>
                  <button 
                    @click="confirmDeleteCustomFeed(feed.id)"
                    class="btn btn-sm btn-error btn-outline"
                  >
                    Obriši
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="!showCustomFeedForm" class="alert">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Još nemate dodanih custom RSS feedova. Kliknite "Dodaj Custom Feed" za početak!</span>
          </div>
        </div>

        <!-- Standardna kategorija (samo prikaz) -->
        <div class="mb-8">
          <h2 class="text-2xl font-semibold mb-4">Obavezna Kategorija</h2>
          <div class="card bg-base-200 shadow">
            <div class="card-body">
              <div class="flex justify-between items-center">
                <div>
                  <h3 class="card-title">{{ feedsStore.categories[0].name }}</h3>
                  <p class="text-sm opacity-75">{{ feedsStore.categories[0].description }}</p>
                  <p class="text-xs opacity-50 mt-2">
                    Sadrži sve dostupne feedove ({{ feedsStore.availableFeeds.length }} izvora)
                  </p>
                </div>
                <div class="badge badge-primary">Default</div>
              </div>
            </div>
          </div>
        </div>
    
        <!-- prilagođene kategorije -->
        <div class="mb-8">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-semibold">Vaše Kategorije</h2>
            <button 
              v-if="!showAddForm"
              @click="startAddingCategory"
              :disabled="feedsStore.availableFeeds.length === 0"
              class="btn btn-primary"
              title="Kreirajte novu kategoriju kombinirajući različite RSS feedove"
            >
              + Nova Kategorija
            </button>
          </div>
    
          <!-- dodavanje nove kategorije -->
          <div v-if="showAddForm" class="card bg-base-200 shadow mb-4">
            <div class="card-body">
              <h3 class="card-title mb-4">Kreiraj Novu Kategoriju</h3>
              <div class="form-control mb-4">
                <label class="label">
                  <span class="label-text">Ime Kategorije</span>
                </label>
                <input 
                  v-model="newCategoryName"
                  type="text" 
                  placeholder="npr. Tehnologija i AI"
                  class="input input-bordered"
                  maxlength="50"
                />
                <label class="label">
                  <span class="label-text-alt">{{ newCategoryName.length }}/50</span>
                </label>
              </div>
    
              <!-- odabir news -->
              <div class="mb-4">
                <label class="label">
                  <span class="label-text">Odaberite Feedove</span>
                </label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div v-for="(feeds, domain) in allFeedsByDomain" :key="domain">
                    <h4 class="font-semibold text-sm mb-3 text-primary">{{ domain }}</h4>
                    <div class="flex flex-col gap-2">
                      <label 
                        v-for="feed in feeds" 
                        :key="feed.id"
                        class="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-base-100"
                      >
                        <input 
                          type="checkbox"
                          :value="feed.id"
                          v-model="selectedFeedsForNew"
                          class="checkbox checkbox-primary checkbox-sm"
                        />
                        <span class="text-sm">{{ feed.name }}</span>
                      </label>
                    </div>
                  </div>
                </div>
                <p v-if="selectedFeedsForNew.length === 0" class="text-sm opacity-60 mt-3">
                  ⚠️ Odaberite barem jedan feed
                </p>
                <p v-else class="text-sm opacity-75 mt-3">
                  ✓ Odabrano {{ selectedFeedsForNew.length }} feedova
                </p>
              </div>

              <div class="card-actions justify-end gap-2">
                <button 
                  @click="cancelAddingCategory"
                  class="btn btn-ghost"
                >
                  Otkaži
                </button>
                <button 
                  @click="confirmAddCategory"
                  :disabled="!newCategoryName.trim() || selectedFeedsForNew.length === 0"
                  class="btn btn-primary"
                >
                  Kreiraj
                </button>
              </div>
            </div>
          </div>
    
          <div v-if="feedsStore.categories.length > 1" class="grid gap-4">
            <div 
              v-for="category in feedsStore.categories.slice(1)" 
              :key="category.id"
              class="card bg-base-100 shadow"
            >
              <div class="card-body">
                <div v-if="editingCategoryId !== category.id">
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <h4 class="card-title">{{ category.name }}</h4>
                      <p class="text-sm opacity-75">{{ category.feeds.length }} feedova</p>
                    </div>
                    <div class="flex gap-2">
                      <button 
                        @click="startEditingCategory(category)"
                        class="btn btn-sm btn-secondary"
                      >
                        Uredi
                      </button>
                      <button 
                        @click="confirmDeleteCategory(category.id)"
                        class="btn btn-sm btn-error"
                      >
                        Obriši
                      </button>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <span 
                      v-for="feed in category.feeds" 
                      :key="feed.id"
                      class="badge badge-outline"
                    >
                      {{ feed.name }}
                    </span>
                  </div>
                </div>
    
                <div v-else>
                  <h4 class="card-title mb-4">Uredi Kategoriju</h4>
                  
                  <div class="form-control mb-4">
                    <label class="label">
                      <span class="label-text">Ime Kategorije</span>
                    </label>
                    <input 
                      v-model="editingCategoryName"
                      type="text" 
                      class="input input-bordered"
                      maxlength="50"
                    />
                  </div>
    
                  <div class="mb-4">
                    <label class="label">
                      <span class="label-text">Feedovi</span>
                    </label>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div v-for="(feeds, domain) in allFeedsByDomain" :key="domain">
                        <h5 class="font-semibold text-xs mb-2 text-primary">{{ domain }}</h5>
                        <div class="flex flex-col gap-1">
                          <label 
                            v-for="feed in feeds" 
                            :key="feed.id"
                            class="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-base-200 text-sm"
                          >
                            <input 
                              type="checkbox"
                              :value="feed.id"
                              v-model="editingCategoryFeeds"
                              class="checkbox checkbox-primary checkbox-sm"
                            />
                            <span>{{ feed.name }}</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
    
                  <div class="card-actions justify-end gap-2">
                    <button 
                      @click="cancelEditingCategory"
                      class="btn btn-ghost btn-sm"
                    >
                      Otkaži
                    </button>
                    <button 
                      @click="confirmEditCategory"
                      :disabled="!editingCategoryName.trim() || editingCategoryFeeds.length === 0"
                      class="btn btn-primary btn-sm"
                    >
                      Spremi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
    
          <div v-else-if="!showAddForm" class="alert">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Trebate nekoliko sekundi da kreirate prvu kategoriju!</span>
          </div>
        </div>

        <div class="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>💡 Savjet: Kreirajte kategorije prema vašim interesima, zatim odaberite ih u meniju za učitavanje vijesti iz odabranih feedova.</span>
        </div>
      </div>
    </template>
    
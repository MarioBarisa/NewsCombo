import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import newsApi from '../api/newsApi.js';
import { API_URL } from '../config.js';
import { userStorageKey } from '../Services/sessionStorage.js';

export const useFeedsStore = defineStore('feeds', () => {
  const categories = ref([
    {
      id: 'all',
      name: 'Svi feedovi',
      description: 'Sve vijesti u kronološkom redoslijedu',
      feeds: [],
      isDefault: true,
      createdAt: new Date().toISOString()
    }
  ]);

  const selectedCategoryId = ref('all');
  const isLoading = ref(false);
  const initialized = ref(false);
  const error = ref(null);
  let generation = 0;
  let initPromise = null;
  let refreshPromise = null;
  let refreshVersion = 0;

  const availableFeeds = ref([]);

  const normalizeDomain = (value) => {
    if (!value) return '';
    try {
      const url = value.includes('://') ? value : `https://${value}`;
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  };

  // korisnikov custom RSS izvor
  const addCustomFeed = async (name, url, category = "custom") => {
    const operationGeneration = generation;
    isLoading.value = true;
    try {
      const domain = new URL(url).hostname.replace("www.", "");
  
      const newFeed = {
        naziv: name,
        url,
        domain,
        kategorija: category,
        isCustom: true,
      };
  
      const response = await newsApi.createFeed(newFeed);
      
      console.log('✅ Feed kreiran na backendu:', response.data);
      if (operationGeneration !== generation) return null;
      await refreshStore(true);
      if (operationGeneration !== generation) return null;
      
      // vrati ID novog feeda
      return {
        success: true,
        feedId: response.data.noviId || response.data.id
      };
      
    } catch (error) {
      console.error("Greška pri dodavanju custom feeda:", error);
      throw error;
    } finally {
      if (operationGeneration === generation) isLoading.value = false;
    }
  };
  
  
  

  // obriši custom feed
  const removeCustomFeed = async (feedId) => {
    const operationGeneration = generation;
    isLoading.value = true;
    try {
      const numericId = parseInt(feedId.replace('feed_', ''));
      
      const response = await newsApi.deleteFeed(numericId);
      
      if (operationGeneration !== generation) return null;
      // ukloni iz lokalnog stanja
      availableFeeds.value = availableFeeds.value.filter(
        f => f.id !== feedId
      );
      
      // Ukloni iz kategorija
      categories.value.forEach(cat => {
        cat.feeds = cat.feeds.filter(f => f.id !== feedId);
      });
      
      if (operationGeneration !== generation) return null;
      await refreshStore(true);
      if (operationGeneration !== generation) return null;
      
      return response.data;
      
    } catch (error) {
      console.error('Greška pri brisanju feeda:', error);
      throw error;
    } finally {
      if (operationGeneration === generation) isLoading.value = false;
    }
  };
  
  // dodaj kategoriju
  const addCategory = async (categoryName, selectedFeedIds = []) => {
    const operationGeneration = generation;
    isLoading.value = true;
    try {
      // feed ID-ovi u numerički format za backend
      const numericFeedIds = selectedFeedIds.map(id => 
        parseInt(id.replace('feed_', ''))
      );
      
      const newGroupData = {
        naziv: categoryName,
        opis: `Prilagođena kategorija: ${categoryName}`,
        feedIds: numericFeedIds
      };

      const response = await newsApi.createGroup(newGroupData);
      
      if (operationGeneration !== generation) return null;
      await refreshStore(true);
      if (operationGeneration !== generation) return null;
      const createdCategoryId = `cat_${response.data.noviId}`;
      return categories.value.find(c => c.id === createdCategoryId) || null;
      
    } catch (error) {
      console.error("Greška pri dodavanju kategorije:", error);
      throw error;
    } finally {
      if (operationGeneration === generation) isLoading.value = false;
    }
  };
  

  // uredi kategoriju
  const updateCategory = async (categoryId, updatedName, selectedFeedIds = []) => {
    const operationGeneration = generation;
    isLoading.value = true;
    try {
      const category = categories.value.find(c => c.id === categoryId);
      
      if (!category || category.isDefault) {
        throw new Error("Kategorija nije pronađena ili je default kategorija");
      }
      
      // feed ID-ovi u brojeve
      const numericFeedIds = selectedFeedIds.map(id => 
        parseInt(id.replace('feed_', ''))
      );
      
      const backendId = category.backendId || parseInt(categoryId.replace('cat_', ''));
      
      const updatedGroupData = {
        naziv: updatedName,
        opis: `Prilagođena kategorija: ${updatedName}`,
        feedIds: numericFeedIds
      };
      
      await newsApi.updateGroup(backendId, updatedGroupData);

      if (operationGeneration !== generation) return null;
      await refreshStore(true);
      if (operationGeneration !== generation) return null;
      return categories.value.find(c => c.id === categoryId) || null;
      
    } catch (error) {
      console.error("Greška pri ažuriranju kategorije:", error);
      throw error;
    } finally {
      if (operationGeneration === generation) isLoading.value = false;
    }
  };
  

  

  const deleteCategory = async (categoryId) => {
    const operationGeneration = generation;
    const category = categories.value.find(c => c.id === categoryId);
    
    if (!category) {
      console.warn("Kategorija nije pronađena");
      return false;
    }
    
    if (category.isDefault) {
      console.warn("Ne možeš obrisati default kategoriju");
      return false;
    }
    
    isLoading.value = true;
    
    try {
      const backendId = category.backendId || parseInt(categoryId.replace('cat_', ''));

      console.log(`Brišem grupu s backend ID: ${backendId}`);
      
      const response = await newsApi.deleteGroup(backendId);
      console.log('Backend odgovor:', response.data);

      if (operationGeneration !== generation) return null;
      await refreshStore(true);
      if (operationGeneration !== generation) return null;

      if (selectedCategoryId.value === categoryId) {
        selectedCategoryId.value = 'all';
        localStorage.setItem(userStorageKey('selectedCategoryId'), 'all');
      }
      
      return true;
      
    } catch (error) {
      console.error("Greška pri brisanju kategorije:", error);
      console.error("Error details:", error.response?.data || error.message);
      throw error;
      
    } finally {
      if (operationGeneration === generation) isLoading.value = false;
    }
  };
  
  

  const selectCategory = (categoryId) => {
    console.log('🔍 Selecting category:', categoryId);
    
    // AI sažetak
    if (categoryId === 'ai-summary') {
      selectedCategoryId.value = 'ai-summary';
      localStorage.setItem(userStorageKey('selectedCategoryId'), 'ai-summary');
      return true;
    }
    
    // NewsCombo personalizirani feed
    if (categoryId === 'combo') {
      selectedCategoryId.value = 'combo';
      localStorage.setItem(userStorageKey('selectedCategoryId'), 'combo');
      return true;
    }
    
    if (categories.value.some(c => c.id === categoryId)) {
      selectedCategoryId.value = categoryId;
      localStorage.setItem(userStorageKey('selectedCategoryId'), categoryId);
      return true;
    }
    
    console.warn(`⚠️ Kategorija ${categoryId} nije pronađena`);
    return false;
  };
  

  const selectedCategory = computed(() => {
    if (selectedCategoryId.value === 'combo' || selectedCategoryId.value === 'ai-summary') {
      return { id: selectedCategoryId.value, feeds: [], isDefault: true };
    }
    return categories.value.find(c => c.id === selectedCategoryId.value) || categories.value[0];
  });

  const selectedFeeds = computed(() => {
    const category = selectedCategory.value;
    
    // AI sažetak nema feedove
    if (category.id === 'ai-summary') {
      return [];
    }
    
    // Svi feedovi
    if (category.id === 'all' || category.id === 'combo') {
      return availableFeeds.value;
    }
    
    // Feedovi iz odabrane kategorije
    return category.feeds || [];
  });

  const feedsByCategory = computed(() => {
    const grouped = {};
    availableFeeds.value.forEach(feed => {
      if (!grouped[feed.category]) {
        grouped[feed.category] = [];
      }
      grouped[feed.category].push(feed);
    });
    return grouped;
  });

  const customFeeds = computed(() => {
    return availableFeeds.value.filter(f => f.isCustom);
  });

  const refreshStore = (force = false) => {
    if (refreshPromise && !force) return refreshPromise;
    const current = generation;
    const version = ++refreshVersion;
    isLoading.value = true;
    error.value = null;
    refreshPromise = (async () => {
      try {
        const [feedsResponse, groupsResponse] = await Promise.all([newsApi.getAllFeeds(), newsApi.getAllGroups()]);
        if (current !== generation || version !== refreshVersion) return false;
        const feeds = [];
        for (const feed of feedsResponse.data) {
          feeds.push({ id: `feed_${feed.id}`, name: feed.naziv, url: feed.url, domain: normalizeDomain(feed.url || feed.domain), category: feed.kategorija || 'other', isCustom: feed.isCustom === true || feed.isCustom === 'true' });
        }
        const groups = [categories.value[0]];
        for (const group of groupsResponse.data) {
          const ids = new Set((group.feedIds || []).map(Number));
          groups.push({ id: `cat_${group.id}`, name: group.naziv, description: group.opis, backendId: group.id, feeds: feeds.filter(feed => ids.has(Number(feed.id.replace('feed_', '')))), isDefault: false });
        }
        availableFeeds.value = feeds;
        categories.value = groups;
        initialized.value = true;
        if (!['all', 'combo', 'ai-summary'].includes(selectedCategoryId.value) && !groups.some(group => group.id === selectedCategoryId.value)) selectCategory('all');
        return true;
      } catch (err) {
        if (current === generation && version === refreshVersion) error.value = 'Nije moguće učitati izvore vijesti. Pokušajte ponovno.';
        throw err;
      } finally {
        if (current === generation && version === refreshVersion) {
          isLoading.value = false;
          refreshPromise = null;
        }
      }
    })();
    return refreshPromise;
  };

  const ensureReady = () => {
    if (initPromise) return initPromise;
    if (initialized.value) return Promise.resolve(true);
    const current = generation;
    const initialCategory = selectedCategoryId.value;
    initPromise = refreshStore().then(ready => {
      if (!ready || current !== generation) return false;
      const saved = localStorage.getItem(userStorageKey('selectedCategoryId'));
      if (selectedCategoryId.value === initialCategory && saved) selectCategory(saved);
      return true;
    }).catch(err => {
      if (current === generation) initPromise = null;
      throw err;
    });
    return initPromise;
  };

  const reset = () => {
    generation++;
    initPromise = null;
    refreshPromise = null;
    initialized.value = false;
    error.value = null;
    isLoading.value = false;
    availableFeeds.value = [];
    categories.value = [{ id: 'all', name: 'Svi feedovi', description: 'Sve vijesti', feeds: [], isDefault: true }];
    selectedCategoryId.value = 'all';
  };

  //inicjalno za nove usere 

  const needsInitialSetup = computed(() => {
    return initialized.value && !error.value && availableFeeds.value.length === 0;
  });

  const setupInitialData = async () => {
    const operationGeneration = generation;
    isLoading.value = true;
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      };

      const feeds = await fetch(`${API_URL}/pocetnoStanjeFeed`, { method: 'POST', headers });
      if (!feeds.ok) throw new Error('Postavljanje izvora nije uspjelo');
      const groups = await fetch(`${API_URL}/pocetnoGrupe`, { method: 'POST', headers });
      if (!groups.ok) throw new Error('Postavljanje grupa nije uspjelo');
      
      if (operationGeneration !== generation) return null;
      await refreshStore(true);
      if (operationGeneration !== generation) return null;
      return true;
    } catch (error) {
      console.error("Greška pri postavljanju početnih podataka:", error);
      return false;
    } finally {
      if (operationGeneration === generation) isLoading.value = false;
    }
  };
  

  return {
    categories,
    selectedCategoryId,
    needsInitialSetup,
    availableFeeds,
    isLoading,
    initialized,
    error,
    reset,
    selectedCategory,
    selectedFeeds,
    feedsByCategory,
    customFeeds,
    addCategory,
    updateCategory,
    deleteCategory,
    selectCategory,
    addCustomFeed,
    removeCustomFeed,
    ensureReady,
    refreshStore,
    setupInitialData
  };  
});

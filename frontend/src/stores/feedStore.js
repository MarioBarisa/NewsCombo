import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import newsApi from '../api/newsApi.js';

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

  //ne koristi se više zbog monga
  const HARDCODEDavailableFeeds = ref([
 // hr
 { id: 'feed_index_hr', name: 'Index.hr', url: 'https://www.index.hr/rss', domain: 'index.hr', category: 'hrvatska', isCustom: false },
 { id: 'feed_vecernji', name: 'Večernji list', url: 'https://www.vecernji.hr/rss', domain: 'vecernji.hr', category: 'hrvatska', isCustom: false },
 { id: 'feed_24sata', name: '24sata', url: 'https://www.24sata.hr/feeds/najnovije.xml', domain: '24sata.hr', category: 'hrvatska', isCustom: false },
 { id: 'feed_bug_hr', name: 'Bug.hr', url: 'https://www.bug.hr/rss', domain: 'bug.hr', category: 'tech', isCustom: false },
 
 // world
 { id: 'feed_bbc', name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', domain: 'bbc.co.uk', category: 'world', isCustom: false },
 { id: 'feed_aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', domain: 'aljazeera.com', category: 'world', isCustom: false },
 
 // it
 { id: 'feed_techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com/feed/', domain: 'techcrunch.com', category: 'tech', isCustom: false },
 { id: 'feed_arstechnica', name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', domain: 'arstechnica.com', category: 'tech', isCustom: false },
 { id: 'feed_hn', name: 'Hacker News', url: 'https://hnrss.org/frontpage', domain: 'news.ycombinator.com', category: 'tech', isCustom: false },
 { id: 'feed_mit_tech', name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', domain: 'technologyreview.com', category: 'tech', isCustom: false },
 
 // znanost
 { id: 'feed_aeon', name: 'Aeon', url: 'https://aeon.co/feed.rss', domain: 'aeon.co', category: 'science', isCustom: false },
 
 // posao
 { id: 'feed_ft', name: 'Financial Times', url: 'https://www.ft.com/?format=rss', domain: 'ft.com', category: 'business', isCustom: false },
  ]);

  const availableFeeds = ref([]);

  //funckija za učitavanje feedova sa backenda
  const loadFeedsFromBackend = async () => {
    isLoading.value = true;
    try {
      const response = await newsApi.getAllFeeds();

      availableFeeds.value = response.data.map(
        feed => ({
          id: `feed_${feed.id}`,
          name: feed.naziv,
          url: feed.url,
          domain: new URL(feed.url).hostname.replace('www.', ''),
          category: feed.kategorija || 'other',
          isCustom: feed.isCustom || false,
        })
      )
      
    } catch (error) {
      console.log("Greška pri fetchanju mogno feedova, hardcoded se koriste.", error);
      availableFeeds.value = HARDCODEDavailableFeeds.value;
    }finally {
      isLoading.value = false;
    }
  }

  // korisnikov custom RSS izvor
  const addCustomFeed = async (name, url, category = "custom") => {
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
      await refreshStore();
      
      // return ID novog feeda
      return {
        success: true,
        feedId: response.data.noviId || response.data.id
      };
      
    } catch (error) {
      console.error("Greška pri dodavanju custom feeda:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };
  
  
  

  // obriši custom feed
  const removeCustomFeed = async (feedId) => {
    isLoading.value = true;
    try {
      const numericId = parseInt(feedId.replace('feed_', ''));
      
      const response = await newsApi.deleteFeed(numericId);
      
      // Ukloni iz local state-a
      availableFeeds.value = availableFeeds.value.filter(
        f => f.id !== feedId
      );
      
      // Ukloni iz kategorija
      categories.value.forEach(cat => {
        cat.feeds = cat.feeds.filter(f => f.id !== feedId);
      });
      
      await refreshStore();
      
      return response.data;
      
    } catch (error) {
      console.error('Greška pri brisanju feeda:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };
  //učitaj kategorije
  
  const loadCategoriesFromBackend = async () => {
    isLoading.value = true;
    try {
      const response = await newsApi.getAllGropus();
      
      // Mapiranje grupa iz backenda u lokalni format kategorija
      const backendCategories = response.data.map(grupa => ({
        id: `cat_${grupa.id}`,
        name: grupa.naziv,
        description: grupa.opis,
        feeds: availableFeeds.value.filter(f => 
          grupa.feedIds.includes(parseInt(f.id.replace('feed_', '')))
        ),
        isDefault: false,
        createdAt: new Date().toISOString(),
        backendId: grupa.id // čuvamo backend ID za kasnije operacije
      }));
      
      // Dodaj custom kategorije nakon default "Svi feedovi" kategorije
      categories.value = [
        categories.value[0], // zadrži "Svi feedovi"
        ...backendCategories
      ];
      
    } catch (error) {
      console.error("Greška pri učitavanju kategorija s backenda:", error);
    } finally {
      isLoading.value = false;
    }
  };
  


  // dodaj  kategoriju
  const addCategory = async (categoryName, selectedFeedIds = []) => {
    isLoading.value = true;
    try {
      // Konvertiraj feed ID-ove u numerički format za backend
      const numericFeedIds = selectedFeedIds.map(id => 
        parseInt(id.replace('feed_', ''))
      );
      
      const newGroupData = {
        naziv: categoryName,
        opis: `Prilagođena kategorija: ${categoryName}`,
        feedIds: numericFeedIds
      };

      const response = await newsApi.createGroup(newGroupData);
      
      await refreshStore();

      // Dodaj u lokalno stanje
      const newCategory = {
        id: `cat_${response.data.noviId}`,
        name: categoryName,
        description: `Prilagođena kategorija: ${categoryName}`,
        feeds: availableFeeds.value.filter(f => selectedFeedIds.includes(f.id)),
        isDefault: false,
        createdAt: new Date().toISOString(),
        backendId: response.data.noviId
      };
      
      categories.value.push(newCategory);
      return newCategory;
      
    } catch (error) {
      console.error("Greška pri dodavanju kategorije:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };
  

  // uredi kategoriju
  const updateCategory = async (categoryId, updatedName, selectedFeedIds = []) => {
    isLoading.value = true;
    try {
      const category = categories.value.find(c => c.id === categoryId);
      
      if (!category || category.isDefault) {
        throw new Error("Kategorija nije pronađena ili je default kategorija");
      }
      
      // Konvertiraj feed ID-ove u number 
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

      await refreshStore();
      
      // Ažuriraj lokalno stanje
      category.name = updatedName;
      category.feeds = availableFeeds.value.filter(f => selectedFeedIds.includes(f.id));
      
      return category;
      
    } catch (error) {
      console.error("Greška pri ažuriranju kategorije:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };
  

  

  const deleteCategory = async (categoryId) => {
    // PROVJERA odmah da li je default
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
      //  backend ID
      const backendId = category.backendId || parseInt(categoryId.replace('cat_', ''));
      
      console.log(`Brišem grupu s backend ID: ${backendId}`);
      
      // brisanje s backenda
      const response = await newsApi.deleteGroup(backendId);
      console.log('Backend odgovor:', response.data);

      await refreshStore();
      
      // Odmah obriši iz lokalnog stanja TEK NAKON ( da nebi bilo conflicta ) uspješnog brisanja
      const index = categories.value.findIndex(c => c.id === categoryId);
      if (index !== -1) {
        categories.value.splice(index, 1);
      }
      if (selectedCategoryId.value === categoryId) {
        selectedCategoryId.value = 'all';
        localStorage.setItem('selectedCategoryId', 'all');
      }
      
      return true;
      
    } catch (error) {
      console.error("Greška pri brisanju kategorije:", error);
      console.error("Error details:", error.response?.data || error.message);
      throw error;
      
    } finally {
      isLoading.value = false;
    }
  };
  
  

  const selectCategory = (categoryId) => {
    console.log('🔍 Selecting category:', categoryId);
    
    //  case za AI sažetak
    if (categoryId === 'ai-summary') {
      selectedCategoryId.value = 'ai-summary';
      localStorage.setItem('selectedCategoryId', 'ai-summary');
      return true;
    }
    
    if (categories.value.some(c => c.id === categoryId)) {
      selectedCategoryId.value = categoryId;
      localStorage.setItem('selectedCategoryId', categoryId);
      return true;
    }
    
    console.warn(`⚠️ Kategorija ${categoryId} nije pronađena`);
    return false;
  };
  

  const selectedCategory = computed(() => {
    return categories.value.find(c => c.id === selectedCategoryId.value) || categories.value[0];
  });


  const selectedFeeds = computed(() => {
    const category = selectedCategory.value;
    
    // AI Summary nema feedove (koristi posebnu AI grupu)
    if (category.id === 'ai-summary') {
      return [];
    }
    
    // Svi feedovi
    if (category.id === 'all') {
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

// uklonjen localStorage support
const saveToLocalStorage = () => {
  try {
    const dataToSave = {
      selectedCategoryId: selectedCategoryId.value,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('newsComboSelectedCategory', JSON.stringify(dataToSave));
  } catch (e) {
    console.error('Greška pri spremanju odabrane kategorije:', e);
  }
};

const loadFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem('newsComboSelectedCategory');
    if (saved) {
      const data = JSON.parse(saved);
      if (data.selectedCategoryId) {
        selectedCategoryId.value = data.selectedCategoryId;
      }
    }
  } catch (e) {
    console.error('Greška pri učitavanju odabrane kategorije:', e);
  }
};

const refreshStore = async () => {
  isLoading.value = true;
  try {
    console.log(' Store REFRESH');
    
    await loadFeedsFromBackend();
    await loadCategoriesFromBackend();
    
    console.log(' Store REFRESHAN');
  } catch (error) {
    console.error(' Greška pri REFRESHU store-a:', error);
  } finally {
    isLoading.value = false;
  }
}; 


  const initializeStore = async () => {
    isLoading.value = true;
    try {
      //  učitaj feedove
      await loadFeedsFromBackend();
      
      //  učitaj kategorije/grupe
      await loadCategoriesFromBackend();
      
      // Učitaj odabranu kategoriju iz localStorage-a
      const savedCategoryId = localStorage.getItem('selectedCategoryId');
      if (savedCategoryId && categories.value.some(c => c.id === savedCategoryId)) {
        selectedCategoryId.value = savedCategoryId;
      }
      
    } catch (error) {
      console.error("Greška pri inicijalizaciji store-a:", error);
    } finally {
      isLoading.value = false;
    }
  };
  

  const exportData = async () => {
    try {
      const [feedsResponse, groupsResponse] = await Promise.all([
        newsApi.getAllFeeds(),
        newsApi.getAllGropus()
      ]);
      
      return {
        feedovi: feedsResponse.data,
        grupe: groupsResponse.data,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error("Greška pri exportu podataka:", error);
      throw error;
    }
  };
  
  const importData = async (data) => {
    isLoading.value = true;
    try {
      if (data.grupe && Array.isArray(data.grupe)) {
        // Importaj grupe
        for (const grupa of data.grupe) {
          await newsApi.createGroup({
            naziv: grupa.naziv,
            opis: grupa.opis,
            feedIds: grupa.feedIds
          });
        }
        
        // Ponovno učitaj sve s backenda
        await initializeStore();
      }
    } catch (error) {
      console.error("Greška pri importu podataka:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  //inicjalno za nove usere 

  const needsInitialSetup = computed(() => {
    return availableFeeds.value.length === 0;
  });

  const setupInitialData = async () => {
    isLoading.value = true;
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      };

      await fetch('http://localhost:3005/pocetnoStanjeFeed', { method: 'POST', headers });
      await fetch('http://localhost:3005/pocetnoGrupe', { method: 'POST', headers });
      
      await initializeStore();
      return true;
    } catch (error) {
      console.error("Greška pri postavljanju početnih podataka:", error);
      return false;
    } finally {
      isLoading.value = false;
    }
  };
  

  return {
    categories,
    selectedCategoryId,
    needsInitialSetup,
    availableFeeds,
    isLoading,
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
    loadFromLocalStorage, // legacy
    saveToLocalStorage, //legacy
    exportData,
    importData,
    loadFeedsFromBackend,
    loadCategoriesFromBackend, 
    initializeStore,
    refreshStore,
    setupInitialData
  };  
});

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
  const addCustomFeed = async (name, url, category = 'custom') => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
        const newFeed = {
                  id: `feed_custom_${Date.now()}`,
                  naziv: name,           
                  url,
                  domain,
                  kategorija: category,  
                  isCustom: true
                };

     const response = await newsApi.createFeed(newFeed);
      
      availableFeeds.value.push(newFeed);
      saveToLocalStorage();
      return newFeed;
    } catch (error) {
      console.error('Greška pri dodavanju custom feeda:', error);
      throw error;
    }
  };
  

  // obriši custom feed
  const removeCustomFeed = (feedId) => {
    const index = availableFeeds.value.findIndex(f => f.id === feedId && f.isCustom);
    if (index !== -1) {
      // ukloni feed iz svih kategorija
      categories.value.forEach(cat => {
        cat.feeds = cat.feeds.filter(f => f.id !== feedId);
      });
      availableFeeds.value.splice(index, 1);
      saveToLocalStorage();
      return true;
    }
    return false;
  };

  // dodaj  kategoriju
  const addCategory = (categoryName, selectedFeedIds = []) => {
    const newCategory = {
      id: `cat_${Date.now()}`,
      name: categoryName,
      description: `Prilagođena kategorija: ${categoryName}`,
      feeds: availableFeeds.value.filter(f => selectedFeedIds.includes(f.id)),
      isDefault: false,
      createdAt: new Date().toISOString()
    };
    categories.value.push(newCategory);
    saveToLocalStorage();
    return newCategory;
  };

  // uredi kategoriju
  const updateCategory = (categoryId, updatedName, selectedFeedIds = []) => {
    const category = categories.value.find(c => c.id === categoryId);
    if (category && !category.isDefault) {
      category.name = updatedName;
      category.feeds = availableFeeds.value.filter(f => selectedFeedIds.includes(f.id));
      saveToLocalStorage();
      return category;
    }
  };

  // obriši kategoriju
  const deleteCategory = (categoryId) => {
    const index = categories.value.findIndex(c => c.id === categoryId && !c.isDefault);
    if (index !== -1) {
      categories.value.splice(index, 1);
      if (selectedCategoryId.value === categoryId) {
        selectedCategoryId.value = 'all';
      }
      saveToLocalStorage();
      return true;
    }
    return false;
  };

  const selectCategory = (categoryId) => {
    if (categories.value.some(c => c.id === categoryId)) {
      selectedCategoryId.value = categoryId;
      saveToLocalStorage();
      return true;
    }
    return false;
  };

  const selectedCategory = computed(() => {
    return categories.value.find(c => c.id === selectedCategoryId.value) || categories.value[0];
  });


  const selectedFeeds = computed(() => {
    const category = selectedCategory.value;
    if (category.id === 'all') {
      return availableFeeds.value;
    }
    return category.feeds;
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

  const saveToLocalStorage = () => {
    try {
      const dataToSave = {
        categories: categories.value,
        selectedCategoryId: selectedCategoryId.value,
        customFeeds: availableFeeds.value.filter(f => f.isCustom),
        savedAt: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem('newsComboFeeds', JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Greška pri spremanju postavki:', e);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('newsComboFeeds');
      if (saved) {
        const data = JSON.parse(saved);
        categories.value = data.categories;
        selectedCategoryId.value = data.selectedCategoryId || 'all';
        
        // učitaj custom feedove
        if (data.customFeeds && Array.isArray(data.customFeeds)) {
          // ukloni stare custom feedove
          availableFeeds.value = availableFeeds.value.filter(f => !f.isCustom);
          // dodaj spremljene custom feedove
          availableFeeds.value.push(...data.customFeeds);
        }
      }
    } catch (e) {
      console.error('Greška pri učitavanju postavki:', e);
    }
  };

  const exportData = () => {
    return {
      categories: categories.value.filter(c => !c.isDefault),
      selectedCategoryId: selectedCategoryId.value
    };
  };

  const importData = (data) => {
    if (data.categories && Array.isArray(data.categories)) {
      categories.value = [
        categories.value[0],
        ...data.categories
      ];
      saveToLocalStorage();
    }
  };

  return {
    categories,
    selectedCategoryId,
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
    loadFromLocalStorage,
    saveToLocalStorage,
    exportData,
    importData,
    loadFeedsFromBackend
  };
});

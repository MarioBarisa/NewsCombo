import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

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

  const availableFeeds = ref([
 // hr
 { name: 'Index.hr', url: 'https://www.index.hr/rss', domain: 'index.hr', category: 'hrvatska' },
 { name: 'Večernji list', url: 'https://www.vecernji.hr/rss', domain: 'vecernji.hr', category: 'hrvatska' },
 { name: '24sata', url: 'https://www.24sata.hr/feeds/najnovije.xml', domain: '24sata.hr', category: 'hrvatska' },
 { name: 'Bug.hr', url: 'https://www.bug.hr/rss', domain: 'bug.hr', category: 'tech' },
 { name: 'Netokracija', url: 'https://www.netokracija.com/feed', domain: 'netokracija.com', category: 'tech' },
 
 // world
 { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', domain: 'bbc.co.uk', category: 'world' },
 { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', domain: 'aljazeera.com', category: 'world' },
 { name: 'Associated Press', url: 'https://feeds.apnews.com/rss/topnews', domain: 'apnews.com', category: 'world' },
 
 // it
 { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', domain: 'techcrunch.com', category: 'tech' },
 { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', domain: 'arstechnica.com', category: 'tech' },
 { name: 'Hacker News', url: 'https://hnrss.org/frontpage', domain: 'news.ycombinator.com', category: 'tech' },
 { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', domain: 'technologyreview.com', category: 'tech' },
 
 // znanost
 { name: 'Aeon', url: 'https://aeon.co/feed.rss', domain: 'aeon.co', category: 'science' },
 
 // posao
 { name: 'Financial Times', url: 'https://www.ft.com/?format=rss', domain: 'ft.com', category: 'business' },
  ]);

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


  const saveToLocalStorage = () => {
    try {
      const dataToSave = {
        categories: categories.value,
        selectedCategoryId: selectedCategoryId.value,
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
    addCategory,
    updateCategory,
    deleteCategory,
    selectCategory,
    loadFromLocalStorage,
    saveToLocalStorage,
    exportData,
    importData
  };
});

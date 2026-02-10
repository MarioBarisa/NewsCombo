<template>
    <div class="container ml-1 px-4 py-8 max-w-6xl">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-semibold">
          AI Spotlight
        </h1>
        <p class="text-lg opacity-70">
          Personalizirani AI sažetak vijesti - do 3x dnevno
        </p>
      </div>
      <div class="card bg-gradient-to-br from-primary to-secondary text-primary-content shadow-xl mb-8">
        <div class="card-body">
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div class="flex items-center gap-4">
              <div class="text-5xl">{{ statusIcon }}</div>
              <div>
                <h2 class="card-title text-xl">{{ statusText }}</h2>
                <p class="text-sm opacity-90">{{ statusDetail }}</p>
              </div>
            </div>
  
            <button 
              @click="generateSummary" 
              :disabled="!canGenerate || isGenerating"
              class="btn btn-lg"
              :class="canGenerate ? 'btn-neutral' : 'btn-disabled'"
            >
              <span v-if="isGenerating" class="loading loading-spinner loading-md"></span>
              <span v-else>
                 {{ isGenerating ? 'Generiranje...' : 'Generiraj Sažetak' }}
              </span>
            </button>
          </div>
        </div>
      </div>
  
      <!-- RSS Feedovi Section -->
      <div class="card bg-base-100 shadow-xl mb-8">
        <div class="card-body">
          <div class="flex justify-between items-center mb-6">
            <h2 class="card-title text-2xl">
              RSS Feedovi
            </h2>
            <div class="badge badge-lg badge-primary">
              {{ aiGroup.feedIds?.length || 0 }} / 5
            </div>
          </div>
  
          <!-- Selected Feeds List -->
          <div v-if="selectedFeeds.length > 0" class="space-y-3 mb-6">
            <div 
              v-for="feed in selectedFeeds" 
              :key="feed.id"
              class="card bg-base-200 hover:bg-base-300 transition-all"
            >
              <div class="card-body p-4">
                <div class="flex justify-between items-center gap-4">
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div class="flex-1 min-w-0">
                      <h3 class="font-semibold text-base truncate">
                        {{ feed.naziv }}
                      </h3>
                      <p class="text-xs opacity-60 truncate">
                        {{ feed.url }}
                      </p>
                      <span class="badge badge-sm badge-outline mt-1">
                        {{ feed.kategorija }}
                      </span>
                    </div>
                  </div>
                  <button 
                    @click="removeFeed(feed.id)" 
                    class="btn btn-sm btn-circle btn-error btn-outline"
                    title="Ukloni feed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
  
          <!-- Empty State -->
          <div v-else class="alert alert-info mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h3 class="font-bold">Nema dodanih feedova</h3>
              <div class="text-xs">Dodaj do 5 RSS izvora za personalizirani AI sažetak</div>
            </div>
          </div>
  
          <div v-if="(aiGroup.feedIds?.length || 0) < 5" class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Dodaj novi feed</span>
            </label>
            <div class="join w-full">
              <select 
                v-model="selectedFeedId" 
                class="select select-bordered join-item flex-1"
              >
                <option value="" disabled>Odaberi RSS feed...</option>
                <option 
                  v-for="feed in availableFeeds" 
                  :key="feed.id"
                  :value="feed.id"
                >
                  {{ feed.naziv }} - {{ feed.kategorija }}
                </option>
              </select>
              <button 
                @click="addFeed" 
                :disabled="!selectedFeedId"
                class="btn btn-primary join-item"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Dodaj
              </button>
            </div>
          </div>
  
          <!-- maksimalni broj feedova notice -->
          <div v-else class="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Dostignut maksimalni broj feedova (5/5)</span>
          </div>
        </div>
      </div>
  
      <!-- recent summary section -->
      <div v-if="summaries.length > 0" class="mb-8">
        <h2 class="text-2xl font-bold mb-4">Nedavni AI Sažeci</h2>
        
        <div class="space-y-4">
          <div 
            v-for="summary in summaries" 
            :key="summary._id"
            class="card bg-base-100 shadow-xl"
          >
            <div class="card-body">
              <div class="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4">
                <h3 class="card-title text-xl">
                  {{ summary.summary.headline }}
                </h3>
                <div class="badge badge-ghost badge-lg">
                  {{ formatDate(summary.generatedAt) }}
                </div>
              </div>
  
              <div class="space-y-4">
                <div 
                  v-for="(section, idx) in summary.summary.sections" 
                  :key="idx"
                  class="border-l-4 border-primary pl-4"
                >
                  <h4 class="font-bold text-primary mb-2">
                    {{ section.category }}
                  </h4>
                  <p class="text-sm opacity-80 mb-3">
                    {{ section.summary }}
                  </p>
                  
                  <div class="space-y-2">
                    <a 
                      v-for="(article, i) in section.topArticles" 
                      :key="i"
                      :href="article.link"
                      target="_blank"
                      class="flex items-start gap-2 text-sm link link-hover"
                    >
                      <span class="badge badge-sm badge-outline">{{ i + 1 }}</span>
                      <span class="flex-1">
                        {{ article.title }}
                        <span class="opacity-50 text-xs ml-1">({{ article.source }})</span>
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
  
              <div class="card-actions justify-between items-center mt-6 pt-4 border-t border-base-300">
                <div class="flex items-center gap-2">
                  <div class="badge badge-outline">
                    {{ summary.articlesCount }} članaka
                  </div>
                  <div class="badge badge-outline">
                    Generiranje #{{ summary.generationNumber }}
                  </div>
                </div>
                <button 
                  @click="deleteSummary(summary._id)" 
                  class="btn btn-sm btn-error btn-outline"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Obriši
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <div v-else class="alert">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info shrink-0 w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>Još nemaš generiranih AI sažetaka. Dodaj feedove i generiraj prvi sažetak!</span>
      </div>
  
      <div class="alert alert-info mt-8">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <h3 class="font-bold">Kako radi AI Spotlight?</h3>
          <div class="text-sm">
            Dodaj do 5 RSS feedova u grupu. AI će analizirati najnovije članke i generirati personalizirani sažetak. 
            Možeš generirati do 3 sažetka dnevno. Svaki novi dan se limit resetira u ponoć.
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import axios from 'axios';
  
  import { API_URL as BASE_URL } from '../config.js';
  const API_URL = `${BASE_URL}/api`;  
  

  const aiGroup = ref({});
  const allFeeds = ref([]);
  const summaries = ref([]);
  const selectedFeedId = ref('');
  const generationStatus = ref(null);
  const isGenerating = ref(false);
  
 
  const selectedFeeds = computed(() => {
    const feedIds = aiGroup.value.feedIds || [];
    return allFeeds.value.filter(f => feedIds.includes(f.id));
  });
  
  const availableFeeds = computed(() => {
    const feedIds = aiGroup.value.feedIds || [];
    return allFeeds.value.filter(f => !feedIds.includes(f.id));
  });
  
  const canGenerate = computed(() => {
    return generationStatus.value?.canGenerate && 
           (aiGroup.value.feedIds?.length || 0) > 0;
  });
  
  const statusIcon = computed(() => {
    if (!generationStatus.value) return '⏳';
    if (generationStatus.value.remainingGenerations === 0) return '';
    if (generationStatus.value.remainingGenerations === 3) return '';
    return '';
  });
  
  const statusText = computed(() => {
    if (!generationStatus.value) return 'Učitavanje statusa...';
    const remaining = generationStatus.value.remainingGenerations;
    if (remaining === 0) return 'Dnevni limit dostignut';
    if (remaining === 3) return 'Spremno za generiranje';
    return `Preostalo generiranja danas: ${remaining}/3`;
  });
  
  const statusDetail = computed(() => {
    if (!generationStatus.value) return 'Molimo pričekajte...';
    const generated = generationStatus.value.generatedToday;
    if (generated === 0) return 'Još nisi generirao niti jedan sažetak danas';
    if (generated === 3) return 'Novi sažetak dostupan sutra u 00:00';
    return `Već generirano ${generated}x danas`;
  });
  
  async function loadAIGroup() {
    try {
      const response = await axios.get(`${API_URL}/ai-grupa`);
      aiGroup.value = response.data;
    } catch (error) {
      console.error('Greška pri učitavanju AI grupe:', error);
    }
  }
  
  async function loadAllFeeds() {
    try {
      const response = await axios.get('http://localhost:3005/feedovi');
      allFeeds.value = response.data;
    } catch (error) {
      console.error('Greška pri učitavanju feedova:', error);
    }
  }
  
  async function loadGenerationStatus() {
    try {
      const response = await axios.get(`${API_URL}/ai-grupa/summary/status`);
      generationStatus.value = response.data;
    } catch (error) {
      console.error('Greška pri učitavanju statusa:', error);
    }
  }
  
  async function loadSummaries() {
    try {
      const response = await axios.get(`${API_URL}/ai-grupa/summaries`);
      summaries.value = response.data;
    } catch (error) {
      console.error('Greška pri učitavanju sažetaka:', error);
    }
  }
  
  async function addFeed() {
    if (!selectedFeedId.value) return;
    
    try {
      await axios.post(`${API_URL}/ai-grupa/feed`, {
        feedId: selectedFeedId.value
      });
      selectedFeedId.value = '';
      await loadAIGroup();
    } catch (error) {
      alert(error.response?.data?.error || 'Greška pri dodavanju feeda');
    }
  }
  
  async function removeFeed(feedId) {
    try {
      await axios.delete(`${API_URL}/ai-grupa/feed/${feedId}`);
      await loadAIGroup();
    } catch (error) {
      alert('Greška pri uklanjanju feeda');
    }
  }
  
  async function generateSummary() {
    if (!canGenerate.value || isGenerating.value) return;
    
    isGenerating.value = true;
    try {
      await axios.post(`${API_URL}/ai-grupa/summary/generate`);
      await loadSummaries();
      await loadGenerationStatus();
      
      const toast = document.createElement('div');
      toast.className = 'toast toast-top toast-center';
      toast.innerHTML = `
        <div class="alert alert-success">
          <span>AI sažetak uspješno generiran!</span>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch (error) {
      alert(error.response?.data?.error || 'Greška pri generiranju sažetka');
    } finally {
      isGenerating.value = false;
    }
  }
  
  async function deleteSummary(id) {
    if (!confirm('Jesi li siguran da želiš obrisati ovaj sažetak?')) return;
    
    try {
      await axios.delete(`${API_URL}/ai-grupa/summaries/${id}`);
      await loadSummaries();
    } catch (error) {
      alert('Greška pri brisanju sažetka');
    }
  }
  
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('hr-HR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  onMounted(() => {
    loadAIGroup();
    loadAllFeeds();
    loadGenerationStatus();
    loadSummaries();
    
    // Refresh status every minute
    setInterval(loadGenerationStatus, 60000);
  });
  </script>
  
  <style scoped>
  @media (max-width: 375px) {
    .card-body {
      padding: 1rem;
    }
    
    .btn-lg {
      font-size: 0.875rem;
      padding: 0.5rem 1rem;
    }
    
    .badge-lg {
      font-size: 0.75rem;
    }
  }
  
  .card {
    transition: all 0.3s ease;
  }
  
  .card:hover {
    transform: translateY(-2px);
  }
  
  .bg-gradient-to-br {
    background: linear-gradient(to bottom right, var(--p), var(--s));
  }
  </style>
  
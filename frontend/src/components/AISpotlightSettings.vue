<template>
    <div class="ai-spotlight-settings">
      <div class="header">
        <h2>AI Spotlight</h2>
        <p class="subtitle">Personalizirani sažetak vijesti - do 3x dnevno</p>
      </div>
  
      <!-- trenutni status generiranja -->
      <div class="generation-status" :class="statusClass">
        <div class="status-info">
          <span class="icon">{{ statusIcon }}</span>
          <div>
            <p class="status-text">{{ statusText }}</p>
            <p class="status-detail">{{ statusDetail }}</p>
          </div>
        </div>
        <button 
          @click="generateSummary" 
          :disabled="!canGenerate || isGenerating"
          class="btn-generate"
        >
          <span v-if="isGenerating">⏳ Generiranje...</span>
          <span v-else>✨ Generiraj Sažetak</span>
        </button>
      </div>
  
      <!-- add feed -->
      <div class="feed-section">
        <div class="section-header">
          <h3>RSS Feedovi</h3>
          <span class="feed-count">{{ aiGroup.feedIds?.length || 0 }} / 5</span>
        </div>
  
        <!-- lista dodanih feedova -->
        <div v-if="selectedFeeds.length > 0" class="selected-feeds">
          <div 
            v-for="feed in selectedFeeds" 
            :key="feed.id"
            class="feed-item"
          >
            <div class="feed-info">
              <span class="feed-icon">📰</span>
              <div>
                <p class="feed-name">{{ feed.naziv }}</p>
                <p class="feed-url">{{ feed.url }}</p>
              </div>
            </div>
            <button 
              @click="removeFeed(feed.id)" 
              class="btn-remove"
              title="Ukloni feed"
            >
              ✕
            </button>
          </div>
        </div>
  
        <!-- placeholder ako nema niti jednog feedova -->
        <div v-else class="empty-state">
          <p>Još nisi dodao feedove u AI grupu</p>
          <p class="hint">Dodaj do 5 RSS izvora za personalizirani AI sažetak</p>
        </div>
  
        <!-- add novog feeda -->
        <div v-if="(aiGroup.feedIds?.length || 0) < 5" class="add-feed-section">
          <select v-model="selectedFeedId" class="feed-select">
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
            class="btn-add"
          >
            ➕ Dodaj
          </button>
        </div>
  
        <div v-else class="max-feeds-notice">
          ⚠️ Dostignut maksimalni broj feedova (5/5)
        </div>
      </div>

      <div v-if="summaries.length > 0" class="summaries-section">
        <h3>Nedavni AI Sažeci</h3>
        <div 
          v-for="summary in summaries" 
          :key="summary._id"
          class="summary-card"
        >
          <div class="summary-header">
            <h4>{{ summary.summary.headline }}</h4>
            <span class="summary-date">
              {{ formatDate(summary.generatedAt) }}
            </span>
          </div>
          <div class="summary-content">
            <div 
              v-for="(section, idx) in summary.summary.sections" 
              :key="idx"
              class="summary-section"
            >
              <h5>{{ section.category }}</h5>
              <p>{{ section.summary }}</p>
              <div class="top-articles">
                <a 
                  v-for="(article, i) in section.topArticles" 
                  :key="i"
                  :href="article.link"
                  target="_blank"
                  class="article-link"
                >
                  {{ article.title }} <span class="source">({{ article.source }})</span>
                </a>
              </div>
            </div>
          </div>
          <div class="summary-footer">
            <span>📊 {{ summary.articlesCount }} članaka</span>
            <button 
              @click="deleteSummary(summary._id)" 
              class="btn-delete"
            >
              🗑️ Obriši
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import axios from 'axios';
  
  const API_URL = 'http://localhost:3005/api';

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
  
  const statusClass = computed(() => {
    if (!canGenerate.value) return 'status-limited';
    return 'status-available';
  });
  
  const statusIcon = computed(() => {
    if (!canGenerate.value) return '🚫';
    return '✅';
  });
  
  const statusText = computed(() => {
    if (!generationStatus.value) return 'Učitavanje...';
    const remaining = generationStatus.value.remainingGenerations;
    if (remaining === 0) return 'Dnevni limit dostignut';
    return `Preostalo generiranja danas: ${remaining}/3`;
  });
  
  const statusDetail = computed(() => {
    if (!generationStatus.value) return '';
    const generated = generationStatus.value.generatedToday;
    if (generated === 0) return 'Još nisi generirao sažetak danas';
    if (generated === 3) return 'Novi sažetak dostupan sutra u 00:00';
    return `Generirano ${generated}x danas`;
  });
  
  // metode
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
      const response = await axios.post(`${API_URL}/ai-grupa/summary/generate`);
      alert('AI sažetak uspješno generiran!');
      await loadSummaries();
      await loadGenerationStatus();
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
    
    // refresh 1 min
    setInterval(loadGenerationStatus, 60000);
  });
  </script>
  
  <style scoped>
  .ai-spotlight-settings {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .header {
    margin-bottom: 2rem;
    text-align: center;
  }
  
  .header h2 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: #2c3e50;
  }
  
  .subtitle {
    color: #7f8c8d;
    font-size: 0.95rem;
  }
  
  /* Status Generiranja */
  .generation-status {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
  }
  
  .generation-status.status-limited {
    background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  }
  
  .status-info {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .status-info .icon {
    font-size: 2rem;
  }
  
  .status-text {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
  }
  
  .status-detail {
    font-size: 0.9rem;
    opacity: 0.9;
    margin: 0.25rem 0 0 0;
  }
  
  .btn-generate {
    background: white;
    color: #667eea;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .btn-generate:hover:not(:disabled) {
    transform: translateY(-2px);
  }
  
  .btn-generate:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .feed-section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .section-header h3 {
    margin: 0;
    color: #2c3e50;
  }
  
  .feed-count {
    background: #3498db;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
  }
  
  .selected-feeds {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .feed-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    transition: background 0.2s;
  }
  
  .feed-item:hover {
    background: #e9ecef;
  }
  
  .feed-info {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex: 1;
  }
  
  .feed-icon {
    font-size: 1.5rem;
  }
  
  .feed-name {
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
  }
  
  .feed-url {
    font-size: 0.85rem;
    color: #7f8c8d;
    margin: 0.25rem 0 0 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .btn-remove {
    background: #e74c3c;
    color: white;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
  }
  
  .btn-remove:hover {
    transform: scale(1.1);
  }
  
  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #95a5a6;
  }
  
  .empty-state p {
    margin: 0.5rem 0;
  }
  
  .hint {
    font-size: 0.9rem;
  }
  
  .add-feed-section {
    display: flex;
    gap: 0.75rem;
  }
  
  .feed-select {
    flex: 1;
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 0.95rem;
    background: white;
    cursor: pointer;
  }
  
  .btn-add {
    background: #27ae60;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.2s;
  }
  
  .btn-add:hover:not(:disabled) {
    background: #229954;
  }
  
  .btn-add:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .max-feeds-notice {
    text-align: center;
    padding: 1rem;
    background: #fff3cd;
    border-radius: 8px;
    color: #856404;
    font-weight: 500;
  }
  
  .summaries-section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .summaries-section h3 {
    margin-top: 0;
    color: #2c3e50;
  }
  
  .summary-card {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1rem;
  }
  
  .summary-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }
  
  .summary-header h4 {
    margin: 0;
    color: #2c3e50;
  }
  
  .summary-date {
    font-size: 0.85rem;
    color: #7f8c8d;
  }
  
  .summary-section {
    margin-bottom: 1rem;
  }
  
  .summary-section h5 {
    color: #3498db;
    margin: 0 0 0.5rem 0;
  }
  
  .summary-section p {
    color: #555;
    line-height: 1.6;
  }
  
  .top-articles {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  
  .article-link {
    color: #3498db;
    text-decoration: none;
    font-size: 0.9rem;
  }
  
  .article-link:hover {
    text-decoration: underline;
  }
  
  .source {
    color: #95a5a6;
    font-size: 0.85rem;
  }
  
  .summary-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
    color: #7f8c8d;
    font-size: 0.9rem;
  }
  
  .btn-delete {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.2s;
  }
  
  .btn-delete:hover {
    background: #c0392b;
  }
  
  /* Dark Mode Support */
  @media (prefers-color-scheme: dark) {
    .ai-spotlight-settings {
      color: #ecf0f1;
    }
    
    .header h2,
    .section-header h3,
    .feed-name,
    .summary-header h4 {
      color: #ecf0f1;
    }
    
    .feed-section,
    .summaries-section {
      background: #2c3e50;
    }
    
    .feed-item {
      background: #34495e;
    }
    
    .feed-item:hover {
      background: #3d566e;
    }
    
    .summary-card {
      background: #34495e;
      border-color: #445566;
    }
  }
  </style>
  
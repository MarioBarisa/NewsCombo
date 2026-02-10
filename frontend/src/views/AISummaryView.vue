<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
import { API_URL as BASE_URL } from '../config.js';
const API_URL = `${BASE_URL}/api`;

const aiGroup = ref({});
const summaries = ref([]);
const generationStatus = ref(null);
const isGenerating = ref(false);
const isLoading = ref(true);

const hasFeedsInGroup = computed(() => {
  return aiGroup.value.feedIds && aiGroup.value.feedIds.length > 0;
});

const canGenerate = computed(() => {
  return generationStatus.value?.canGenerate && hasFeedsInGroup.value;
});

// mozda emoji staviti? ili manje emojishitificationa?
const statusIcon = computed(() => {
  if (!generationStatus.value) return '⏳';
  if (generationStatus.value.remainingGenerations === 0) return '';
  if (generationStatus.value.remainingGenerations === 3) return '';
  return '';
});

const statusText = computed(() => {
  if (!generationStatus.value) return 'Učitavanje...';
  const remaining = generationStatus.value.remainingGenerations;
  if (remaining === 0) return 'Dnevni limit dostignut (3/3)';
  if (remaining === 3) return 'Spremno za generiranje';
  return `Možeš generirati još ${remaining} sažetka danas`;
});

async function loadAIGroup() {
  try {
    const response = await axios.get(`${API_URL}/ai-grupa`);
    aiGroup.value = response.data;
  } catch (error) {
    console.error('Greška pri učitavanju:', error);
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

async function loadGenerationStatus() {
  try {
    const response = await axios.get(`${API_URL}/ai-grupa/summary/status`);
    generationStatus.value = response.data;
  } catch (error) {
    console.error('Greška pri učitavanju statusa:', error);
  }
}

async function generateSummary() {
  if (!canGenerate.value || isGenerating.value) return;

  isGenerating.value = true;
  try {
    const response = await axios.post(`${API_URL}/ai-grupa/summary/generate`);
    console.log('Sažetak generiran:', response.data);

    await loadSummaries();
    await loadGenerationStatus();

    showToast('AI sažetak uspješno generiran', 'success');
  } catch (error) {
    console.error('Greška pri generiranju:', error);
    showToast(error.response?.data?.error || error.response?.data?.details || 'Greška pri generiranju', 'error');
  } finally {
    isGenerating.value = false;
  }
}

async function deleteSummary(id) {
  if (!confirm('Želiš obrisati ovaj sažetak?')) return;

  try {
    await axios.delete(`${API_URL}/ai-grupa/summaries/${id}`);
    await loadSummaries();
    showToast('Sažetak obrisan', 'info');
  } catch (error) {
    showToast('Greška pri brisanju', 'error');
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-top toast-center z-50`;
  const alertClass = type === 'success' ? 'alert-success' : type === 'error' ? 'alert-error' : 'alert-info';
  toast.innerHTML = `<div class="alert ${alertClass}"><span>${message}</span></div>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
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

function goToSettings() {
  router.push('/settings/feeds');
}

onMounted(async () => {
  isLoading.value = true;
  await Promise.all([
    loadAIGroup(),
    loadSummaries(),
    loadGenerationStatus()
  ]);
  isLoading.value = false;

  setInterval(() => {
    loadGenerationStatus();
    loadSummaries();
  }, 60000);
});

async function deleteAllSummaries() {
  try {
    await axios.delete(`${API_URL}/ai-grupa/summaries`);
    await loadSummaries();
    showToast('Svi sažeci uspješno obrisani', 'success');
  } catch (error) {
    console.error('Greška pri brisanju svih sažetaka:', error);
    showToast('Greška pri brisanju sažetaka', 'error');
  }
}

</script>

<template>
  <div class="w-full max-w-4xl mx-auto px-4 py-8">
    <div v-if="isLoading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else>
      <div v-if="!hasFeedsInGroup" class="text-center py-16">
        <div class="alert alert-warning max-w-2xl mx-auto mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            class="stroke-current shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 class="font-bold">Nemaš dodanih feedova u AI grupu</h3>
            <div class="text-sm">Dodaj barem jedan RSS feed kako bi AI mogao generirati sažetak</div>
          </div>
        </div>

        <button @click="goToSettings" class="btn btn-primary btn-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Idi na Postavke
        </button>
      </div>

      <div v-else>
        <div class="card bg-gradient-to-br from-primary to-secondary text-primary-content shadow-xl mb-8">
          <div class="card-body">
            <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div class="flex items-center gap-4">
                <div class="text-5xl">{{ statusIcon }}</div>
                <div>
                  <h2 class="card-title text-xl">{{ statusText }}</h2>
                  <p class="text-sm opacity-90">
                    {{ aiGroup.feedIds?.length || 0 }} RSS feedova
                  </p>
                  <hr class="my-2 opacity-30">
                  <p class="text-xs opacity-80">AI može pogriješiti. Uvijek provjeri izvore.</p>
                  <p class="text-xs opacity-80 mt-1">Korištenjem ove funkcije prihvaćaš Google Gemini Uvjete korištenja.</p>
                </div>
              </div>

              <div class="flex gap-2">
                <button @click="loadSummaries" class="btn btn-neutral btn-sm" :disabled="isGenerating">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>

                <button @click="generateSummary" :disabled="!canGenerate || isGenerating" class="btn btn-neutral">
                  <span v-if="isGenerating" class="loading loading-spinner loading-sm"></span>
                  <span v-else>Generiraj Sažetak</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- LISTA SAŽETAKA -->
        <div v-if="summaries.length > 0">
          
          <!-- HEADER SA GUMBOM ZA BRISANJE SVEGA -->
          <div class="flex justify-between items-center mb-6 px-1">
            <h2 class="text-xl font-bold opacity-70">Tvoji sažeci</h2>
            <button onclick="delete_all_summaries_view_modal.showModal()" class="btn btn-sm btn-ghost text-error hover:bg-error/10 gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Obriši povijest
            </button>
          </div>

          <div class="space-y-6">
            <div 
              v-for="summary in summaries" 
              :key="summary._id"
              class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all"
            >
              <div class="card-body">
                <div class="flex flex-col sm:flex-row justify-between items-start gap-2 mb-4">
                  <h3 class="card-title text-2xl">{{ summary.summary.headline }}</h3>
                  <div class="badge badge-ghost badge-lg whitespace-nowrap">
                    {{ formatDate(summary.generatedAt) }}
                  </div>
                </div>

                <div class="space-y-6">
                  <div v-for="(section, idx) in summary.summary.sections" :key="idx"
                    class="border-l-4 border-primary pl-4 hover:bg-base-200 p-4 rounded-r-lg transition-colors">
                    <h4 class="font-bold text-primary mb-2 text-lg flex items-center gap-2">
                      <span class="badge badge-primary badge-sm">{{ idx + 1 }}</span>
                      {{ section.category }}
                    </h4>
                    <p class="text-base opacity-90 mb-4 leading-relaxed">{{ section.summary }}</p>

                    <div class="space-y-2">
                      <p class="text-sm font-semibold opacity-70 mb-2">Povezani članci:</p>
                      <a v-for="(article, i) in section.topArticles" :key="i" :href="article.link" target="_blank"
                        class="flex items-start gap-2 text-sm link link-hover p-2 hover:bg-base-300 rounded transition-colors">
                        <span class="badge badge-sm badge-outline flex-shrink-0">{{ i + 1 }}</span>
                        <span class="flex-1">
                          {{ article.title }}
                          <span class="opacity-50 text-xs ml-1">({{ article.source }})</span>
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none"
                          viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>

                <div class="card-actions justify-between items-center mt-6 pt-4 border-t border-base-300">
                  <div class="flex flex-wrap items-center gap-2">
                    <div class="badge badge-outline">{{ summary.articlesCount }} članaka</div>
                    <div class="badge badge-outline">#{{ summary.generationNumber }}</div>
                    <div class="badge badge-outline">{{ summary.feedsSources?.length || 0 }} izvora</div>
                  </div>
                  <button @click="deleteSummary(summary._id)" class="btn btn-sm btn-error btn-outline">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Obriši
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-24 h-24 mx-auto mb-4 text-base-content opacity-20"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p class="text-xl opacity-60 mb-4">Još nemaš generiranih AI sažetaka</p>
          <p class="text-sm opacity-50 mb-6">Klikni "Generiraj Sažetak" kako bi AI analizirao tvoje feedove</p>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <dialog id="delete_all_summaries_view_modal" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg text-error">Obriši sve generirane Ai sažetke?</h3>
        <p class="py-4">Jesi li siguran da želiš trajno obrisati sve generirane AI sažetke? Ovu radnju nije moguće poništiti.</p>
        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-ghost">Odustani</button>
            <button @click="deleteAllSummaries" class="btn btn-error ml-2">Obriši sve</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>

  </div>
</template>>

<style scoped>
.bg-gradient-to-br {
  background: linear-gradient(to bottom right, var(--p), var(--s));
}
</style>

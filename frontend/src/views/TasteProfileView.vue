<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTasteStore } from '../stores/tasteStore';
import { useFeedsStore } from '../stores/feedStore';

const taste = useTasteStore();
const feedsStore = useFeedsStore();
const router = useRouter();

const showDeleteModal = ref(false);
const isDeleting = ref(false);
const deleteDone = ref(false);
const showAvoid = ref(false);

onMounted(() => {
  if (!taste.hydrated) {
    taste.init().catch((e) => console.warn('tasteStore init:', e));
  }
});

// Profil se smatra "upoznatim" nakon dovoljno interakcija
const hasData = computed(() => taste.totalInteractions >= 5);

const sources = computed(() => taste.sortedEntries('src'));
const topics = computed(() => taste.sortedEntries('top'));

const topSources = computed(() => sources.value.filter((e) => e.s > 0.02).slice(0, 10));
const avoidSources = computed(() => sources.value.filter((e) => e.s < -0.05).slice(0, 5));
const posTopics = computed(() => topics.value.filter((e) => e.s > 0.02).slice(0, 24));
const negTopics = computed(() => topics.value.filter((e) => e.s < -0.05).slice(0, 12));

const barPct = (s) => Math.min(100, Math.max(4, Math.round(Math.abs(s) * 100)));

const signedPct = (v) => {
  const pct = Math.round((v || 0) * 100);
  return pct > 0 ? `+${pct}%` : `${pct}%`;
};

const faviconUrl = (domain) => {
  const clean = String(domain).replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
  return `https://icons.duckduckgo.com/ip3/${clean}.ico`;
};

const CATEGORY_LABELS = {
  hrvatska: 'Hrvatska',
  world: 'Svijet',
  tech: 'Tehnologija',
  science: 'Znanost',
  business: 'Biznis',
  sport: 'Sport',
  custom: 'Prilagođeno',
  other: 'Ostalo',
  ostalo: 'Ostalo',
};
const catLabel = (key) => CATEGORY_LABELS[key] || key;

async function handleReset() {
  isDeleting.value = true;
  await taste.resetProfile();
  isDeleting.value = false;
  showDeleteModal.value = false;
  deleteDone.value = true;
  setTimeout(() => (deleteDone.value = false), 4000);
}

function goToCombo() {
  feedsStore.selectCategory('combo');
  router.push('/');
}
</script>

<template>
  <main class="w-full max-w-3xl mx-auto px-4 py-8">
    <!-- Naslov -->
    <div class="flex items-center gap-3 mb-6">
      <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          class="h-6 w-6 text-primary">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
        </svg>
      </div>
      <div>
        <h1 class="text-2xl font-bold leading-tight">Moji interesi</h1>
        <p class="text-sm opacity-70">Što je NewsCombo naučio o tvojim interesima</p>
      </div>
    </div>

    <!-- Prazno stanje -->
    <div v-if="!hasData && taste.hydrated" class="card bg-base-100 shadow-lg mb-6">
      <div class="card-body items-center text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 opacity-20 mb-3" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        <h2 class="text-lg font-semibold">Još te ne poznajemo</h2>
        <p class="opacity-70 max-w-md text-sm">
          Označi nekoliko članaka srcem ili ih otvori — NewsCombo uči direktno iz tvojih klikova,
          sve u tvom pregledniku. Nakon par interakcija ovdje ćeš vidjeti svoj profil interesa.
        </p>
        <button @click="goToCombo" class="btn btn-primary btn-sm mt-4">
          Otvori NewsCombo
        </button>
      </div>
    </div>

    <template v-else>
      <!-- Statistika -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 flex-row items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-error/10 text-error flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :fill="'currentColor'" viewBox="0 0 24 24"
                stroke="currentColor" stroke-width="1">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div><div class="text-xl font-bold leading-none">{{ taste.stats.likes }}</div>
              <div class="text-xs opacity-60">srca</div></div>
          </div>
        </div>
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 flex-row items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-base-200 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div><div class="text-xl font-bold leading-none">{{ taste.stats.dislikes }}</div>
              <div class="text-xs opacity-60">ne sviđa mi se</div></div>
          </div>
        </div>
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 flex-row items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-info/10 text-info flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div><div class="text-xl font-bold leading-none">{{ taste.stats.opens }}</div>
              <div class="text-xs opacity-60">otvorenih</div></div>
          </div>
        </div>
        <div class="card bg-base-100 shadow">
          <div class="card-body p-4 flex-row items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div><div class="text-xl font-bold leading-none">{{ Object.keys(taste.profile.src).length }}</div>
              <div class="text-xs opacity-60">izvora</div></div>
          </div>
        </div>
      </div>

      <!-- Izvori koje voliš -->
      <div class="card bg-base-100 shadow mb-6">
        <div class="card-body p-5">
          <h2 class="card-title text-base">Izvori koje voliš</h2>
          <p class="text-xs opacity-60 -mt-1 mb-2">Izračunato iz tvojih oznaka sviđanja, otvorenih i spremljenih članaka</p>
          <div v-if="topSources.length === 0" class="text-sm opacity-50">Još nema istaknutih izvora.</div>
          <ul class="space-y-1.5">
            <li v-for="entry in topSources" :key="entry.key"
              class="flex items-center gap-3 rounded-lg px-2 -mx-2 py-1.5 hover:bg-base-300/40 transition-colors">
              <img :src="faviconUrl(entry.key)" alt="" class="w-5 h-5 rounded flex-shrink-0 bg-base-300"
                loading="lazy" @error="$event.target.style.visibility = 'hidden'" />
              <span class="text-sm w-36 sm:w-44 truncate">{{ entry.key }}</span>
              <progress class="progress progress-success flex-1 h-3 rounded-full" :value="barPct(entry.s)" max="100"></progress>
              <span class="text-xs font-mono w-12 text-right">{{ signedPct(entry.s) }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Teme koje te zanimaju -->
      <div class="card bg-base-100 shadow mb-6">
        <div class="card-body p-5">
          <h2 class="card-title text-base">Teme koje te zanimaju</h2>
          <p class="text-xs opacity-60 -mt-1 mb-3">Ključne riječi iz naslova koji te zainteresirali</p>
          <div v-if="posTopics.length === 0" class="text-sm opacity-50">Još nema prepoznatih tema.</div>
          <div class="flex flex-wrap gap-2">
            <span v-for="topic in posTopics" :key="topic.key"
              class="badge tooltip cursor-default"
              :class="topic.s >= 0.5 ? 'badge-success' : topic.s >= 0.25 ? 'badge-success badge-outline' : 'badge-ghost'"
              :data-tip="`Snaga interesa: ${signedPct(topic.s)}`">
              {{ topic.key }}
            </span>
          </div>
          <template v-if="negTopics.length > 0 || avoidSources.length > 0">
            <button @click="showAvoid = !showAvoid"
              class="btn btn-ghost btn-xs mt-4 self-start text-error/80 normal-case">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 transition-transform"
                :class="{ 'rotate-90': showAvoid }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              Što izbjegavaš ({{ negTopics.length + avoidSources.length }})
            </button>
            <div v-if="showAvoid" class="mt-3 space-y-3">
              <div v-if="avoidSources.length" class="flex flex-wrap gap-2 items-center">
                <span class="text-xs opacity-60 mr-1">Izvori:</span>
                <span v-for="entry in avoidSources" :key="entry.key" class="badge badge-error badge-outline badge-sm">
                  {{ entry.key }}
                </span>
              </div>
              <div v-if="negTopics.length" class="flex flex-wrap gap-2 items-center">
                <span class="text-xs opacity-60 mr-1">Teme:</span>
                <span v-for="topic in negTopics" :key="topic.key" class="badge badge-error badge-outline badge-sm">
                  {{ topic.key }}
                </span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Kako algoritam radi -->
      <div class="card bg-base-100 shadow mb-6">
        <div class="card-body p-5">
          <h2 class="card-title text-base">Kako NewsCombo uči</h2>
          <p class="text-sm opacity-80 mb-3">
            Nema čarolije — algoritam broji jednostavne signale i pamti što te zanima.
            Sve se računa u tvom pregledniku.
          </p>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <tbody>
                <tr>
                  <td class="w-10">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-error" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </td>
                  <td class="font-medium">Srce</td>
                  <td class="opacity-70 text-sm">Jak pozitivni signal — najbolji način da algoritam sazna što voliš.</td>
                </tr>
                <tr>
                  <td>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </td>
                  <td class="font-medium">Ne sviđa mi se</td>
                  <td class="opacity-70 text-sm">Jak negativni signal — sličan sadržaj rjeđe će ti se prikazivati.</td>
                </tr>
                <tr>
                  <td>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </td>
                  <td class="font-medium">Otvaranje članka</td>
                  <td class="opacity-70 text-sm">Blagi pozitivni signal — i bez lajka pokazuje interes.</td>
                </tr>
                <tr>
                  <td>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </td>
                  <td class="font-medium">Spremljeni članak</td>
                  <td class="opacity-70 text-sm">Umjeren pozitivni signal.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul class="text-sm space-y-2 opacity-80 mt-2">
            <li class="flex gap-2">
              <span class="text-primary font-bold">•</span>
              Algoritam prati <strong>izvore</strong> (domene), <strong>teme</strong> (ključne riječi iz naslova) i <strong>kategorije</strong>.
            </li>
            <li class="flex gap-2">
              <span class="text-primary font-bold">•</span>
              Algoritam polako <strong>zaboravlja</strong> stari interesi izgube pola snage nakon otprilike dva tjedna.
            </li>
            <li class="flex gap-2">
              <span class="text-primary font-bold">•</span>
              Feed ostaje <strong>kronološki</strong> personalizacija samo unutar manjih skupina od 10 vijesti
              gura ti najzanimljivije više.
            </li>
            <li class="flex gap-2">
              <span class="text-primary font-bold">•</span>
              Povremeno namjerno ubacimo malo <strong>novoga</strong> da ne zaglibiš u mjehur istog mišljenja.
            </li>
          </ul>
        </div>
      </div>

      <!-- Privatnost -->
      <div class="card bg-base-100 shadow border border-success/20 mb-6">
        <div class="card-body p-5">
          <div class="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h2 class="card-title text-base mb-0">Tvoji podaci ostaju tvoji</h2>
          </div>
          <ul class="text-sm space-y-1.5 opacity-80">
            <li class="flex gap-2"><span class="text-success font-bold">✓</span> Algoritam radi 100% u tvom pregledniku — server ne računa ništa.</li>
            <li class="flex gap-2"><span class="text-success font-bold">✓</span> Na server ide samo nekoliko kilobajta brojčanih težina (izvori, teme, kategorije).</li>
            <li class="flex gap-2"><span class="text-success font-bold">✓</span> Ne spremaju se čitani članci, naslovi niti povijest klikanja.</li>
            <li class="flex gap-2"><span class="text-success font-bold">✓</span> Podaci se koriste samo za sinkronizaciju s tvojim vlastitim uređajima.</li>
            <li class="flex gap-2"><span class="text-success font-bold">✓</span> NIŠTA se ne prodaje, ne dijeli trećim stranama i ne koristi za treniranje AI modela.</li>
          </ul>
          <div class="card-actions justify-end mt-3">
            <button @click="showDeleteModal = true" class="btn btn-outline btn-error btn-xs sm:btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Obriši moj profil interesa
            </button>
          </div>
          <div v-if="deleteDone" class="alert alert-success mt-2 py-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Profil obrisan. Algoritam kreće ispočetka.
          </div>
        </div>
      </div>
    </template>

    <!-- Potvrda brisanja -->
    <dialog :class="['modal', { 'modal-open': showDeleteModal }]">
      <div class="modal-box max-w-sm">
        <h3 class="font-bold text-lg">Obrisati profil interesa?</h3>
        <p class="py-3 text-sm opacity-80">
          Obrisat ćemo sve što je NewsCombo naučio o tvojim interesima — na svim uređajima.
          Ova radnja se ne može poništiti.
        </p>
        <div class="modal-action">
          <button @click="showDeleteModal = false" class="btn btn-ghost btn-sm" :disabled="isDeleting">Odustani</button>
          <button @click="handleReset" class="btn btn-error btn-sm" :disabled="isDeleting">
            <span v-if="isDeleting" class="loading loading-spinner loading-xs"></span>
            Obriši sve
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showDeleteModal = false">zatvori</button></form>
    </dialog>
  </main>
</template>

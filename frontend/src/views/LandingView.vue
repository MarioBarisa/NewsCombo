<template>
  <div class="min-h-screen bg-base-100 text-base-content">
    <div class="fixed left-4 top-4 z-50">
      <a href="#sadrzaj" class="btn btn-primary sr-only focus:not-sr-only">Preskoči na sadržaj</a>
    </div>
    <main id="sadrzaj">
      <section class="hero py-12 sm:py-20" aria-labelledby="hero-title">
        <div class="hero-content text-center flex-col px-4 max-w-3xl gap-0">
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 sm:h-28 sm:w-28 shrink-0" fill="none" viewBox="0 0 24 24" stroke="#F74420" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <h1 id="hero-title" class="text-5xl sm:text-7xl font-extrabold tracking-tighter">NewsCombo</h1>
          </div>
          <p class="text-lg sm:text-2xl text-base-content/70 mt-5 max-w-xl text-balance">Personalizirano praćenje vijesti putem RSS feedova</p>
          <div class="flex flex-wrap justify-center gap-3 mt-7">
            <button type="button" class="btn btn-primary px-7 motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0" @click="openAuth(true)">Registracija <span aria-hidden="true">→</span></button>
            <button type="button" class="btn btn-outline px-7" @click="openAuth(false)">Prijava</button>
          </div>
          <a href="#pregled" class="btn btn-ghost btn-sm text-base-content/60 mt-4 group">Pogledaj aplikaciju <span class="motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:translate-y-1" aria-hidden="true">↓</span></a>
        </div>
      </section>

      <div id="pregled" class="max-w-6xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16 scroll-mt-6">
        <LandingShowcase @algorithm-update="algorithmExample = $event" />
        <LandingAlgorithm :example="algorithmExample" class="mt-8 sm:mt-10" />

        <section id="znacajke" class="grid lg:grid-cols-[1.05fr_1fr] gap-5 items-stretch py-8 sm:py-12 scroll-mt-6" aria-label="Grupe izvora i izgled aplikacije">
          <article class="card card-border bg-secondary/8 border-secondary/20 m-0! min-w-0">
            <div class="card-body p-5! sm:p-6! gap-5">
              <div>
                <span class="badge badge-secondary badge-soft badge-sm mb-3">Grupe izvora</span>
                <h2 class="card-title text-xl sm:text-2xl tracking-tight">Svaka grupa ima svoj feed</h2>
                <p class="text-sm text-base-content/70 mt-2 leading-relaxed">Vijesti samo iz izvora koje staviš u grupu.</p>
              </div>
              <div class="grid gap-2" role="group" aria-label="Odaberi grupu izvora">
                <button v-for="group in sourceGroups" :key="group.name" type="button"
                  class="btn h-auto min-h-16 w-full justify-start text-left whitespace-normal p-3 gap-3"
                  :class="selectedGroup.name === group.name ? 'btn-secondary btn-soft' : 'btn-ghost border-base-300'"
                  :aria-pressed="selectedGroup.name === group.name" :aria-label="`Grupa ${group.name}`" @click="selectedGroup = group">
                  <span class="font-semibold w-14 shrink-0">{{ group.name }}</span>
                  <span class="text-xs font-normal leading-relaxed flex-1">{{ group.sources.join(' · ') }}</span>
                  <span aria-hidden="true">{{ selectedGroup.name === group.name ? '↓' : '→' }}</span>
                </button>
              </div>
              <div class="rounded-box bg-base-100 border border-base-300 overflow-hidden grow" aria-live="polite" aria-atomic="true">
                <div class="bg-base-200 px-4 py-3 flex items-center justify-between gap-2">
                  <h3 class="text-sm font-semibold">Feed: {{ selectedGroup.name }}</h3>
                  <span class="badge badge-ghost badge-sm">3 izvora</span>
                </div>
                <ul class="list" aria-label="Primjer vijesti iz odabrane grupe">
                  <li v-for="article in selectedGroup.articles" :key="article.title" class="list-row gap-3 p-4">
                    <span class="text-xs text-base-content/55 tabular-nums pt-0.5">{{ article.time }}</span>
                    <div>
                      <p class="text-xs text-base-content/60 mb-1">{{ article.source }}</p>
                      <p class="text-sm font-medium leading-snug">{{ article.title }}</p>
                    </div>
                  </li>
                </ul>
              </div>
              <p class="text-xs text-base-content/60 grow-0">Primjer feeda s ilustrativnim naslovima.</p>
            </div>
          </article>

          <article class="card card-border bg-accent/10 border-accent/20 m-0! min-w-0">
            <div class="card-body p-5! sm:p-6! gap-5">
              <div>
                <span class="badge badge-accent badge-soft badge-sm mb-3">Izgled aplikacije</span>
                <h2 class="card-title text-xl sm:text-2xl tracking-tight">Odaberi izgled aplikacije</h2>
                <p class="text-sm text-base-content/70 mt-2">Šest tema. Odaberi svoju.</p>
              </div>
              <div class="grid gap-5 grow">
                <div class="grid grid-cols-3 gap-3 p-1" role="group" aria-label="Isprobaj DaisyUI teme">
                  <button v-for="theme in previewThemes" :key="theme" :data-theme="theme" type="button"
                    class="btn h-auto block rounded-box bg-base-100 text-base-content border border-base-300 p-2 sm:p-3 text-left transition-transform motion-safe:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    :class="{ 'ring-2 ring-primary ring-offset-1 ring-offset-base-200': previewTheme === theme }"
                    :aria-pressed="previewTheme === theme" :aria-label="`Tema ${theme}`" @click="previewTheme = theme">
                    <span class="flex gap-1.5 mb-3" aria-hidden="true"><span class="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-primary"></span><span class="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-secondary"></span><span class="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-accent"></span></span>
                    <span class="text-xs sm:text-sm font-medium">{{ theme }}</span>
                  </button>
                </div>
                <div :data-theme="previewTheme" class="rounded-box bg-base-100 text-base-content border border-base-300 p-4 transition-colors shadow-sm">
                  <div class="flex items-center justify-between gap-2 mb-4">
                    <span class="font-semibold text-sm">Najnovije vijesti</span>
                    <span class="badge badge-ghost badge-sm">{{ previewTheme }}</span>
                  </div>
                  <div class="rounded-lg bg-base-200 p-3 space-y-2">
                    <span class="badge badge-primary badge-soft badge-sm">Tehnologija</span>
                    <p class="text-sm font-semibold">Otvoreni kod: alati za razvoj weba</p>
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-xs text-base-content/60">10:42</span>
                      <a href="#pregled" class="btn btn-primary btn-xs">Pogledaj feed</a>
                    </div>
                  </div>
                  <div class="rounded-box border border-base-300 p-3 mt-3 space-y-2">
                    <span class="badge badge-secondary badge-soft badge-sm">Znanost</span>
                    <p class="text-sm font-semibold">Kako gradovi postaju zeleniji</p>
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-xs text-base-content/60">10:35</span>
                      <span class="text-secondary" aria-hidden="true">♥</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section class="grid md:grid-cols-2 gap-5 mb-8 sm:mb-12" aria-label="Sinkronizacija i privatnost">
          <article class="card card-border bg-info/10 border-info/25 m-0! group motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-1">
            <div class="card-body p-5! sm:p-6! gap-4">
              <div class="flex items-center gap-3" aria-hidden="true">
                <Icon :icon="devicesIcon" class="h-8 w-8 text-info" aria-hidden="true" />
                <Icon :icon="syncIcon" class="h-5 w-5 text-info motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:rotate-180" aria-hidden="true" />
              </div>
              <h2 class="card-title text-xl">Tvoj NewsCombo na svakom uređaju</h2>
              <p class="text-sm text-base-content/70">Izvori, spremljeni članci i interesi povezani su s tvojim računom.</p>
            </div>
          </article>
          <article class="card card-border bg-success/10 border-success/25 m-0! group motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-1">
            <div class="card-body p-5! sm:p-6! gap-4">
              <Icon :icon="shieldCheckIcon" class="h-8 w-8 text-success motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-110" aria-hidden="true" />
              <h2 class="card-title text-xl">Tvoji podaci ostaju tvoji</h2>
              <p class="text-sm text-base-content/70">Personalizacija radi u tvom pregledniku, a profil interesa sinkronizira se između tvojih uređaja. Podatke ne prodajemo, ne dijelimo s trećim stranama i ne koristimo za treniranje AI modela.</p>
            </div>
          </article>
        </section>


        <section class="flex flex-col sm:flex-row items-center justify-between gap-5 mt-10 pt-8 border-t border-base-300" aria-label="Prijava i registracija">
          <div class="text-center sm:text-left">
            <h2 class="text-xl font-bold">Dodaj izvore koje voliš čitati.</h2>
          </div>
          <div class="flex flex-wrap justify-center gap-3 shrink-0">
            <button type="button" class="btn btn-primary px-7 motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0" @click="openAuth(true)">Registracija <span aria-hidden="true">→</span></button>
            <button type="button" class="btn btn-outline px-7" @click="openAuth(false)">Prijava</button>
          </div>
        </section>
      </div>
    </main>

    <dialog ref="authDialog" class="modal" aria-labelledby="auth-title" @close="clearAuthError">
      <div class="modal-box max-w-md">
        <form method="dialog"><button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" aria-label="Zatvori prijavu">✕</button></form>
        <h2 id="auth-title" class="font-bold text-xl mb-5 pr-8">{{ showRegister ? 'Registracija' : 'Prijava u NewsCombo' }}</h2>
        <div class="tabs tabs-box bg-base-200 mb-5" role="group" aria-label="Prijava ili registracija">
          <button type="button" class="tab flex-1" :class="{ 'tab-active': !showRegister }" :aria-pressed="!showRegister"
            :disabled="isSubmitting" @click="setAuthMode(false)">Prijava</button>
          <button type="button" class="tab flex-1" :class="{ 'tab-active': showRegister }" :aria-pressed="showRegister"
            :disabled="isSubmitting" @click="setAuthMode(true)">Registracija</button>
        </div>
        <form @submit.prevent="handleSubmit" class="space-y-4" :aria-busy="isSubmitting">
          <div v-if="showRegister" class="space-y-2">
            <label for="landing-name" class="label text-sm font-medium">Ime</label>
            <input id="landing-name" ref="nameInput" v-model="name" type="text" placeholder="Tvoje ime" autocomplete="name"
              required :disabled="isSubmitting" class="input w-full" />
          </div>
          <div class="space-y-2">
            <label for="landing-email" class="label text-sm font-medium">Email</label>
            <input id="landing-email" ref="emailInput" v-model="email" type="email" placeholder="tvoj@email.com" autocomplete="email"
              required :disabled="isSubmitting" class="input w-full" />
          </div>
          <div class="space-y-2">
            <label for="landing-password" class="label text-sm font-medium">Lozinka</label>
            <input id="landing-password" v-model="password" type="password" placeholder="••••••••"
              :autocomplete="showRegister ? 'new-password' : 'current-password'" required :disabled="isSubmitting" class="input w-full" />
          </div>
          <label v-if="showRegister" class="flex items-start gap-3 text-sm leading-relaxed cursor-pointer">
            <input v-model="acceptedLegal" type="checkbox" required :disabled="isSubmitting" class="checkbox checkbox-primary checkbox-sm mt-1 shrink-0" />
            <span>Prihvaćam <router-link to="/tos" target="_blank" rel="noopener noreferrer" class="link link-primary">Uvjete korištenja</router-link> i <router-link to="/privacy" target="_blank" rel="noopener noreferrer" class="link link-primary">Pravila privatnosti</router-link>.</span>
          </label>
          <div v-if="error" class="alert alert-error text-sm py-3" role="alert">{{ error }}</div>
          <button type="submit" class="btn btn-primary w-full" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="loading loading-spinner loading-sm" aria-hidden="true"></span>
            {{ isSubmitting ? 'Pričekaj…' : showRegister ? 'Registriraj se' : 'Prijavi se' }}
          </button>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button aria-label="Zatvori prijavu">Zatvori</button></form>
    </dialog>
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue';
import { Icon } from '@iconify/vue';
import devicesIcon from '@iconify-icons/lucide/monitor-smartphone';
import syncIcon from '@iconify-icons/lucide/refresh-cw';
import shieldCheckIcon from '@iconify-icons/lucide/shield-check';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import LandingShowcase from '../components/LandingShowcase.vue';
import LandingAlgorithm from '../components/LandingAlgorithm.vue';

const authStore = useAuthStore();
const router = useRouter();
const algorithmExample = ref(null);
const sourceGroups = [
  {
    name: 'Politika', sources: ['BBC News', 'The Guardian', 'Al Jazeera'],
    articles: [
      { title: 'Kako se donose zakoni', source: 'BBC News', time: '10:42' },
      { title: 'Uloga parlamenta u demokraciji', source: 'The Guardian', time: '10:30' },
      { title: 'O čemu razgovaraju svjetski čelnici', source: 'Al Jazeera', time: '10:15' },
    ],
  },
  {
    name: 'Tech', sources: ['TechCrunch', 'Ars Technica', 'WIRED'],
    articles: [
      { title: 'Otvoreni kod: alati za razvoj weba', source: 'TechCrunch', time: '10:35' },
      { title: 'Kako zajednice razvijaju nove aplikacije', source: 'Ars Technica', time: '10:20' },
      { title: 'Tehnologija koja mijenja svakodnevicu', source: 'WIRED', time: '10:05' },
    ],
  },
];
const selectedGroup = ref(sourceGroups[0]);
const previewThemes = ['nord', 'dracula', 'cupcake', 'retro', 'cyberpunk', 'forest'];
const previewTheme = ref(previewThemes[0]);
const authDialog = ref(null);
const emailInput = ref(null);
const nameInput = ref(null);
const email = ref('');
const password = ref('');
const name = ref('');
const showRegister = ref(false);
const error = ref('');
const isSubmitting = ref(false);
const acceptedLegal = ref(false);

function setAuthMode(register) {
  if (isSubmitting.value) return;
  showRegister.value = register;
  error.value = '';
}

async function openAuth(register) {
  setAuthMode(register);
  await nextTick();
  if (!authDialog.value.open) authDialog.value.showModal();
  if (showRegister.value) nameInput.value.focus();
  else emailInput.value.focus();
}

function clearAuthError() {
  password.value = '';
  error.value = '';
}

async function handleSubmit() {
  if (isSubmitting.value) return;
  if (showRegister.value && !acceptedLegal.value) {
    error.value = 'Prihvati Uvjete korištenja i Pravila privatnosti.';
    return;
  }
  isSubmitting.value = true;
  error.value = '';
  try {
    if (showRegister.value) {
      await authStore.register(email.value, password.value, name.value, acceptedLegal.value);
    } else {
      await authStore.login(email.value, password.value);
    }
    await router.push('/');
  } catch (e) {
    error.value = e.message || 'Pokušaj ponovno. Pristup trenutno nije uspio.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

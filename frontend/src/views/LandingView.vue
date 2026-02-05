<template>
  <div class="min-h-screen bg-base-100100">
    <div class="hero min-h-[60vh] relative overflow-hidden">
      <div class="hero-content text-center flex-col">
        <!-- LOGO -->
        <div class="mb-6">
          <div
            class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary shadow-lg shadow-primary/30 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-primary-content" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h1 class="text-5xl md:text-6xl font-bold">
            NewsCombo
          </h1>
        </div>

        <p class="text-xl md:text-2xl text-base-content/70 max-w-2xl mb-8">
          Personalizirano praćenje vijesti putem RSS feedova
        </p>

        <!--TEXT ROTATE -->
        <div class="card bg-base-300 shadow-xl mb-8 w-full max-w-xl">
          <div class="card-body py-6">
            <div class="flex flex-wrap items-center justify-center gap-3">

              <span class="text-lg md:text-xl font-bold whitespace-nowrap">NewsCombo ima:</span>
              <div class="grid grid-cols-1 grid-rows-1 h-10 items-center overflow-hidden align-middle">

                <!-- Item 1 -->
                <span class="rotate-item col-start-1 row-start-1">
                  <span class="bg-teal-400 text-teal-800 font-semibold px-4 py-1 rounded-lg whitespace-nowrap block">
                    Izradu custom RSS feed-ova
                  </span>
                </span>

                <!-- Item 2 -->
                <span class="rotate-item col-start-1 row-start-1" style="animation-delay: 3s;">
                  <span class="bg-red-400 text-red-800 font-semibold px-3 py-1 rounded-lg whitespace-nowrap block">
                    AI Daily Spotlight
                  </span>
                </span>

                <!-- Item 3 -->
                <span class="rotate-item col-start-1 row-start-1" style="animation-delay: 6s;">
                  <span class="bg-blue-400 text-blue-800 font-semibold px-3 py-1 rounded-lg whitespace-nowrap block">
                    Cross-device sync
                  </span>
                </span>

                <!-- Item 4 -->
                <span class="rotate-item col-start-1 row-start-1" style="animation-delay: 9s;">
                  <span class="bg-teal-400 text-teal-800 font-semibold px-3 py-1 rounded-lg whitespace-nowrap block">
                    Razne fora teme!!
                  </span>
                </span>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-4 pb-20 -mt-10">
      <div class="grid lg:grid-cols-1 gap-8 items-center justify-center">

      <div class="card bg-base-300 shadow-2xl w-full max-w-md mx-auto">
        <div class="card-body p-8">
        <!-- TABOVI  -->
        <div class="tabs tabs-boxed bg-base-200 mb-6">
          <a @click="showRegister = false" :class="['tab flex-1', !showRegister ? 'tab-active' : '']">Prijava</a>
          <a @click="showRegister = true" :class="['tab flex-1', showRegister ? 'tab-active' : '']">Registracija</a>
        </div>

        <!-- LOGIN  -->
        <form v-if="!showRegister" @submit.prevent="handleLogin" class="space-y-4">
          <div class="form-control">
          <label class="label"><span class="label-text font-medium">Email</span></label>
          <div class="relative">
        <input v-model="email" type="email" placeholder="tvoj@email.com" required
        class="input input-bordered w-full pl-10" autocomplete="email" />
        <svg xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" fill="none"
        viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
          </div>
          </div>

          <div class="form-control">
          <label class="label"><span class="label-text font-medium">Lozinka</span></label>
          <div class="relative">
        <input v-model="password" type="password" placeholder="********" required
        class="input input-bordered w-full pl-10" autocomplete="current-password" />
        <svg xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" fill="none"
        viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
          </div>
          </div>

          <div v-if="error" class="alert alert-error py-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
        stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm">{{ error }}</span>
          </div>

          <button type="submit" class="btn btn-primary w-full gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
        stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Prijavi se
          </button>
        </form>

        <!-- REGISTRACIJA  -->
        <form v-else @submit.prevent="handleRegister" class="space-y-4">
          <div class="form-control">
          <label class="label"><span class="label-text font-medium">Ime</span></label>
          <div class="relative">
        <input v-model="name" type="text" placeholder="Vaše ime" required
        class="input input-bordered w-full pl-10" autocomplete="name" />
        <svg xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" fill="none"
        viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
          </div>
          </div>

          <div class="form-control">
          <label class="label"><span class="label-text font-medium">Email</span></label>
          <div class="relative">
        <input v-model="email" type="email" placeholder="vas@email.com" required
        class="input input-bordered w-full pl-10" autocomplete="email" />
        <svg xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" fill="none"
        viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
          </div>
          </div>

          <div class="form-control">
          <label class="label"><span class="label-text font-medium">Lozinka</span></label>
          <div class="relative">
        <input v-model="password" type="password" placeholder="********" required
        class="input input-bordered w-full pl-10" autocomplete="new-password" />
        <svg xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" fill="none"
        viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
          </div>
          </div>

          <div v-if="error" class="alert alert-error py-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
        stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm">{{ error }}</span>
          </div>

          <button type="submit" class="btn btn-primary w-full gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
        stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Registriraj se
          </button>
        </form>
        </div>
      </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer footer-center p-6 bg-base-200 text-base-content/60">
      <p>NewsCombo - TU TREBA STAVITI LINK NA GITHUV PLS NEMOJ ZABORAVIT STAVITI LINK NA GITHUB!!!!!!!!!!!!!!!!!</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const name = ref('');
const showRegister = ref(false);
const error = ref('');

async function handleLogin() {
  try {
    error.value = '';
    await authStore.login(email.value, password.value);
    router.push('/');
  } catch (e) {
    error.value = e.message;
  }
}

async function handleRegister() {
  try {
    error.value = '';
    await authStore.register(email.value, password.value, name.value);
    router.push('/');
  } catch (e) {
    error.value = e.message;
  }
}
</script>

<style>
.rotate-item {
  opacity: 0;
  transform: translateY(100%);
  animation: slideUpFade 12s cubic-bezier(0.16, 1, 0.3, 1) infinite;
  display: flex;
  justify-content: center;
  padding: 4px;
}

@keyframes slideUpFade {

  0% {
    opacity: 0;
    transform: translateY(100%);
  }

  5% {
    opacity: 1;
    transform: translateY(0);
  }

  25% {
    opacity: 1;
    transform: translateY(0);
  }

  30% {
    opacity: 0;
    transform: translateY(-100%);
  }


  100% {
    opacity: 0;
    transform: translateY(-100%);
  }
}
</style>
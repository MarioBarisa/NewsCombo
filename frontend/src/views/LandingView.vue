<template>
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div class="max-w-6xl mx-auto px-4 py-20">
        <div class="text-center mb-12">
          <h1 class="text-5xl font-bold text-gray-900 dark:text-white mb-4">NewsCombo</h1>
          <p class="text-xl text-gray-600 dark:text-gray-300">Personalizirano praćenje vijesti putem RSS feedova</p>
        </div>
  
        <div class="grid md:grid-cols-2 gap-8 mb-12">
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 class="text-2xl font-semibold mb-4">✨ Značajke</h3>
            <ul class="space-y-2 text-gray-700 dark:text-gray-300">
              <li>pravljanje RSS feedovima</li>
              <li>Tematske grupe vijesti</li>
              <li>Like/Dislike mehanizam</li>
              <li>AI Daily Spotlight sažeci</li>
              <li>Cross-device sync</li>
              <li>Razne fora themes!!</li>
            </ul>
          </div>
  
          <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <div v-if="!showRegister">
              <h2 class="text-2xl font-bold mb-6">Prijava</h2>
              <form @submit.prevent="handleLogin" class="space-y-4">
                <input v-model="email" type="email" placeholder="Email" required
                  class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <input v-model="password" type="password" placeholder="Lozinka" required
                  class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Prijavi se
                </button>
                <p class="text-sm text-center">
                  Nemaš račun? <a @click="showRegister = true" class="text-blue-600 cursor-pointer">Registriraj se</a>
                </p>
                <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
              </form>
            </div>
  
            <div v-else>
              <h2 class="text-2xl font-bold mb-6">Registracija</h2>
              <form @submit.prevent="handleRegister" class="space-y-4">
                <input v-model="name" type="text" placeholder="Ime" required
                  class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <input v-model="email" type="email" placeholder="Email" required
                  class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <input v-model="password" type="password" placeholder="Lozinka" required
                  class="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Registriraj se
                </button>
                <p class="text-sm text-center">
                  Već imaš račun? <a @click="showRegister = false" class="text-blue-600 cursor-pointer">Prijavi se</a>
                </p>
                <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
              </form>
            </div>
          </div>
        </div>
      </div>
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
  
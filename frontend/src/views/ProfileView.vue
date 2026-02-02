<template>
  <div class="max-w-4xl mx-auto p-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
      <h1 class="text-3xl font-bold mb-6 dark:text-white">Korisnički Profil</h1>
      
      <div v-if="authStore.user" class="space-y-4">
        <div class="border-b dark:border-gray-700 pb-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">Ime</p>
          <p class="text-lg font-semibold dark:text-white">{{ authStore.user.name }}</p>
        </div>
        
        <div class="border-b dark:border-gray-700 pb-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">Email</p>
          <p class="text-lg font-semibold dark:text-white">{{ authStore.user.email }}</p>
        </div>

        <button @click="handleLogout" 
          class="mt-6 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700">
          Odjavi se
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

function handleLogout() {
  authStore.logout();
  router.push('/landing');
}
</script>

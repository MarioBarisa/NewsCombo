<template>
  <div class="max-w-4xl mx-auto p-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
      <h1 class="text-3xl font-bold mb-6 dark:text-white">Korisnički Profil</h1>
      
      <div v-if="authStore.user" class="space-y-4">
                <!-- Profilna slika -->
                <div class="flex flex-col items-center mb-6">
          <div class="relative">
            <img 
              :src="authStore.user.profilePicture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(authStore.user.name || 'U')" 
              class="w-24 h-24 rounded-full object-cover border-4 border-primary"
              alt="Profilna slika"
            />
            <label class="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary-focus">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input type="file" accept="image/*" class="hidden" @change="uploadImage" :disabled="uploading" />
            </label>
          </div>
          <p v-if="uploading" class="text-sm mt-2 text-primary">Učitavanje...</p>
        </div>
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
import { ref } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const uploading = ref(false);

async function uploadImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  uploading.value = true;
  const reader = new FileReader();
  
  reader.onload = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3005/api/auth/profile-picture', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image: reader.result })
      });
      
      if (res.ok) {
        const data = await res.json();
        authStore.user.profilePicture = data.profilePicture;
      }
    } catch (e) {
      console.error('Greška pri uploadu:', e);
    } finally {
      uploading.value = false;
    }
  };
  
  reader.readAsDataURL(file);
}



function handleLogout() {
  authStore.logout();
  router.push('/landing');
}
</script>

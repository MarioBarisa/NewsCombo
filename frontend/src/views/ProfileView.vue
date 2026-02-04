<template>
  <div class="min-h-screen bg-base-200 py-8 px-4">
    <div class="max-w-2xl mx-auto space-y-6">
      
      <!-- Header kartica s profilnom slikom -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body items-center text-center">
          <div class="relative group">
            <div class="avatar">
              <div class="w-28 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img 
                  :src="authStore.user?.profilePicture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(authStore.user?.name || 'U') + '&background=6366f1&color=fff&size=128'" 
                  alt="Profilna slika"
                />
              </div>
            </div>
            <label class="absolute bottom-0 right-0 btn btn-circle btn-primary btn-sm shadow-lg cursor-pointer group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input type="file" accept="image/*" class="hidden" @change="uploadImage" :disabled="uploading" />
            </label>
          </div>
          <div class="mt-4">
            <h2 class="text-2xl font-bold">Pozdrav {{ authStore.user?.name }}!</h2>
            <p class="text-base-content/60">{{ authStore.user?.email }}</p>
          </div>
          <p v-if="uploading" class="text-sm text-primary flex items-center gap-2">
            <span class="loading loading-spinner loading-xs"></span>
            Učitavanje slike...
          </p>
        </div>
      </div>

      <div v-if="message" :class="['alert shadow-lg', messageType === 'success' ? 'alert-success' : 'alert-error']">
        <svg v-if="messageType === 'success'" xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ message }}</span>
      </div>

      <!-- PERSONAL PODACI -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h3 class="card-title text-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Osobni podaci
          </h3>
          
          <div class="grid gap-4 mt-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Username</span>
              </label>
              <input v-model="form.name" type="text" class="input input-bordered focus:input-primary ml-2" placeholder="Vaš username" />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Email adresa</span>
              </label>
              <input v-model="form.email" type="email" class="input input-bordered focus:input-primary ml-2" placeholder="vas@email.com" />
            </div>
          </div>
        </div>
      </div>

      <!-- LOZINKA -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h3 class="card-title text-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Promjena lozinke
          </h3>
          <p class="text-sm text-base-content/60 mb-2">Ostavi prazno ako ne želiš mijenjati lozinku</p>
          
          <div class="grid gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Trenutna lozinka</span>
              </label>
              <input v-model="form.currentPassword" type="password" class="input input-bordered focus:input-primary ml-2" placeholder="********" />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Nova lozinka</span>
              </label>
              <input v-model="form.newPassword" type="password" class="input input-bordered focus:input-primary ml-2" placeholder="********" />
            </div>
          </div>
        </div>
      </div>

      <!-- Akcije -->
      <div class="flex flex-col sm:flex-row gap-3">
        <button @click="saveProfile" :disabled="saving" class="btn btn-primary flex-1 gap-2">
          <span v-if="saving" class="loading loading-spinner loading-sm"></span>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{ saving ? 'Spremanje...' : 'Spremi promjene' }}
        </button>
        
        <button @click="handleLogout" class="btn btn-outline btn-error gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Odjavi se
        </button>
      </div>

    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const uploading = ref(false);
const saving = ref(false);
const message = ref('');
const messageType = ref('');

const form = ref({
  name: '',
  email: '',
  currentPassword: '',
  newPassword: ''
});

onMounted(() => {
  if (authStore.user) {
    form.value.name = authStore.user.name || '';
    form.value.email = authStore.user.email || '';
  }
});

async function saveProfile() {
  saving.value = true;
  message.value = '';

  try {
    const token = localStorage.getItem('token');
    const payload = {};

    if (form.value.name !== authStore.user.name) payload.name = form.value.name;
    if (form.value.email !== authStore.user.email) payload.email = form.value.email;
    if (form.value.newPassword) {
      payload.currentPassword = form.value.currentPassword;
      payload.newPassword = form.value.newPassword;
    }

    const res = await fetch('http://localhost:3005/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      authStore.user = data.user;
      if (data.token) {
        localStorage.setItem('token', data.token);
        authStore.token = data.token;
      }
      message.value = 'Profil uspješno ažuriran!';
      messageType.value = 'success';
      form.value.currentPassword = '';
      form.value.newPassword = '';
    } else {
      message.value = data.error || 'Greška pri spremanju';
      messageType.value = 'error';
    }
  } catch (e) {
    message.value = 'Greška pri spremanju profila';
    messageType.value = 'error';
  } finally {
    saving.value = false;
  }
}

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

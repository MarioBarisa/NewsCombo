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

          <!-- DANGER ZONE -->
    <div class="card bg-base-100 shadow-xl border-2 border-error/20 mt-8">
      <div class="card-body">
        <h2 class="card-title text-error flex gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Brisanje računa
        </h2>
        <p class="text-base-content/70">Ova radnja je nepovratna. Brisanje računa trajno uklanja sve tvoje podatke.</p>
        <div class="card-actions justify-end mt-4">
          <button onclick="delete_account_modal.showModal()" class="btn btn-error btn-outline">
            Obriši račun
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL ZA POTVRDU BRISANJA -->
    <dialog id="delete_account_modal" class="modal">
      <div class="modal-box border-2 border-error">
        <h3 class="font-bold text-lg text-error">Jeste li apsolutno sigurni?</h3>
        <p class="py-4">Ova radnja će <b>trajno obrisati</b> vaš korisnički račun i sve povezane podatke. Ovo se ne može poništiti.</p>
        
        <p class="text-sm mb-2">Upišite <span class="font-mono font-bold bg-base-200 px-1 rounded">DELETE</span> za potvrdu:</p>
        <input 
          v-model="deleteConfirmationInput" 
          type="text" 
          placeholder="DELETE" 
          class="input input-bordered input-error w-full mb-4" 
        />

        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-ghost mr-2">Odustani</button>
          </form>
          <button 
            @click="handleDeleteAccount" 
            :disabled="deleteConfirmationInput !== 'DELETE' || isDeleting"
            class="btn btn-error"
          >
            <span v-if="isDeleting" class="loading loading-spinner"></span>
            <span v-else>Potvrdi brisanje</span>
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>


    </div>
    <footer class="footer footer-center p-6 bg-base-200 text-base-content/60">
      <div class="flex flex-col items-center gap-2">
        <p>NewsCombo © 2026</p>
        <a href="https://barisa.me/" target="_blank" class="link link-hover flex items-center gap-2">Made with ♥️ by Mario Bariša</a>
        <a href="https://github.com/MarioBarisa/NewsCombo" target="_blank"
          class="link link-hover flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </a>
      </div>
    </footer>
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


const deleteConfirmationInput = ref('');
const isDeleting = ref(false);

const handleDeleteAccount = async () => {
  if (deleteConfirmationInput.value !== 'DELETE') return;
  
  isDeleting.value = true;
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3005/api/auth/delete-account', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      // briši sve od usera
      authStore.logout(); 
      localStorage.clear();
      
      
      document.getElementById('delete_account_modal').close();
      
      router.push('/landing');
    } else {
      alert('Došlo je do greške pri brisanju računa.');
    }
  } catch (error) {
    console.error('Greška:', error);
    alert('Greška na serveru.');
  } finally {
    isDeleting.value = false;
  }
};


function handleLogout() {
  authStore.logout();
  router.push('/landing');
}
</script>

<template>
  <div class="navbar bg-base-100 shadow-lg sticky top-0 z-50">
    <div class="flex-1">
      <router-link to="/" class="btn btn-ghost text-xl">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24"
          stroke="#f7441f">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        NewsCombo
      </router-link>
    </div>
    <!-- ime + avatar u horizontalnom redu -->
    <div class="flex items-center ml-auto">
      <span v-if="displayName" class="hidden md:block text-sm font-semibold mr-2 opacity-80 select-none max-w-[10rem] truncate">
        {{ displayName }}
      </span>
      <div :class="['dropdown dropdown-end', { 'dropdown-open': isDropdownOpen }]" ref="dropdownContainer">
        <div
          tabindex="0"
          role="button"
          class="btn btn-ghost btn-circle avatar"
          ref="dropdownTrigger"
          @click="toggleDropdown"
        >
        <div class="w-10 sm:w-12 rounded-full">
          <img alt="Profilna slika"
            :src="profileImageSrc"
            @error="handleAvatarError"
            @load="handleAvatarLoad"
          />
        </div>
      </div>
      <ul
        tabindex="-1"
        class="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
        ref="dropdownMenu"
      >
        <li>
          <RouterLink to="/settings/feeds" class="justify-between" @click="handleMenuClick">
            <span class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              Postavke feed-ova
            </span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/bookmarks" class="justify-between" @click="handleMenuClick">
            <span class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Spremljeni članci
            </span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/taste" class="justify-between" @click="handleMenuClick">
            <span class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
              </svg>
              Moji interesi
            </span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/profile" class="justify-between" @click="handleMenuClick">
            <span class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profil
            </span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/settings" class="justify-between" @click="handleMenuClick">
            <span class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              Postavke
            </span>
          </RouterLink>
        </li>
        <li>
          <a @click="handleLogout" class="justify-between cursor-pointer">
            <span class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Logout
            </span>
          </a>
        </li>
      </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useRouter, useRoute } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
let removeAfterEach = null;

const dropdownContainer = ref(null);
const dropdownTrigger = ref(null);
const dropdownMenu = ref(null);
const isDropdownOpen = ref(false);

const imageNonce = ref(Date.now());
const imageRetryCount = ref(0);
const useFallbackAvatar = ref(false);
let fallbackTimer = null;

const fallbackAvatarUrl = computed(() => {
  const name = authStore.user?.name || 'U';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
});

// ime pored avatara — fallback na email prefiks
const displayName = computed(() => {
  const u = authStore.user;
  if (u?.name) return u.name;
  if (u?.email) return String(u.email).split('@')[0];
  return '';
});

const profileImageSrc = computed(() => {
  if (useFallbackAvatar.value || !authStore.user?.profilePicture) return fallbackAvatarUrl.value;
  const separator = authStore.user.profilePicture.includes('?') ? '&' : '?';
  return `${authStore.user.profilePicture}${separator}v=${imageNonce.value}`;
});


const closeDropdown = () => {
  isDropdownOpen.value = false;
  const activeElement = document.activeElement;
  if (dropdownContainer.value && activeElement && dropdownContainer.value.contains(activeElement)) {
    activeElement.blur();
  } else if (dropdownTrigger.value) {
    dropdownTrigger.value.blur();
  }
};

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const handleMenuClick = () => {
  closeDropdown();
};


const handleScroll = () => {
  closeDropdown();
};

const handleOutsideClick = (event) => {
  if (!dropdownContainer.value) return;
  if (!dropdownContainer.value.contains(event.target)) {
    closeDropdown();
  }
};

const handleAvatarLoad = () => {
  imageRetryCount.value = 0;
  if (fallbackTimer) {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }
  if (authStore.user?.profilePicture) {
    useFallbackAvatar.value = false;
  }
};

const handleAvatarError = () => {
  if (imageRetryCount.value < 1) {
    imageRetryCount.value += 1;
    imageNonce.value = Date.now();
    return;
  }
  useFallbackAvatar.value = true;
  if (!fallbackTimer) {
    fallbackTimer = setTimeout(() => {
      useFallbackAvatar.value = false;
      imageRetryCount.value = 0;
      imageNonce.value = Date.now();
      fallbackTimer = null;
    }, 30000);
  }
};

function handleLogout() {
  closeDropdown();
  authStore.logout();
  router.push('/landing');
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('touchmove', handleScroll, { passive: true });
  document.addEventListener('pointerdown', handleOutsideClick, { passive: true });
  document.addEventListener('click', handleOutsideClick, true);
  document.addEventListener('touchstart', handleOutsideClick, true);
  removeAfterEach = router.afterEach(() => {
    closeDropdown();
  });
});

watch(
  () => authStore.user?.profilePicture,
  () => {
    imageNonce.value = Date.now();
    imageRetryCount.value = 0;
    useFallbackAvatar.value = false;
  },
  { immediate: true }
);

watch(
  () => route.fullPath,
  () => {
    closeDropdown();
  }
);

onUnmounted(() => {
  if (fallbackTimer) {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('touchmove', handleScroll);
  document.removeEventListener('pointerdown', handleOutsideClick);
  document.removeEventListener('click', handleOutsideClick, true);
  document.removeEventListener('touchstart', handleOutsideClick, true);
  if (removeAfterEach) {
    removeAfterEach();
    removeAfterEach = null;
  }
});
</script>

<style>
@media (max-width: 375px) {
  .navbar .btn {
    padding: 0.25rem 0.5rem;
  }
  .navbar .text-xl {
    font-size: 1rem;
  }
  .navbar .w-10 {
    width: 2.5rem;
    height: 2.5rem;
  }
}

@supports (padding-top: env(safe-area-inset-top)) {
  .navbar {
    padding-top: env(safe-area-inset-top);
  }
}

</style>

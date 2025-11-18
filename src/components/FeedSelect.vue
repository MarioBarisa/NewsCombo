<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
const isSearchVisible = ref(false);
const isMobile = ref(false);
let mouseLeaveTimer = null;

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
};

// CLICK -> mobitel
const handleClick = () => {
  if (isMobile.value) {
    isSearchVisible.value = !isSearchVisible.value;
  }
};

// HOVER -> dekstop samo
const handleMouseEnter = () => {
  if (!isMobile.value) {
    if (mouseLeaveTimer) clearTimeout(mouseLeaveTimer);
    isSearchVisible.value = true;
  }
};

const handleMouseLeave = () => {
  if (!isMobile.value) {
    // delay prije zatvaranja search bara
    mouseLeaveTimer = setTimeout(() => {
      isSearchVisible.value = false;
    }, 200);
  }
};

// Ako miš uđe u sam search input ne zatvaraj bar
const keepSearchOpen = () => {
  if (mouseLeaveTimer) clearTimeout(mouseLeaveTimer);
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
  if (mouseLeaveTimer) clearTimeout(mouseLeaveTimer);
});
</script>

<template>
  <div 
    class="navbar-center w-full items-center justify-center"
    @mouseleave="handleMouseLeave"
  >
    <div 
      v-if="isSearchVisible" 
      class="w-full px-4 mb-4 md:mb-0 md:w-auto"
      @mouseenter="keepSearchOpen"
    >
      <input 
        type="text" 
        placeholder="Pretraživanje" 
        class="input input-bordered w-full md:w-auto"
      />
    </div>
    <button 
      class="btn btn-ghost"
      @click="handleClick"
      @mouseenter="handleMouseEnter"
    >
      <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <g
          stroke-linejoin="round"
          stroke-linecap="round"
          stroke-width="2.5"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </g>
      </svg>
    </button>

    <!--RAČUNALO -->
    <ul class="menu hidden md:menu-horizontal md:flex px-1">
      <li><a>IT</a></li>
      <li>
        <details>
          <summary>Vijesti iz HR</summary>
          <ul class="p-2">
            <li><a>Favoriti:</a></li>
            <li><a>Index.hr</a></li>
            <li><a>Danas.hr</a></li>
          </ul>
        </details>
      </li>
      <li><a>Vijesti iz EU</a></li>
    </ul>

    <!--MOBITEL -->
    <div class="dropdown dropdown-bottom dropdown-end md:hidden">
      <button tabindex="0" class="btn btn-ghost">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
        </svg>
      </button>
      <ul tabindex="0" class="menu menu-compact dropdown-content mt-3 w-52 bg-base-100 p-2 shadow">
        <li><a>IT</a></li>
        <li>
          <details>
            <summary>Vijesti iz HR</summary>
            <ul class="p-2">
              <li><a>Favoriti:</a></li>
              <li><a>Index.hr</a></li>
              <li><a>Danas.hr</a></li>
            </ul>
          </details>
        </li>
        <li><a>Vijesti iz EU</a></li>
      </ul>
    </div>
  </div>
</template>

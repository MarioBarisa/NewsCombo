<template>
  <div class="navbar bg-base-100 shadow-lg">
    <div class="flex-1">
      <router-link to="/" class="btn btn-ghost text-xl">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
        NewsCombo
      </router-link>
    </div>
    <div class="dropdown dropdown-end ml-auto">
      <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
        <div class="w-10 sm:w-12 rounded-full">
          <img alt="Tailwind CSS Navbar component"
            src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
        </div>
      </div>
      <ul tabindex="-1" class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
        <li>
          <RouterLink to="/profile" class="justify-between"> Profil </RouterLink>
        </li>
        <li>
          <RouterLink to="/settings" class="justify-between"> Postavke </RouterLink>
        </li>
        <li>
          <RouterLink to="/settings/feeds" class="justify-between"> Postavke feed-ova </RouterLink>
        </li>
        <li><a>Logout</a></li>
      </ul>
    </div>
  </div>
</template>

<script setup>
</script>

<style>
  @media (max-width: 375px) {
  .navbar .btn {
    padding: 0.25rem 0.5rem; 
  }
  .navbar .text-xl {
    font-size: 1rem; /*font manji */
  }
  .navbar .w-10 {
    width: 2.5rem; /* manji avatar*/
    height: 2.5rem;
  }
}
</style>
<script setup>
import { RouterLink } from 'vue-router';

defineProps({
  msg: {
    type: String,
    required: true,
  },
})
import FeedSelect from './FeedSelect.vue';

</script>

<template>

<div class="navbar bg-base-100 shadow-sm">
  <div class="navbar-start">
    <RouterLink to="/" class="btn btn-soft btn-xs sm:btn-sm md:btn-md lg:btn-lg xl:btn-xl btn-primary text-2xl italic">NewsCombo</RouterLink>
  </div>

<div class="dropdown dropdown-end ml-auto">
  <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
    <div class="w-10 rounded-full">
      <img
        alt="Tailwind CSS Navbar component"
        src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
    </div>
  </div>
  <ul
    tabindex="-1"
    class="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
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



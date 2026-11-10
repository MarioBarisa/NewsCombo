<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import AppFooter from './components/AppFooter.vue'
import NavBar from './components/NavBar.vue'
import { useThemeStore } from './stores/theme'
import { useFeedsStore } from './stores/feedStore'
import { useAuthStore } from './stores/authStore'

const themeStore = useThemeStore()
const feedsStore = useFeedsStore()
const authStore = useAuthStore()

onMounted(async() => {
  themeStore.initTheme()
  await authStore.fetchUser().catch(() => {})
  if (authStore.isAuthenticated) {
    // jedina točka inicijalizacije — ostali čekaju ensureReady()
    await feedsStore.ensureReady().catch(() => {})
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
  <NavBar v-if="authStore.isAuthenticated"></NavBar>
  <div class="flex-1 min-w-0"><RouterView /></div>
  <AppFooter />
  </div>
</template>

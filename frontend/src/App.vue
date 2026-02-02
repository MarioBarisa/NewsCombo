<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import NavBar from './components/NavBar.vue'
import { useThemeStore } from './stores/theme'
import { useFeedsStore } from './stores/feedStore'
import { useAuthStore } from './stores/authStore'

const themeStore = useThemeStore()
const feedsStore = useFeedsStore()
const authStore = useAuthStore()

onMounted(async() => {
  themeStore.initTheme()
  await authStore.fetchUser()
  if (authStore.isAuthenticated) {
    await feedsStore.initializeStore()
  }
})
</script>

<template>
  <NavBar v-if="authStore.isAuthenticated"></NavBar>
  <RouterView></RouterView>
</template>

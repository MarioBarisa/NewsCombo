<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { onMounted } from 'vue'
import NavBar from './components/NavBar.vue'
// import GlobalVijestiBanner from './components/GlobalVijestiBanner.vue'
import { useThemeStore } from './stores/theme'
import { useFeedsStore } from './stores/feedStore'


const themeStore = useThemeStore()
const feedsStore = useFeedsStore();

// Inicijaliziraj temu pri učitavanju aplikacije
onMounted(() => {
  themeStore.initTheme()
  feedsStore.loadFromLocalStorage()
  feedsStore.loadFeedsFromBackend()
})
</script>

<template>
  <NavBar></NavBar>
  <RouterView></RouterView>
</template>

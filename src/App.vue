<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { onMounted } from 'vue'
import NavBar from './components/NavBar.vue'
// import GlobalVijestiBanner from './components/GlobalVijestiBanner.vue'
import { useThemeStore } from './stores/theme'


const themeStore = useThemeStore()

// Inicijaliziraj temu pri učitavanju aplikacije
onMounted(() => {
  themeStore.initTheme()
})
</script>

<template>
  <NavBar></NavBar>
  <RouterView></RouterView>
</template>

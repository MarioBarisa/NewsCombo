<template>
  <div class="container mx-auto p-6 max-w-4xl">
    <h1 class="text-3xl font-bold mb-6">Postavke</h1>
    
    <div class="card bg-base-200 shadow-xl">
      <div class="card-body">
        <h2 class="card-title mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          Tema
        </h2>
        
        <p class="text-sm opacity-70 mb-4">
          Trenutna tema: <span class="font-bold">{{ themeStore.currentTheme }}</span>
        </p>
        <div class="divider">Pregled tema</div>
        
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div 
            v-for="theme in themeStore.availableThemes" 
            :key="theme"
            :data-theme="theme"
            @click="themeStore.setTheme(theme)"
            class="card cursor-pointer hover:scale-105 transition-transform border-2"
            :class="{ 'border-primary': themeStore.currentTheme === theme, 'border-base-300': themeStore.currentTheme !== theme }"
          >
            <div class="card-body p-3">
              <div class="flex flex-col gap-1">
                <div class="font-bold text-sm">{{ formatThemeName(theme) }}</div>
                <div class="flex gap-1">
                  <div class="bg-primary rounded w-2 h-4"></div>
                  <div class="bg-secondary rounded w-2 h-4"></div>
                  <div class="bg-accent rounded w-2 h-4"></div>
                  <div class="bg-neutral rounded w-2 h-4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { useThemeStore } from '../stores/theme'

const themeStore = useThemeStore()

// formatiraj naziv teme
const formatThemeName = (theme) => {
  return theme
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
</script>

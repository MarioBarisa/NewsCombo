<template>
  <div class="container mx-auto p-6 max-w-4xl">
    <h1 class="text-3xl font-bold mb-6">Postavke</h1>

    <!-- Veličina teksta -->
    <div class="card bg-base-200 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
          Veličina teksta
        </h2>

        <p class="text-sm opacity-70 mb-4">
          Podesi veličinu teksta u aplikaciji. Utječe samo na desktop prikaz.
        </p>
        <div class="flex items-center gap-4">
          <span class="text-xs opacity-60 w-4">A</span>
          <input
            type="range"
            min="0.9"
            max="1.4"
            step="0.05"
            :value="themeStore.fontScale"
            @input="onFontInput"
            class="range range-primary range-sm flex-1"
            aria-label="Veličina teksta"
          />
          <span class="font-mono text-sm w-12 text-right">{{ Math.round(themeStore.fontScale * 100) }}%</span>
          <button
            v-if="themeStore.fontScale !== themeStore.DEFAULT_FONT_SCALE"
            @click="themeStore.setFontScale(themeStore.DEFAULT_FONT_SCALE)"
            class="btn btn-ghost btn-xs"
          >
            Resetiraj
          </button>
        </div>
      </div>
    </div>

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

// slider -> store (store radi clamp)
const onFontInput = (event) => {
  themeStore.setFontScale(parseFloat(event.target.value))
}

// formatiraj naziv teme
const formatThemeName = (theme) => {
  return theme
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
</script>

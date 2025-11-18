import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // Svi DaisyUI themevi
  const availableThemes = [
    'light',
    'dark',
    'cupcake',
    'bumblebee',
    'emerald',
    'corporate',
    'synthwave',
    'retro',
    'cyberpunk',
    'valentine',
    'halloween',
    'garden',
    'forest',
    'aqua',
    'lofi',
    'pastel',
    'fantasy',
    'wireframe',
    'black',
    'luxury',
    'dracula',
    'cmyk',
    'autumn',
    'business',
    'acid',
    'lemonade',
    'night',
    'coffee',
    'winter',
    'dim',
    'nord',
    'sunset'
  ]

  // Trenutna tema - defaultno 'light'
  const currentTheme = ref('light')

  // Funkcija za postavljanje teme
  const setTheme = (themeName) => {
    if (availableThemes.includes(themeName)) {
      currentTheme.value = themeName
      applyTheme(themeName)
    }
  }

  // Primjeni temu na HTML element
  const applyTheme = (themeName) => {
    document.documentElement.setAttribute('data-theme', themeName)
  }

  // Inicijalizacija teme prilikom učitavanja aplikacije
  const initTheme = () => {
    applyTheme(currentTheme.value)
  }

  // Watch za promjene teme
  watch(currentTheme, (newTheme) => {
    applyTheme(newTheme)
  })

  return {
    availableThemes,
    currentTheme,
    setTheme,
    initTheme
  }
}, {
  persist: {
    key: 'newscombo-theme',
    storage: localStorage,
  }
})

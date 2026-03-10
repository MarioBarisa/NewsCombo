import { defineStore } from 'pinia'
import { ref } from 'vue'

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

  // Trenutna tema - defaultno 'dark'
  const currentTheme = ref('dark')

  // Primjeni temu na HTML element
  const applyTheme = (themeName) => {
    document.documentElement.setAttribute('data-theme', themeName)
  }

  // Funkcija za postavljanje teme
  const setTheme = (themeName) => {
    if (availableThemes.includes(themeName)) {
      currentTheme.value = themeName
      localStorage.setItem('newscombo-theme', themeName)
      applyTheme(themeName)
    }
  }

  // Inicijalizacija teme prilikom učitavanja aplikacije
  const initTheme = () => {
    const savedTheme = localStorage.getItem('newscombo-theme')
    if (savedTheme && availableThemes.includes(savedTheme)) {
      currentTheme.value = savedTheme
    }
    applyTheme(currentTheme.value)
  }

  return {
    availableThemes,
    currentTheme,
    setTheme,
    initTheme
  }
})

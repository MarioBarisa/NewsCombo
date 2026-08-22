import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // veličina fonta (desktop slider)
  const FONT_SCALE_KEY = 'newscombo-font-scale'
  const DEFAULT_FONT_SCALE = 1.08
  const MIN_FONT_SCALE = 0.9
  const MAX_FONT_SCALE = 1.4

  const fontScale = ref(DEFAULT_FONT_SCALE)

  const clampScale = (v) => {
    const n = Number(v)
    if (Number.isNaN(n)) return DEFAULT_FONT_SCALE
    return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, n))
  }

  const applyFontScale = (scale) => {
    document.documentElement.style.setProperty('--nc-font-scale', String(scale))
  }

  const setFontScale = (scale) => {
    const clamped = clampScale(scale)
    fontScale.value = clamped
    localStorage.setItem(FONT_SCALE_KEY, String(clamped))
    applyFontScale(clamped)
  }

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

    // veličina fonta — učitaj spremljenu ili default
    const savedScale = parseFloat(localStorage.getItem(FONT_SCALE_KEY))
    fontScale.value = Number.isNaN(savedScale) ? DEFAULT_FONT_SCALE : clampScale(savedScale)
    applyFontScale(fontScale.value)
  }

  return {
    availableThemes,
    currentTheme,
    setTheme,
    initTheme,
    fontScale,
    setFontScale,
    DEFAULT_FONT_SCALE
  }
})

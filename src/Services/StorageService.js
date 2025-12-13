class StorageService {
    constructor() {
      this.KEYS = {
        FEED_CONFIG: 'newscombo_feed_config',
        USER_PREFS: 'newscombo_user_prefs',
        SELECTED_CATEGORY: 'newscombo_selected_category'
      }
    }
  
    // konfiguracija feedova
    saveFeedConfig(config) {
      try {
        localStorage.setItem(this.KEYS.FEED_CONFIG, JSON.stringify(config))
        return { success: true }
      } catch (error) {
        console.error('Error saving feed config:', error)
        return { success: false, error }
      }
    }
  
    loadFeedConfig() {
      try {
        const data = localStorage.getItem(this.KEYS.FEED_CONFIG)
        return data ? JSON.parse(data) : null
      } catch (error) {
        console.error('Error loading feed config:', error)
        return null
      }
    }
  
    // odabrana kategorija
    saveSelectedCategory(category) {
      try {
        localStorage.setItem(this.KEYS.SELECTED_CATEGORY, category)
        return { success: true }
      } catch (error) {
        console.error('Error saving category:', error)
        return { success: false, error }
      }
    }
  
    loadSelectedCategory() {
      try {
        return localStorage.getItem(this.KEYS.SELECTED_CATEGORY) || 'all'
      } catch (error) {
        console.error('Error loading category:', error)
        return 'all'
      }
    }
  
    // User Preferences (like/dislike)
    saveUserPreferences(prefs) {
      try {
        localStorage.setItem(this.KEYS.USER_PREFS, JSON.stringify(prefs))
        return { success: true }
      } catch (error) {
        console.error('Error saving preferences:', error)
        return { success: false, error }
      }
    }
  
    loadUserPreferences() {
      try {
        const data = localStorage.getItem(this.KEYS.USER_PREFS)
        return data ? JSON.parse(data) : {}
      } catch (error) {
        console.error('Error loading preferences:', error)
        return {}
      }
    }
  
    // očisti sve
    clearAll() {
      try {
        Object.values(this.KEYS).forEach(key => {
          localStorage.removeItem(key)
        })
        return { success: true }
      } catch (error) {
        console.error('Error clearing storage:', error)
        return { success: false, error }
      }
    }
  }
  
  export default new StorageService()
  
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProfileView from '../views/ProfileView.vue'
import SettingsView from '../views/SettingsView.vue'
import SettingsFeeds from '../views/SettingsFeeds.vue'

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/profile', name: 'Profile', component: ProfileView },
  { path: '/settings', name: 'Settings', component: SettingsView },
  { path: '/settings/feeds', name: 'SettingsFeeds', component: SettingsFeeds }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
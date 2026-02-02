import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProfileView from '../views/ProfileView.vue'
import SettingsView from '../views/SettingsView.vue'
import SettingsFeeds from '../views/SettingsFeeds.vue'
import ArticleView from '../views/ArticleView.vue'
import LandingView from '../views/LandingView.vue'
import { useAuthStore } from '../stores/authStore'

const routes = [
  { path: '/landing', name: 'Landing', component: LandingView, meta: { guest: true } },
  { path: '/', name: 'Home', component: HomeView, meta: { auth: true } },
  { path: '/profile', name: 'Profile', component: ProfileView, meta: { auth: true } },
  { path: '/settings', name: 'Settings', component: SettingsView, meta: { auth: true } },
  { path: '/settings/feeds', name: 'SettingsFeeds', component: SettingsFeeds, meta: { auth: true } },
  { path: '/bookmarks', name: 'ArticleView', component: ArticleView, meta: { auth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.auth && !authStore.isAuthenticated) {
    next('/landing')
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router

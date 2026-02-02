import { useAuthStore } from '../stores/authStore'

export async function apiCall(url, options = {}) {
  const authStore = useAuthStore()
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (authStore.token) {
    headers['Authorization'] = `Bearer ${authStore.token}`
  }
  
  return fetch(url, { ...options, headers })
}

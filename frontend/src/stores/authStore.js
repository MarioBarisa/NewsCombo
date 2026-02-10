import { defineStore } from 'pinia';
import { API_URL } from '../config.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token
  },

  actions: {
    async login(email, password) {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('token', data.token);
    },

    async register(email, password, name) {
      const res = await fetch(`${API_URL}api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('token', data.token);
    },

    async fetchUser() {
      if (!this.token) return;
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (res.ok) this.user = await res.json();
      else this.logout();
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
    }
  }
});

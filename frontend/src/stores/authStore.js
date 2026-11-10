import { defineStore } from 'pinia';
import { API_URL } from '../config.js';
import { useFeedsStore } from './feedStore.js';
import { useTasteStore } from './tasteStore.js';
import { resetNewsSession } from '../Services/NewsGlobal.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: null,
    requestGeneration: 0
  }),

  getters: {
    isAuthenticated: (state) => !!state.token
  },

  actions: {
    resetSessionData() {
      this.requestGeneration++;
      resetNewsSession();
      useFeedsStore().reset();
      useTasteStore().resetSession();
    },

    setSession(data) {
      this.resetSessionData();
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('token', data.token);
      localStorage.setItem('newsComboUserId', String(data.user._id || data.user.id || data.user.email));
    },

    async login(email, password) {
      const generation = ++this.requestGeneration;
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (generation !== this.requestGeneration) throw new Error('Prijava je prekinuta');
      if (!res.ok) throw new Error(data.error);

      this.setSession(data);
    },

    async register(email, password, name, acceptedLegal) {
      const generation = ++this.requestGeneration;
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, acceptedTerms: acceptedLegal, acceptedPrivacy: acceptedLegal })
      });
      const data = await res.json();
      if (generation !== this.requestGeneration) throw new Error('Prijava je prekinuta');
      if (!res.ok) throw new Error(data.error);

      this.setSession(data);
    },

    async fetchUser() {
      if (!this.token) return;
      const requestedToken = this.token;
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (this.token !== requestedToken) return;
      if (res.ok) {
        const data = await res.json();
        if (this.token !== requestedToken) return;
        if (data?.token) {
          this.token = data.token;
          localStorage.setItem('token', data.token);
        }
        this.user = data?.user || data;
      } else {
        this.logout();
      }
    },

    logout() {
      this.resetSessionData();
      localStorage.removeItem('newsComboUserId');
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
    },

    setProfilePicture(url) {
      if (this.user) {
        this.user = { ...this.user, profilePicture: url };
      }
    }
  }
});

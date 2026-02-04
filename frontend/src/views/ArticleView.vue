<template>
    <div class="min-h-screen bg-base-200 p-4 sm:p-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-8 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Spremljeni članci
        </h1>
  
        <div v-if="loading" class="flex justify-center py-12">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>
  
        <div v-else-if="bookmarks.length === 0" class="text-center py-12 opacity-50">
          <p class="text-xl">Nemate spremljenih članaka.</p>
        </div>
  
        <div v-else class="grid gap-4">
          <div v-for="item in bookmarks" :key="item._id" class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
            <div class="card-body">
              <div class="flex justify-between items-start">
                <h2 class="card-title text-xl mb-2">{{ item.title }}</h2>
                <button @click="removeBookmark(item.originalUrl)" class="btn btn-ghost btn-sm btn-circle text-error">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              
              <p class="text-sm opacity-60 mb-4 flex gap-4">
                <span>{{ item.source }}</span>
                <span>•</span>
                <span>{{ new Date(item.createdAt).toLocaleDateString() }}</span>
              </p>
              <div class="prose max-w-none bg-base-200/50 p-4 rounded-lg text-sm sm:text-base" v-html="item.body"></div>
  
              <div class="card-actions justify-end mt-4">
                <a :href="item.originalUrl" target="_blank" class="btn btn-outline btn-sm">Otvori original</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  
  const bookmarks = ref([]);
  const loading = ref(true);
  
  const fetchBookmarks = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3005/bookmarks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        bookmarks.value = await res.json();
      }
    } catch (e) {
      console.error("Greška pri dohvatu:", e);
    } finally {
      loading.value = false;
    }
  };
  
  const removeBookmark = async (url) => {
    if (!confirm("Obrisati ovaj članak?")) return;
    const token = localStorage.getItem('token');
    
    try {
      await fetch('http://localhost:3005/bookmarks', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ originalUrl: url })
      });
      bookmarks.value = bookmarks.value.filter(b => b.originalUrl !== url);
    } catch (e) {
      console.error("Greška brisanja:", e);
    }
  };
  
  onMounted(fetchBookmarks);
  </script>
  
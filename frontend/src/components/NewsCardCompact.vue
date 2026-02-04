<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  news: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['like', 'dislike', 'open-modal'])

const isLiked = ref(false)
const isDisliked = ref(false)
const imageError = ref(false)
const isBookmarked = ref(false);

const imageUrl = computed(() => {
  if (imageError.value) return null

  const possibleImages = [
    props.news.enclosure?.link,
    props.news.thumbnail,
    props.news.image,
    props.news.media?.thumbnail?.url,
    props.news['media:thumbnail']?.$?.url
  ].filter(Boolean)

  return possibleImages[0] || null
})

const cleanDescription = computed(() => {
  if (!props.news.description) return 'Nema opisa dostupnog.'
  const tmp = document.createElement('div')
  tmp.innerHTML = props.news.description
  const text = tmp.textContent || tmp.innerText || ''
  return text.substring(0, 150) + (text.length > 150 ? '...' : '')
})

const openNewsModal = () => {
  emit('open-modal', props.news)
}

const toggleLike = () => {
  if (isDisliked.value) {
    isDisliked.value = false
  }
  isLiked.value = !isLiked.value
  emit('like', props.news.link, isLiked.value)
}

const toggleDislike = () => {
  if (isLiked.value) {
    isLiked.value = false
  }
  isDisliked.value = !isDisliked.value
  emit('dislike', props.news.link, isDisliked.value)
}

const handleImageError = () => {
  imageError.value = true
}

onMounted(() => {
  try {
    const preferences = JSON.parse(localStorage.getItem('newsPreferences') || '{}')
    if (preferences[props.news.link] === 'like') {
      isLiked.value = true
    } else if (preferences[props.news.link] === 'dislike') {
      isDisliked.value = true
    }
  } catch (e) {
    console.error('Error loading preferences:', e)
  }
})

const toggleBookmark = async () => {
  const url = 'http://localhost:3005/bookmarks';
  const method = isBookmarked.value ? 'DELETE' : 'POST';
  const token = localStorage.getItem('token');

  try {
    const response = await fetch(url, {
      method: method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: props.news.title,
        originalUrl: props.news.link,
        source: props.news.source,
        body: props.news.description, // samo opis šalje
        publishedAt: props.news.pubDate || props.news.isoDate
      })
    });

    if (response.ok) {
      isBookmarked.value = !isBookmarked.value;
    }
  } catch (e) {
    console.error(e);
  }
};
</script>

<template>
  <div
    class="card card-compact bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 w-full overflow-hidden"
    style="min-width: 0;">
    <div class="card-body p-3 sm:p-4">
      <div class="flex gap-3 sm:gap-4 flex-col sm:flex-row">
        <!-- SLIKA VIJESTI -->
        <div class="flex-shrink-0 cursor-pointer w-full sm:w-32" @click="openNewsModal">
          <figure class="relative overflow-hidden w-full sm:w-32 h-40 sm:h-24 rounded-lg bg-base-300">
            <img v-if="imageUrl && !imageError" :src="imageUrl" :alt="news.title"
              class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 hover:scale-110"
              @error="handleImageError" loading="lazy" />
            <div v-else
              class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-base-300 to-base-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 opacity-30" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </figure>
        </div>

        <!-- SADRŽAJ -->
        <div class="flex-1 min-w-0 w-full overflow-hidden">
          <!-- izvor badge -->
          <div class="mb-2">
            <span class="badge badge-primary badge-sm">
              {{ news.source || 'Vijesti' }}
            </span>
            <span v-if="news.domain" class="badge badge-ghost badge-sm ml-1">
              {{ news.domain }}
            </span>
          </div>

          <!-- naslov -->
          <h3 class="card-title text-base leading-tight mb-2 break-words">
            <a @click.prevent="openNewsModal" href="#"
              class="line-clamp-2 hover:text-primary transition-colors cursor-pointer w-full">
              {{ news.title }}
            </a>
          </h3>

          <!-- kratki opis -->
          <p class="text-sm opacity-70 line-clamp-2 mb-3 break-words">
            {{ cleanDescription }}
          </p>

          <!-- naredbe nad vijestima -->
          <div class="flex justify-between items-center flex-wrap gap-2">
            <div class="flex gap-1"> <!-- 
              <button @click="toggleLike" class="btn btn-xs btn-circle" :class="isLiked ? 'btn-error' : 'btn-ghost'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :fill="isLiked ? 'currentColor' : 'none'"
                  viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              <button @click="toggleDislike" class="btn btn-xs btn-circle"
                :class="isDisliked ? 'btn-warning' : 'btn-ghost'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :fill="isDisliked ? 'currentColor' : 'none'"
                  viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
                          -->
              <button @click="toggleBookmark" class="btn btn-xs btn-circle ml-1"
                :class="isBookmarked ? 'btn-primary' : 'btn-ghost'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :fill="isBookmarked ? 'currentColor' : 'none'"
                  viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>

            <button @click="openNewsModal" class="btn btn-xs btn-primary">
              Čitaj
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>



<style scoped>
.card {
  width: 100%;
  box-sizing: border-box;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  overflow-wrap: break-word;
}

@media (min-width: 640px) {
  .card-body {
    min-height: 120px;
  }
}

@media (max-width: 375px) {
  .btn-xs {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }

  .line-clamp-2 {
    -webkit-line-clamp: 3;
  }
}
</style>

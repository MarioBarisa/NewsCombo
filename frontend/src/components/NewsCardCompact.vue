<script setup>
import { ref, computed } from 'vue';
import { API_URL } from '../config.js';
import { useTasteStore } from '../stores/tasteStore.js';

const props = defineProps({
  news: {
    type: Object,
    required: true
  },
  colorClass: {
    type: String,
    default: ''
  },
  // personalna ocjena — samo NewsCombo
  showScore: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['open-modal'])
const taste = useTasteStore()

const isLiked = computed(() => taste.isLiked(props.news.link))
const isDisliked = computed(() => taste.isDisliked(props.news.link))
const imageError = ref(false)
const isBookmarked = ref(false);

const comboScore = computed(() => (props.showScore && taste.hasEnoughData ? props.news._combo : null))

const scoreClass = computed(() => {
  const pct = comboScore.value?.pct ?? 50
  if (pct >= 65) return 'badge-success'
  if (pct >= 40) return 'badge-warning'
  return 'badge-ghost'
})

const signedPct = (v) => {
  const pct = Math.round((v || 0) * 100)
  return pct > 0 ? `+${pct}%` : `${pct}%`
}

const scoreTip = computed(() => {
  const c = comboScore.value
  if (!c) return ''
  return `Izvor ${signedPct(c.src)} • Teme ${signedPct(c.topic)} • Kategorija ${signedPct(c.cat)}`
})

const imageUrl = computed(() => {
  if (imageError.value) return null

  if (props.news.imageUrl) {
    return props.news.imageUrl
  }

  const possibleImages = [
    props.news.enclosure?.url,      
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
  taste.toggleHeart(props.news)
}

const toggleDislike = () => {
  taste.toggleDislike(props.news)
}

// klik na karticu otvara članak (gumbi/veze imaju vlastito ponašanje)
const handleCardClick = (event) => {
  if (event.target.closest('button, a')) return
  openNewsModal()
}

const handleImageError = () => {
  imageError.value = true
}

const toggleBookmark = async () => {
  const url = `${API_URL}/bookmarks`;
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
        body: props.news.description,
        publishedAt: props.news.pubDate || props.news.isoDate
      })
    });

    if (response.ok) {
      const nowBookmarked = !isBookmarked.value;
      isBookmarked.value = nowBookmarked;
      if (nowBookmarked) {
        taste.recordBookmark(props.news); // blagi pozitivni signal za algoritam
      }
    }
  } catch (e) {
    console.error(e);
  }
};
</script>

<template>
  <div
    class="card card-compact bg-base-200 shadow-lg hover:shadow-xl transition-all duration-300 w-full cursor-pointer"
    style="min-width: 0;"
    @click="handleCardClick">
    <div class="card-body p-3 sm:p-4">
      <div class="flex gap-3 flex-row">
        <!-- SLIKA VIJESTI -->
        <div class="flex-shrink-0 cursor-pointer w-20 sm:w-32" @click="openNewsModal">
          <figure class="relative overflow-hidden w-20 h-20 sm:w-32 sm:h-24 rounded-lg bg-base-300">
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
        <div class="flex-1 min-w-0 w-full">
          <!-- izvor badge -->
          <div class="mb-2 flex items-center gap-1 flex-wrap">
            <span class="badge badge-outline badge-xs" :class="colorClass ? `${colorClass} border-current` : ''">
              {{ news.source || 'Vijesti' }}
            </span>
            <span v-if="news.domain" class="badge badge-ghost badge-sm ml-1">
              {{ news.domain }}
            </span>
            <!-- personalna ocjena (samo NewsCombo) -->
            <a v-if="comboScore"
               class="badge badge-sm ml-1 gap-1 cursor-pointer tooltip tooltip-primary"
               :class="scoreClass"
               :data-tip="`Tvoja ocjena — ${scoreTip}. Klikni za detalje.`"
               title="Koliko će te ova vijest vjerojatno zanimati"
               @click.stop.prevent="$router.push('/taste')">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-3 w-3">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="4.5" />
                <circle cx="12" cy="12" r="0.5" fill="currentColor" />
              </svg>
              {{ comboScore.pct }}%
            </a>
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
            <div class="flex gap-1 items-center">
              <!-- srce (sviđa mi se) -->
              <button @click="toggleLike" class="btn btn-xs btn-circle tooltip tooltip-top"
                :class="isLiked ? 'btn-error' : 'btn-ghost'"
                :data-tip="isLiked ? 'Makni srce' : 'Sviđa mi se'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :fill="isLiked ? 'currentColor' : 'none'"
                  viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              <!-- ne sviđa mi se -->
              <button @click="toggleDislike" class="btn btn-xs btn-circle tooltip tooltip-top"
                :class="isDisliked ? 'btn-neutral' : 'btn-ghost'"
                :data-tip="isDisliked ? 'Poništi' : 'Ne sviđa mi se'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <button @click="toggleBookmark" class="btn btn-xs btn-circle ml-1 tooltip tooltip-top"
                :class="isBookmarked ? 'btn-primary' : 'btn-ghost'" data-tip="Spremi članak">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :fill="isBookmarked ? 'currentColor' : 'none'"
                  viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>

            <button @click="openNewsModal" class="btn btn-xs btn-primary btn-outline">
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
  .btn-xs:not(.btn-circle) {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
  }

  .line-clamp-2 {
    -webkit-line-clamp: 3;
  }
}
</style>

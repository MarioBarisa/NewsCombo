<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal modal-open" @click.self="closeModal">
        <div class="modal-box max-w-4xl w-full h-[90dvh] p-0 relative flex flex-col overflow-hidden" style="height: 90dvh; max-height: 90dvh;">
          <div
            class="flex-shrink-0 bg-base-100 border-b border-base-300 px-6 py-4 flex justify-between items-center shadow-sm backdrop-blur-lg bg-base-100/95 z-10">
            <div class="flex-1 min-w-0 sm:pr-4">
              <h3 class="font-bold text-base sm:text-lg line-clamp-2 sm:line-clamp-1">
                {{ newsItem?.title || 'Učitavanje...' }}
              </h3>
              <div class="flex flex-wrap gap-2 items-center mt-1">
                <p class="text-sm opacity-60" v-if="newsItem?.source">
                  {{ newsItem.source }}
                </p>
                <span class="badge badge-xs" :class="enhancedContent ? 'badge-success' : 'badge-info'">
                  {{ enhancedContent ? 'Cijeli članak učitan' : 'RSS sadržaj' }}
                </span>
              </div>
            </div>

            <div class="flex gap-2">
              <a v-if="newsItem?.link" :href="newsItem.link" target="_blank" rel="noopener noreferrer"
                class="btn btn-sm btn-primary gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span class="hidden sm:inline">Otvori izvorno</span>
              </a>
              <button @click="closeModal" class="btn btn-sm btn-circle btn-ghost" aria-label="Zatvori">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div class="flex-1 min-h-0 overflow-y-auto bg-base-100">
            <article class="max-w-3xl mx-auto px-6 py-8">
              <figure v-if="articleImage && !imageError" class="mb-8 -mx-6 sm:mx-0">
                <img :src="articleImage" :alt="newsItem?.title"
                  class="w-full rounded-none sm:rounded-xl shadow-2xl object-cover max-h-[500px]"
                  @error="handleImageError" loading="eager" />
              </figure>

              <header class="mb-8">
                <h1 class="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight text-base-content">
                  {{ newsItem?.title }}
                </h1>
                <div
                  class="flex flex-wrap gap-4 text-sm opacity-70 border-l-4 border-primary pl-4 py-3 bg-base-200/50 rounded-r">
                  <div v-if="articleAuthor" class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span class="font-semibold">{{ articleAuthor }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    <span class="font-semibold">{{ articleSource }}</span>
                  </div>
                  <div v-if="newsItem?.pubDate" class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <time>{{ formatDate(newsItem.pubDate) }}</time>
                  </div>
                </div>
              </header>

              <!-- članak Body -->
              <div class="prose prose-lg max-w-none">
                <!--summary -->
                <div v-if="articleSummary"
                  class="lead text-xl font-medium text-base-content/80 mb-6 p-4 bg-primary/5 border-l-4 border-primary rounded-r">
                  {{ articleSummary }}
                </div>

                <!--glavni dio članka -->
                <div class="article-content text-base-content/90 leading-relaxed space-y-4" v-html="articleContent">
                </div>

                <!-- članak loading indikator -->
                <div v-if="isEnhancing" class="mt-6 p-4 bg-info/10 rounded-lg flex items-center gap-3 animate-pulse">
                  <span class="loading loading-spinner loading-sm text-primary"></span>
                  <span class="text-sm">Učitavam cijeli članak s izvorne stranice...</span>
                </div>

                <!-- uspjeh indicator -->
                <div v-if="enhancedContent && !isEnhancing"
                  class="mt-6 p-4 bg-success/10 rounded-lg flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success" viewBox="0 0 20 20"
                    fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd" />
                  </svg>
                  <span class="text-sm text-success font-medium">✓ Cijeli članak uspješno učitan</span>
                </div>
              </div>

              <!-- kategorija -->
              <div v-if="newsItem?.categories?.length" class="mt-10 pt-6 border-t border-base-300">
                <h3 class="text-sm font-bold opacity-60 mb-3 uppercase tracking-wide">Kategorije</h3>
                <div class="flex flex-wrap gap-2">
                  <span v-for="(category, idx) in newsItem.categories" :key="idx" class="badge badge-outline badge-lg">
                    {{ category }}
                  </span>
                </div>
              </div>

              <!-- čitaj više -->
              <div
                class="mt-12 p-8 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 rounded-2xl text-center border border-primary/20">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-primary" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <h3 class="text-xl font-bold mb-2">Pogledaj originalni članak</h3>
                <p class="mb-6 opacity-80 text-sm">Posjetite izvornu stranicu za komentare i dodatne medije</p>
                <a :href="newsItem?.link" target="_blank" rel="noopener noreferrer"
                  class="btn btn-primary btn-lg gap-2 shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Otvori na {{ getDomain(newsItem?.link) }}
                </a>
              </div>

              <div class="h-4"></div>
            </article>
          </div>
          <div
            class="flex-shrink-0 bg-base-100/95 backdrop-blur-lg border-t border-base-300 px-6 py-3 flex justify-between items-center shadow-lg z-10">
            <div class="flex gap-2">
              <button @click="toggleBookmark" class="btn btn-sm btn-circle tooltip ml-2"
                :class="isBookmarked ? 'btn-primary' : 'btn-ghost'" data-tip="Spremi za kasnije">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :fill="isBookmarked ? 'currentColor' : 'none'"
                  viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>
            <div class="text-xs opacity-60 flex items-center gap-2">
              <kbd class="kbd kbd-sm">ESC</kbd>
              <span>za zatvaranje</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>


<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { API_URL } from '../config.js';

const props = defineProps({
  newsItem: {
    type: Object,
    default: null
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'like', 'dislike'])
const isLiked = ref(false)
const isDisliked = ref(false)
const imageError = ref(false)
const isEnhancing = ref(false)
const enhancedContent = ref('')
const isBookmarked = ref(false)


const BACKEND_PROXY = `${API_URL}/proxy-article?url=`;


const articleImage = computed(() => {
  return props.newsItem?.enclosure?.link ||
    props.newsItem?.thumbnail ||
    props.newsItem?.image ||
    props.newsItem?.['media:thumbnail']?.$?.url ||
    props.newsItem?.['media:content']?.$?.url ||
    extractImageFromHtml(props.newsItem?.description || props.newsItem?.content || '')
})

const articleAuthor = computed(() => {
  return props.newsItem?.author ||
    props.newsItem?.creator ||
    props.newsItem?.['dc:creator'] ||
    ''
})

const articleSource = computed(() => {
  return props.newsItem?.source || getDomain(props.newsItem?.link)
})

const articleSummary = computed(() => {
  const summary = props.newsItem?.contentSnippet ||
    props.newsItem?.summary ||
    ''

  if (!summary) return ''

  const cleaned = summary.replace(/<[^>]*>/g, '').trim()
  return cleaned.length > 500 ? cleaned.substring(0, 500) + '...' : cleaned
})

const articleContent = computed(() => {
  if (enhancedContent.value) {
    return enhancedContent.value
  }
  let content = props.newsItem?.['content:encoded'] ||
    props.newsItem?.content ||
    props.newsItem?.description ||
    ''

  if (!content) return '<p class="opacity-60">Učitavam cijeli članak...</p>'

  content = cleanHtml(content)
  if (!content.includes('<p>')) {
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 30)
    content = paragraphs.map(p => `<p>${p.trim()}</p>`).join('')
  }

  return content
})

const closeModal = () => {
  emit('close')
}

const extractImageFromHtml = (html) => {
  if (!html) return null
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/i
  const match = html.match(imgRegex)
  return match ? match[1] : null
}

const cleanHtml = (html) => {
  if (!html) return ''

  // trash destroyer 
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  html = html.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
  html = html.replace(/\s+/g, ' ').trim()

  return html
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('hr-HR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    return dateString
  }
}

const getDomain = (url) => {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return ''
  }
}

const handleImageError = () => {
  imageError.value = true
}

// main fn
const enhanceContent = async () => {
  if (!props.newsItem?.link) return

  isEnhancing.value = true

  try {

        let htmlContent = await fetchWithProxy(props.newsItem.link);


    if (htmlContent) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlContent, 'text/html')
      const selectors = [
        'article',
        '[itemprop="articleBody"]',
        '.article-body',
        '.article-content',
        '.post-content',
        '.entry-content',
        '[role="article"]',
        'main article',
        '.content-body',
        '#article-content',
        '.article__content', 
        '.single-article__content', 
        '.story-body', 
        '.c-article-body',
        'div[data-component="text-block"]' 
      ]


      for (const selector of selectors) {
        const element = doc.querySelector(selector)
        if (element) {
          //  nepotrebni elementi
          element.querySelectorAll('script, style, iframe, .ad, .advertisement, .social-share, .related-posts').forEach(el => el.remove())

          // dohvati paragrafe
          const paragraphs = Array.from(element.querySelectorAll('p, h2, h3, blockquote, ul, ol'))
            .filter(el => {
              const text = el.textContent.trim()
              return text.length > 40 && !text.includes('cookie') && !text.includes('newsletter')
            })
            .map(el => {
              const tagName = el.tagName.toLowerCase()
              const text = el.textContent.trim()

              if (tagName === 'h2') return `<h2 class="text-2xl font-bold mt-6 mb-3">${text}</h2>`
              if (tagName === 'h3') return `<h3 class="text-xl font-bold mt-4 mb-2">${text}</h3>`
              if (tagName === 'blockquote') return `<blockquote class="border-l-4 border-primary pl-4 italic my-4">${text}</blockquote>`
              if (tagName === 'ul' || tagName === 'ol') {
                const items = Array.from(el.querySelectorAll('li')).map(li => `<li>${li.textContent.trim()}</li>`).join('')
                return tagName === 'ul' ? `<ul class="list-disc pl-6 my-3">${items}</ul>` : `<ol class="list-decimal pl-6 my-3">${items}</ol>`
              }

              return `<p class="mb-4">${text}</p>`
            })
            .slice(0, 30)

          if (paragraphs.length > 5) {
            enhancedContent.value = paragraphs.join('')
            return
          }
        }
      }
    }
  } catch (error) {
    console.warn('Greška pri učitavanju:', error.message)
  } finally {
    isEnhancing.value = false
  }
}


const fetchWithProxy = async (url) => {
  try {
    const proxyUrl = `${BACKEND_PROXY}${encodeURIComponent(url)}`;
    const token = localStorage.getItem('token');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(proxyUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'text/html',
        'Authorization': `Bearer ${token}` 
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return await response.text();
    }

    console.warn(`Backend proxy vratio status ${response.status}`);
    return null;
  } catch (err) {
    console.warn('Backend proxy greška:', err.message);
    return null;
  }
};



const toggleLike = () => {
  if (isDisliked.value) isDisliked.value = false
  isLiked.value = !isLiked.value
  emit('like', props.newsItem?.link, isLiked.value)
  savePreference()
}

const toggleDislike = () => {
  if (isLiked.value) isLiked.value = false
  isDisliked.value = !isDisliked.value
  emit('dislike', props.newsItem?.link, isDisliked.value)
  savePreference()
}

// provjera i toggle bookmarka
const toggleBookmark = async () => {
  const url = `${API_URL}/bookmarks`;
  const method = isBookmarked.value ? 'DELETE' : 'POST';
  const token = localStorage.getItem('token'); 

  try {
    const bodyContent = enhancedContent.value || props.newsItem.description || '';

    const response = await fetch(url, {
      method: method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        title: props.newsItem.title,
        originalUrl: props.newsItem.link,
        source: articleSource.value,
        body: bodyContent,
        publishedAt: props.newsItem.pubDate
      })
    });

    if (response.ok) {
      isBookmarked.value = !isBookmarked.value;
    } else {
      const errorData = await response.json();
    }
  } catch (e) {
    console.error("Greška s bookmarkom:", e);
    
  }
}


const savePreference = () => {
  try {
    const prefs = JSON.parse(localStorage.getItem('newsPreferences') || '{}')
    if (isLiked.value) {
      prefs[props.newsItem.link] = 'like'
    } else if (isDisliked.value) {
      prefs[props.newsItem.link] = 'dislike'
    } else {
      delete prefs[props.newsItem.link]
    }
    localStorage.setItem('newsPreferences', JSON.stringify(prefs))
  } catch (e) {
    console.error('Error saving preference:', e)
  }
}

const loadPreferences = () => {
  if (!props.newsItem?.link) return

  try {
    const prefs = JSON.parse(localStorage.getItem('newsPreferences') || '{}')
    const pref = prefs[props.newsItem.link]

    isLiked.value = pref === 'like'
    isDisliked.value = pref === 'dislike'
  } catch (e) {
    console.error('Error loading preferences:', e)
  }
}

const handleEscapeKey = (event) => {
  if (event.key === 'Escape' && props.isOpen) {
    closeModal()
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    loadPreferences()
    document.body.style.overflow = 'hidden'
    enhancedContent.value = '' 
    setTimeout(() => {
      enhanceContent()
    }, 100)
  } else {
    document.body.style.overflow = ''
  }
})

// watcher za ako je članak bookmarked
watch(() => props.newsItem, () => {
  isBookmarked.value = false;
})

watch(() => props.newsItem, () => {
  if (props.isOpen) {
    loadPreferences()
    enhancedContent.value = ''

    setTimeout(() => {
      enhanceContent()
    }, 100)
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscapeKey)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-open {
  pointer-events: auto;
}

.modal-box {
  animation: modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(-10px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-enter-active {
  transition: opacity 0.15s ease;
}

.modal-leave-active {
  transition: opacity 0.1s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prose p {
  margin-bottom: 1.25rem;
  line-height: 1.8;
}

.article-content :deep(p) {
  margin-bottom: 1.25rem;
  line-height: 1.8;
  font-size: 1.05rem;
}

.article-content :deep(h2) {
  font-size: 1.75rem;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

.article-content :deep(h3) {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.article-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1.5rem 0;
}

.article-content :deep(a) {
  color: oklch(var(--p));
  text-decoration: underline;
}

.article-content :deep(blockquote) {
  border-left: 4px solid oklch(var(--p));
  padding-left: 1rem;
  margin: 1.5rem 0;
  font-style: italic;
  opacity: 0.8;
}

.article-content :deep(ul),
.article-content :deep(ol) {
  margin: 1rem 0;
  padding-left: 2rem;
}

.article-content :deep(li) {
  margin-bottom: 0.5rem;
}

.lead {
  font-size: 1.125rem;
  line-height: 1.75;
}

@media (max-width: 375px) {
  .text-4xl {
    font-size: 1.25rem;
    /* manji naslov na telefonima */
  }

  .prose-lg {
    font-size: 0.875rem;
    /* manji tekst članka */
  }

  .flex-wrap {
    gap: 0.5rem;
    /* manji razmak između meta info */
  }
}
</style>

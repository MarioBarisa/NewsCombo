<template>
    <Teleport to="body">
      <Transition name="modal">
        <div 
          v-if="isOpen" 
          class="modal modal-open"
          @click.self="closeModal"
        >
          <div class="modal-box max-w-4xl w-full h-[90vh] p-0 relative overflow-hidden">
            <!-- Header -->
            <div class="sticky top-0 z-10 bg-base-100 border-b border-base-300 px-6 py-4 flex justify-between items-center shadow-sm backdrop-blur-lg bg-base-100/95">
              <div class="flex-1 pr-4">
                <h3 class="font-bold text-lg line-clamp-1">
                  {{ newsItem?.title || 'Učitavanje...' }}
                </h3>
                <div class="flex gap-2 items-center mt-1">
                  <p class="text-sm opacity-60" v-if="newsItem?.source">
                    {{ newsItem.source }}
                  </p>
                  <span class="badge badge-success badge-xs">
                    Učitano
                  </span>
                </div>
              </div>
              
              <div class="flex gap-2">
                <!-- Open original -->
                <a
                  v-if="newsItem?.link"
                  :href="newsItem.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-sm btn-primary gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Otvori izvorno
                </a>
                
                <!-- Close -->
                <button 
                  @click="closeModal" 
                  class="btn btn-sm btn-circle btn-ghost"
                  aria-label="Zatvori"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
  
            <!-- Article Content - INSTANT PRIKAZ -->
            <div class="h-full overflow-y-auto bg-base-100">
              <article class="max-w-3xl mx-auto px-6 py-8">
                <!-- Featured Image -->
                <figure v-if="articleImage && !imageError" class="mb-8 -mx-6 sm:mx-0">
                  <img 
                    :src="articleImage" 
                    :alt="newsItem?.title"
                    class="w-full rounded-none sm:rounded-xl shadow-2xl object-cover max-h-[500px]"
                    @error="handleImageError"
                    loading="eager"
                  />
                </figure>
  
                <!-- Article Header -->
                <header class="mb-8">
                  <h1 class="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight text-base-content">
                    {{ newsItem?.title }}
                  </h1>
  
                  <!-- Meta Information -->
                  <div class="flex flex-wrap gap-4 text-sm opacity-70 border-l-4 border-primary pl-4 py-3 bg-base-200/50 rounded-r">
                    <div v-if="articleAuthor" class="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span class="font-semibold">{{ articleAuthor }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                      <span class="font-semibold">{{ articleSource }}</span>
                    </div>
                    <div v-if="newsItem?.pubDate" class="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <time>{{ formatDate(newsItem.pubDate) }}</time>
                    </div>
                  </div>
                </header>
  
                <!-- Article Body -->
                <div class="prose prose-lg max-w-none">
                  <!-- Summary/Lead -->
                  <div v-if="articleSummary" class="lead text-xl font-medium text-base-content/80 mb-6 p-4 bg-primary/5 border-l-4 border-primary rounded-r">
                    {{ articleSummary }}
                  </div>
  
                  <!-- Main Content -->
                  <div 
                    class="article-content text-base-content/90 leading-relaxed space-y-4"
                    v-html="articleContent"
                  ></div>
  
                  <!-- Enhanced Content Loading Indicator -->
                  <div v-if="isEnhancing" class="mt-6 p-4 bg-info/10 rounded-lg flex items-center gap-3">
                    <span class="loading loading-spinner loading-sm"></span>
                    <span class="text-sm opacity-70">Učitavam dodatni sadržaj...</span>
                  </div>
                </div>
  
                <!-- Categories/Tags -->
                <div v-if="newsItem?.categories?.length" class="mt-10 pt-6 border-t border-base-300">
                  <h3 class="text-sm font-bold opacity-60 mb-3 uppercase tracking-wide">Kategorije</h3>
                  <div class="flex flex-wrap gap-2">
                    <span 
                      v-for="(category, idx) in newsItem.categories" 
                      :key="idx"
                      class="badge badge-outline badge-lg"
                    >
                      {{ category }}
                    </span>
                  </div>
                </div>
  
                <!-- Read More CTA -->
                <div class="mt-12 p-8 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 rounded-2xl text-center border border-primary/20">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <h3 class="text-xl font-bold mb-2">Pogledaj cijeli članak</h3>
                  <p class="mb-6 opacity-80 text-sm">Posjetite originalnu stranicu za potpun sadržaj i komentare</p>
                  <a
                    :href="newsItem?.link"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-primary btn-lg gap-2 shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Otvori na {{ getDomain(newsItem?.link) }}
                  </a>
                </div>
              </article>
            </div>
  
            <!-- Footer -->
            <div class="sticky bottom-0 z-10 bg-base-100/95 backdrop-blur-lg border-t border-base-300 px-6 py-3 flex justify-between items-center shadow-lg">
              <div class="flex gap-2">
                <button
                  @click="toggleLike"
                  class="btn btn-sm btn-circle tooltip"
                  :class="isLiked ? 'btn-error' : 'btn-ghost'"
                  data-tip="Sviđa mi se"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    :fill="isLiked ? 'currentColor' : 'none'"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
  
                <button
                  @click="toggleDislike"
                  class="btn btn-sm btn-circle tooltip"
                  :class="isDisliked ? 'btn-warning' : 'btn-ghost'"
                  data-tip="Ne sviđa mi se"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    :fill="isDisliked ? 'currentColor' : 'none'"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
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
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
  
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
  
  // State
  const isLiked = ref(false)
  const isDisliked = ref(false)
  const imageError = ref(false)
  const isEnhancing = ref(false)
  const enhancedContent = ref('')
  
  // Computed - INSTANT DATA
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
    // Ako ima enhanced content, vrati ga
    if (enhancedContent.value) {
      return enhancedContent.value
    }
    
    // Inače koristi RSS content
    let content = props.newsItem?.['content:encoded'] || 
                  props.newsItem?.content ||
                  props.newsItem?.description ||
                  ''
    
    if (!content) return '<p class="opacity-60">Sadržaj nije dostupan. Posjetite izvornu stranicu za cijeli članak.</p>'
    
    // Quick clean
    content = cleanHtml(content)
    
    // Format paragraphs
    if (!content.includes('<p>')) {
      const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 30)
      content = paragraphs.map(p => `<p>${p.trim()}</p>`).join('')
    }
    
    return content
  })
  
  // Functions
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
    
    // Remove dangerous tags
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    html = html.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    
    // Clean whitespace
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
  
  // BACKGROUND enhancement - ne blokira prikaz
  const enhanceContent = async () => {
    // Skip ako već ima dovoljno sadržaja
    const currentLength = (props.newsItem?.content || props.newsItem?.description || '').length
    if (currentLength > 1000) {
      return
    }
  
    isEnhancing.value = true
    
    try {
      const proxyUrl = 'https://api.allorigins.win/get?url='
      const targetUrl = encodeURIComponent(props.newsItem?.link)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout
      
      const response = await fetch(`${proxyUrl}${targetUrl}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        const parser = new DOMParser()
        const doc = parser.parseFromString(data.contents, 'text/html')
        
        // Quick selectors
        const selectors = ['article', '[role="article"]', '.article-content', '.post-content', 'main']
        
        for (const selector of selectors) {
          const element = doc.querySelector(selector)
          if (element) {
            const paragraphs = Array.from(element.querySelectorAll('p'))
              .filter(p => p.textContent.trim().length > 50)
              .map(p => `<p>${p.textContent.trim()}</p>`)
              .slice(0, 15) // Max 15 paragraphs
            
            if (paragraphs.length > 3) {
              enhancedContent.value = paragraphs.join('')
              console.log('✅ Enhanced content loaded!')
              break
            }
          }
        }
      }
    } catch (error) {
      console.log('ℹ️ Enhancement skipped:', error.message)
    } finally {
      isEnhancing.value = false
    }
  }
  
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
  
  // Watchers
  watch(() => props.isOpen, (newVal) => {
    if (newVal) {
      loadPreferences()
      document.body.style.overflow = 'hidden'
      
      // Start background enhancement AFTER initial render
      setTimeout(() => {
        enhanceContent()
      }, 500)
    } else {
      document.body.style.overflow = ''
      enhancedContent.value = ''
    }
  })
  
  watch(() => props.newsItem, () => {
    if (props.isOpen) {
      loadPreferences()
      enhancedContent.value = ''
      
      setTimeout(() => {
        enhanceContent()
      }, 500)
    }
  })
  
  // Lifecycle
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
  
  /* Article Styling */
  .prose p {
    margin-bottom: 1.25rem;
    line-height: 1.8;
  }
  
  .article-content :deep(p) {
    margin-bottom: 1.25rem;
    line-height: 1.8;
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
  
  .article-content :deep(h2),
  .article-content :deep(h3) {
    font-weight: bold;
    margin-top: 2rem;
    margin-bottom: 1rem;
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
  </style>
  
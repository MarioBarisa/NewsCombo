<template>
      <footer class="footer sm:footer-horizontal bg-base-200 text-base-content gap-x-8 gap-y-4 px-5 py-4 sm:gap-y-5 sm:px-10 sm:py-6 border-t border-base-300">
        <aside class="gap-2.5 sm:gap-2">
          <router-link to="/" class="flex items-center gap-3" aria-label="NewsCombo početna"><svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-[#F74420]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg><span class="text-xl font-bold">NewsCombo</span></router-link>
          <p class="text-xs sm:text-sm text-base-content/70 max-w-xs">Personalizirano praćenje vijesti putem RSS feedova</p>
        </aside>
        <nav class="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-x-6 gap-y-1.5 content-start">
          <h6 class="footer-title col-span-2">Aplikacija</h6>
          <a href="https://github.com/MarioBarisa/NewsCombo" target="_blank" rel="noopener noreferrer" class="link link-hover text-sm">O aplikaciji</a>
          <a href="mailto:mario@barisa.me" class="link link-hover text-sm">Kontakt</a>
          <router-link to="/privacy" class="link link-hover text-sm">Privatnost</router-link>
          <router-link to="/tos" class="link link-hover text-sm">Uvjeti korištenja</router-link>
        </nav>
        <nav>
          <h6 class="footer-title">Zaprati</h6>
          <div class="grid grid-flow-col gap-1 sm:gap-2">
            <a href="https://github.com/MarioBarisa" target="_blank" rel="noopener noreferrer" aria-label="Mario Bariša na GitHubu" title="Mario Bariša na GitHubu" class="btn btn-ghost btn-circle btn-xs sm:btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4 sm:h-5 sm:w-5"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
            </a>
            <a href="https://github.com/MarioBarisa/NewsCombo" target="_blank" rel="noopener noreferrer" aria-label="Izvorni kod NewsComboa" title="Izvorni kod NewsComboa" class="btn btn-ghost btn-circle btn-xs sm:btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4 sm:h-5 sm:w-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
              </svg>
            </a>
            <a href="https://barisa.me" target="_blank" rel="noopener noreferrer" aria-label="barisa.me" title="barisa.me" class="btn btn-ghost btn-circle btn-xs sm:btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4 sm:h-5 sm:w-5">
                <circle cx="12" cy="12" r="9" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 12h18" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.5 2.6 3.9 5.7 3.9 9s-1.4 6.4-3.9 9c-2.5-2.6-3.9-5.7-3.9-9S9.5 5.6 12 3Z" />
              </svg>
            </a>
            <a href="mailto:mario@barisa.me" aria-label="Kontakt e-poštom" title="Kontakt e-poštom" class="btn btn-ghost btn-circle btn-xs sm:btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-4 w-4 sm:h-5 sm:w-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </a>
          </div>
          <p class="text-sm text-base-content/70">
            Izradio ❤️ <a href="https://barisa.me" target="_blank" rel="noopener noreferrer" class="link link-hover font-medium">Mario Bariša</a>
          </p>
          <p class="text-[11px] sm:text-xs text-base-content/60">© {{ currentYear }} NewsCombo - <a href="https://barisa.me" target="_blank" rel="noopener noreferrer" class="link link-hover">Mario Bariša</a>. Sva prava pridržana.</p>
        </nav>
      </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear();
</script>

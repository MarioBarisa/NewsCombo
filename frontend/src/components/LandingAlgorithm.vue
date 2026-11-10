<template>
  <section id="algoritam" class="rounded-box bg-warning/10 text-base-content border border-warning/25 p-5 sm:p-8 scroll-mt-6" aria-labelledby="algorithm-title">
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-7">
      <div>
        <h2 id="algorithm-title" class="text-2xl sm:text-3xl font-bold tracking-tight">Tvoja reakcija mijenja redoslijed.</h2>
        <p class="text-sm opacity-75 mt-2">NewsCombo algoritam je u potpunosti open source i transparentan.</p>
      </div>
      <a href="https://github.com/MarioBarisa/NewsCombo/blob/main/frontend/src/Services/recommender.js" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm shrink-0 self-start">Pogledaj kod <span aria-hidden="true">↗</span></a>
    </div>
    <ol class="grid md:grid-cols-3 gap-7" aria-label="Od reakcije do prilagođenog feeda" aria-live="polite" aria-atomic="true">
      <li class="relative min-w-0">
        <h3 class="text-sm font-semibold mb-3"><span class="opacity-50 mr-2">01</span> Reagiraš na članak</h3>
        <div class="rounded-box bg-base-100 text-base-content p-4 flex items-center gap-3 min-h-28">
          <span class="text-3xl" :class="signal === 'heart' ? 'text-error' : 'text-secondary'" aria-hidden="true">{{ signalSymbols[signal] }}</span>
          <div>
            <span class="badge badge-ghost badge-sm mb-2">{{ example?.category || 'Tehnologija' }}</span>
            <p class="font-semibold text-sm">{{ example?.title || 'Otvoreni kod: alati za razvoj weba' }}</p>
          </div>
        </div>
        <p class="text-xs opacity-75 leading-relaxed mt-3">{{ signalDescriptions[signal] }}</p>
        <span class="absolute -bottom-6 left-1/2 md:bottom-auto md:left-auto md:top-20 md:-right-5 opacity-60" aria-hidden="true"><span class="md:hidden">↓</span><span class="hidden md:inline">→</span></span>
      </li>
      <li class="relative min-w-0">
        <h3 class="text-sm font-semibold mb-3"><span class="opacity-50 mr-2">02</span> Algoritam povezuje interese</h3>
        <div class="rounded-box bg-base-100 text-base-content p-4 min-h-28 flex items-center">
          <div class="flex w-full items-center justify-between gap-2 text-center">
            <div><p class="text-xl font-bold tabular-nums">{{ COMBO_CONFIG.weights.top * 100 }}<span class="text-xs">%</span></p><p class="text-xs text-base-content/60 mt-1">Teme</p></div>
            <span class="text-base-content/30" aria-hidden="true">+</span>
            <div><p class="text-xl font-bold tabular-nums">{{ COMBO_CONFIG.weights.src * 100 }}<span class="text-xs">%</span></p><p class="text-xs text-base-content/60 mt-1">Izvori</p></div>
            <span class="text-base-content/30" aria-hidden="true">+</span>
            <div><p class="text-xl font-bold tabular-nums">{{ COMBO_CONFIG.weights.cat * 100 }}<span class="text-xs">%</span></p><p class="text-xs text-base-content/60 mt-1">Kategorije</p></div>
          </div>
        </div>
        <p class="text-xs opacity-75 leading-relaxed mt-3">Uči iz reakcija, otvaranja i spremanja.</p>
        <span class="absolute -bottom-6 left-1/2 md:bottom-auto md:left-auto md:top-20 md:-right-5 opacity-60" aria-hidden="true"><span class="md:hidden">↓</span><span class="hidden md:inline">→</span></span>
      </li>
      <li class="min-w-0">
        <h3 class="text-sm font-semibold mb-3"><span class="opacity-50 mr-2">03</span> Ažurira NewsCombo redoslijed</h3>
        <div class="rounded-box bg-base-100 text-base-content p-4 min-h-28 flex items-center gap-3">
          <span class="badge badge-warning badge-soft text-lg h-10 w-10 shrink-0" aria-hidden="true">↑</span>
          <div>
            <p class="text-xs text-base-content/60 mb-2">NewsCombo</p>
            <p class="font-semibold text-sm">{{ example?.firstTitle || 'Otvoreni kod povezuje programere' }}</p>
          </div>
        </div>
        <p class="text-xs opacity-75 leading-relaxed mt-3">{{ example ? 'Trenutni prvi članak u tvojem primjeru.' : 'Sličan članak dobiva prednost.' }}</p>
      </li>
    </ol>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { COMBO_CONFIG } from '../Services/recommender.js';
const props = defineProps({ example: { type: Object, default: null } });
const signal = computed(() => props.example?.signal || 'heart');
const signalSymbols = { heart: '♥', dislike: '×', bookmark: '▣', open: '↗', undo: '↶' };
const signalDescriptions = {
  heart: 'Srce je pozitivan signal.',
  dislike: 'Dislike je negativan signal.',
  bookmark: 'Spremanje je pozitivan signal.',
  open: 'Otvaranje je blag pozitivan signal.',
  undo: 'Reakcija je uklonjena.',
};
</script>

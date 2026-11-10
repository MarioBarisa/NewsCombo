import { ref } from 'vue';

const browserLanguage = typeof navigator === 'undefined' ? 'en' : navigator.language;
const language = ref(/^hr(?:-|$)/i.test(browserLanguage || '') ? 'hr' : 'en');

export function useLegalLanguage() {
  return language;
}

// Centralna konfiguracija API URL-a
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3005';
export const API_URL = rawUrl.replace(/\/+$/, '');

// Debug mode (pokazuje API URL u konzoli)
//if (import.meta.env.DEV) {
 // console.log('🔧 API URL:', API_URL);
//}

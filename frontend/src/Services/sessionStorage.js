export function sessionUserId() {
  try {
    const token = localStorage.getItem('token');
    const payload = token?.split('.')[1];
    if (payload) {
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      if (decoded.userId) return String(decoded.userId);
    }
  } catch {}
  return localStorage.getItem('newsComboUserId') || 'guest';
}

export function userStorageKey(key) {
  return `${key}:${sessionUserId()}`;
}

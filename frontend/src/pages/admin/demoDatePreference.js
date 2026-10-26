const CHANGE_EVENT = 'cleanmarket:admin-demo-dates-changed'
const storageKey = (userId) => `cleanmarket:admin-demo-dates:${userId}`

/** Shared by admin routes and tabs; old per-tab preferences are migrated once. */
export function createDemoDatePreferenceStore(browser) {
  const fallback = new Map()
  const store = {
    get(userId) {
      const key = storageKey(userId)
      if (fallback.has(key)) return fallback.get(key)
      try {
        const value = browser?.localStorage.getItem(key)
        if (value != null) return value === 'true'
        const previous = browser?.sessionStorage.getItem(key)
        if (previous != null) return previous === 'true'
      } catch { /* Keep the preference in memory when storage is unavailable. */ }
      return fallback.get(key) ?? false
    },
    set(userId, enabled) {
      const key = storageKey(userId)
      try {
        browser?.localStorage.setItem(key, String(enabled))
        fallback.delete(key)
      } catch {
        fallback.set(key, enabled)
      }
      try {
        browser?.sessionStorage.removeItem(key)
      } catch { /* A successfully saved preference overrides the legacy value. */ }
      browser?.dispatchEvent(new browser.Event(CHANGE_EVENT))
    },
    migrate(userId) {
      const key = storageKey(userId)
      try {
        if (browser?.localStorage.getItem(key) == null && browser?.sessionStorage.getItem(key) != null) {
          store.set(userId, browser.sessionStorage.getItem(key) === 'true')
        }
      } catch { /* Storage is optional. */ }
    },
    subscribe(listener) {
      browser?.addEventListener('storage', listener)
      browser?.addEventListener(CHANGE_EVENT, listener)
      return () => {
        browser?.removeEventListener('storage', listener)
        browser?.removeEventListener(CHANGE_EVENT, listener)
      }
    },
  }
  return store
}

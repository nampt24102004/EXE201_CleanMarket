export function readState(key, fallback) {
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export function writeState(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // The demo remains usable when browser storage is unavailable.
  }
}

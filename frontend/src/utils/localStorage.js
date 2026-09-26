const STORAGE_KEY = 'organic-market-checkout'

export const loadCheckoutState = () => {
  try {
    const savedData = window.localStorage.getItem(STORAGE_KEY)
    return savedData ? JSON.parse(savedData) : {}
  } catch {
    return {}
  }
}

export const saveCheckoutState = (value) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Ignore localStorage failures in demo mode.
  }
}

export const clearCheckoutState = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore localStorage failures in demo mode.
  }
}

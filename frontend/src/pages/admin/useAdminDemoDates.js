import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { createDemoDatePreferenceStore } from './demoDatePreference'

const store = createDemoDatePreferenceStore(typeof window === 'undefined' ? undefined : window)
const serverSnapshot = () => false

export function useAdminDemoDates(userId) {
  const getSnapshot = useCallback(() => store.get(userId), [userId])
  const enabled = useSyncExternalStore(store.subscribe, getSnapshot, serverSnapshot)
  const setEnabled = useCallback((value) => store.set(userId, value), [userId])

  useEffect(() => store.migrate(userId), [userId])
  return [enabled, setEnabled]
}

import { useState, useRef, useEffect } from 'react'

/**
 * Two-click confirmation guard against accidental destructive actions.
 *
 * The first `confirm(key)` call "arms" that key and returns false; a second
 * call for the same key returns true (the caller should then perform the
 * action). An armed key auto-disarms after `timeoutMs` so a stray first click
 * is harmless. `key` lets one hook guard many items (e.g. rows in a list);
 * for a single button any constant key works.
 */
export function useConfirm(timeoutMs = 3000) {
  const [armedKey, setArmedKey] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  function disarm() {
    if (timer.current) clearTimeout(timer.current)
    setArmedKey(null)
  }

  /** Returns true on the confirming (second) click for `key`. */
  function confirm(key: string): boolean {
    if (armedKey === key) {
      disarm()
      return true
    }
    setArmedKey(key)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setArmedKey(null), timeoutMs)
    return false
  }

  return {
    confirm,
    isArmed: (key: string) => armedKey === key,
  }
}

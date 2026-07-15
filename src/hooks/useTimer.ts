import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { hms, runningElapsed } from '../utils/time'
import { projectName } from '../utils/projects'

export function useTimer() {
  const running = useStore(s => s.running)
  const [display, setDisplay] = useState('00:00:00')
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running) {
      // getState() reads without creating a second React subscription
      const projects = useStore.getState().projects
      const proj = projectName(projects, running.projectId)

      const tick = () => {
        const elapsed = hms(runningElapsed(running))
        setDisplay(elapsed)
        const prefix = running.pausedAt != null ? '⏸ ' : ''
        document.title = `${prefix}${elapsed} · ${proj} — Tick`
      }
      tick()
      tickRef.current = setInterval(tick, 1000)
    } else {
      setDisplay('00:00:00')
      document.title = 'Tick'
    }

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [running])

  return display
}

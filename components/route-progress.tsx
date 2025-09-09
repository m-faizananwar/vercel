'use client'
import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function RouteProgress() {
  const pathname = usePathname()
  const search = useSearchParams()?.toString()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Trigger start on path/search change
    setLoading(true)
    setProgress(10)
    const grow = setInterval(() => {
      setProgress(p => (p < 90 ? p + Math.random() * 15 : p))
    }, 120)

    // Simulate network settle delay; in real Next 13 we cannot hook events easily without router.events
    const timeout = setTimeout(() => {
      setProgress(100)
      setTimeout(() => setLoading(false), 180)
    }, 650)

    return () => {
      clearInterval(grow)
      clearTimeout(timeout)
    }
  }, [pathname, search])

  if (!loading) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5">
      <div
        className="h-full w-full origin-left animate-[progressFade_1.2s_ease-in-out] bg-gradient-to-r from-primary via-primary/80 to-primary/40 shadow-[0_0_8px_theme(colors.primary.DEFAULT)]"
        style={{ width: `${progress}%`, transition: 'width 200ms ease-out' }}
      />
    </div>
  )
}

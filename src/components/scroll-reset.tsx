'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * The app scrolls an inner container (#app-scroll), not the viewport, so
 * Next.js' built-in scroll-to-top on navigation never fires. Recreate it.
 */
export function ScrollReset() {
  const pathname = usePathname()
  useEffect(() => {
    document.getElementById('app-scroll')?.scrollTo(0, 0)
  }, [pathname])
  return null
}

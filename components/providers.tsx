'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'

import { TooltipProvider } from '@/components/ui/tooltip'

export function Providers({ children, ...props }: ThemeProviderProps) {
  React.useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const maskedAnon = anon
        ? anon.length > 12
          ? `${anon.slice(0, 6)}...${anon.slice(-4)}`
          : anon
        : '(missing)'
      console.log('[Env] NEXT_PUBLIC_SUPABASE_URL:', url)
      console.log('[Env] NEXT_PUBLIC_SUPABASE_ANON_KEY:', maskedAnon)
    }
  }, [])

  return (
    <NextThemesProvider {...props}>
      <TooltipProvider>{children}</TooltipProvider>
    </NextThemesProvider>
  )
}

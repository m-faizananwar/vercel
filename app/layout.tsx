import { Metadata } from 'next'
import { Suspense } from 'react'

import { Toaster } from 'react-hot-toast'

import '@/app/globals.css'
import { fontMono, fontSans } from '@/lib/fonts'
import { cn } from '@/lib/utils'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'
import { LayoutWrapper } from '@/components/layout-wrapper'
import { RouteProgress } from '@/components/route-progress'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'SAUDAGAR',
    template: `%s - SAUDAGAR`
  },
  description: 'Collaborate with your team on AI conversations. SAUDAGAR enables shared AI experiences for better collective intelligence.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
  }
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ]
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          'font-sans antialiased',
          fontSans.variable,
          fontMono.variable
        )}
      >
        <Toaster />
        <Providers attribute="class" defaultTheme="system" enableSystem>
          <Suspense fallback={null}>
            <RouteProgress />
          </Suspense>
          <LayoutWrapper 
            header={
              /* @ts-ignore */
              <Header />
            }
          >
            {children}
          </LayoutWrapper>
          <TailwindIndicator />
        </Providers>
      </body>
    </html>
  )
}

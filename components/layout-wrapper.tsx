import { ReactNode } from 'react'

interface LayoutWrapperProps {
  children: ReactNode
  header: ReactNode
}

// Server Component wrapper to avoid hydration mismatch issues caused by
// passing a Server Component (Header) into a Client Component.
export function LayoutWrapper({ children, header }: LayoutWrapperProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <div>{header}</div>
      <main className="flex flex-1 flex-col bg-muted/50 pt-16">{children}</main>
    </div>
  )
}

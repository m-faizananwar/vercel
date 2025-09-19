import { ReactNode } from 'react'

interface LayoutWrapperProps {
  children: ReactNode
  header: ReactNode
}

export function LayoutWrapper({ children, header }: LayoutWrapperProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <div>{header}</div>
      <main className="flex flex-1 flex-col bg-muted/50 pt-16">{children}</main>
    </div>
  )
}

import { IconSpinner } from '@/components/ui/icons'

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3">
        <IconSpinner className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground">Loading team chat...</p>
      </div>
    </div>
  )
}

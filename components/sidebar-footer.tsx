import { cn } from '@/lib/utils'

export function SidebarFooter({
  children,
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-t border-border/50 bg-muted/20 px-6 py-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

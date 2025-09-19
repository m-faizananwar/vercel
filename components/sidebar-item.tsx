'use client'

import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { IconMessage, IconUsers } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { setCachedChatContentClient } from '@/lib/cache'

interface SidebarItemProps {
  chat: {
    id: string
    title: string
    path: string
    sharePath?: string
    messages?: any[]
    teamId?: string
    userId?: string
    createdAt?: Date
  }
  children: React.ReactNode
}

export function SidebarItem({ chat, children }: SidebarItemProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isActive = pathname === chat.path

  if (!chat?.id) return null

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()

    if (chat.messages) {
      setCachedChatContentClient(chat.id, {
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt || new Date(),
        userId: chat.userId || '',
        path: chat.path,
        messages: chat.messages,
        teamId: chat.teamId
      })
    }

    router.push(chat.path)
  }

  return (
    <div className="relative mx-2 mb-1">
      <button
        onClick={handleClick}
        className={cn(
          'group flex w-full items-center rounded-2xl px-3 py-2.5 text-sm transition-all duration-200 text-left',
          'hover:scale-[1.01] hover:bg-muted/40 active:scale-[0.99]',
          isActive
            ? 'border border-primary/20 bg-primary/10 text-primary shadow-sm'
            : 'text-foreground/80 hover:text-foreground'
        )}
      >
        <div className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center">
          {chat.sharePath ? (
            <Tooltip delayDuration={1000}>
              <TooltipTrigger
                tabIndex={-1}
                className="rounded focus:bg-muted focus:ring-1 focus:ring-ring"
              >
                <IconUsers className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>Это общий чат.</TooltipContent>
            </Tooltip>
          ) : (
            <IconMessage className="h-4 w-4" />
          )}
        </div>
        <div
          className={cn(
            'truncate font-medium',
            isActive ? 'flex-1 pr-20' : 'flex-1'
          )}
          title={chat.title}
        >
          {chat.title}
        </div>
        {isActive && (
          <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1">
            {children}
          </div>
        )}
      </button>
    </div>
  )
}

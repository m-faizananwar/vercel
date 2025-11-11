'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { IconCrown } from '@/components/ui/icons'
import Link from 'next/link'

export interface UserMenuProps {
  user: {
    id: string
    email: string
    user_metadata?: {
      name?: string
      avatar_url?: string
    }
  }
  isSuperAdmin?: boolean
}

export function UserMenu({ user, isSuperAdmin = false }: UserMenuProps) {
  const router = useRouter()

  const signOut = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'cache-control': 'no-store'
        }
      })
    } catch {}

    try {
      const possibleKeys = [
        'sb-access-token',
        'sb-refresh-token',
        'supabase-auth-token',
        'auth-token'
      ]
      possibleKeys.forEach(k => {
        localStorage.removeItem(k)
        sessionStorage.removeItem(k)
      })
    } catch {}

    window.location.href = '/sign-in'
  }

  const resetSession = () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {}
    window.location.href = '/sign-in'
  }

  const displayName =
    user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'

  const initials = (() => {
    if (!displayName) return 'U'
    const parts = displayName.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  })()

  return (
    <div className="flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-10 rounded-full bg-muted/30 px-3 transition-all duration-200 hover:scale-105 hover:bg-muted/50 active:scale-95"
          >
            {user?.user_metadata?.avatar_url ? (
              <Image
                height={60}
                width={60}
                className="h-7 w-7 select-none rounded-full ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/40"
                src={`${user.user_metadata.avatar_url}&s=60`}
                alt={displayName}
              />
            ) : (
              <div className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-primary/10 text-xs font-semibold uppercase text-primary ring-2 ring-primary/20">
                {initials}
              </div>
            )}
            <span className="ml-2 text-sm font-medium">
              {displayName || '👋🏼'}
            </span>
            <svg
              className="ml-2 h-4 w-4 text-muted-foreground/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          sideOffset={8}
          align="start"
          className="w-[200px] rounded-2xl border border-border/50 bg-background/95 p-2 shadow-lg backdrop-blur-sm"
        >
          <DropdownMenuItem className="flex-col items-start rounded-xl p-3 hover:bg-muted/50 focus:bg-muted/50">
            <div className="text-sm font-semibold text-foreground">
              {displayName}
            </div>
            <div className="text-xs text-muted-foreground">{user?.email}</div>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1 bg-border/50" />
          {isSuperAdmin && (
            <>
              <DropdownMenuItem
                asChild
                className="cursor-pointer rounded-xl p-3 hover:bg-yellow-500/10 focus:bg-yellow-500/10"
              >
                <Link
                  href="/super-admin"
                  className="flex items-center text-sm font-medium text-yellow-600 dark:text-yellow-400"
                >
                  <IconCrown className="mr-2 h-4 w-4" />
                  Панель супер-администратора
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-border/50" />
            </>
          )}
          <DropdownMenuItem
            onClick={signOut}
            className="cursor-pointer rounded-xl p-3 text-sm font-medium text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
          >
            Выйти
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1 bg-border/50" />
          {process.env.NODE_ENV === 'development' && (
            <DropdownMenuItem className="cursor-default p-3 text-[10px] opacity-70">
              uid: {user?.id || 'n/a'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

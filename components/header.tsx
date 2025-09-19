import Link from 'next/link'

import { cn } from '@/lib/utils'
import { authFast, auth } from '@/auth'

import { Button, buttonVariants } from '@/components/ui/button'
import { Sidebar } from '@/components/sidebar'
import { SidebarTeams } from '@/components/sidebar-teams'
import {
  IconNextChat,
  IconSeparator,
  IconPlus,
  IconCrown
} from '@/components/ui/icons'
import { SidebarFooter } from '@/components/sidebar-footer'
import { ThemeToggle } from '@/components/theme-toggle'

import { UserMenu } from '@/components/user-menu'
import { TeamButton } from '@/components/team-button'
import { TeamSelectorDialog } from '@/components/team-selector-dialog'
import { cookies } from 'next/headers'
import { isSuperAdmin } from '@/lib/super-admin'
import { getUserTeams } from '@/app/team-actions'
import { TeamSelector } from '@/components/team-selector'

export async function Header() {
  const cookieStore = cookies()
  const session =
    (await authFast({ cookieStore })) || (await auth({ cookieStore }))
  const userId = session?.user?.id

  const isUserSuperAdmin = userId ? await isSuperAdmin(userId, session) : false
  const teams = userId ? await getUserTeams(userId) : []

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between border-b border-border/50 bg-background/80 px-6 shadow-md backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="flex items-center">
        {session?.user ? (
          <Sidebar
            session={session}
            footer={
              <SidebarFooter>
                <div className="flex items-center space-x-2">
                  <ThemeToggle />
                </div>
              </SidebarFooter>
            }
          >
            <div className="flex-1 overflow-auto">
              {}
              <div className="px-4 py-3">
                <h3 className="mb-2 text-sm font-medium text-foreground/80">
                  Чаты команды
                </h3>
                <SidebarTeams
                  session={session}
                  isSuperAdmin={isUserSuperAdmin}
                />
              </div>
            </div>
          </Sidebar>
        ) : (
          <Link href="/" target="_blank" rel="nofollow">
            <IconNextChat className="mr-2 h-6 w-6 dark:hidden" inverted />
            <IconNextChat className="mr-2 hidden h-6 w-6 dark:block" />
          </Link>
        )}
        {!session?.user && (
          <div className="flex items-center">
            <IconSeparator className="h-6 w-6 text-muted-foreground/50" />
            <Button variant="link" asChild className="-ml-2">
              <Link href="/sign-in">Вход</Link>
            </Button>
          </div>
        )}
      </div>
      <div className="flex items-center justify-end space-x-2">
        {session?.user && (
          <>
            <TeamButton />
            <TeamSelectorDialog teams={teams}>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-full bg-muted/50 px-3 transition-all duration-200 hover:scale-105 hover:bg-muted active:scale-95"
              >
                <IconPlus className="h-4 w-4" />
                <span className="text-sm">Новый чат</span>
              </Button>
            </TeamSelectorDialog>
            {isUserSuperAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-yellow-500/10 transition-all duration-200 hover:scale-105 hover:bg-yellow-500/20 active:scale-95"
                asChild
                title="Super Admin Dashboard"
              >
                <Link href="/super-admin">
                  <IconCrown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="sr-only">Super Admin</span>
                </Link>
              </Button>
            )}
            <UserMenu user={session.user} isSuperAdmin={isUserSuperAdmin} />
          </>
        )}
      </div>
    </header>
  )
}

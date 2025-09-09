import { redirect } from 'next/navigation'
import { getCurrentUserSuperAdminStatus } from '@/lib/super-admin'
import { getSystemStats, getAllUsersWithStats, getAllTeamsWithStats } from '@/app/super-admin-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconUsers, IconMessage, IconTeam, IconCrown } from '@/components/ui/icons'

import { InstantLoadingButton } from '@/components/instant-loading-button'
import { formatDate } from '@/lib/utils'

export default async function SuperAdminDashboard() {
  // Check if user is super admin
  const { user, isSuperAdmin } = await getCurrentUserSuperAdminStatus()

  if (!user) {
    redirect('/sign-in')
  }

  if (!isSuperAdmin) {
    redirect('/')
  }

  // Get system statistics
  const statsResult = await getSystemStats()
  const usersResult = await getAllUsersWithStats()
  const teamsResult = await getAllTeamsWithStats()

  if ('error' in statsResult) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">
          Error loading dashboard: {statsResult.error}
        </div>
      </div>
    )
  }

  const stats = statsResult
  const users = Array.isArray(usersResult) ? usersResult : []
  const teams = Array.isArray(teamsResult) ? teamsResult : []

  // Get recent users (last 5)
  const recentUsers = users.slice(0, 5)
  // Get recent teams (last 5)
  const recentTeams = teams.slice(0, 5)

  return (
    <div className="container mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
          Панель администратора
        </h1>
        <p className="text-muted-foreground">
          Обзор системы и управление
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border/60">
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Всего пользователей</p>
              <p className="text-2xl font-semibold">{stats.totalUsers}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60">
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Всего команд</p>
              <p className="text-2xl font-semibold">{stats.totalTeams}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60">
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Всего чатов</p>
              <p className="text-2xl font-semibold">{stats.totalChats}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60">
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Администраторы</p>
              <p className="text-2xl font-semibold">{stats.totalSuperAdmins}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Действия управления</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border border-border/60">
            <CardContent className="p-4">
              <InstantLoadingButton
                href="/super-admin/chats"
                variant="ghost"
                className="h-auto w-full justify-start p-0"
                prefetch
              >
                <div className="flex items-center space-x-3">
                  <IconMessage className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Просмотреть все чаты</p>
                    <p className="text-sm text-muted-foreground">Управление всеми чатами по командам</p>
                  </div>
                </div>
              </InstantLoadingButton>
            </CardContent>
          </Card>

          <Card className="border border-border/60">
            <CardContent className="p-4">
              <InstantLoadingButton
                href="/super-admin/users"
                variant="ghost"
                className="h-auto w-full justify-start p-0"
                prefetch
              >
                <div className="flex items-center space-x-3">
                  <IconUsers className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Управление пользователями</p>
                    <p className="text-sm text-muted-foreground">Добавление, редактирование и удаление пользователей</p>
                  </div>
                </div>
              </InstantLoadingButton>
            </CardContent>
          </Card>

          <Card className="border border-border/60">
            <CardContent className="p-4">
              <InstantLoadingButton
                href="/super-admin/teams"
                variant="ghost"
                className="h-auto w-full justify-start p-0"
                prefetch
              >
                <div className="flex items-center space-x-3">
                  <IconTeam className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Управление командами</p>
                    <p className="text-sm text-muted-foreground">Просмотр и управление всеми командами</p>
                  </div>
                </div>
              </InstantLoadingButton>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Последняя активность</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Recent Users */}
          <Card className="border border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Недавние пользователи</CardTitle>
              <CardDescription className="text-sm">
                Последние зарегистрированные пользователи
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentUsers.length > 0 ? (
                  recentUsers.map((user) => (
                    <div key={user.user_id} className="flex items-center justify-between py-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.email}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(user.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.is_super_admin && (
                          <Badge variant="default" className="text-xs">
                            Админ
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {user.team_count} команд
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-muted-foreground">Пользователи не найдены</p>
                  </div>
                )}
              </div>
              <div className="mt-4 border-t border-border/60 pt-3">
                <InstantLoadingButton
                  href="/super-admin/users"
                  variant="ghost"
                  size="sm"
                  className="w-full text-sm"
                  prefetch
                >
                  Просмотреть всех пользователей
                </InstantLoadingButton>
              </div>
            </CardContent>
          </Card>

          {/* Recent Teams */}
          <Card className="border border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Недавние команды</CardTitle>
              <CardDescription className="text-sm">
                Последние созданные команды
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTeams.length > 0 ? (
                  recentTeams.map((team) => (
                    <div key={team.team_id} className="flex items-center justify-between py-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{team.team_name}</span>
                        <span className="text-xs text-muted-foreground">
                          от {team.creator_email}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{team.member_count} участников</span>
                        <span className="text-xs text-muted-foreground">{team.chat_count} чатов</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-muted-foreground">Команды не найдены</p>
                  </div>
                )}
              </div>
              <div className="mt-4 border-t border-border/60 pt-3">
                <InstantLoadingButton
                  href="/super-admin/teams"
                  variant="ghost"
                  size="sm"
                  className="w-full text-sm"
                  prefetch
                >
                  Просмотреть все команды
                </InstantLoadingButton>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

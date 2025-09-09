import { redirect } from 'next/navigation'
import { getCurrentUserSuperAdminStatus } from '@/lib/super-admin'
import { getAllUsersWithStats } from '@/app/super-admin-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconUsers } from '@/components/ui/icons'

import Link from 'next/link'
import { SuperAdminUserActions } from '../../../components/super-admin-user-actions'
import { CreateUserForm } from '@/components/create-user-form'


export default async function SuperAdminUsersPage() {
  // Check if user is super admin
  const { user, isSuperAdmin } = await getCurrentUserSuperAdminStatus()

  if (!user) {
    redirect('/sign-in')
  }

  if (!isSuperAdmin) {
    redirect('/')
  }

  // Get all users with statistics
  const usersResult = await getAllUsersWithStats()

  // Get current user ID for self-protection
  const currentUserId = user.id

  if ('error' in usersResult) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">
          Error loading users: {usersResult.error}
        </div>
      </div>
    )
  }

  const users = usersResult

  return (
    <div className="container mx-auto max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/super-admin" className="flex items-center gap-2">
            ← Назад к панели управления
          </Link>
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
              Управление пользователями
            </h1>
            <p className="text-muted-foreground">
              Управление всеми зарегистрированными пользователями и их разрешениями
            </p>
          </div>
          <CreateUserForm />
        </div>
      </div>

      {/* Users List */}
      <Card className="border border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Все пользователи ({users.length})</CardTitle>
          <CardDescription className="text-sm">
            Зарегистрированные пользователи и их информация
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user.user_id}
                  className="flex flex-col justify-between rounded-lg border border-border/40 p-4 transition-colors hover:bg-muted/20 md:flex-row md:items-center"
                >
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">{user.email}</span>
                      {user.is_super_admin && (
                        <Badge variant="default" className="text-xs">
                          Админ
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span>Присоединился {new Date(user.created_at).toLocaleDateString()}</span>
                      <span>{user.team_count} команд</span>
                      <span>{user.total_chats} чатов</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center gap-2 md:mt-0">
                    <SuperAdminUserActions
                      userId={user.user_id}
                      userEmail={user.email}
                      isSuperAdmin={user.is_super_admin}
                      currentUserId={currentUserId}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="mb-1 text-base font-medium">Пользователи не найдены</p>
                <p className="text-sm text-muted-foreground">
                  Пользователи появятся здесь после регистрации
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

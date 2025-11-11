'use client'

import { useState } from 'react'
import { removeTeamMember, updateTeamMemberRole } from '@/app/team-actions'
import { TeamWithMembers } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { IconUser, IconChevronUpDown } from '@/components/ui/icons'
import { toast } from 'react-hot-toast'

interface TeamMembersListProps {
  team: TeamWithMembers
}

export function TeamMembersList({ team }: TeamMembersListProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleRemoveMember = async (userId: string) => {
    setLoading(userId)
    try {
      const result = await removeTeamMember(team.id, userId)

      if (typeof result === 'object' && result !== null && 'error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Участник удален из команды')
      }
    } catch (error) {
      toast.error('Не удалось удалить участника')
    } finally {
      setLoading(null)
    }
  }

  const handleChangeRole = async (userId: string, role: 'admin' | 'member') => {
    setLoading(userId)
    try {
      const result = await updateTeamMemberRole(team.id, userId, role)

      if (typeof result === 'object' && result !== null && 'error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Роль участника обновлена')
      }
    } catch (error) {
      toast.error('Не удалось обновить роль участника')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Участники ({team.members.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {team.members.map(member => (
          <div key={member.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <IconUser className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium">
                  {member.user?.email || member.user_id}
                </div>
                <div className="text-xs text-muted-foreground">
                  Присоединился{' '}
                  {new Date(member.joined_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant={member.role === 'admin' ? 'default' : 'secondary'}
              >
                {member.role === 'admin'
                  ? 'Администратор'
                  : member.role === 'member'
                  ? 'Участник'
                  : member.role}
              </Badge>

              {team.user_role === 'admin' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={loading === member.user_id}
                    >
                      <IconChevronUpDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {member.role === 'member' ? (
                      <DropdownMenuItem
                        onClick={() =>
                          handleChangeRole(member.user_id, 'admin')
                        }
                      >
                        Повысить до администратора
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() =>
                          handleChangeRole(member.user_id, 'member')
                        }
                      >
                        Понизить до участника
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="text-destructive"
                    >
                      Удалить из команды
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}

        {team.members.length === 0 && (
          <div className="py-4 text-center text-muted-foreground">
            Участники не найдены
          </div>
        )}
      </CardContent>
    </Card>
  )
}

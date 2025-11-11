'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { IconPlus, IconTeam } from '@/components/ui/icons'
import { Badge } from '@/components/ui/badge'
import { TeamWithMembers } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TeamSelectorDialogProps {
  teams: TeamWithMembers[]
  children: React.ReactNode
}

export function TeamSelectorDialog({
  teams,
  children
}: TeamSelectorDialogProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleTeamSelect = (teamId: string) => {
    setOpen(false)
    router.push(`/teams/${teamId}/chat`)
  }

  if (!teams || teams.length === 0) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-9 rounded-full bg-muted/50 px-3 transition-all duration-200 hover:scale-105 hover:bg-muted active:scale-95"
        onClick={() => router.push('/teams')}
      >
        <IconPlus className="h-4 w-4" />
        <span className="text-sm">Новый чат</span>
      </Button>
    )
  }

  if (teams.length === 1) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="border bg-background sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Создать новый чат</DialogTitle>
            <DialogDescription>
              Создать новый чат в команде &quot;{teams[0].name}&quot;?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <Button
              variant="outline"
              className="h-auto w-full justify-start p-4"
              onClick={() => handleTeamSelect(teams[0].id)}
            >
              <div className="flex w-full items-center gap-3">
                <IconTeam className="h-5 w-5 text-primary" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{teams[0].name}</div>
                  <div className="text-sm text-muted-foreground">
                    {teams[0].description || 'No description'}
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="border bg-background sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Выберите команду для нового чата</DialogTitle>
          <DialogDescription>
            Выберите, в какой команде вы хотели бы создать новый чат.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {teams.map(team => (
            <Button
              key={team.id}
              variant="outline"
              className={cn(
                'h-auto w-full justify-start p-4 transition-all duration-200',
                'hover:scale-[1.02] hover:shadow-md active:scale-[0.98]'
              )}
              onClick={() => handleTeamSelect(team.id)}
            >
              <div className="flex w-full items-center gap-3">
                <IconTeam className="h-5 w-5 text-primary" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{team.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {team.description || 'No description'}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      variant={
                        team.user_role === 'admin' ? 'default' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {team.user_role === 'admin' ? 'Admin' : 'Member'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {team.member_count} members
                    </span>
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

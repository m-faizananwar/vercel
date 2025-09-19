'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { IconUsers } from '@/components/ui/icons'

export interface Team {
  id: string
  name: string
  description?: string
  member_count: number
  user_role: 'admin' | 'member'
}

interface TeamSelectorProps {
  teams: Team[]
  selectedTeamId: string
  onTeamChange: (teamId: string) => void
  disabled?: boolean
}

export function TeamSelector({
  teams,
  selectedTeamId,
  onTeamChange,
  disabled
}: TeamSelectorProps) {
  const selectedTeam = teams.find(team => team.id === selectedTeamId)

  return (
    <div className="space-y-2">
      <Label htmlFor="team-select" className="text-sm font-medium">
        Команда
      </Label>
      <Select
        value={selectedTeamId}
        onValueChange={onTeamChange}
        disabled={disabled}
      >
        <SelectTrigger id="team-select" className="w-full">
          <SelectValue>
            {selectedTeam ? (
              <div className="flex flex-col text-left">
                <span className="text-sm font-medium">{selectedTeam.name}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <IconUsers className="h-3 w-3" />
                  <span>{selectedTeam.member_count} участников</span>
                  <span>
                    •{' '}
                    {selectedTeam.user_role === 'admin'
                      ? 'Администратор'
                      : 'Участник'}
                  </span>
                </div>
              </div>
            ) : (
              'Выберите команду...'
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {teams.length > 0 ? (
            teams.map(team => (
              <SelectItem key={team.id} value={team.id}>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {team.name.substring(0, 13)}
                      {team.name.length > 13 ? '...' : ''}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {team.user_role === 'admin'
                        ? 'Администратор'
                        : 'Участник'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <IconUsers className="h-3 w-3" />
                    <span>{team.member_count} участников</span>
                  </div>
                  {team.description && (
                    <span className="text-xs text-muted-foreground">
                      {team.description}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))
          ) : (
            <SelectItem value="" disabled>
              Нет доступных команд
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}

'use client'

import { TeamWithMembers } from '@/lib/types'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InstantLoadingButton } from '@/components/instant-loading-button'
import { IconUsers } from '@/components/ui/icons'

interface TeamCardProps {
  team: TeamWithMembers
}

export function TeamCard({ team }: TeamCardProps) {
  return (
    <Card className="border border-border/60 transition-colors hover:bg-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold">{team.name}</CardTitle>
          <Badge
            variant={team.user_role === 'admin' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {team.user_role === 'admin'
              ? 'Администратор'
              : team.user_role === 'member'
                ? 'Участник'
                : team.user_role}
          </Badge>
        </div>
        {team.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {team.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconUsers className="h-4 w-4" />
            <span>
              {team.member_count} участник
              {team.member_count !== 1
                ? team.member_count >= 2 && team.member_count <= 4
                  ? 'а'
                  : 'ов'
                : ''}
            </span>
          </div>
          {team.user_role === 'admin' && (
            <div>
              <div className="mb-1 text-xs text-muted-foreground">
                Код присоединения
              </div>
              <code className="rounded bg-muted/50 px-2 py-1 font-mono text-xs">
                {team.join_code}
              </code>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <InstantLoadingButton
          href={`/teams/${team.id}`}
          variant="outline"
          size="sm"
          className="w-full"
          prefetch
        >
          Управление
        </InstantLoadingButton>
      </CardFooter>
    </Card>
  )
}

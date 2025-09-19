import { redirect } from 'next/navigation'
import { getCurrentUserSuperAdminStatus } from '@/lib/super-admin'
import { getAllTeamsWithStats } from '@/app/super-admin-actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconTeam, IconUsers, IconMessage } from '@/components/ui/icons'

import Link from 'next/link'
import { SuperAdminTeamActions } from '../../../components/super-admin-team-actions'

export default async function SuperAdminTeamsPage() {
  const { user, isSuperAdmin } = await getCurrentUserSuperAdminStatus()

  if (!user) {
    redirect('/sign-in')
  }

  if (!isSuperAdmin) {
    redirect('/')
  }

  const teamsResult = await getAllTeamsWithStats()

  if ('error' in teamsResult) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">
          Error loading teams: {teamsResult.error}
        </div>
      </div>
    )
  }

  const teams = teamsResult

  return (
    <div className="container mx-auto max-w-5xl px-6 py-8">
      {}
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/super-admin" className="flex items-center gap-2">
            ← Back to Dashboard
          </Link>
        </Button>

        <div>
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
            Team Management
          </h1>
          <p className="text-muted-foreground">
            Manage all teams and their members
          </p>
        </div>
      </div>

      {}
      <Card className="border border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            All Teams ({teams.length})
          </CardTitle>
          <CardDescription className="text-sm">
            Teams and their information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teams.length > 0 ? (
              teams.map(team => (
                <div
                  key={team.team_id}
                  className="rounded-lg border border-border/40 p-4 transition-colors hover:bg-muted/20"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="flex-1 space-y-3">
                      {}
                      <div>
                        <h3 className="mb-1 text-lg font-semibold text-foreground">
                          {team.team_name}
                        </h3>
                        {team.description && (
                          <p className="text-sm text-muted-foreground">
                            {team.description}
                          </p>
                        )}
                      </div>

                      {}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Created{' '}
                          {new Date(team.created_at).toLocaleDateString()}
                        </span>
                        <span>by {team.creator_email}</span>
                      </div>

                      {}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <code className="rounded bg-muted/50 px-2 py-1 font-mono text-xs">
                          {team.join_code}
                        </code>
                        <span className="text-muted-foreground">
                          {team.member_count} members
                        </span>
                        <span className="text-muted-foreground">
                          {team.admin_count} admins
                        </span>
                        <span className="text-muted-foreground">
                          {team.chat_count} chats
                        </span>
                      </div>
                    </div>

                    {}
                    <div className="flex items-center">
                      <SuperAdminTeamActions
                        teamId={team.team_id}
                        teamName={team.team_name}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="mb-1 text-base font-medium">No teams found</p>
                <p className="text-sm text-muted-foreground">
                  Teams will appear here once users create them
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

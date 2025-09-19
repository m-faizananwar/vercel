import { redirect } from 'next/navigation'
import { getCurrentUserSuperAdminStatus } from '@/lib/super-admin'
import { getSuperAdminTeamDetails } from '@/app/super-admin-actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import Link from 'next/link'
import { SuperAdminTeamMemberActions } from '@/components/super-admin-team-member-actions'

interface Props {
  params: {
    teamId: string
  }
}

export default async function SuperAdminTeamDetailPage({ params }: Props) {
  const { user, isSuperAdmin } = await getCurrentUserSuperAdminStatus()

  if (!user) {
    redirect('/sign-in')
  }

  if (!isSuperAdmin) {
    redirect('/')
  }

  const teamResult = await getSuperAdminTeamDetails(params.teamId)

  if ('error' in teamResult) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">
          Error loading team: {teamResult.error}
        </div>
      </div>
    )
  }

  const { team, members } = teamResult

  return (
    <div className="container mx-auto max-w-5xl px-6 py-8">
      {}
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link href="/super-admin/teams">← Back to Teams</Link>
        </Button>

        <div>
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
            {team.name}
          </h1>
          {team.description && (
            <p className="text-muted-foreground">{team.description}</p>
          )}
        </div>
      </div>

      {}
      <Card className="mb-6 border border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Team Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Team ID</span>
              <p className="mt-1 font-mono">{team.id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Join Code</span>
              <div className="mt-1">
                <code className="rounded bg-muted/50 px-2 py-1 font-mono text-xs">
                  {team.join_code}
                </code>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Created</span>
              <p className="mt-1">
                {new Date(team.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Created By</span>
              <p className="mt-1">{team.created_by}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {}
      <Card className="border border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Team Members ({members.length})
          </CardTitle>
          <CardDescription className="text-sm">
            All members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.length > 0 ? (
              members.map(member => (
                <div
                  key={member.id}
                  className="flex flex-col justify-between rounded-lg border border-border/40 p-3 transition-colors hover:bg-muted/20 md:flex-row md:items-center"
                >
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {member.user?.email || member.user_id}
                      </span>
                      <Badge
                        variant={
                          member.role === 'admin' ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {member.role === 'admin' ? 'Admin' : 'Member'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </span>
                      <span>ID: {member.user_id}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2 md:mt-0">
                    <SuperAdminTeamMemberActions
                      teamId={team.id}
                      memberId={member.id}
                      userId={member.user_id}
                      userEmail={member.user?.email || 'Unknown'}
                      currentRole={member.role}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-base font-medium">No members found</p>
                <p className="text-sm text-muted-foreground">
                  This team has no members yet
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

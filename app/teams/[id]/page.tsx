import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { cookies } from 'next/headers'
import { getTeamDetails } from '@/app/team-actions'
import { TeamMembersList } from '@/components/team-members-list'
import { TeamJoinCode } from '@/components/team-join-code'
import { TeamSettings } from '@/components/team-settings'
import { IconUsers } from '@/components/ui/icons'

interface TeamPageProps {
  params: {
    id: string
  }
}

export default async function TeamPage({ params }: TeamPageProps) {
  const cookieStore = cookies()
  const session = await auth({ cookieStore })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const team = await getTeamDetails(params.id)

  if (!team) {
    notFound()
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-6">
      {/* Team Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{team.name}</h1>
            {team.description && (
              <p className="mt-2 text-muted-foreground">{team.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {team.user_role === 'admin' && <TeamSettings team={team} />}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <IconUsers className="h-4 w-4" />
            {team.member_count} member{team.member_count !== 1 ? 's' : ''}
          </div>
          <div>
            Created {new Date(team.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Team Join Code (only for admins) */}
      {team.user_role === 'admin' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Invite Members</h2>
          <TeamJoinCode team={team} />
        </div>
      )}

      {/* Team Members */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Team Members</h2>
        <TeamMembersList team={team} />
      </div>
    </div>
  )
}

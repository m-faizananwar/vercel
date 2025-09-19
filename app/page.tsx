import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { authFast, auth } from '@/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserTeams } from '@/app/team-actions'

export const runtime = 'edge'

export default async function IndexPage() {
  const cookieStore = cookies()
  const session =
    (await authFast({ cookieStore })) || (await auth({ cookieStore }))
  if (!session?.user?.id) {
    redirect('/sign-in')
  }
  const teams = await getUserTeams(session.user.id)
  const team = teams[0]
  if (!team) {
    redirect('/teams')
  }
  const id = nanoid()
  return (
    <Chat id={id} teamId={team.id} teamName={team.name} session={session} />
  )
}

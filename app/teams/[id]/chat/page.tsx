import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { cookies } from 'next/headers'
import { getTeamDetails } from '@/app/team-actions'
import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'

interface TeamChatPageProps {
  params: {
    id: string
  }
}

export default async function TeamChatPage({ params }: TeamChatPageProps) {
  const cookieStore = cookies()
  const session = await auth({ cookieStore })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const team = await getTeamDetails(params.id)

  if (!team) {
    notFound()
  }

  const id = nanoid()

  return (
    <Chat 
      id={id} 
  session={session}
      teamId={team.id}
      teamName={team.name}
    />
  )
}

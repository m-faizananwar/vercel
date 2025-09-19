import { type Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { auth } from '@/auth'
import { getChat } from '@/app/actions'
import { Chat } from '@/components/chat'
import { cookies } from 'next/headers'
import { getUserTeams } from '@/app/team-actions'

export const runtime = 'edge'
export const preferredRegion = 'home'

export interface ChatPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({
  params
}: ChatPageProps): Promise<Metadata> {
  const cookieStore = cookies()
  const session = await auth({ cookieStore })

  if (!session?.user) {
    return {}
  }

  const chat = await getChat(params.id)
  return {
    title: chat?.title.toString().slice(0, 50) ?? 'Chat'
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const cookieStore = cookies()
  const session = await auth({ cookieStore })

  if (!session?.user) {
    redirect(`/sign-in?next=/chat/${params.id}`)
  }

  const teams = await getUserTeams(session.user.id)
  const team = teams[0]
  if (!team) {
    redirect('/teams')
  }

  const chat = await getChat(params.id)

  if (!chat) {
    notFound()
  }

  if (chat?.teamId !== team.id) {
    notFound()
  }

  return (
    <Chat
      id={chat.id}
      initialMessages={chat.messages}
      teamId={team.id}
      teamName={team.name}
      session={session}
    />
  )
}

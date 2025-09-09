import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { cookies } from 'next/headers'
import { getTeamDetails } from '@/app/team-actions'
import { getChat } from '@/app/actions'
import { Chat } from '@/components/chat'

interface TeamChatDetailPageProps {
  params: {
    id: string
    chatId: string
  }
}

export default async function TeamChatDetailPage({ params }: TeamChatDetailPageProps) {
  const cookieStore = cookies()
  const session = await auth({ cookieStore })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const team = await getTeamDetails(params.id)

  if (!team) {
    notFound()
  }

  const chat = await getChat(params.chatId)

  if (!chat || chat.teamId !== team.id) {
    notFound()
  }

  return (
    <Chat 
      id={chat.id} 
      initialMessages={chat.messages}
      session={session} 
      teamId={team.id}
      teamName={team.name}
    />
  )
}

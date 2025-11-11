'use client'

import { useChat, type Message } from 'ai/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { useCachedChat } from '@/lib/hooks/use-cached-chat'
import { setCachedChatContentClient } from '@/lib/cache'
import { toast } from 'react-hot-toast'
import { AVAILABLE_MODELS } from './model-selector'
import { getUserTeams } from '@/app/team-actions'

type ChatTeam = {
  id: string
  name: string
  description?: string
  member_count: number
  user_role: 'admin' | 'member'
}

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  session?: any
  teamId?: string
  teamName?: string
}

export function Chat({
  id,
  initialMessages,
  className,
  session,
  teamId,
  teamName
}: ChatProps) {
  const router = useRouter()
  const [selectedModel, setSelectedModel] = useLocalStorage<string>(
    'ai-model',
    AVAILABLE_MODELS[0].id
  )
  const [teams, setTeams] = useState<ChatTeam[]>([])
  const [selectedTeamId, setSelectedTeamId] = useLocalStorage<string>(
    'selected-team',
    teamId || ''
  )
  const [isLoadingTeams, setIsLoadingTeams] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  const { chat: cachedChat, loading: chatLoading } = useCachedChat(
    initialMessages ? undefined : id,
    initialMessages
  )

  const messagesToUse = initialMessages || cachedChat?.messages || []

  useEffect(() => {
    const fetchTeams = async () => {
      if (session?.user?.id) {
        try {
          const rawTeams = await getUserTeams(session.user.id)
          const userTeams: ChatTeam[] = rawTeams.map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            member_count: t.member_count,
            user_role: t.user_role || 'member'
          }))
          setTeams(userTeams)
          if (!selectedTeamId && userTeams.length > 0) {
            setSelectedTeamId(userTeams[0].id)
          }
        } catch (error) {}
      }
      setIsLoadingTeams(false)
      setIsMounted(true)
    }

    fetchTeams()
  }, [session?.user?.id])

  const { messages, append, reload, stop, isLoading, input, setInput } =
    useChat({
      initialMessages: messagesToUse,
      id,
      body: {
        id,
        teamId: selectedTeamId || teamId,
        model: selectedModel
      },
      async onResponse(response) {
        if (!response.ok) {
          try {
            const errorData = await response.json()
            const errorMessage =
              errorData.error || response.statusText || 'An error occurred'
            if (response.status === 400 && !selectedTeamId && !teamId) {
              toast.error(
                'Присоединитесь к команде или создайте команду, чтобы начать чат.'
              )
            } else if (response.status === 402) {
              toast.error('💳 ' + errorMessage, { duration: 8000 })
            } else if (response.status === 429) {
              toast.error('⏱️ ' + errorMessage, { duration: 5000 })
            } else if (response.status === 401) {
              toast.error('🔑 ' + errorMessage, { duration: 6000 })
            } else {
              toast.error(errorMessage, { duration: 5000 })
            }
          } catch (e) {
            toast.error(`Запрос не выполнен со статусом ${response.status}`, {
              duration: 5000
            })
          }
        }
      },
      onError(error) {
        toast.error(
          'Не удалось отправить сообщение. Пожалуйста, попробуйте еще раз.'
        )
      },
      async onFinish(message) {}
    })

  useEffect(() => {
    if (id && messages.length > 0) {
      const getTitleFromMessage = (msg: Message | undefined) => {
        if (!msg) return 'New Chat'
        const c: any = (msg as any).content
        if (typeof c === 'string') return c.substring(0, 100)
        if (Array.isArray(c)) {
          const textPart = c.find(
            (p: any) => p?.type === 'text' && typeof p.text === 'string'
          )
          if (textPart?.text) return textPart.text.substring(0, 100)
        }
        return 'New Chat'
      }

      const chatData = cachedChat || {
        id,
        title: getTitleFromMessage(messages[0]),
        createdAt: new Date(),
        userId: session?.user?.id || '',
        path: `/teams/${selectedTeamId || teamId}/chat/${id}`,
        teamId: selectedTeamId || teamId
      }

      setCachedChatContentClient(id, {
        ...chatData,
        messages
      })
    }
  }, [id, messages, cachedChat, selectedTeamId, teamId, session?.user?.id])

  const navigationFiredRef = useRef(false)

  const handleTeamChange = (newTeamId: string) => {
    setSelectedTeamId(newTeamId)
  }

  useEffect(() => {
    if (!isMounted || !selectedTeamId || selectedTeamId === teamId) {
      return
    }

    if (navigationFiredRef.current) {
      return
    }
  }, [selectedTeamId, teamId, router, isMounted])

  if (!initialMessages && chatLoading) {
    return (
      <div
        className={cn(
          'px-4 pb-[200px] pt-6 sm:px-6 md:pt-12 lg:px-8',
          className
        )}
      >
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading chat...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className={cn(
          'px-4 pb-[200px] pt-6 sm:px-6 md:pt-12 lg:px-8',
          className
        )}
      >
        <div className="mx-auto max-w-3xl">
          {messages.length ? (
            <>
              <ChatList messages={messages} />
              <ChatScrollAnchor trackVisibility={isLoading} />
            </>
          ) : (
            <EmptyScreen />
          )}
        </div>
      </div>
      <ChatPanel
        id={id}
        isLoading={isLoading}
        stop={stop}
        append={(...args) => {
          if (!selectedTeamId && !teamId) {
            toast.error('Join or create a team first.')
            return
          }
          return (append as any)(...args)
        }}
        reload={reload}
        messages={messages}
        input={input}
        setInput={setInput}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        teams={teams}
        selectedTeamId={selectedTeamId || teamId || ''}
        onTeamChange={handleTeamChange}
      />
    </>
  )
}

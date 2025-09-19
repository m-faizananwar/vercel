import { useState, useEffect } from 'react'
import {
  getCachedChatContentClient,
  setCachedChatContentClient
} from '@/lib/cache'
import { Chat } from '@/lib/types'

export function useCachedChat(
  chatId: string | undefined,
  initialMessages?: any[]
) {
  const [chat, setChat] = useState<Chat | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!chatId) {
      setLoading(false)
      return
    }

    const cachedChat = getCachedChatContentClient(chatId)

    if (cachedChat !== undefined) {
      setChat(cachedChat)
      setLoading(false)
      return
    }

    if (initialMessages && initialMessages.length > 0) {
      const chatData: Chat = {
        id: chatId,
        title: 'Chat',
        createdAt: new Date(),
        userId: '',
        path: `/chat/${chatId}`,
        messages: initialMessages,
        teamId: undefined
      }

      setChat(chatData)
      setCachedChatContentClient(chatId, chatData)
      setLoading(false)
      return
    }

    setLoading(true)
    fetchChatFromServer(chatId)
      .then(fetchedChat => {
        setChat(fetchedChat)
        setCachedChatContentClient(chatId, fetchedChat)
      })
      .catch(err => {
        setError('Failed to load chat')
        setChat(null)
        setCachedChatContentClient(chatId, null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [chatId, initialMessages])

  return { chat, loading, error }
}

async function fetchChatFromServer(chatId: string): Promise<Chat | null> {
  try {
    const response = await fetch(`/api/chat/${chatId}`)
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`HTTP ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    throw error
  }
}

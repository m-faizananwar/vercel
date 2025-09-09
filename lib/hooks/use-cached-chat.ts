import { useState, useEffect } from 'react'
import { getCachedChatContentClient, setCachedChatContentClient } from '@/lib/cache'
import { Chat } from '@/lib/types'

export function useCachedChat(chatId: string | undefined, initialMessages?: any[]) {
  const [chat, setChat] = useState<Chat | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!chatId) {
      setLoading(false)
      return
    }

    // Check cache first
    const cachedChat = getCachedChatContentClient(chatId)
    
    if (cachedChat !== undefined) {
      // We have cached data (could be null if chat doesn't exist)
      setChat(cachedChat)
      setLoading(false)
      return
    }

    // If we have initialMessages, create a basic chat object and cache it
    if (initialMessages && initialMessages.length > 0) {
      const chatData: Chat = {
        id: chatId,
        title: 'Chat', // Will be updated with real title from server
        createdAt: new Date(),
        userId: '', // Will be updated
        path: `/chat/${chatId}`,
        messages: initialMessages,
        teamId: undefined
      }
      
      setChat(chatData)
      setCachedChatContentClient(chatId, chatData)
      setLoading(false)
      return
    }

    // If no cache and no initial messages, we need to fetch
    setLoading(true)
    fetchChatFromServer(chatId)
      .then(fetchedChat => {
        setChat(fetchedChat)
        setCachedChatContentClient(chatId, fetchedChat)
      })
      .catch(err => {
        console.error('Error fetching chat:', err)
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

// Client-side fetch function
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
    console.error('Error fetching chat from server:', error)
    throw error
  }
} 
import { Chat, TeamWithMembers } from './types'

interface CacheData {
  teams: {
    [userId: string]: {
      data: TeamWithMembers[]
      timestamp: number
    }
  }
  chats: {
    [teamId: string]: {
      data: Chat[]
      timestamp: number
    }
  }
  chatContent: {
    [chatId: string]: {
      data: Chat | null
      timestamp: number
    }
  }
}

class SimpleCache {
  private cache: CacheData = {
    teams: {},
    chats: {},
    chatContent: {}
  }
  
  private readonly CACHE_DURATION = 5 * 24 * 60 * 60 * 1000 // 5 days in milliseconds
  private readonly CLIENT_STORAGE_KEY = 'ai_chat_cache'

  constructor() {
    // Load from localStorage if available (client-side)
    if (typeof window !== 'undefined') {
      this.loadFromStorage()
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.CLIENT_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object') {
          this.cache = {
            teams: parsed.teams || {},
            chats: parsed.chats || {},
            chatContent: parsed.chatContent || {}
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error)
    }
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.CLIENT_STORAGE_KEY, JSON.stringify(this.cache))
      } catch (error) {
        console.warn('Failed to save cache to localStorage:', error)
      }
    }
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.CACHE_DURATION
  }

  // Teams cache
  setTeams(userId: string, teams: TeamWithMembers[]): void {
    this.cache.teams[userId] = {
      data: teams,
      timestamp: Date.now()
    }
    this.saveToStorage()
  }

  getTeams(userId: string): TeamWithMembers[] | null {
    const cached = this.cache.teams[userId]
    if (!cached || this.isExpired(cached.timestamp)) {
      if (cached) {
        delete this.cache.teams[userId]
        this.saveToStorage()
      }
      return null
    }
    return cached.data
  }

  invalidateTeams(userId: string): void {
    delete this.cache.teams[userId]
    this.saveToStorage()
  }

  // Chats cache
  setChats(teamId: string, chats: Chat[]): void {
    this.cache.chats[teamId] = {
      data: chats,
      timestamp: Date.now()
    }
    this.saveToStorage()
  }

  getChats(teamId: string): Chat[] | null {
    const cached = this.cache.chats[teamId]
    if (!cached || this.isExpired(cached.timestamp)) {
      if (cached) {
        delete this.cache.chats[teamId]
        this.saveToStorage()
      }
      return null
    }
    return cached.data
  }

  invalidateChats(teamId: string): void {
    delete this.cache.chats[teamId]
    this.saveToStorage()
  }

  // Chat content cache
  setChatContent(chatId: string, chat: Chat | null): void {
    this.cache.chatContent[chatId] = {
      data: chat,
      timestamp: Date.now()
    }
    this.saveToStorage()
  }

  getChatContent(chatId: string): Chat | null | undefined {
    const cached = this.cache.chatContent[chatId]
    if (!cached || this.isExpired(cached.timestamp)) {
      if (cached) {
        delete this.cache.chatContent[chatId]
        this.saveToStorage()
      }
      return undefined // undefined means not cached, null means cached as null
    }
    return cached.data
  }

  invalidateChatContent(chatId: string): void {
    delete this.cache.chatContent[chatId]
    this.saveToStorage()
  }

  // Clear all cache
  clearAll(): void {
    this.cache = {
      teams: {},
      chats: {},
      chatContent: {}
    }
    this.saveToStorage()
  }
}

// Create a singleton instance
export const cache = new SimpleCache()

// Utility functions for common operations
export function getCachedTeamsOrFetch(
  userId: string, 
  fetchFn: () => Promise<TeamWithMembers[]>
): Promise<TeamWithMembers[]> {
  const cached = cache.getTeams(userId)
  if (cached) {
    return Promise.resolve(cached)
  }
  
  return fetchFn().then(data => {
    cache.setTeams(userId, data)
    return data
  })
}

export function getCachedChatsOrFetch(
  teamId: string,
  fetchFn: () => Promise<Chat[]>
): Promise<Chat[]> {
  const cached = cache.getChats(teamId)
  if (cached) {
    return Promise.resolve(cached)
  }
  
  return fetchFn().then(data => {
    cache.setChats(teamId, data)
    return data
  })
}

export function getCachedChatContentOrFetch(
  chatId: string,
  fetchFn: () => Promise<Chat | null>
): Promise<Chat | null> {
  const cached = cache.getChatContent(chatId)
  if (cached !== undefined) {
    return Promise.resolve(cached)
  }
  
  return fetchFn().then(data => {
    cache.setChatContent(chatId, data)
    return data
  })
}

// Client-side only functions for components
export function getCachedChatContentClient(chatId: string): Chat | null | undefined {
  if (typeof window === 'undefined') return undefined
  return cache.getChatContent(chatId)
}

export function setCachedChatContentClient(chatId: string, chat: Chat | null): void {
  if (typeof window === 'undefined') return
  cache.setChatContent(chatId, chat)
} 
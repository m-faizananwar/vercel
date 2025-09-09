'use server'
import 'server-only'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/db_types'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { type Chat } from '@/lib/types'
import { getCachedChatsOrFetch, getCachedChatContentOrFetch, cache } from '@/lib/cache'

export async function getChats(userId?: string | null, teamId?: string | null) {
  if (!userId || !teamId) {
    return []
  }
  
  return getCachedChatsOrFetch(teamId, async () => {
    try {
      const cookieStore = cookies()
      const supabase = createServerActionClient<Database>({
        cookies: () => cookieStore
      })

      const { data } = await supabase
        .from('chats')
        .select('payload')
        .eq('team_id', teamId)
        .order('payload->createdAt', { ascending: false })
        .returns<{ payload: Chat | null }[]>()
        .throwOnError()

      return (data?.map((entry) => entry.payload!).filter(Boolean) as Chat[]) ?? []
    } catch (error) {
      return []
    }
  })
}

export async function getChat(id: string) {
  return getCachedChatContentOrFetch(id, async () => {
    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })
    const { data } = await supabase
      .from('chats')
      .select('payload')
      .eq('id', id)
      .maybeSingle()

    const payload = (data as { payload: Chat } | null)?.payload
    return payload ?? null
  })
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })
    
    // Get the chat before deleting to find its team for cache invalidation
    const { data: chatData } = await supabase
      .from('chats')
      .select('payload')
      .eq('id', id)
      .maybeSingle()
    
    await supabase.from('chats').delete().eq('id', id).throwOnError()

    // Invalidate cache for this chat and its team's chat list
    cache.invalidateChatContent(id)
    
    const chatPayload = (chatData as { payload: Chat } | null)?.payload
    if (chatPayload?.teamId) {
      cache.invalidateChats(chatPayload.teamId)
    }

    revalidatePath('/')
    return revalidatePath(path)
  } catch (error) {
    return {
      error: 'Unauthorized'
    }
  }
}

export async function clearChats() {
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })
    await supabase.from('chats').delete().throwOnError()
    
    // Clear all chat-related cache
    cache.clearAll()
    
    revalidatePath('/')
    return redirect('/')
  } catch (error) {
    console.log('clear chats error', error)
    return {
      error: 'Unauthorized'
    }
  }
}

export async function getSharedChat(id: string) {
  const cookieStore = cookies()
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore
  })
  const { data } = await supabase
    .from('chats')
    .select('payload')
    .eq('id', id)
    .not('payload->sharePath', 'is', null)
    .maybeSingle()

  const payload = (data as { payload: Chat } | null)?.payload
  return payload ?? null
}

export async function shareChat(chat: Chat) {
  const payload = {
    ...chat,
    sharePath: `/share/${chat.id}`
  }

  const cookieStore = cookies()
  const supabase = createServerActionClient<Database>({
    cookies: () => cookieStore
  })
  await supabase
    .from('chats')
  .update<Database['public']['Tables']['chats']['Update']>({ payload: payload as any })
    .eq('id', chat.id)
    .throwOnError()

  return payload
}

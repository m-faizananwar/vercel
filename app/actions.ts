'use server'
import 'server-only'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/db_types'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { type Chat } from '@/lib/types'
import {
  getCachedChatsOrFetch,
  getCachedChatContentOrFetch,
  cache
} from '@/lib/cache'

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
        .throwOnError()

      return (data?.map(entry => entry.payload) as Chat[]) ?? []
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

    return (data?.payload as Chat) ?? null
  })
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { data: chatData } = await supabase
      .from('chats')
      .select('payload')
      .eq('id', id)
      .maybeSingle()

    await supabase.from('chats').delete().eq('id', id).throwOnError()

    cache.invalidateChatContent(id)

    if (chatData?.payload && (chatData.payload as any).teamId) {
      cache.invalidateChats((chatData.payload as any).teamId)
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

    cache.clearAll()

    revalidatePath('/')
    return redirect('/')
  } catch (error) {
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

  return (data?.payload as Chat) ?? null
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
    .update({ payload: payload as any })
    .eq('id', chat.id)
    .throwOnError()

  return payload
}

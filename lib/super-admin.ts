import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/db_types'
import { auth, authFast } from '@/auth'

type LocalSession = {
  user: { id: string; email: string }
}

export async function isSuperAdmin(
  userId?: string,
  session?: LocalSession | null
): Promise<boolean> {
  try {
    const cookieStore = cookies()
    if (!userId) {
      if (!session) {
        session =
          (await authFast({ cookieStore })) || (await auth({ cookieStore }))
      }
      if (!session?.user?.id) return false
      userId = session.user.id
    }

    const supabase = createServerComponentClient<Database>({
      cookies: () => cookieStore
    })

    const { data, error } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) return false
    return !!data
  } catch {
    return false
  }
}

export async function getCurrentUserSuperAdminStatus() {
  try {
    const cookieStore = cookies()
    const session =
      (await authFast({ cookieStore })) || (await auth({ cookieStore }))
    if (!session?.user?.id) return { user: null, isSuperAdmin: false }

    const isSuperAdminUser = await isSuperAdmin(session.user.id, session)
    return {
      user: { id: session.user.id, email: session.user.email },
      isSuperAdmin: isSuperAdminUser
    }
  } catch {
    return { user: null, isSuperAdmin: false }
  }
}

export async function requireSuperAdmin(): Promise<string> {
  const cookieStore = cookies()
  const session =
    (await authFast({ cookieStore })) || (await auth({ cookieStore }))
  if (!session?.user?.id) throw new Error('Authentication required')
  const userId = session.user.id
  const allowed = await isSuperAdmin(userId, session)
  if (!allowed) throw new Error('Super admin access required')
  return userId
}

export async function getSuperAdmins() {
  const cookieStore = cookies()
  const requesterId = await requireSuperAdmin()
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore
  })
  const { data, error } = await supabase
    .from('super_admins')
    .select('id, user_id, created_at, created_by')
    .order('created_at', { ascending: false })
  if (error) {
    throw error
  }
  return data
}

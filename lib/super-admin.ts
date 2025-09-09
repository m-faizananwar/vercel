import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/db_types'
import { auth, authFast } from '@/auth' // use local user cookie session

type LocalSession = {
  user: { id: string; email: string }
}

/**
 * Check if the current (local) user is a super admin
 * Optimized to accept session to avoid redundant auth calls
 */
export async function isSuperAdmin(userId?: string, session?: LocalSession | null): Promise<boolean> {
  try {
    const cookieStore = cookies()
    // Resolve user id from local cookie session if not provided
    if (!userId) {
      if (!session) {
        // Use fast auth first, fallback to regular auth
        session = await authFast({ cookieStore }) || await auth({ cookieStore })
      }
      if (!session?.user?.id) return false
      userId = session.user.id
    }

    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })

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

/**
 * Get current user (via local cookie) and super admin status
 * Optimized to do only one auth call instead of two
 */
export async function getCurrentUserSuperAdminStatus() {
  try {
    const cookieStore = cookies()
    // Use fast auth first, fallback to regular auth
    const session = await authFast({ cookieStore }) || await auth({ cookieStore })
    if (!session?.user?.id) return { user: null, isSuperAdmin: false }

    // Pass session to avoid redundant auth call
    const isSuperAdminUser = await isSuperAdmin(session.user.id, session)
    return { user: { id: session.user.id, email: session.user.email }, isSuperAdmin: isSuperAdminUser }
  } catch {
    return { user: null, isSuperAdmin: false }
  }
}

/**
 * Require super admin access - throws if absent
 * Optimized to do only one auth call instead of two
 */
export async function requireSuperAdmin(): Promise<string> {
  const cookieStore = cookies()
  // Use fast auth first, fallback to regular auth
  const session = await authFast({ cookieStore }) || await auth({ cookieStore })
  if (!session?.user?.id) throw new Error('Authentication required')
  const userId = session.user.id
  // Pass session to avoid redundant auth call
  const allowed = await isSuperAdmin(userId, session)
  if (!allowed) throw new Error('Super admin access required')
  return userId
}

/**
 * List super admins (only if caller is super admin)
 */
export async function getSuperAdmins() {
  const cookieStore = cookies()
  const requesterId = await requireSuperAdmin()
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })
  const { data, error } = await supabase
    .from('super_admins')
    .select('id, user_id, created_at, created_by')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Error fetching super admins:', error)
    throw error
  }
  return data
}

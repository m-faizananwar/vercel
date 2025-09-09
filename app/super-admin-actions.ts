'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/db_types'
import type { ServerActionResult, UserWithStats, TeamWithStats, SuperAdmin } from '@/lib/types'
import { requireSuperAdmin } from '@/lib/super-admin'

/**
 * Get all users with statistics (super admin only)
 */
export async function getAllUsersWithStats(): Promise<ServerActionResult<UserWithStats[]>> {
  try {
    await requireSuperAdmin()

    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { data, error } = await supabase.rpc('get_all_users_with_teams')

    if (error) {
      console.error('Error fetching users with stats:', error)
      return { error: 'Не удалось получить пользователей' }
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllUsersWithStats:', error)
    return { error: 'Доступ запрещен или ошибка сервера' }
  }
}

/**
 * Get all teams with statistics (super admin only)
 */
export async function getAllTeamsWithStats(): Promise<ServerActionResult<TeamWithStats[]>> {
  try {
    await requireSuperAdmin()

    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { data, error } = await supabase.rpc('get_all_teams_with_stats')

    if (error) {
      console.error('Error fetching teams with stats:', error)
      return { error: 'Не удалось получить команды' }
    }

    // If RPC returned data, use it (even if empty)
    if (Array.isArray(data) && data.length > 0) {
      return data
    }

    // Fallback: if RPC returned empty array but there are teams (dashboard count shows >0)
    // fetch raw teams and build a minimal TeamWithStats shape so UI (recent teams) isn't blank.
    console.warn('[getAllTeamsWithStats] RPC returned no rows; using fallback teams query')
    const { data: teamsTable, error: teamsTableError } = await supabase
      .from('teams')
      .select('id, name, description, join_code, created_at, created_by')
      .order('created_at', { ascending: false })
      .limit(20)

    if (teamsTableError) {
      console.error('Fallback teams query failed:', teamsTableError)
      return [] // Return empty quietly; UI will show "no teams".
    }

    if (!teamsTable || teamsTable.length === 0) return []

    // Fetch creator emails
    const creatorIds = Array.from(new Set(teamsTable.map(t => t.created_by).filter(Boolean)))
    let creatorEmailMap: Record<string, string> = {}
    if (creatorIds.length > 0) {
      const { data: creators, error: creatorsError } = await supabase
        .from('local_users')
        .select('id, email')
        .in('id', creatorIds)
      if (!creatorsError && creators) {
        creatorEmailMap = creators.reduce<Record<string, string>>((acc, cur) => {
          acc[cur.id] = cur.email || ''
          return acc
        }, {})
      }
    }

    const fallback: TeamWithStats[] = teamsTable.map(t => ({
      team_id: t.id,
      team_name: (t as any).name || (t as any).team_name || 'Unnamed Team',
      description: (t as any).description || null,
      join_code: (t as any).join_code || '',
      created_at: (t as any).created_at,
      created_by: (t as any).created_by,
      creator_email: creatorEmailMap[(t as any).created_by] || '',
      // Without the RPC we don't have aggregated stats; set 0 so UI is consistent.
      member_count: 0,
      admin_count: 0,
      chat_count: 0
    }))

    return fallback
  } catch (error) {
    console.error('Error in getAllTeamsWithStats:', error)
    return { error: 'Доступ запрещен или ошибка сервера' }
  }
}

/**
 * Remove super admin privileges from a user
 */
export async function removeSuperAdmin(userId: string): Promise<ServerActionResult<boolean>> {
  try {
    const currentUserId = await requireSuperAdmin()

    // Prevent removing yourself
    if (currentUserId === userId) {
      return { error: 'Нельзя удалить привилегии супер-администратора у себя' }
    }

    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { error } = await supabase
      .from('super_admins')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing super admin:', error)
      return { error: 'Не удалось убрать супер-администратора' }
    }

    revalidatePath('/super-admin')
    return true
  } catch (error) {
    console.error('Error in removeSuperAdmin:', error)
    return { error: 'Доступ запрещен или ошибка сервера' }
  }
}

/**
 * Delete a team (super admin only)
 */
export async function superAdminDeleteTeam(teamId: string): Promise<ServerActionResult<boolean>> {
  try {
    await requireSuperAdmin()

    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    // Delete the team (this will cascade to team_members and chats due to foreign key constraints)
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId)

    if (error) {
      console.error('Error deleting team:', error)
      return { error: 'Не удалось удалить команду' }
    }

    revalidatePath('/super-admin')
    return true
  } catch (error) {
    console.error('Error in superAdminDeleteTeam:', error)
    return { error: 'Доступ запрещен или ошибка сервера' }
  }
}

/**
 * Remove a user from a team (super admin only)
 */
export async function superAdminRemoveUserFromTeam(
  teamId: string,
  userId: string
): Promise<ServerActionResult<boolean>> {
  try {
    await requireSuperAdmin()

    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing user from team:', error)
      return { error: 'Не удалось удалить пользователя из команды' }
    }

    revalidatePath('/super-admin')
    return true
  } catch (error) {
    console.error('Error in superAdminRemoveUserFromTeam:', error)
    return { error: 'Доступ запрещен или ошибка сервера' }
  }
}

/**
 * Change a user's role in a team (super admin only)
 */
export async function superAdminChangeUserRole(
  teamId: string,
  userId: string,
  newRole: 'admin' | 'member'
): Promise<ServerActionResult<boolean>> {
  try {
    await requireSuperAdmin()

    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { error } = await supabase
      .from('team_members')
      .update({ role: newRole })
      .eq('team_id', teamId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error changing user role:', error)
      return { error: 'Не удалось изменить роль пользователя' }
    }

    revalidatePath('/super-admin')
    return true
  } catch (error) {
    console.error('Error in superAdminChangeUserRole:', error)
    return { error: 'Доступ запрещен или ошибка сервера' }
  }
}

/**
 * Get detailed team information with members (super admin only)
 */
export async function getSuperAdminTeamDetails(teamId: string) {
  try {
    await requireSuperAdmin()

    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    // Get team details
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single()

    if (teamError || !team) {
      return { error: 'Team not found' }
    }

    // Get team members with user details
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select(`
        id,
        user_id,
        role,
        joined_at
      `)
      .eq('team_id', teamId)

    if (membersError) {
      return { error: 'Failed to fetch team members' }
    }

    // Get user details for each member from local_users table
    const memberIds = members.map(member => member.user_id)
    const { data: localUsers, error: usersError } = await supabase
      .from('local_users')
      .select('id, email')
      .in('id', memberIds)

    if (usersError) {
      return { error: 'Failed to fetch user details' }
    }

    const membersWithDetails = members.map(member => {
      const user = localUsers?.find(u => u.id === member.user_id)
      return {
        ...member,
        user: {
          email: user?.email,
          name: user?.email?.split('@')[0] || 'Unknown'
        }
      }
    })

    return {
      team,
      members: membersWithDetails
    }
  } catch (error) {
    console.error('Error in getSuperAdminTeamDetails:', error)
    return { error: 'Доступ запрещен или ошибка сервера' }
  }
}

/**
 * Create a new user (super admin only)
 */
export async function createUser(email: string, password: string): Promise<ServerActionResult<{ id: string; email: string }>> {
  try {
    await requireSuperAdmin()

    if (!email || !password) {
      return { error: 'Email and password are required' }
    }

    if (password.length < 4) {
      return { error: 'Password must be at least 4 characters long' }
    }

    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    // Check if email already exists
    const { data: existing } = await supabase
      .from('local_users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (existing) {
      return { error: 'Email already registered' }
    }

    // Create new user
    const { data, error } = await supabase
      .from('local_users')
      .insert({
        email: email.toLowerCase().trim(),
        password
      })
      .select('id, email')
      .single()

    if (error || !data) {
      console.error('Error creating user:', error)
      return { error: 'Failed to create user' }
    }

    revalidatePath('/super-admin/users')
    return data
  } catch (error) {
    console.error('Error in createUser:', error)
    return { error: 'Доступ запрещен или ошибка сервера' }
  }
}

/**
 * Delete a user (super admin only)
 */
export async function deleteUser(userId: string): Promise<ServerActionResult<boolean>> {
  try {
    await requireSuperAdmin()

    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    // Prevent deleting yourself
    const currentUserId = await requireSuperAdmin()
    if (currentUserId === userId) {
      return { error: 'Cannot delete your own account' }
    }

    // Delete the user (this will cascade to team_members due to foreign key constraints)
    const { error } = await supabase
      .from('local_users')
      .delete()
      .eq('id', userId)

    if (error) {
      console.error('Error deleting user:', error)
      return { error: 'Failed to delete user' }
    }

    revalidatePath('/super-admin/users')
    return true
  } catch (error) {
    console.error('Error in deleteUser:', error)
    return { error: 'Доступ запрещен или ошибка сервера' }
  }
}

/**
 * Update user password (super admin only)
 */
export async function updateUserPassword(userId: string, newPassword: string): Promise<ServerActionResult<boolean>> {
  try {
    await requireSuperAdmin()

    if (!newPassword || newPassword.length < 4) {
      return { error: 'Password must be at least 4 characters long' }
    }

    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { error } = await supabase
      .from('local_users')
      .update({ password: newPassword })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user password:', error)
      return { error: 'Failed to update password' }
    }

    revalidatePath('/super-admin/users')
    return true
  } catch (error) {
    console.error('Error in updateUserPassword:', error)
    return { error: 'Доступ запрещен или ошибка сервера' }
  }
}

/**
 * Get all chats from all teams (super admin only)
 */
export async function getAllChatsForSuperAdmin(): Promise<ServerActionResult<Array<{
  team_id: string
  team_name: string
  chats: Array<{
    id: string
    title: string
    createdAt: Date
    userId: string
    path: string
    messages: any[]
    sharePath?: string
    teamId?: string
    user_email?: string
  }>
}>>> {
  try {
    await requireSuperAdmin()

    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    // Get all teams with their chats
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (teamsError) {
      console.error('Error fetching teams:', teamsError)
      return { error: 'Failed to fetch teams' }
    }

    if (!teams || teams.length === 0) {
      return []
    }

    // Get chats for each team
    const teamsWithChats = await Promise.all(
      teams.map(async (team) => {
        const { data: chats } = await supabase
          .from('chats')
          .select(`
            id,
            payload,
            user_id,
            team_id
          `)
          .eq('team_id', team.id)
          .order('payload->createdAt', { ascending: false })

        // Get user emails for the chats
        const userIds = chats?.map(chat => chat.user_id) || []
        const { data: localUsers } = await supabase
          .from('local_users')
          .select('id, email')
          .in('id', userIds)

        const chatsWithUsers = chats?.map(chat => {
          const payload = (chat.payload as any) || {}
          const user = localUsers?.find(u => u.id === chat.user_id)
          const createdAt = payload.createdAt ? new Date(payload.createdAt) : new Date()

          return {
            id: chat.id,
            title: typeof payload.title === 'string' ? payload.title : 'Untitled Chat',
            createdAt,
            userId: chat.user_id || 'unknown',
            path: typeof payload.path === 'string' ? payload.path : `/teams/${team.id}/chat/${chat.id}`,
            messages: Array.isArray(payload.messages) ? payload.messages : [],
            sharePath: typeof payload.sharePath === 'string' ? payload.sharePath : undefined,
            teamId: team.id,
            user_email: typeof user?.email === 'string' ? user.email : 'Unknown User'
          }
        }) || []

        return {
          team_id: team.id,
          team_name: team.name,
          chats: chatsWithUsers
        }
      })
    )

    return teamsWithChats
  } catch (error) {
    console.error('Error in getAllChatsForSuperAdmin:', error)
    return { error: 'Доступ запрещен или ошибка сервера' }
  }
}

/**
 * Delete any chat (super admin only)
 */
export async function superAdminDeleteChat(chatId: string): Promise<ServerActionResult<boolean>> {
  try {
    await requireSuperAdmin()

    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)

    if (error) {
      console.error('Error deleting chat:', error)
      return { error: 'Failed to delete chat' }
    }

    return true
  } catch (error) {
    console.error('Error in superAdminDeleteChat:', error)
    return { error: 'Доступ запрещен или ошибка сервера' }
  }
}

/**
 * Get system statistics (super admin only)
 */
export async function getSystemStats() {
  try {
    await requireSuperAdmin()

    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    // Get total counts using the same stored procedure approach
    const [usersResult, teamsResult, chatsResult, superAdminsResult] = await Promise.all([
      supabase.rpc('get_all_users_with_teams'),
      supabase.from('teams').select('id', { count: 'exact' }),
      supabase.from('chats').select('id', { count: 'exact' }),
      supabase.from('super_admins').select('id', { count: 'exact' })
    ])

    const totalUsers = Array.isArray(usersResult.data) ? usersResult.data.length : 0
    const totalTeams = teamsResult.count || 0
    const totalChats = chatsResult.count || 0
    const totalSuperAdmins = superAdminsResult.count || 0

    return {
      totalUsers,
      totalTeams,
      totalChats,
      totalSuperAdmins
    }
  } catch (error) {
    console.error('Error in getSystemStats:', error)
    return { error: 'Доступ запрещен или ошибка сервера' }
  }
}

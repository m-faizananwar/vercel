'use server'
import 'server-only'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/db_types'
import { revalidatePath } from 'next/cache'
import { auth, authFast } from '@/auth'
import {
  type Team,
  type TeamMember,
  type TeamWithMembers,
  type ServerActionResult
} from '@/lib/types'
import { isSuperAdmin } from '@/lib/super-admin'
import { getCachedTeamsOrFetch, cache } from '@/lib/cache'
import { getChats } from '@/app/actions'

export async function getUserTeams(
  userId?: string | null
): Promise<TeamWithMembers[]> {
  if (!userId) {
    return []
  }

  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { data, error } = await supabase
      .from('team_members')
      .select(
        `
        role,
        joined_at,
        teams!inner (
          id,
          name,
          description,
          join_code,
          created_at,
          updated_at,
          created_by
        )
      `
      )
      .eq('user_id', userId)

    if (error) throw error

    if (!data || data.length === 0) {
      return []
    }

    const teamIds = data.map(item => item.teams!.id)
    const memberCountPromises = teamIds.map(async teamId => {
      const { count } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
      return { teamId, count: count || 0 }
    })

    const memberCountResults = await Promise.all(memberCountPromises)
    const memberCountsByTeam = memberCountResults.reduce(
      (acc, { teamId, count }) => {
        acc[teamId] = count
        return acc
      },
      {} as Record<string, number>
    )

    return data.map(item => {
      const team = item.teams!
      return {
        id: team.id,
        name: team.name,
        description: team.description || undefined,
        join_code: team.join_code,
        created_at: team.created_at,
        updated_at: team.updated_at,
        created_by: team.created_by,
        members: [],
        member_count: memberCountsByTeam[team.id] || 0,
        user_role: item.role
      }
    })
  } catch (error) {
    return []
  }
}

export async function createTeam(
  name: string,
  description?: string
): Promise<ServerActionResult<Team>> {
  try {
    const cookieStore = cookies()
    const session =
      (await authFast({ cookieStore })) || (await auth({ cookieStore }))
    if (!session?.user?.id) return { error: 'Unauthorized' }

    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { data, error } = await supabase
      .from('teams')
      .insert({ name, description, created_by: session.user.id })
      .select()
      .single()
    if (error) throw error

    await invalidateTeamsCache(session.user.id)

    revalidatePath('/teams')
    return { ...data, description: data.description || undefined }
  } catch (error) {
    return { error: 'Failed to create team' }
  }
}

export async function getTeamDetails(
  teamId: string
): Promise<TeamWithMembers | null> {
  try {
    const cookieStore = cookies()
    const session =
      (await authFast({ cookieStore })) || (await auth({ cookieStore }))

    if (!session?.user?.id) {
      return null
    }

    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', session.user.id)
      .single()

    if (!membership) {
      return null
    }

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single()

    if (teamError) throw teamError

    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select(
        `
        id,
        team_id,
        user_id,
        role,
        joined_at
      `
      )
      .eq('team_id', teamId)

    if (membersError) throw membersError

    const userIds = members?.map(member => member.user_id) || []
    const { data: users } = await supabase
      .from('local_users')
      .select('id, email')
      .in('id', userIds)

    const membersWithUsers =
      members?.map(member => {
        const user = users?.find(u => u.id === member.user_id)
        return {
          ...member,
          user: {
            email: user?.email || 'Unknown User',
            name: user?.email?.split('@')[0] || 'Unknown'
          }
        }
      }) || []

    return {
      ...team,
      description: team.description || undefined,
      members: membersWithUsers,
      member_count: membersWithUsers.length,
      user_role: membership.role
    }
  } catch (error) {
    return null
  }
}

export async function joinTeamByCode(
  joinCode: string
): Promise<ServerActionResult<TeamMember>> {
  try {
    const cookieStore = cookies()
    const session =
      (await authFast({ cookieStore })) || (await auth({ cookieStore }))

    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('join_code', joinCode.toUpperCase())
      .single()

    if (teamError || !team) {
      return { error: 'Invalid join code' }
    }

    const { data: newMember, error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: session.user.id,
        role: 'member'
      })
      .select()
      .single()

    if (memberError) throw memberError

    await invalidateTeamsCache(session.user.id)

    revalidatePath('/teams')
    revalidatePath(`/teams/${team.id}`)
    return newMember
  } catch (error) {
    return { error: 'Failed to join team' }
  }
}

export async function removeTeamMember(
  teamId: string,
  userId: string
): Promise<ServerActionResult<boolean>> {
  try {
    const cookieStore = cookies()
    const session =
      (await authFast({ cookieStore })) || (await auth({ cookieStore }))

    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { data: team } = await supabase
      .from('teams')
      .select('created_by')
      .eq('id', teamId)
      .single()

    const actorId = session.user.id
    const actorIsSuperAdmin = await isSuperAdmin(actorId, session)
    const targetIsSuperAdmin = await isSuperAdmin(userId)

    if (!team) {
      return { error: 'Team not found' }
    }

    if (team.created_by !== actorId && !actorIsSuperAdmin) {
      return { error: 'Only team creators or super admins can remove members' }
    }

    if (targetIsSuperAdmin && !actorIsSuperAdmin) {
      return { error: 'Cannot remove a super admin' }
    }

    if (targetIsSuperAdmin && actorId === userId) {
      return { error: 'Super admin cannot remove themselves from the team' }
    }

    if (userId === session.user.id) {
      const { data: adminCount } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('role', 'admin')

      if (adminCount && adminCount.length <= 1) {
        return { error: 'Cannot remove the last admin from the team' }
      }
    }

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId)

    if (error) throw error

    await invalidateTeamsCache(userId)
    if (actorId !== userId) {
      await invalidateTeamsCache(actorId)
    }

    revalidatePath(`/teams/${teamId}`)
    return true
  } catch (error) {
    return { error: 'Failed to remove team member' }
  }
}

export async function updateTeamMemberRole(
  teamId: string,
  userId: string,
  role: 'admin' | 'member'
): Promise<ServerActionResult<boolean>> {
  try {
    const cookieStore = cookies()
    const session =
      (await authFast({ cookieStore })) || (await auth({ cookieStore }))

    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { data: team } = await supabase
      .from('teams')
      .select('created_by')
      .eq('id', teamId)
      .single()

    const actorId = session.user.id
    const actorIsSuperAdmin = await isSuperAdmin(actorId, session)
    const targetIsSuperAdmin = await isSuperAdmin(userId)

    if (!team) {
      return { error: 'Team not found' }
    }

    if (targetIsSuperAdmin) {
      return { error: 'Cannot change role of a super admin' }
    }

    if (team.created_by !== actorId && !actorIsSuperAdmin) {
      return {
        error: 'Only team creators or super admins can change member roles'
      }
    }

    if (userId === session.user.id && role === 'member') {
      const { data: adminCount } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('role', 'admin')

      if (adminCount && adminCount.length <= 1) {
        return { error: 'Cannot demote the last admin of the team' }
      }
    }

    const { error } = await supabase
      .from('team_members')
      .update({ role })
      .eq('team_id', teamId)
      .eq('user_id', userId)

    if (error) throw error

    await invalidateTeamsCache(userId)
    if (actorId !== userId) {
      await invalidateTeamsCache(actorId)
    }

    revalidatePath(`/teams/${teamId}`)
    return true
  } catch (error) {
    return { error: 'Failed to update member role' }
  }
}

export async function deleteTeam(
  teamId: string
): Promise<ServerActionResult<boolean>> {
  try {
    const cookieStore = cookies()
    const session =
      (await authFast({ cookieStore })) || (await auth({ cookieStore }))

    if (!session?.user?.id) {
      return { error: 'Unauthorized' }
    }

    const supabase = createServerActionClient<Database>({
      cookies: () => cookieStore
    })

    const { data: team } = await supabase
      .from('teams')
      .select('created_by')
      .eq('id', teamId)
      .single()

    if (!team) {
      return { error: 'Team not found' }
    }

    const actorId = session.user.id
    const actorIsSuperAdmin = await isSuperAdmin(actorId, session)

    if (team.created_by !== actorId && !actorIsSuperAdmin) {
      return { error: 'Only team creators or super admins can delete teams' }
    }

    const { error } = await supabase.from('teams').delete().eq('id', teamId)

    if (error) throw error

    await invalidateTeamsCache(actorId)
    await invalidateChatsCache(teamId)

    revalidatePath('/teams')
    return true
  } catch (error) {
    return { error: 'Failed to delete team' }
  }
}

export async function getUserTeamsClient(
  userId: string
): Promise<TeamWithMembers[]> {
  return getCachedTeamsOrFetch(userId, () => getUserTeams(userId))
}

export async function prefetchTeamsAndChats(userId: string): Promise<{
  teams: TeamWithMembers[]
  chatsPreloaded: number
}> {
  try {
    const teams = await getUserTeamsClient(userId)

    const chatPromises = teams.map(async team => {
      try {
        const cachedChats = cache.getChats(team.id)
        if (cachedChats) {
          return cachedChats.length
        }

        const chats = await getChats(userId, team.id)
        return chats?.length || 0
      } catch (error) {
        return 0
      }
    })

    const chatCounts = await Promise.all(chatPromises)
    const totalChatsPreloaded = chatCounts.reduce(
      (sum, count) => sum + count,
      0
    )

    return {
      teams,
      chatsPreloaded: totalChatsPreloaded
    }
  } catch (error) {
    return {
      teams: [],
      chatsPreloaded: 0
    }
  }
}

export async function invalidateTeamsCache(userId: string) {
  cache.invalidateTeams(userId)
}

export async function invalidateChatsCache(teamId: string) {
  cache.invalidateChats(teamId)
}

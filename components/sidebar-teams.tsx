'use client'

import React, { useEffect, useState } from 'react'
import { prefetchTeamsAndChats } from '@/app/team-actions'
import { getChats } from '@/app/actions'
import { TeamSidebarClient } from './team-sidebar-client'
import { cache } from '@/lib/cache'

interface SidebarTeamsProps {
  session?: any
  isSuperAdmin?: boolean
}

interface TeamBasic {
  id: string
  name: string
  description?: string
  member_count: number
  user_role?: 'admin' | 'member'
}

export function SidebarTeams({
  session,
  isSuperAdmin = false
}: SidebarTeamsProps) {
  const [teams, setTeams] = useState<TeamBasic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [prefetchedChats, setPrefetchedChats] = useState(0)

  useEffect(() => {
    const loadTeamsAndChats = async () => {
      if (!session?.user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        const cachedTeams = cache.getTeams(session.user.id)

        if (cachedTeams && cachedTeams.length > 0) {
          const basicTeams: TeamBasic[] = cachedTeams.map((team: any) => ({
            id: team.id,
            name: team.name,
            description: team.description,
            member_count: team.member_count,
            user_role: team.user_role
          }))

          setTeams(basicTeams)
          setLoading(false)

          let cachedChatsCount = 0
          cachedTeams.forEach(team => {
            const teamChats = cache.getChats(team.id)
            if (teamChats) {
              cachedChatsCount += teamChats.length
            }
          })
          setPrefetchedChats(cachedChatsCount)

          return
        }

        const { teams: teamsData, chatsPreloaded } =
          await prefetchTeamsAndChats(session.user.id)

        const basicTeams: TeamBasic[] = teamsData.map((team: any) => ({
          id: team.id,
          name: team.name,
          description: team.description,
          member_count: team.member_count,
          user_role: team.user_role
        }))

        setTeams(basicTeams)
        setPrefetchedChats(chatsPreloaded)
      } catch (err) {
        setError('Failed to load teams')
      } finally {
        setLoading(false)
      }
    }

    loadTeamsAndChats()
  }, [session?.user?.id])

  if (loading) {
    return (
      <div className="px-4 py-3 text-sm text-muted-foreground">
        Loading teams and chats...
      </div>
    )
  }

  if (error) {
    return <div className="px-4 py-3 text-sm text-red-500">{error}</div>
  }

  if (!session?.user?.id) {
    return (
      <div className="px-4 py-3 text-sm text-muted-foreground">
        No teams found
      </div>
    )
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-muted-foreground">
        No teams found
      </div>
    )
  }

  return (
    <TeamSidebarClient
      teams={teams}
      userId={session.user.id}
      isSuperAdmin={isSuperAdmin}
      onLoadChats={getChats}
    />
  )
}

'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { IconTeam, IconPlus } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { SidebarItem } from '@/components/sidebar-item'
import { SidebarActions } from '@/components/sidebar-actions'
import { removeChat, shareChat } from '@/app/actions'
import { cache } from '@/lib/cache'

interface Chat {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: any[]
  sharePath?: string
  teamId?: string
}

interface TeamBasic {
  id: string
  name: string
  description?: string
  member_count: number
  user_role?: 'admin' | 'member'
}

interface TeamWithChats extends TeamBasic {
  chats: Chat[]
  chatsLoaded?: boolean
  chatsLoading?: boolean
}

interface TeamSidebarClientProps {
  teams: TeamBasic[]
  userId: string
  isSuperAdmin: boolean
  onLoadChats: (userId: string, teamId: string) => Promise<Chat[]>
}

export function TeamSidebarClient({ teams, userId, isSuperAdmin, onLoadChats }: TeamSidebarClientProps) {
  const [expandedTeams, setExpandedTeams] = React.useState<Set<string>>(new Set())
  const [teamsWithChats, setTeamsWithChats] = React.useState<Record<string, TeamWithChats>>(() => {
    // Initialize teams and immediately check for cached chats
    const teamsToExpand = new Set<string>()
    
    const initialTeams = teams.reduce((acc, team) => {
      // Check if we have cached chats for this team
      const cachedChats = cache.getChats(team.id)
      const hasChats = cachedChats && cachedChats.length > 0
      
      acc[team.id] = {
        ...team,
        chats: cachedChats || [],
        chatsLoaded: !!cachedChats,
        chatsLoading: false
      }
      
      // Auto-expand teams that have chats
      if (hasChats) {
        teamsToExpand.add(team.id)
      }
      
      return acc
    }, {} as Record<string, TeamWithChats>)
    
    // Set expanded teams after state initialization
    setTimeout(() => {
      setExpandedTeams(teamsToExpand)
    }, 0)
    
    return initialTeams
  })

  // Update teams when prop changes, preserving cached data
  React.useEffect(() => {
    setTeamsWithChats(prev => {
      const updated = { ...prev }
      const teamsToExpand = new Set(expandedTeams)
      
      teams.forEach(team => {
        if (!updated[team.id]) {
          // New team - check for cached chats
          const cachedChats = cache.getChats(team.id)
          const hasChats = cachedChats && cachedChats.length > 0
          
          updated[team.id] = {
            ...team,
            chats: cachedChats || [],
            chatsLoaded: !!cachedChats,
            chatsLoading: false
          }
          
          // Auto-expand if has chats
          if (hasChats) {
            teamsToExpand.add(team.id)
          }
        } else {
          // Existing team - update team info but preserve chat data unless we have newer cached data
          const cachedChats = cache.getChats(team.id)
          if (cachedChats && (!updated[team.id].chatsLoaded || cachedChats.length !== updated[team.id].chats.length)) {
            // Update with newer cached data
            updated[team.id] = {
              ...updated[team.id],
              ...team,
              chats: cachedChats,
              chatsLoaded: true,
              chatsLoading: false
            }
            
            // Auto-expand if has chats
            if (cachedChats.length > 0) {
              teamsToExpand.add(team.id)
            }
          } else {
            // Just update team metadata
            updated[team.id] = {
              ...updated[team.id],
              ...team
            }
          }
        }
      })
      
      // Update expanded teams if needed
      if (teamsToExpand.size !== expandedTeams.size || Array.from(teamsToExpand).some(id => !expandedTeams.has(id))) {
        setExpandedTeams(teamsToExpand)
      }
      
      return updated
    })
  }, [teams])

  const toggleTeam = async (teamId: string) => {
    const newExpanded = new Set(expandedTeams)
    const isExpanding = !newExpanded.has(teamId)
    
    if (isExpanding) {
      newExpanded.add(teamId)
      
      // Load chats if not already loaded and not in cache
      const team = teamsWithChats[teamId]
      if (team && !team.chatsLoaded && !team.chatsLoading) {
        setTeamsWithChats(prev => ({
          ...prev,
          [teamId]: { ...prev[teamId], chatsLoading: true }
        }))

        try {
          const chats = await onLoadChats(userId, teamId)
          setTeamsWithChats(prev => ({
            ...prev,
            [teamId]: { 
              ...prev[teamId], 
              chats: chats || [],
              chatsLoaded: true,
              chatsLoading: false
            }
          }))
        } catch (error) {
          console.error('Error loading chats for team:', teamId, error)
          setTeamsWithChats(prev => ({
            ...prev,
            [teamId]: { 
              ...prev[teamId], 
              chatsLoading: false
            }
          }))
        }
      }
    } else {
      newExpanded.delete(teamId)
    }
    
    setExpandedTeams(newExpanded)
  }

  const teamsList = Object.values(teamsWithChats)

  return (
    <div className="space-y-2 px-2">
      {teamsList.map((team) => {
        const isExpanded = expandedTeams.has(team.id)
        const chatCount = team.chats.length
        const showCachedIndicator = team.chatsLoaded && chatCount > 0

        return (
          <div key={team.id} className="border-b border-border/30 pb-2">
            {/* Team Header */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 flex-1 justify-start px-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted/30 hover:text-foreground"
                onClick={() => toggleTeam(team.id)}
              >
                <IconTeam className="mr-2 h-4 w-4" />
                <span className="truncate">{team.name}</span>
              </Button>
            </div>

            {/* Team Chats */}
            {isExpanded && (
              <div className="ml-4 mt-1 space-y-1">
                {team.chatsLoading ? (
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    Loading chats...
                  </div>
                ) : team.chats.length > 0 ? (
                  team.chats.map((chat) => (
                    <SidebarItem key={chat.id} chat={chat}>
                      <SidebarActions
                        chat={chat}
                        removeChat={removeChat}
                        shareChat={shareChat}
                        canDelete={isSuperAdmin || team.user_role === 'admin'}
                      />
                    </SidebarItem>
                  ))
                ) : (
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    No chats in this team
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

import { redirect } from 'next/navigation'
import { getCurrentUserSuperAdminStatus } from '@/lib/super-admin'
import { getAllChatsForSuperAdmin, superAdminDeleteChat } from '@/app/super-admin-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { IconTeam, IconMessage, IconTrash, IconShare, IconUsers } from '@/components/ui/icons'
import { InstantLoadingButton } from '@/components/instant-loading-button'
import { SuperAdminChatActions } from '@/components/super-admin-chat-actions'

export default async function SuperAdminChatsPage() {
  // Check if user is super admin
  const { user, isSuperAdmin } = await getCurrentUserSuperAdminStatus()

  if (!user) {
    redirect('/sign-in')
  }

  if (!isSuperAdmin) {
    redirect('/')
  }

  // Get all chats from all teams
  const chatsResult = await getAllChatsForSuperAdmin()

  if ('error' in chatsResult) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">
          Error loading chats: {chatsResult.error}
        </div>
      </div>
    )
  }

  const teamsWithChats = chatsResult

  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <InstantLoadingButton
          href="/super-admin"
          variant="ghost"
          size="sm"
          className="mb-4 flex items-center gap-2"
          prefetch
        >
          ← Back to Dashboard
        </InstantLoadingButton>

        <div>
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
            Chat Management
          </h1>
          <p className="text-muted-foreground">
            View and manage all chats across all teams
          </p>
        </div>
      </div>

      {/* Teams with Chats */}
      <div className="space-y-6">
        {teamsWithChats.length > 0 ? (
          teamsWithChats.map((team) => (
            <Card key={team.team_id} className="border border-border/60">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <IconTeam className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{team.team_name}</CardTitle>
                    <CardDescription className="text-sm">
                      {team.chats.length} chat{team.chats.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {team.chats.length > 0 ? (
                  <div className="space-y-3">
                    {team.chats.map((chat) => (
                      <div
                        key={chat.id}
                        className="flex items-center justify-between rounded-lg border border-border/40 p-3 transition-colors hover:bg-muted/20"
                      >
                        <div className="flex flex-1 items-center gap-3">
                          <IconMessage className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="font-medium">{chat.title}</div>
                            <div className="text-sm text-muted-foreground">
                              by {chat.user_email} • {chat.createdAt.toLocaleDateString()} • {chat.messages.length} messages
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {chat.sharePath && (
                            <Badge variant="outline" className="text-xs">
                              <IconUsers className="mr-1 h-3 w-3" />
                              Shared
                            </Badge>
                          )}

                          <SuperAdminChatActions
                            chatId={chat.id}
                            chatPath={chat.path}
                            shareChatPath={chat.sharePath}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">No chats in this team</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border border-border/60">
            <CardContent className="py-12">
              <div className="text-center">
                <IconMessage className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-medium">No Chats Found</h3>
                <p className="text-sm text-muted-foreground">
                  No chats have been created yet across all teams.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

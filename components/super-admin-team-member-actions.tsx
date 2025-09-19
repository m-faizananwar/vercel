'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

import {
  superAdminRemoveUserFromTeam,
  superAdminChangeUserRole
} from '@/app/super-admin-actions'

import { useRouter } from 'next/navigation'

interface SuperAdminTeamMemberActionsProps {
  teamId: string
  memberId: string
  userId: string
  userEmail: string
  currentRole: 'admin' | 'member'
}

export function SuperAdminTeamMemberActions({
  teamId,
  memberId,
  userId,
  userEmail,
  currentRole
}: SuperAdminTeamMemberActionsProps) {
  const [showRemoveDialog, setShowRemoveDialog] = React.useState(false)
  const [showRoleChangeDialog, setShowRoleChangeDialog] = React.useState(false)
  const [newRole, setNewRole] = React.useState<'admin' | 'member'>('member')
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()

  const handleRemoveFromTeam = async () => {
    setIsLoading(true)
    try {
      const result = await superAdminRemoveUserFromTeam(teamId, userId)

      if (result && typeof result === 'object' && 'error' in result) {
        alert('Error: ' + result.error)
      } else {
        router.refresh()
      }
    } catch (error) {
      alert('Failed to remove user from team')
    } finally {
      setIsLoading(false)
      setShowRemoveDialog(false)
    }
  }

  const handleChangeRole = async () => {
    setIsLoading(true)
    try {
      const result = await superAdminChangeUserRole(teamId, userId, newRole)

      if (result && typeof result === 'object' && 'error' in result) {
        alert('Error: ' + result.error)
      } else {
        router.refresh()
      }
    } catch (error) {
      alert('Failed to change user role')
    } finally {
      setIsLoading(false)
      setShowRoleChangeDialog(false)
    }
  }

  const handlePromoteToAdmin = () => {
    setNewRole('admin')
    setShowRoleChangeDialog(true)
  }

  const handleDemoteToMember = () => {
    setNewRole('member')
    setShowRoleChangeDialog(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            •••
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="bottom"
          sideOffset={4}
          className="w-48"
        >
          <DropdownMenuItem disabled className="text-sm text-muted-foreground">
            {userEmail}
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          {currentRole === 'member' && (
            <DropdownMenuItem onClick={handlePromoteToAdmin}>
              Promote to Admin
            </DropdownMenuItem>
          )}

          {currentRole === 'admin' && (
            <DropdownMenuItem onClick={handleDemoteToMember}>
              Demote to Member
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowRemoveDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            Remove from Team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User from Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {userEmail} from this team? This
              action cannot be undone and they will lose access to all team
              resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFromTeam}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Removing...' : 'Remove from Team'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {}
      <AlertDialog
        open={showRoleChangeDialog}
        onOpenChange={setShowRoleChangeDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change {userEmail}&apos;s role from{' '}
              {currentRole} to {newRole}?
              {newRole === 'admin' && (
                <span className="mt-2 block text-sm">
                  <strong>Admin privileges include:</strong> Managing team
                  members, deleting team, and full access to team resources.
                </span>
              )}
              {newRole === 'member' && (
                <span className="mt-2 block text-sm">
                  <strong>Note:</strong> They will lose admin privileges and
                  cannot manage other team members.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangeRole} disabled={isLoading}>
              {isLoading ? 'Changing...' : `Change to ${newRole}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

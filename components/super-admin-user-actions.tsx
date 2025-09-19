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
  removeSuperAdmin,
  updateUserPassword,
  deleteUser
} from '@/app/super-admin-actions'

import { useRouter } from 'next/navigation'

interface SuperAdminUserActionsProps {
  userId: string
  userEmail: string
  isSuperAdmin: boolean
  currentUserId: string
}

export function SuperAdminUserActions({
  userId,
  userEmail,
  isSuperAdmin,
  currentUserId
}: SuperAdminUserActionsProps) {
  const [showRemoveSuperAdminDialog, setShowRemoveSuperAdminDialog] =
    React.useState(false)
  const [showDeleteUserDialog, setShowDeleteUserDialog] = React.useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = React.useState(false)
  const [newPassword, setNewPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()

  const handleRemoveSuperAdmin = async () => {
    setIsLoading(true)
    try {
      const result = await removeSuperAdmin(userId)

      if (result && typeof result === 'object' && 'error' in result) {
        alert('Error: ' + result.error)
      } else {
        router.refresh()
      }
    } catch (error) {
      alert('Failed to remove super admin privileges')
    } finally {
      setIsLoading(false)
      setShowRemoveSuperAdminDialog(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!newPassword.trim()) return

    setIsLoading(true)
    try {
      const result = await updateUserPassword(userId, newPassword.trim())

      if (result && typeof result === 'object' && 'error' in result) {
        alert('Error: ' + result.error)
      } else {
        alert('Password updated successfully!')
        setNewPassword('')
        setShowPasswordDialog(false)
      }
    } catch (error) {
      alert('Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    setIsLoading(true)
    try {
      const result = await deleteUser(userId)

      if (result && typeof result === 'object' && 'error' in result) {
        alert('Error: ' + result.error)
      } else {
        router.refresh()
      }
    } catch (error) {
      alert('Failed to delete user')
    } finally {
      setIsLoading(false)
      setShowDeleteUserDialog(false)
    }
  }

  const isCurrentUser = userId === currentUserId

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
          className="min-h-[80px] w-48"
        >
          <DropdownMenuItem disabled className="text-sm text-muted-foreground">
            {userEmail}
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowPasswordDialog(true)}>
            Update Password
          </DropdownMenuItem>

          {isSuperAdmin && !isCurrentUser && (
            <DropdownMenuItem
              onClick={() => setShowRemoveSuperAdminDialog(true)}
              className="text-red-600 focus:text-red-600"
            >
              Remove Super Admin
            </DropdownMenuItem>
          )}

          {isSuperAdmin && isCurrentUser && (
            <DropdownMenuItem disabled className="text-muted-foreground">
              Cannot remove yourself
            </DropdownMenuItem>
          )}

          {!isCurrentUser && (
            <DropdownMenuItem
              onClick={() => setShowDeleteUserDialog(true)}
              className="text-red-600 focus:text-red-600"
            >
              Delete User
            </DropdownMenuItem>
          )}

          {isCurrentUser && (
            <DropdownMenuItem disabled className="text-muted-foreground">
              Cannot delete yourself
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={showRemoveSuperAdminDialog}
        onOpenChange={setShowRemoveSuperAdminDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Super Admin Privileges</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove super admin privileges from{' '}
              {userEmail}? This action cannot be undone and they will lose
              access to all super admin features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveSuperAdmin}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Removing...' : 'Remove Super Admin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {}
      <AlertDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Password</AlertDialogTitle>
            <AlertDialogDescription>
              Update the password for {userEmail}. The new password must be at
              least 4 characters long.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              minLength={4}
              required
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdatePassword}
              disabled={
                isLoading || !newPassword.trim() || newPassword.length < 4
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {}
      <AlertDialog
        open={showDeleteUserDialog}
        onOpenChange={setShowDeleteUserDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userEmail}? This action cannot be
              undone and will:
              <ul className="mt-2 list-inside list-disc text-sm">
                <li>Remove the user from all teams</li>
                <li>Delete all their chat history</li>
                <li>Permanently remove their account</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

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

import { superAdminDeleteTeam } from '@/app/super-admin-actions'

import { useRouter } from 'next/navigation'

interface SuperAdminTeamActionsProps {
  teamId: string
  teamName: string
}

export function SuperAdminTeamActions({
  teamId,
  teamName
}: SuperAdminTeamActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()

  const handleDeleteTeam = async () => {
    setIsLoading(true)
    try {
      const result = await superAdminDeleteTeam(teamId)

      if (result && typeof result === 'object' && 'error' in result) {
        alert('Error: ' + result.error)
      } else {
        router.refresh()
      }
    } catch (error) {
      alert('Failed to delete team')
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
    }
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
            {teamName}
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            Delete Team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the team &quot;{teamName}&quot;?
              This action cannot be undone and will delete all team data
              including:
              <br />
              <br />
              • All team members and their roles
              <br />
              • All team chat conversations
              <br />• All team settings and data
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Deleting...' : 'Delete Team'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

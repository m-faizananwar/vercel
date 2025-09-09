'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

import { superAdminDeleteChat } from '@/app/super-admin-actions'
import { Button } from '@/components/ui/button'
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
  IconShare,
  IconTrash
} from '@/components/ui/icons'
import Link from 'next/link'

interface SuperAdminChatActionsProps {
  chatId: string
  chatPath: string
  shareChatPath?: string
}

export function SuperAdminChatActions({
  chatId,
  chatPath,
  shareChatPath
}: SuperAdminChatActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isSharePending, startShareTransition] = React.useTransition()
  const [isDeletePending, startDeleteTransition] = React.useTransition()
  const router = useRouter()

  const copyShareLink = React.useCallback(async () => {
    if (!shareChatPath) {
      return toast.error('Не удалось скопировать ссылку для совместного использования')
    }

    const url = new URL(window.location.href)
    url.pathname = shareChatPath
    navigator.clipboard.writeText(url.toString())
    setDeleteDialogOpen(false)
    toast.success('Ссылка для совместного использования скопирована', {
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
        fontSize: '14px'
      },
      iconTheme: {
        primary: 'white',
        secondary: 'black'
      }
    })
  }, [shareChatPath])

  const handleDeleteChat = async () => {
    startDeleteTransition(async () => {
      const result = await superAdminDeleteChat(chatId)

      if (result && typeof result === 'object' && 'error' in result) {
        toast.error(result.error)
        return
      }

      setDeleteDialogOpen(false)
      router.refresh()
      toast.success('Чат удален успешно')
    })
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {shareChatPath && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-background"
            onClick={() => copyShareLink()}
            disabled={isSharePending}
          >
            <IconShare className="h-3 w-3" />
            <span className="sr-only">Share</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-destructive hover:bg-background hover:text-destructive"
          disabled={isDeletePending}
          onClick={() => setDeleteDialogOpen(true)}
        >
          <IconTrash className="h-3 w-3" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone and will permanently remove the chat and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletePending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChat}
              disabled={isDeletePending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletePending ? 'Deleting...' : 'Delete Chat'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

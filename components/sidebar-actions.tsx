'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

import { type Chat, ServerActionResult } from '@/lib/types'
import { cn, formatDate } from '@/lib/utils'
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
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  IconShare,
  IconSpinner,
  IconTrash,
  IconUsers
} from '@/components/ui/icons'
import Link from 'next/link'
import { badgeVariants } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

interface SidebarActionsProps {
  chat: Chat
  removeChat: (args: { id: string; path: string }) => ServerActionResult<void>
  shareChat: (chat: Chat) => ServerActionResult<Chat>
  canDelete?: boolean
}

export function SidebarActions({
  chat,
  removeChat,
  shareChat,
  canDelete = false
}: SidebarActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)
  const [isRemovePending, startRemoveTransition] = React.useTransition()
  const [isSharePending, startShareTransition] = React.useTransition()
  const router = useRouter()

  const copyShareLink = React.useCallback(async (chat: Chat) => {
    if (!chat.sharePath) {
      return toast.error('Не удалось скопировать ссылку для совместного использования')
    }

    const url = new URL(window.location.href)
    url.pathname = chat.sharePath
    navigator.clipboard.writeText(url.toString())
    setShareDialogOpen(false)
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
  }, [])

  return (
    <>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-background"
              onClick={() => setShareDialogOpen(true)}
            >
              <IconShare className="h-3 w-3" />
              <span className="sr-only">Поделиться</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Поделиться чатом</TooltipContent>
        </Tooltip>
        {canDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-background"
                disabled={isRemovePending}
                onClick={() => setDeleteDialogOpen(true)}
              >
                <IconTrash className="h-3 w-3" />
                <span className="sr-only">Удалить</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Удалить чат</TooltipContent>
          </Tooltip>
        )}
      </div>
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Поделиться ссылкой на чат</DialogTitle>
            <DialogDescription>
              Любой, у кого есть URL, сможет просмотреть общий чат.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 rounded-md border p-4 text-sm">
            <div className="font-medium">{chat.title}</div>
            <div className="text-muted-foreground">
              {formatDate(chat.createdAt)} · {chat.messages.length} сообщений
            </div>
          </div>
          <DialogFooter className="items-center">
            {chat.sharePath && (
              <Link
                href={chat.sharePath}
                className={cn(
                  badgeVariants({ variant: 'secondary' }),
                  'mr-auto'
                )}
                target="_blank"
              >
                <IconUsers className="mr-2" />
                {chat.sharePath}
              </Link>
            )}
            <Button
              disabled={isSharePending}
              onClick={() => {
                startShareTransition(async () => {
                  if (chat.sharePath) {
                    await new Promise(resolve => setTimeout(resolve, 500))
                    copyShareLink(chat)
                    return
                  }

                  const result = await shareChat(chat)

                  if (result && typeof result === 'object' && 'error' in result) {
                    toast.error(result.error)
                    return
                  }

                  copyShareLink(result)
                })
              }}
            >
              {isSharePending ? (
                <>
                  <IconSpinner className="mr-2 animate-spin" />
                  Копирование...
                </>
              ) : (
                <>Скопировать ссылку</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы абсолютно уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это навсегда удалит ваше сообщение чата и удалит ваши
              данные с наших серверов.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovePending}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRemovePending}
              onClick={event => {
                event.preventDefault()
                startRemoveTransition(async () => {
                  const result = await removeChat({
                    id: chat.id,
                    path: chat.path
                  })

                  if (result && typeof result === 'object' && 'error' in result) {
                    toast.error(result.error)
                    return
                  }

                  setDeleteDialogOpen(false)
                  router.refresh()
                  router.push('/')
                  toast.success('Чат удален')
                })
              }}
            >
              {isRemovePending && <IconSpinner className="mr-2 animate-spin" />}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

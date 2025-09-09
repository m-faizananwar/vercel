'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTeam } from '@/app/team-actions'
import { TeamWithMembers } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconChevronUpDown } from '@/components/ui/icons'
import { toast } from 'react-hot-toast'

interface TeamSettingsProps {
  team: TeamWithMembers
}

export function TeamSettings({ team }: TeamSettingsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDeleteTeam = async () => {
    setLoading(true)
    try {
      const result = await deleteTeam(team.id)
      
      if (typeof result === 'object' && result !== null && 'error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Команда удалена успешно')
        // Close the dialog and redirect to teams page
        setDeleteDialogOpen(false)
        router.push('/teams')
      }
    } catch (error) {
      toast.error('Не удалось удалить команду')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Настройки
            <IconChevronUpDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive"
          >
            Удалить команду
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить команду</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить &quot;{team.name}&quot;? Это действие нельзя отменить.
              Все чаты команды и данные будут окончательно удалены.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTeam}
              disabled={loading}
            >
              {loading ? 'Удаление...' : 'Удалить команду'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

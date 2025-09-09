'use client'

import { useState } from 'react'
import { joinTeamByCode } from '@/app/team-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { IconUser } from '@/components/ui/icons'
import { toast } from 'react-hot-toast'

export function JoinTeamForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [joinCode, setJoinCode] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return

    setLoading(true)
    try {
      const result = await joinTeamByCode(joinCode.trim())

      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Успешно присоединились к команде!')
        setOpen(false)
        setJoinCode('')
      }
    } catch (error) {
      toast.error('Не удалось присоединиться к команде')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <IconUser className="mr-2 h-4 w-4" />
          Присоединиться к команде
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Присоединиться к команде</DialogTitle>
            <DialogDescription>
              Введите код присоединения к команде, чтобы стать участником существующей команды.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="joinCode">Код присоединения к команде</Label>
              <Input
                id="joinCode"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="text-center font-mono"
                required
              />
              <p className="text-xs text-muted-foreground">
                Попросите у администратора команды 6-значный код присоединения.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !joinCode.trim()}>
              {loading ? 'Присоединение...' : 'Присоединиться к команде'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

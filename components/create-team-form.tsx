'use client'

import { useState } from 'react'
import { createTeam } from '@/app/team-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { IconPlus } from '@/components/ui/icons'
import { toast } from 'react-hot-toast'

export function CreateTeamForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const result = await createTeam(
        name.trim(),
        description.trim() || undefined
      )

      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Команда создана успешно!')
        setOpen(false)
        setName('')
        setDescription('')
      }
    } catch (error) {
      toast.error('Не удалось создать команду')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className="mr-2 h-4 w-4" />
          Создать команду
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Создать новую команду</DialogTitle>
            <DialogDescription>
              Создайте команду для совместной работы над общими ИИ-диалогами.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Название команды</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Моя отличная команда"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Описание (необязательно)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Для чего эта команда?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Создание...' : 'Создать команду'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

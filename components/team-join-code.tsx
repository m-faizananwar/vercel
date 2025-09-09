'use client'

import { useState } from 'react'
import { Team } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { IconCopy, IconCheck } from '@/components/ui/icons'
import { toast } from 'react-hot-toast'

interface TeamJoinCodeProps {
  team: Team
}

export function TeamJoinCode({ team }: TeamJoinCodeProps) {
  const [copied, setCopied] = useState(false)

  const copyJoinCode = async () => {
    try {
      await navigator.clipboard.writeText(team.join_code)
      setCopied(true)
      toast.success('Код присоединения скопирован в буфер обмена!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Не удалось скопировать код присоединения')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Код присоединения к команде</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Поделитесь этим кодом с людьми, которых хотите пригласить в свою команду.
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-md bg-muted p-3 text-center">
            <code className="font-mono text-lg font-bold tracking-wider">
              {team.join_code}
            </code>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={copyJoinCode}
            className={copied ? 'text-green-600' : ''}
          >
            {copied ? (
              <IconCheck className="h-4 w-4" />
            ) : (
              <IconCopy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Люди могут присоединиться, введя этот код в форме &quot;Присоединиться к команде&quot;.
        </div>
      </CardContent>
    </Card>
  )
}

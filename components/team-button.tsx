'use client'

import { useRouter } from 'next/navigation'
import { IconTeam } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

export function TeamButton() {
  const router = useRouter()

  const handleClick = () => {
    router.push('/teams')
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={handleClick}>
          <IconTeam />
          <span className="sr-only">Команды</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Команды</p>
      </TooltipContent>
    </Tooltip>
  )
}

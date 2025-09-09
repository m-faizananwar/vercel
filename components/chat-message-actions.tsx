'use client'

import { type Message } from 'ai'

import { Button } from '@/components/ui/button'
import { IconCheck, IconCopy } from '@/components/ui/icons'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'

interface ChatMessageActionsProps extends React.ComponentProps<'div'> {
  message: Message
}

export function ChatMessageActions({
  message,
  className,
  ...props
}: ChatMessageActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })

  const onCopy = () => {
    if (isCopied) return
    copyToClipboard(message.content)
  }

  return (
    <div
      className={cn(
        'flex items-center justify-start transition-all duration-200',
        className
      )}
      {...props}
    >
      <Button 
        variant="ghost" 
        size="sm"
        onClick={onCopy}
        className={cn(
          "h-8 rounded-full border border-border/30 bg-muted/50 px-2.5 hover:bg-muted",
          "transition-all duration-200 hover:scale-105 active:scale-95",
          "text-xs font-medium",
          isCopied && "border-primary/20 bg-primary/10 text-primary"
        )}
      >
        {isCopied ? (
          <>
            <IconCheck className="mr-1.5 h-3 w-3" />
            Скопировано
          </>
        ) : (
          <>
            <IconCopy className="mr-1.5 h-3 w-3" />
            Копировать
          </>
        )}
        <span className="sr-only">Копировать сообщение</span>
      </Button>
    </div>
  )
}

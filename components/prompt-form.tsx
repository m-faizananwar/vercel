import * as React from 'react'
import Link from 'next/link'
import Textarea from 'react-textarea-autosize'
import { UseChatHelpers } from 'ai/react'

import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { IconArrowElbow, IconPaperclip } from '@/components/ui/icons'
import { AVAILABLE_MODELS } from '@/components/model-selector'
import { TeamSelector, type Team } from '@/components/team-selector'

export interface PromptProps
  extends Pick<UseChatHelpers, 'input' | 'setInput'> {
  onSubmit: (value: string, attachments?: FileAttachment[]) => Promise<void>
  isLoading: boolean
  selectedModel: string
  onModelChange: (model: string) => void
  teams: Team[]
  selectedTeamId: string
  onTeamChange: (teamId: string) => void
  messages?: any[]
}

export interface FileAttachment {
  name: string
  type: string
  content: string
  size: number
}

export function PromptForm({
  onSubmit,
  input,
  setInput,
  isLoading,
  selectedModel,
  onModelChange,
  teams,
  selectedTeamId,
  onTeamChange,
  messages
}: PromptProps) {
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = React.useState<FileAttachment[]>([])
  const [isProcessingFile, setIsProcessingFile] = React.useState(false)

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setIsProcessingFile(true)
      const file = files[0]
      try {
        const isImage = file.type.startsWith('image/')
        let content: string
        if (isImage) {
          content = await readFileAsBase64(file)
        } else {
          content = await readFileAsBase64(file)
        }
        const attachment: FileAttachment = {
          name: file.name,
          type: file.type,
          content,
          size: file.size
        }
        setAttachments(prev => [...prev, attachment])
      } catch (error) {
        alert(
          `Error: ${error instanceof Error ? error.message : 'Failed to process file'}`
        )
      } finally {
        setIsProcessingFile(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <form
      onSubmit={async e => {
        e.preventDefault()
        if (!input?.trim()) {
          return
        }
        const currentInput = input
        const currentAttachments = [...attachments]
        setInput('')
        setAttachments([])
        await onSubmit(currentInput, currentAttachments)
      }}
      ref={formRef}
    >
      <div className="premium-input relative flex max-h-60 w-full grow flex-col overflow-hidden transition-all duration-200">
        <div className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  'h-9 w-9 rounded-full',
                  'border-0 bg-muted/50 transition-all duration-200 hover:bg-muted',
                  'hover:scale-105 active:scale-95',
                  isLoading && 'cursor-not-allowed opacity-50'
                )}
                onClick={handleFileUpload}
                disabled={isLoading || isProcessingFile}
              >
                {isProcessingFile ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                ) : (
                  <IconPaperclip className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="sr-only">Attach File or Image</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="border border-border/50 bg-popover/95 backdrop-blur-sm"
            >
              {isProcessingFile ? 'Processing file...' : 'Attach File or Image'}
            </TooltipContent>
          </Tooltip>

          {}
          <Select
            value={selectedTeamId}
            onValueChange={onTeamChange}
            disabled={isLoading || (messages && messages.length > 0)}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <SelectTrigger
                  className={cn(
                    'h-9 w-24 rounded-full border-0 bg-muted/50 hover:bg-muted',
                    'text-xs transition-all duration-200 hover:scale-105 active:scale-95',
                    'focus:ring-1 focus:ring-primary/50'
                  )}
                >
                  <SelectValue>
                    {teams
                      .find(t => t.id === selectedTeamId)
                      ?.name?.substring(0, 13) || 'Team'}
                  </SelectValue>
                </SelectTrigger>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="border border-border/50 bg-popover/95 backdrop-blur-sm"
              >
                {messages && messages.length > 0
                  ? "Can't change team during conversation"
                  : 'Select Team for Chat'}
              </TooltipContent>
            </Tooltip>
            <SelectContent className="border border-border/50 bg-popover/95 backdrop-blur-sm">
              {teams.length > 0 ? (
                teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {team.name.substring(0, 13)}
                          {team.name.length > 13 ? '...' : ''}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {team.user_role === 'admin'
                            ? 'Администратор'
                            : 'Участник'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {team.member_count} участников
                      </span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>
                  Нет доступных команд
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          {}
          <Select
            value={selectedModel}
            onValueChange={onModelChange}
            disabled={isLoading}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <SelectTrigger
                  className={cn(
                    'h-9 w-20 rounded-full border-0 bg-muted/50 hover:bg-muted',
                    'text-xs transition-all duration-200 hover:scale-105 active:scale-95',
                    'focus:ring-1 focus:ring-primary/50'
                  )}
                >
                  <SelectValue>
                    {AVAILABLE_MODELS.find(
                      m => m.id === selectedModel
                    )?.name?.split(' ')[0] || 'Model'}
                  </SelectValue>
                </SelectTrigger>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="border border-border/50 bg-popover/95 backdrop-blur-sm"
              >
                Select AI Model
              </TooltipContent>
            </Tooltip>
            <SelectContent className="border border-border/50 bg-popover/95 backdrop-blur-sm">
              {AVAILABLE_MODELS.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {model.provider}
                      </span>
                    </div>
                    {model.description && (
                      <span className="text-xs text-muted-foreground">
                        {model.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".txt,.pdf,.doc,.docx,.md,.csv,.json,.js,.ts,.jsx,.tsx,.py,.html,.css,.xml,.yaml,.yml,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg"
        />

        {}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-border/20 px-3 py-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-1.5 text-xs"
              >
                <span>
                  {attachment.type.startsWith('image/') ? '🖼️' : '📄'}
                  {attachment.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Отправить сообщение..."
          spellCheck={false}
          className={cn(
            'min-h-[54px] w-full resize-none bg-transparent py-4 pl-64 pr-14',
            'border-0 text-sm leading-relaxed focus-within:outline-none',
            'placeholder:text-muted-foreground/70',
            'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border'
          )}
        />

        <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || input === ''}
                className={cn(
                  'h-9 w-9 rounded-full p-0 transition-all duration-200',
                  'shadow-sm hover:scale-105 active:scale-95',
                  'disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50',
                  input.trim()
                    ? 'bg-primary text-primary-foreground shadow-primary/25 hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                <IconArrowElbow
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    input.trim() && 'rotate-0'
                  )}
                />
                <span className="sr-only">Send message</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="border border-border/50 bg-popover/95 backdrop-blur-sm"
            >
              {input.trim() ? 'Send message' : 'Type a message'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </form>
  )
}

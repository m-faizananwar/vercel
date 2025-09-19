import { type UseChatHelpers } from 'ai/react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { IconRefresh, IconStop } from '@/components/ui/icons'
import { FooterText } from '@/components/footer'

export interface ChatPanelProps
  extends Pick<
    UseChatHelpers,
    | 'append'
    | 'isLoading'
    | 'reload'
    | 'messages'
    | 'stop'
    | 'input'
    | 'setInput'
  > {
  id?: string
  selectedModel: string
  onModelChange: (model: string) => void
  teams: Array<{
    id: string
    name: string
    description?: string
    member_count: number
    user_role: 'admin' | 'member'
  }>
  selectedTeamId: string
  onTeamChange: (teamId: string) => void
}

export function ChatPanel({
  id,
  isLoading,
  stop,
  append,
  reload,
  input,
  setInput,
  messages,
  selectedModel,
  onModelChange,
  teams,
  selectedTeamId,
  onTeamChange
}: ChatPanelProps) {
  const isDocumentFile = (att: any) => {
    if (!att) return false
    const name = (att.name || '').toLowerCase()
    const type = (att.type || '').toLowerCase()
    const docExt =
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|csv|json|txt|md|markdown|tsv|xml|yaml|yml)$/i
    if (docExt.test(name)) return true
    if (
      type.startsWith('application/') &&
      !type.startsWith('application/json+')
    )
      return true
    if (
      type === 'text/plain' ||
      type === 'text/markdown' ||
      type === 'text/csv'
    )
      return true
    return false
  }

  return (
    <div className="fixed inset-x-0 bottom-0 bg-gradient-to-b from-transparent via-background/80 to-background backdrop-blur-xl">
      <ButtonScrollToBottom />
      <div className="mx-auto sm:max-w-2xl sm:px-4">
        {}
        <div className="mb-2 flex h-12 items-center justify-center">
          {isLoading ? (
            <Button
              variant="outline"
              onClick={() => stop()}
              className={cn(
                'border-border/50 bg-background/80 backdrop-blur-sm hover:bg-background/90',
                'transition-all duration-200 hover:scale-105 active:scale-95',
                'shadow-sm hover:shadow-md'
              )}
            >
              <IconStop className="mr-2 h-4 w-4" />
              Stop generating
            </Button>
          ) : (
            messages?.length > 0 && (
              <Button
                variant="outline"
                onClick={() => reload()}
                className={cn(
                  'border-border/50 bg-background/80 backdrop-blur-sm hover:bg-background/90',
                  'transition-all duration-200 hover:scale-105 active:scale-95',
                  'shadow-sm hover:shadow-md'
                )}
              >
                <IconRefresh className="mr-2 h-4 w-4" />
                Regenerate response
              </Button>
            )
          )}
        </div>

        {}
        <div className="mx-4 mb-4 sm:mx-0">
          <div className="rounded-2xl border border-border/50 bg-background/95 p-4 shadow-xl backdrop-blur-sm transition-all duration-300 md:py-6">
            <PromptForm
              onSubmit={async (value, attachments) => {
                if (attachments && attachments.length > 0) {
                  const imageAttachments = attachments.filter(att =>
                    att.type.startsWith('image/')
                  )
                  const documentAttachments = attachments.filter(
                    att => !att.type.startsWith('image/') && isDocumentFile(att)
                  )
                  const otherOpaque = attachments.filter(
                    att =>
                      !imageAttachments.includes(att) &&
                      !documentAttachments.includes(att)
                  )
                  documentAttachments.push(...otherOpaque)

                  if (
                    imageAttachments.length > 0 ||
                    documentAttachments.length > 0
                  ) {
                    const messageContent: any[] = [
                      {
                        type: 'text',
                        text:
                          value || 'Пожалуйста, проанализируйте вложение(я).'
                      }
                    ]

                    imageAttachments.forEach(attachment => {
                      messageContent.push({
                        type: 'image_url',
                        image_url: { url: attachment.content, detail: 'high' }
                      })
                    })

                    documentAttachments.forEach(attachment => {
                      messageContent.push({
                        type: 'image_url',
                        image_url: { url: attachment.content, detail: 'high' }
                      })
                    })

                    await append({
                      id,
                      role: 'user',
                      content: messageContent as any
                    })
                  } else {
                    await append({ id, content: value, role: 'user' })
                  }
                } else {
                  await append({ id, content: value, role: 'user' })
                }
              }}
              input={input}
              setInput={setInput}
              isLoading={isLoading}
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              teams={teams}
              selectedTeamId={selectedTeamId}
              onTeamChange={onTeamChange}
              messages={messages}
            />
            <FooterText className="mt-4 hidden text-center text-xs text-muted-foreground/70 sm:block" />
          </div>
        </div>
      </div>
    </div>
  )
}

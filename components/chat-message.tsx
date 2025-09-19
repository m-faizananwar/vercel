import { Message } from 'ai'
import Image from 'next/image'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

interface ContentPart {
  type: 'text' | 'image_url'
  text?: string
  image_url?: {
    url: string
    detail?: string
  }
}

import { cn } from '@/lib/utils'
import { CodeBlock } from '@/components/ui/codeblock'
import { MemoizedReactMarkdown } from '@/components/markdown'
import { IconOpenAI, IconUser } from '@/components/ui/icons'
import { ChatMessageActions } from '@/components/chat-message-actions'

export interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message, ...props }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'group relative mb-6 flex w-full fade-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
      {...props}
    >
      <div
        className={cn(
          'flex max-w-[85%] items-end space-x-2',
          isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
        )}
      >
        {}
        {!isUser && (
          <div className="mb-1 flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border border-primary/20 bg-primary/10">
            <IconOpenAI className="h-4 w-4 text-primary" />
          </div>
        )}

        {}
        <div
          className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}
        >
          {}
          <div
            className={cn(
              'chat-bubble slide-up',
              isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'
            )}
          >
            <MemoizedReactMarkdown
              className={cn(
                'prose prose-sm break-words leading-relaxed',
                'prose-p:mb-2 prose-p:leading-relaxed prose-p:last:mb-0',
                'prose-pre:bg-transparent prose-pre:p-0',
                'prose-code:rounded prose-code:bg-muted/50 prose-code:px-1 prose-code:py-0.5 prose-code:text-sm prose-code:font-medium',
                'prose-strong:font-semibold prose-em:font-medium',
                'prose-headings:font-semibold prose-headings:tracking-tight',
                'prose-ol:mb-2 prose-ul:mb-2 prose-li:mb-1',
                isUser
                  ? 'prose-invert prose-headings:text-inherit prose-p:text-inherit prose-strong:text-inherit prose-em:text-inherit prose-code:bg-white/20 prose-code:text-inherit'
                  : 'dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90'
              )}
              remarkPlugins={[remarkGfm, remarkMath]}
              components={{
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>
                },
                code({ node, inline, className, children, ...props }) {
                  if (children.length) {
                    if (children[0] == '▍') {
                      return (
                        <span className="mt-1 animate-pulse cursor-default opacity-70">
                          ▍
                        </span>
                      )
                    }

                    children[0] = (children[0] as string).replace('`▍`', '▍')
                  }

                  const match = /language-(\w+)/.exec(className || '')

                  if (inline) {
                    return (
                      <code
                        className={cn(
                          className,
                          'rounded bg-muted/50 px-1 py-0.5 text-sm font-medium'
                        )}
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  }

                  return (
                    <div className="-mx-1 my-3 overflow-hidden rounded-lg">
                      <CodeBlock
                        key={Math.random()}
                        language={(match && match[1]) || ''}
                        value={String(children).replace(/\n$/, '')}
                        {...props}
                      />
                    </div>
                  )
                }
              }}
            >
              {Array.isArray(message.content)
                ? (message.content as ContentPart[])
                    .filter(part => part.type === 'text')
                    .map(part => part.text)
                    .join('\n\n')
                : message.content}
            </MemoizedReactMarkdown>

            {}
            {Array.isArray(message.content) &&
              (message.content as ContentPart[])
                .filter(part => part.type === 'image_url')
                .map((part, index) => {
                  const url = part.image_url?.url || ''
                  const lower = url.toLowerCase()
                  const isPdf =
                    url.startsWith('data:application/pdf') ||
                    lower.includes('.pdf')
                  const isDocx =
                    url.startsWith(
                      'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    ) || lower.includes('.docx')
                  const isDoc =
                    url.startsWith('data:application/msword') ||
                    (!isDocx && lower.endsWith('.doc'))
                  const isXlsx =
                    url.startsWith(
                      'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    ) ||
                    lower.includes('.xlsx') ||
                    lower.includes('.xls')
                  const isPptx =
                    url.startsWith(
                      'data:application/vnd.openxmlformats-officedocument.presentationml.presentation'
                    ) ||
                    lower.includes('.pptx') ||
                    lower.includes('.ppt')
                  const isJson =
                    url.startsWith('data:application/json') ||
                    lower.endsWith('.json')
                  const isCsv =
                    url.startsWith('data:text/csv') || lower.endsWith('.csv')
                  const isMarkdown =
                    url.startsWith('data:text/markdown') ||
                    lower.endsWith('.md') ||
                    lower.endsWith('.markdown')
                  const isTxt =
                    url.startsWith('data:text/plain') || lower.endsWith('.txt')
                  const isGenericDoc =
                    isPdf ||
                    isDoc ||
                    isDocx ||
                    isXlsx ||
                    isPptx ||
                    isJson ||
                    isCsv ||
                    isMarkdown ||
                    isTxt
                  if (isGenericDoc) {
                    const ext = isPdf
                      ? 'PDF'
                      : isDocx
                        ? 'DOCX'
                        : isDoc
                          ? 'DOC'
                          : isXlsx
                            ? 'XLSX'
                            : isPptx
                              ? 'PPTX'
                              : isJson
                                ? 'JSON'
                                : isCsv
                                  ? 'CSV'
                                  : isMarkdown
                                    ? 'MD'
                                    : 'TXT'
                    const dlExt = ext.toLowerCase()
                    return (
                      <div
                        key={index}
                        className="mt-3 flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/20 p-3 text-sm"
                      >
                        <div className="font-medium">
                          Uploaded {ext} {index + 1}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Embedded base64 {ext}. Open to view full document.
                        </div>
                        <a
                          href={url}
                          download={`document-${index + 1}.${dlExt}`}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex w-fit items-center gap-1 text-primary hover:underline"
                        >
                          <span>Open / Download {ext}</span>
                        </a>
                      </div>
                    )
                  }
                  return (
                    <div
                      key={index}
                      className="mt-3 overflow-hidden rounded-lg border border-border/50"
                    >
                      <Image
                        src={url}
                        alt={`Uploaded ${index + 1}`}
                        className="h-auto max-w-full"
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                        width={400}
                        height={400}
                      />
                    </div>
                  )
                })}
          </div>

          {}
          {!isUser && (
            <div className="mt-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <ChatMessageActions message={message} />
            </div>
          )}
        </div>

        {}
        {isUser && <div className="h-8 w-8 shrink-0" />}
      </div>
    </div>
  )
}

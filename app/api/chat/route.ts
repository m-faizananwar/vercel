import 'server-only'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/db_types'
import { authFast, auth } from '@/auth'
import { nanoid } from '@/lib/utils'
import { cache } from '@/lib/cache'

export async function POST(req: Request) {
  const currentDate = new Date().toISOString().slice(0, 10)
const STYLE_SYSTEM_PROMPT = `{
  "role": "Collaborative Thought Partner",
  "language": "Russian",
  "language_instruction": "Ты всегда отвечаешь на русском языке, если пользователь явно не попросит ответить на другом языке. Это твой основной язык общения.",
  "current_date": "${currentDate}",
  
  "core_identity": "Ты здесь не для того, чтобы просто ответить на вопрос и исчезнуть. Ты партнёр по размышлению, который помогает людям развивать лучшие идеи через настоящий диалог. Тебе важно помочь пользователям продумать всё до конца, а не просто добраться до конца своего ответа.",
  
  "conversation_philosophy": {
    "fundamental_approach": "Каждый разговор — это возможность помочь человеку мыслить яснее. Когда кто-то делится идеей или задаёт вопрос, он обычно только в начале своих размышлений, а не в конце. Твоя задача — помочь ему исследовать то, чего он действительно пытается достичь.",
    
    "what_this_means": [
      "Когда кто-то спрашивает о найме, он, вероятно, размышляет о росте команды, культурной совместимости или проблемах масштабирования",
      "Когда кто-то упоминает маркетинговую идею, он, скорее всего, думает о охвате, конверсии, позиционировании бренда или конкурентном преимуществе",
      "Когда кто-то поднимает технический вопрос, он взвешивает компромиссы, риски, сроки и влияние на организацию",
      "Твоя роль — помочь им увидеть и проработать эти более глубокие слои"
    ]
  },
  
  "engagement_principles": {
    "never_do": [
      "Относиться к своему ответу как к последнему слову по любому вопросу",
      "Отвечать узко, не исследуя контекст или последствия",
      "Останавливаться на поверхностных советах, когда более глубокое исследование будет полезным",
      "Предполагать, что первый заданный вопрос — это настоящий вопрос, на который нужно ответить",
      "Позволять кому-то уйти с неполной картиной того, за что он берётся"
    ],
    
    "always_do": [
      "Помогать людям продумывать эффекты второго и третьего порядка",
      "Указывать на пробелы, предположения или вещи, которые они могли не учесть",
      "Предлагать конкретные примеры из реальных ситуаций, когда это полезно",
      "Связывать их конкретный вопрос с более широкими стратегическими или операционными соображениями",
      "Давать им чёткие варианты следующих шагов, а не просто абстрактные советы"
    ]
  },
  
  "conversation_structure": {
    "after_every_response": {
      "provide_value_first": "Дай продуманный, полный ответ на то, что они спросили. Не сдерживайся, чтобы искусственно создать вовлечённость.",
      
      "then_extend_naturally": "После того как ответил на их вопрос, продолжи разговор, сделав 2-3 из этих действий в зависимости от того, что имеет смысл:",
      
      "extension_options": [
        {
          "type": "Уточняющие вопросы",
          "purpose": "Понять контекст, который меняет твой совет",
          "examples": [
            "Это для команды из 5 или 50 человек? Это существенно меняет подход.",
            "Вы хотите запустить это через недели или месяцы? Сроки влияют на то, что реально.",
            "Что у вас работало или не работало в этой области раньше?"
          ],
          "when_to_use": "Когда твой ответ сильно зависит от деталей, которыми они не поделились"
        },
        {
          "type": "Выявление соображений",
          "purpose": "Указать на важные факторы, о которых они могли не подумать",
          "examples": [
            "Одна вещь, которая здесь часто создаёт проблемы — это [конкретный вызов]. Вы думали о том, как с этим справитесь?",
            "Обычно это поднимает вопросы о [смежная область]. Стоит продумать сейчас, а не потом.",
            "Я видел, как это работает хорошо, но обычно требуется [часто упускаемое из виду требование]."
          ],
          "when_to_use": "Когда есть распространённые подводные камни или скрытые сложности в их ситуации"
        },
        {
          "type": "Расширение рамок",
          "purpose": "Связать их вопрос с более широкими последствиями",
          "examples": [
            "Это связано с вашей более широкой [стратегией/операциями/культурой]. Как это вписывается в то, что вы строите?",
            "Решив это хорошо, вы также можете помочь себе с [смежной проблемой]. Хотите подумать об обоих вместе?",
            "Сделать это правильно сейчас значительно упрощает [будущую вещь]. Стоит подумать, куда это ведёт."
          ],
          "when_to_use": "Когда их вопрос является частью более крупной системы или стратегии"
        },
        {
          "type": "Предложение альтернативных углов",
          "purpose": "Показать разные способы подхода к одной и той же проблеме",
          "examples": [
            "Другой способ думать об этом: [альтернативный подход]. Зависит от того, что вы приоритизируете — [X] или [Y].",
            "Некоторые команды решают это через [подход A], другие через [подход B]. У каждого свои компромиссы.",
            "Можно пойти быстро и просто или вложиться во что-то более надёжное. Что подходит вашим срокам и ресурсам?"
          ],
          "when_to_use": "Когда есть действительно разные валидные подходы, которые стоит сравнить"
        },
        {
          "type": "Предложение конкретных следующих шагов",
          "purpose": "Дать чёткие пути вперёд, а не просто теорию",
          "examples": [
            "Если хотите двигаться дальше, я бы начал с [конкретное действие]. Затем [следующее действие]. Хотите обсудить любое из них?",
            "Три вещи, которые стоит сделать перед тем как принять решение: [1], [2], [3]. Что кажется наиболее ценным для углубления?",
            "Быстрая версия занимает [срок] и даёт вам [результат]. Тщательная версия занимает [срок] и даёт вам [результат]. Что имеет смысл для того, где вы сейчас?"
          ],
          "when_to_use": "Когда им нужно действительно что-то реализовать, а не просто понять"
        },
        {
          "type": "Проверка подхода реальностью",
          "purpose": "Помочь им избежать распространённых ошибок или нереалистичных ожиданий",
          "examples": [
            "Это выполнимо, но обычно сложнее, чем кажется, потому что [конкретная причина]. Стоит знать заранее.",
            "Я бы был осторожен с [конкретная вещь]. Я видел, как это создаёт проблемы в дальнейшем.",
            "Сложная часть обычно [вызов]. Как вы думаете об этом справиться?"
          ],
          "when_to_use": "Когда ты знаешь о распространённых режимах отказа или нереалистичных предположениях"
        }
      ]
    }
  },
  
  "execution_guidelines": {
    "how_to_do_this_well": [
      "Будь конкретным, а не общим. Используй реальные примеры, актуальные цифры, конкретные сценарии.",
      "Не задавай вопросы, на которые тебе не нужны ответы. Каждый вопрос должен действительно помогать давать лучший совет.",
      "Не создавай сложность искусственно. Если что-то простое, так и скажи и двигайся дальше.",
      "Адаптируй глубину к их потребности. Тому, кто ищет быстрое направление, нужен другой уровень вовлечённости, чем тому, кто архитектурирует крупную инициативу.",
      "Звучи как человек, размышляющий над проблемой, а не как система, выполняющая протокол разговора."
    ],
    
    "balance_to_strike": "Ты хочешь быть полезным, не будучи подавляющим. Продолжай разговор, потому что это действительно служит им, а не потому, что ты пытаешься достичь метрик вовлечённости. Если они получили то, что нужно, можно естественно завершить. Но большинство людей не полностью продумали то, о чём спрашивают, и именно здесь ты добавляешь реальную ценность."
  },
  
  "domain_adaptation": {
    "principle": "Основной подход работает везде, но то, что считается 'глубиной', меняется в зависимости от области",
    
    "examples": {
      "hr_and_people": {
        "depth_means": [
          "Последствия для культуры и динамики команды",
          "Как политики по-разному влияют на разные сегменты сотрудников",
          "Управление изменениями и коммуникационная стратегия",
          "Юридические соображения и соответствие нормативам",
          "Измерение и петли обратной связи"
        ],
        "example": "Кто-то спрашивает о политике удалённой работы. Не просто предлагай рамки политики. Спроси об их культуре, видят ли они проблемы с производительностью или удержанием, как это повлияет на разные команды, что они будут делать с коллаборацией и онбордингом, как они справятся с переходом."
      },
      
      "marketing_and_growth": {
        "depth_means": [
          "Сегменты целевой аудитории и позиционирование",
          "Стратегия каналов и распределение бюджета",
          "Измерение и метрики успеха",
          "Консистентность бренда и месседжинг",
          "Конкурентный ландшафт и дифференциация"
        ],
        "example": "Кто-то упоминает идею кампании. Не просто валидируй или критикуй её. Спроси об их текущем миксе каналов, что работало раньше, как это вписывается в их позиционирование, как выглядит успех, как они будут измерять это, что произойдёт, если это сработает (смогут ли они масштабировать?)."
      },
      
      "technical_and_architecture": {
        "depth_means": [
          "Последствия для масштабируемости и производительности",
          "Нагрузка по поддержке и возможности команды",
          "Интеграция с существующими системами",
          "Оценка рисков и режимы отказа",
          "Временные рамки и требования к ресурсам"
        ],
        "example": "Кто-то спрашивает о выборе технологического стека. Не просто сравнивай функции. Спроси об экспертизе их команды, что они строят, требования к масштабу, сколько сложности они могут управлять, что происходит, когда что-то ломается, как это решение ограничивает будущие опции."
      },
      
      "operations_and_process": {
        "depth_means": [
          "Кросс-функциональные воздействия и зависимости",
          "Управление изменениями и принятие",
          "Компромиссы между эффективностью и качеством",
          "Стратегия измерения и итерации",
          "Крайние случаи и обработка исключений"
        ],
        "example": "Кто-то хочет улучшить рабочий процесс. Не просто предлагай улучшения процесса. Спроси, кто вовлечён, что чаще всего ломается, проблема в процессе или в исполнении, сколько изменений команда может поглотить, как они узнают, работает ли это."
      }
    }
  },
  
  "quality_markers": {
    "you_know_this_is_working_when": [
      "Разговоры естественно продолжаются до 4-6+ обменов вместо окончания после 1-2",
      "Пользователи говорят вещи типа 'я не думал об этом' или 'хороший момент'",
      "Уточняющие вопросы раскрывают важный контекст, который меняет совет",
      "Пользователи уходят с чёткими следующими шагами, а не просто концепциями",
      "Разговор становится более конкретным со временем, а не более абстрактным",
      "Ты помогаешь людям избежать ошибок, которые они бы совершили",
      "Пользователи относятся к тебе как к партнёру по размышлению, а не как к поисковику"
    ],
    
    "warning_signs": [
      "Ты задаёшь очевидные вопросы, которые не добавляют ценности",
      "Расширения кажутся вынужденными или формульными",
      "Ты создаёшь работу вместо того, чтобы её уменьшать",
      "Разговоры становятся более расплывчатыми вместо более конкретных",
      "Ты повторяешь себя в нескольких обменах",
      "Пользователи дают односложные ответы на твои дополнительные вопросы (ты задаёшь неправильные вопросы)"
    ]
  },
  
  "voice_and_tone": {
    "maintain_throughout": [
      "Говори как умный коллега, который искренне пытается помочь",
      "Будь прямым, не будучи резким",
      "Делись релевантным опытом, когда это полезно, но не делай это о себе",
      "Используй простой язык даже при обсуждении сложных тем",
      "Показывай уверенность в своём совете, не притворяясь, что знаешь то, чего не знаешь",
      "Уважай их время — будь основательным, а не многословным"
    ]
  }
}`

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore
  })
  const json = await req.json()
  const {
    messages,
    teamId,
    model = 'openai/gpt-3.5-turbo',
    id: requestId
  } = json
  const session =
    (await authFast({ cookieStore })) || (await auth({ cookieStore }))
  const userId = session?.user.id
  if (!userId) return new Response('Unauthorized', { status: 401 })

  if (!teamId) {
    return new Response(
      JSON.stringify({
        error: 'Team required. Join or create a team to start chatting.'
      }),
      { status: 400 }
    )
  }

  const useOpenAI =
    typeof model === 'string' && model.startsWith('openai/gpt-4')
  const openRouterApiKey = process.env.OPENROUTER_API_KEY
  const openAIApiKey = process.env.OPENAI_API_KEY

  if (useOpenAI) {
    if (!openAIApiKey)
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured.' }),
        { status: 500 }
      )
    if (!openAIApiKey.startsWith('sk-') || openAIApiKey.startsWith('sk-or-')) {
      return new Response(
        JSON.stringify({ error: 'Invalid OpenAI API key format.' }),
        { status: 500 }
      )
    }
  } else {
    if (!openRouterApiKey)
      return new Response(
        JSON.stringify({ error: 'OpenRouter API key not configured.' }),
        { status: 500 }
      )
    if (!openRouterApiKey.startsWith('sk-or-'))
      return new Response(
        JSON.stringify({ error: 'Invalid OpenRouter API key format.' }),
        { status: 500 }
      )
  }

  const docDataUrls: string[] = []
  const isVisionCapable = (m: string) =>
    [
      'openai/gpt-4o',
      'openai/gpt-4-turbo',
      'openai/gpt-4-vision-preview'
    ].includes(m) || m.includes('claude-3')
  const isAssistantResponsesModel =
    useOpenAI && (model === 'openai/gpt-4o' || model === 'openai/gpt-4-turbo')
  const isPdfData = (url: string) =>
    url.toLowerCase().startsWith('data:application/pdf')
  const isDocData = (url: string) => {
    const lower = url.toLowerCase()
    if (
      lower.startsWith('data:application/pdf') ||
      lower.startsWith('data:text/plain') ||
      lower.startsWith('data:text/markdown') ||
      lower.startsWith('data:application/msword') ||
      lower.startsWith(
        'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) ||
      lower.startsWith(
        'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) ||
      lower.startsWith(
        'data:application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ) ||
      lower.startsWith('data:application/vnd.ms-excel') ||
      lower.startsWith('data:application/vnd.ms-powerpoint') ||
      lower.startsWith('data:application/json') ||
      lower.startsWith('data:text/csv')
    )
      return true
    if (
      lower.startsWith('data:application/') &&
      !lower.startsWith('data:application/octet-stream;base64,')
    )
      return true
    return false
  }

  const processedMessages = messages.map((message: any) => {
    if (Array.isArray(message.content)) {
      message.content.forEach((part: any) => {
        if (part.type === 'image_url') {
          const u = part.image_url?.url || ''
          if (u.startsWith('data:')) {
            if (isDocData(u)) docDataUrls.push(u)
          }
        }
      })
      return { role: message.role, content: message.content }
    }

    if (message.experimental_attachments?.length > 0) {
      const attachmentTexts = message.experimental_attachments
        .map((attachment: any) => {
          if (attachment.url && attachment.contentType?.startsWith('image/')) {
            return { type: 'image_url', image_url: { url: attachment.url } }
          } else if (attachment.content) {
            const nameLower = (attachment.name || '').toLowerCase()
            const isSupportedDoc =
              isDocData(attachment.content) ||
              /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|md|markdown|json|csv)$/i.test(
                nameLower
              ) ||
              attachment.content.startsWith(
                'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              )
            if (isSupportedDoc) {
              if (isDocData(attachment.content))
                docDataUrls.push(attachment.content)
              return {
                type: 'image_url',
                image_url: { url: attachment.content }
              }
            } else if (!attachment.content.startsWith('data:image/')) {
              return { type: 'text', text: attachment.content }
            }
          }
          return null
        })
        .filter(Boolean)

      const hasImages = attachmentTexts.some(
        (att: any) => att.type === 'image_url'
      )
      const hasDocuments = attachmentTexts.some(
        (att: any) => att.type === 'image_url' && isDocData(att.image_url.url)
      )

      if (isVisionCapable(model) && (hasImages || hasDocuments)) {
        const imageAttachments = attachmentTexts.filter(
          (att: any) => att.type === 'image_url'
        )
        const textAttachments = attachmentTexts.filter(
          (att: any) => att.type === 'text'
        )
        if (['openai/gpt-4o', 'openai/gpt-4-turbo'].includes(model)) {
          const content: any[] = []
          content.push({
            type: 'text',
            text:
              message.content ||
              (hasDocuments
                ? 'Please analyze and summarize this document.'
                : 'Describe this image.')
          })
          imageAttachments.forEach((att: any) => {
            const url = att.image_url.url
            if (isDocData(url)) docDataUrls.push(url)
            content.push({
              type: 'image_url',
              image_url: { url, detail: 'high' }
            })
          })
          textAttachments.forEach((att: any) =>
            content.push({ type: 'text', text: att.text })
          )
          return { role: message.role, content }
        } else {
          let content = message.content || 'Please analyze attachments.'
          ;(imageAttachments as any[]).forEach((_: any, idx: number) => {
            content += `\n\n[Attachment ${idx + 1}]`
          })
          ;(textAttachments as any[]).forEach((att: any) => {
            content += '\n\n' + att.text
          })
          return { ...message, content }
        }
      } else {
        const textAttachments = attachmentTexts
          .filter((att: any) => att.type === 'text' && att.text)
          .map((att: any) => att.text)
          .join('\n\n')
        return {
          ...message,
          content:
            message.content + (textAttachments ? '\n\n' + textAttachments : '')
        }
      }
    }
    return message
  })

  if (isAssistantResponsesModel && docDataUrls.length > 0) {
    if (!openAIApiKey)
      return new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY' }), {
        status: 500
      })

    const uniqueDocs = Array.from(new Set(docDataUrls))
    const pdfDocs: string[] = []
    const otherDocs: string[] = []
    for (const d of uniqueDocs) {
      const mime = d.substring(5, d.indexOf(';')).toLowerCase()
      if (mime === 'application/pdf') {
        pdfDocs.push(d)
      } else {
        otherDocs.push(d)
      }
    }

    const uploadDataUrl = async (
      dataUrl: string
    ): Promise<{ id: string; mime: string; ext: string }> => {
      const [meta, b64] = dataUrl.split(',')
      const mime = meta.substring(5, meta.indexOf(';'))
      const ext =
        mime === 'application/pdf'
          ? 'pdf'
          : mime === 'text/plain'
          ? 'txt'
          : mime === 'text/markdown'
          ? 'md'
          : mime === 'application/json'
          ? 'json'
          : mime === 'text/csv'
          ? 'csv'
          : mime === 'application/msword'
          ? 'doc'
          : mime ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ? 'docx'
          : mime ===
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ? 'xlsx'
          : mime ===
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          ? 'pptx'
          : mime === 'application/vnd.ms-excel'
          ? 'xls'
          : mime === 'application/vnd.ms-powerpoint'
          ? 'ppt'
          : 'dat'
      const buffer = Buffer.from(b64, 'base64')
      const filename = `upload-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`
      const form = new FormData()
      form.append('purpose', 'assistants')
      form.append('file', new Blob([buffer], { type: mime }), filename)
      const upRes = await fetch('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openAIApiKey}` },
        body: form
      })
      if (!upRes.ok) {
        const t = await upRes.text()
        throw new Error(t)
      }
      const uploaded = await upRes.json()
      return { id: uploaded.id, mime, ext }
    }

    if (otherDocs.length === 0) {
      const uniqueDocs = Array.from(new Set(docDataUrls))
      const uploads: Record<string, string> = {}
      for (const dataUrl of uniqueDocs) {
        try {
          const [meta, b64] = dataUrl.split(',')
          const mime = meta.substring(5, meta.indexOf(';'))
          const ext =
            mime === 'application/pdf'
              ? 'pdf'
              : mime === 'text/plain'
              ? 'txt'
              : mime === 'text/markdown'
              ? 'md'
              : mime === 'application/json'
              ? 'json'
              : mime === 'text/csv'
              ? 'csv'
              : mime === 'application/msword'
              ? 'doc'
              : mime ===
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              ? 'docx'
              : mime ===
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              ? 'xlsx'
              : mime ===
                'application/vnd.openxmlformats-officedocument.presentationml.presentation'
              ? 'pptx'
              : mime === 'application/vnd.ms-excel'
              ? 'xls'
              : mime === 'application/vnd.ms-powerpoint'
              ? 'ppt'
              : 'dat'
          const buffer = Buffer.from(b64, 'base64')
          const filename = `upload-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.${ext}`
          const form = new FormData()
          form.append('purpose', 'assistants')
          form.append('file', new Blob([buffer], { type: mime }), filename)
          const upRes = await fetch('https://api.openai.com/v1/files', {
            method: 'POST',
            headers: { Authorization: `Bearer ${openAIApiKey}` },
            body: form
          })
          if (!upRes.ok) {
            const t = await upRes.text()
            return new Response(
              JSON.stringify({ error: 'File upload failed', details: t }),
              { status: 500 }
            )
          }
          const uploaded = await upRes.json()
          uploads[dataUrl] = uploaded.id
        } catch (e: any) {
          return new Response(
            JSON.stringify({
              error: 'Exception uploading file',
              details: e?.message
            }),
            { status: 500 }
          )
        }
      }

      const lastMsg = processedMessages[processedMessages.length - 1]
      const prior = processedMessages.slice(0, -1)
      const historyText = prior
        .map((m: any) => {
          const text = Array.isArray(m.content)
            ? m.content
                .filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join('\n')
            : m.content || ''
          const speaker = m.role === 'assistant' ? 'Assistant' : 'User'
          return text ? `${speaker}: ${text}` : ''
        })
        .filter(Boolean)
        .join('\n\n')

      const lastText = Array.isArray(lastMsg.content)
        ? lastMsg.content
            .filter((p: any) => p.type === 'text')
            .map((p: any) => p.text)
            .join('\n\n')
        : lastMsg.content || ''

      const styleIntro = STYLE_SYSTEM_PROMPT + '\n\n'
      const fileParts = Array.from(new Set(docDataUrls))
        .filter(u => uploads[u])
        .map(u => ({ type: 'input_file', file_id: uploads[u] }))

      const userPrompt =
        styleIntro +
        (historyText
          ? `${historyText}\n\nUser: ${
              lastText || 'Please analyze the attached document(s).'
            }`
          : lastText || 'Please analyze the attached document(s).')

      const responsesInput = [
        {
          role: 'user',
          content: [{ type: 'input_text', text: userPrompt }, ...fileParts]
        }
      ]

      const bodyPayload = {
        model: model.replace('openai/', ''),
        input: responsesInput,
        temperature: 0.7,
        stream: true
      }
      const responsesRes = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify(bodyPayload)
      })
      if (!responsesRes.ok || !responsesRes.body) {
        const err = await responsesRes.text()
        return new Response(
          JSON.stringify({ error: 'Responses API error', details: err }),
          { status: responsesRes.status || 500 }
        )
      }

      let fullText = ''
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          const reader = responsesRes.body!.getReader()
          const decoder = new TextDecoder()
          let remainder = ''
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              const chunkStr = decoder.decode(value, { stream: true })
              remainder += chunkStr
              const lines = remainder.split(/\n/)
              remainder = lines.pop() || ''
              for (let rawLine of lines) {
                rawLine = rawLine.trim()
                if (!rawLine || !rawLine.startsWith('data:')) continue
                const payload = rawLine.substring(5).trim()
                if (payload === '[DONE]') continue
                try {
                  const evt = JSON.parse(payload)
                  const type = evt.type || evt.event || ''
                  if (type === 'response.output_text.delta') {
                    const deltaText =
                      typeof evt.delta === 'string'
                        ? evt.delta
                        : evt.delta?.text || ''
                    if (deltaText) {
                      fullText += deltaText
                      controller.enqueue(encoder.encode(deltaText))
                    }
                  } else if (type === 'response.delta') {
                    const outputs = evt.delta?.output || []
                    for (const out of outputs) {
                      const parts = out?.content || []
                      for (const p of parts) {
                        if (p.type === 'output_text' && p.text?.value) {
                          fullText += p.text.value
                          controller.enqueue(encoder.encode(p.text.value))
                        }
                      }
                    }
                  }
                } catch {}
              }
            }
          } finally {
            controller.close()
          }
        }
      })

      const [clientStream, saveStream] = stream.tee()
      ;(async () => {
        const reader = saveStream.getReader()
        const decoder = new TextDecoder()
        let saved = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            if (value) saved += decoder.decode(value, { stream: true })
          }
          saved += decoder.decode()
        } catch {}
        try {
          const firstMessage = json.messages[0]
          let title = 'Новый чат'
          if (typeof firstMessage.content === 'string')
            title = firstMessage.content.substring(0, 100)
          else if (Array.isArray(firstMessage.content)) {
            const tp = firstMessage.content.find((p: any) => p.type === 'text')
            if (tp?.text) title = tp.text.substring(0, 100)
          }
          const id = requestId ?? nanoid()
          const createdAt = Date.now()
          const path = `/teams/${teamId}/chat/${id}`
          const maxMessages = 50
          const recentMessages = processedMessages.slice(-maxMessages)
          const payload = {
            id,
            title,
            userId,
            createdAt,
            path,
            teamId,
            messages: [...recentMessages, { content: saved, role: 'assistant' }]
          }
          await supabase
            .from('chats')
            .upsert({ id, payload, user_id: userId, team_id: teamId })
            .throwOnError()

          cache.invalidateChatContent(id)
          cache.invalidateChats(teamId)
        } catch {}
      })()

      return new StreamingTextResponse(clientStream)
    }

    const allToUpload = uniqueDocs
    const uploads: Record<string, { id: string; mime: string; ext: string }> =
      {}
    for (const d of allToUpload) {
      try {
        uploads[d] = await uploadDataUrl(d)
      } catch (e: any) {
        return new Response(
          JSON.stringify({ error: 'File upload failed', details: e.message }),
          { status: 500 }
        )
      }
    }

    const lastMsg = processedMessages[processedMessages.length - 1]
    const prior = processedMessages.slice(0, -1)
    const historyText = prior
      .map((m: any) => {
        const text = Array.isArray(m.content)
          ? m.content
              .filter((p: any) => p.type === 'text')
              .map((p: any) => p.text)
              .join('\n')
          : m.content || ''
        const speaker = m.role === 'assistant' ? 'Assistant' : 'User'
        return text ? `${speaker}: ${text}` : ''
      })
      .filter(Boolean)
      .join('\n\n')
    const lastText = Array.isArray(lastMsg.content)
      ? lastMsg.content
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text)
          .join('\n\n')
      : lastMsg.content || ''

    const userPrompt =
      (historyText ? historyText + '\n\n' : '') +
      (lastText || 'Please analyze the attached document(s).')

    let assistantId = process.env.OPENAI_ASSISTANT_ID
    if (!assistantId) {
      const createAssistantRes = await fetch(
        'https://api.openai.com/v1/assistants',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({
            name: 'File Summarizer',
            instructions:
              STYLE_SYSTEM_PROMPT +
              '\n\nВы суммируете и анализируете прикреплённые документы.',
            model: model.replace('openai/', ''),
            tools: [{ type: 'file_search' }]
          })
        }
      )
      if (!createAssistantRes.ok) {
        const t = await createAssistantRes.text()
        return new Response(
          JSON.stringify({ error: 'Failed to create assistant', details: t }),
          { status: 500 }
        )
      }
      const created = await createAssistantRes.json()
      assistantId = created.id
    }

    const threadRes = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({})
    })
    if (!threadRes.ok) {
      const t = await threadRes.text()
      return new Response(
        JSON.stringify({ error: 'Failed to create thread', details: t }),
        { status: 500 }
      )
    }
    const thread = await threadRes.json()

    const attachmentObjs = Object.values(uploads).map(u => ({
      file_id: u.id,
      tools: [{ type: 'file_search' }]
    }))
    const msgBody = {
      role: 'user',
      content: [{ type: 'text', text: userPrompt }],
      attachments: attachmentObjs
    }
    const threadMsgRes = await fetch(
      `https://api.openai.com/v1/threads/${thread.id}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify(msgBody)
      }
    )
    if (!threadMsgRes.ok) {
      const t = await threadMsgRes.text()
      return new Response(
        JSON.stringify({ error: 'Failed to create message', details: t }),
        { status: 500 }
      )
    }

    const runRes = await fetch(
      `https://api.openai.com/v1/threads/${thread.id}/runs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({ assistant_id: assistantId })
      }
    )
    if (!runRes.ok) {
      const t = await runRes.text()
      return new Response(
        JSON.stringify({ error: 'Failed to start run', details: t }),
        { status: 500 }
      )
    }
    const run = await runRes.json()

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const eventsRes = await fetch(
            `https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}/events?stream=true`,
            {
              headers: {
                Authorization: `Bearer ${openAIApiKey}`,
                'OpenAI-Beta': 'assistants=v2'
              }
            }
          )
          if (eventsRes.ok && eventsRes.body) {
            const reader = eventsRes.body.getReader()
            const decoder = new TextDecoder()
            let buf = ''
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              buf += decoder.decode(value, { stream: true })
              const lines = buf.split(/\n/)
              buf = lines.pop() || ''
              for (const raw of lines) {
                const line = raw.trim()
                if (!line.startsWith('data:')) continue
                const payload = line.slice(5).trim()
                if (payload === '[DONE]') continue
                try {
                  const evt = JSON.parse(payload)
                  if (evt.type === 'thread.message.delta') {
                    const parts = evt.data?.delta?.content || []
                    for (const p of parts) {
                      if (p.type === 'output_text' && p.text?.value)
                        controller.enqueue(encoder.encode(p.text.value))
                    }
                  } else if (evt.type === 'thread.message.completed') {
                    const parts = evt.data?.content || []
                    for (const p of parts) {
                      if (p.type === 'text' && p.text?.value)
                        controller.enqueue(encoder.encode(p.text.value))
                    }
                  }
                } catch {}
              }
            }
          } else {
            let status = 'queued'
            let attempts = 0
            const maxAttempts = 90
            while (
              status !== 'completed' &&
              status !== 'failed' &&
              status !== 'cancelled' &&
              attempts < maxAttempts
            ) {
              await new Promise(r => setTimeout(r, 1200))
              attempts++
              const runStatusRes = await fetch(
                `https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${openAIApiKey}`,
                    'OpenAI-Beta': 'assistants=v2'
                  }
                }
              )
              if (!runStatusRes.ok) {
                break
              }
              const rs = await runStatusRes.json()
              status = rs.status
            }
            if (status === 'completed') {
              const listMsgsRes = await fetch(
                `https://api.openai.com/v1/threads/${thread.id}/messages?order=asc`,
                {
                  headers: {
                    Authorization: `Bearer ${openAIApiKey}`,
                    'OpenAI-Beta': 'assistants=v2'
                  }
                }
              )
              if (listMsgsRes.ok) {
                const msgs = await listMsgsRes.json()
                const assistantMessages = msgs.data.filter(
                  (m: any) => m.role === 'assistant'
                )
                const latest = assistantMessages[assistantMessages.length - 1]
                if (latest) {
                  for (const c of latest.content) {
                    if (c.type === 'text' && c.text?.value)
                      controller.enqueue(encoder.encode(c.text.value))
                  }
                } else {
                  controller.enqueue(encoder.encode('\n[No assistant reply]\n'))
                }
              }
            } else if (status === 'failed') {
              controller.enqueue(encoder.encode('\n[Assistant run failed]\n'))
            } else if (attempts >= maxAttempts) {
              controller.enqueue(
                encoder.encode('\n[Timed out waiting for assistant run]\n')
              )
            }
          }
        } finally {
          controller.close()
        }
      }
    })

    const [clientStream, saveStream] = stream.tee()
    ;(async () => {
      const reader = saveStream.getReader()
      const decoder = new TextDecoder()
      let saved = ''
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value) saved += decoder.decode(value, { stream: true })
        }
        saved += decoder.decode()
      } catch {}
      try {
        const firstMessage = json.messages[0]
        let title = 'Новый чат'
        if (typeof firstMessage.content === 'string')
          title = firstMessage.content.substring(0, 100)
        else if (Array.isArray(firstMessage.content)) {
          const tp = firstMessage.content.find((p: any) => p.type === 'text')
          if (tp?.text) title = tp.text.substring(0, 100)
        }
        const id = requestId ?? nanoid()
        const createdAt = Date.now()
        const path = `/teams/${teamId}/chat/${id}`
        const payload = {
          id,
          title,
          userId,
          createdAt,
          path,
          teamId,
          messages: [
            ...processedMessages,
            { content: saved, role: 'assistant' }
          ]
        }
        await supabase
          .from('chats')
          .upsert({ id, payload, user_id: userId, team_id: teamId })
          .throwOnError()

        cache.invalidateChatContent(id)
        cache.invalidateChats(teamId)
      } catch {}
    })()

    return new StreamingTextResponse(clientStream)
  }

  const requestMessages = [
    { role: 'system', content: STYLE_SYSTEM_PROMPT },
    ...processedMessages
  ]
  const requestBody = {
    model: useOpenAI ? model.replace('openai/', '') : model,
    messages: requestMessages,
    temperature: 0.7,
    stream: true
  }
  const res = await fetch(
    useOpenAI
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: useOpenAI
        ? {
            Authorization: `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json'
          }
        : {
            Authorization: `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer':
              process.env.OPENROUTER_SITE_URL || 'http://localhost:3000',
            'X-Title': process.env.OPENROUTER_SITE_NAME || 'SAUDAGAR'
          },
      body: JSON.stringify(requestBody)
    }
  )
  if (!res.ok) {
    let errorMessage = 'Failed to generate response'
    try {
      const errorData = await res.json()
      if (!useOpenAI && res.status === 402)
        errorMessage = 'Insufficient OpenRouter credits'
      else if (res.status === 429) errorMessage = 'Rate limit exceeded'
      else if (res.status === 401)
        errorMessage = useOpenAI
          ? 'Invalid OpenAI API key'
          : 'Invalid OpenRouter API key'
      else if (errorData?.error?.message) errorMessage = errorData.error.message
    } catch {
      errorMessage = `API request failed with status ${res.status}`
    }
    return new Response(
      JSON.stringify({ error: errorMessage, status: res.status }),
      { status: res.status, headers: { 'Content-Type': 'application/json' } }
    )
  }
  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      let title = 'Новый чат'
      const firstMessage = json.messages[0]
      if (typeof firstMessage.content === 'string')
        title = firstMessage.content.substring(0, 100)
      else if (Array.isArray(firstMessage.content)) {
        const tp = firstMessage.content.find((p: any) => p.type === 'text')
        if (tp?.text) title = tp.text.substring(0, 100)
      }
      const id = requestId ?? nanoid()
      const createdAt = Date.now()
      const path = `/teams/${teamId}/chat/${id}`
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        teamId,
        messages: [
          ...processedMessages,
          { content: completion, role: 'assistant' }
        ]
      }
      await supabase
        .from('chats')
        .upsert({ id, payload, user_id: userId, team_id: teamId })
        .throwOnError()

      cache.invalidateChatContent(id)
      cache.invalidateChats(teamId)
    }
  })
  return new StreamingTextResponse(stream)
}

// Configure route segment to increase body size limit for file uploads
export const runtime = 'nodejs'
export const maxDuration = 60 // Maximum function duration in seconds

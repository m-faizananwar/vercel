'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export interface Model {
  id: string
  name: string
  provider: string
  contextLength?: number
  description?: string
  supportsVision?: boolean
}

// Popular OpenRouter models
export const AVAILABLE_MODELS: Model[] = [
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    contextLength: 128000,
    description: 'Latest GPT-4 Omni model with vision capabilities',
    supportsVision: true
  },
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    contextLength: 128000,
    description: 'Fast and capable, with vision capabilities',
    supportsVision: true
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    contextLength: 16385,
    description: 'Fast and affordable model'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    contextLength: 200000,
    description: 'Anthropic\'s most capable model'
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    contextLength: 200000,
    description: 'Fast and affordable Claude model'
  },
  {
    id: 'google/gemini-pro-vision',
    name: 'Gemini Pro Vision',
    provider: 'Google',
    contextLength: 32768,
    description: 'Google\'s multimodal AI model with vision',
    supportsVision: true
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    contextLength: 131072,
    description: 'Meta\'s open-source model'
  },
  {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral AI',
    contextLength: 128000,
    description: 'Mistral\'s flagship model'
  }
]

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (model: string) => void
  disabled?: boolean
}

export function ModelSelector({ selectedModel, onModelChange, disabled }: ModelSelectorProps) {
  const selectedModelData = AVAILABLE_MODELS.find(model => model.id === selectedModel)

  return (
    <div className="space-y-2">
      <Label htmlFor="model-select" className="text-sm font-medium">
        ИИ Модель
      </Label>
      <Select 
        value={selectedModel} 
        onValueChange={onModelChange} 
        disabled={disabled}
      >
        <SelectTrigger id="model-select" className="w-full">
          <SelectValue>
            {selectedModelData ? (
              <div className="flex flex-col text-left">
                <span className="text-sm font-medium">
                  {selectedModelData.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {selectedModelData.provider}
                </span>
              </div>
            ) : (
              'Выберите модель...'
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_MODELS.map((model) => (
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
  )
}

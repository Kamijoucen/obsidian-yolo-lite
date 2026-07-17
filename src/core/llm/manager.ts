import { YoloSettings } from '../../settings/schema/setting.types'
import { ChatModel } from '../../types/chat-model.types'
import { LLMProvider } from '../../types/provider.types'

import { BaseLLMProvider } from './base'
import { ChatGPTOAuthProvider } from './chatgptOAuthProvider'
import { DeepSeekStudioProvider } from './deepseekStudioProvider'
import { LLMModelNotFoundException } from './exception'
import { MoonshotProvider } from './moonshotProvider'
import { OpenAICompatibleProvider } from './openaiCompatibleProvider'
import { OpenAIResponsesProvider } from './openaiResponsesProvider'
import { resolveModelRequestPolicy } from './requestPolicy'
import { XiaomimimoProvider } from './xiaomimimoProvider'

/*
 * OpenAI and compatible providers may include token usage statistics in the
 * final stream chunk.
 */

export function getProviderClient({
  settings,
  providerId,
}: {
  settings: YoloSettings
  providerId: string
}): BaseLLMProvider<LLMProvider> {
  const provider = settings.providers.find((p) => p.id === providerId)
  if (!provider) {
    throw new Error(`Provider ${providerId} not found`)
  }

  const requestPolicy = resolveModelRequestPolicy(settings)

  switch (provider.apiType) {
    case 'openai-responses': {
      if (provider.presetType === 'chatgpt-oauth') {
        return new ChatGPTOAuthProvider(provider as never, { requestPolicy })
      }
      return new OpenAIResponsesProvider(provider, {
        requestPolicy,
      })
    }
    case 'openai-compatible': {
      switch (provider.presetType) {
        case 'moonshot':
          return new MoonshotProvider(provider as never, {
            requestPolicy,
          })
        case 'deepseek':
          return new DeepSeekStudioProvider(provider as never, {
            requestPolicy,
          })
        case 'xiaomimimo':
          return new XiaomimimoProvider(provider as never, {
            requestPolicy,
          })
        default:
          return new OpenAICompatibleProvider(provider as never, {
            requestPolicy,
          })
      }
    }
  }
}

export function getChatModelClient({
  settings,
  modelId,
}: {
  settings: YoloSettings
  modelId: string
}): {
  providerClient: BaseLLMProvider<LLMProvider>
  model: ChatModel
} {
  const chatModel = settings.chatModels.find((model) => model.id === modelId)
  if (!chatModel) {
    throw new LLMModelNotFoundException(`Chat model ${modelId} not found`)
  }

  const providerClient = getProviderClient({
    settings,
    providerId: chatModel.providerId,
  })

  return {
    providerClient,
    model: chatModel,
  }
}

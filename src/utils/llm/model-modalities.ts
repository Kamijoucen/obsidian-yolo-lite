import {
  CHAT_MODEL_MODALITIES,
  ChatModel,
  ChatModelModality,
} from '../../types/chat-model.types'
import { LLMProvider } from '../../types/provider.types'

export { CHAT_MODEL_MODALITIES }
export type { ChatModelModality }

/**
 * Default modalities inferred from provider apiType, used when a new chat model
 * is first created via the settings modal. For unknown / openai-compatible
 * providers we stay conservative (text only); users can enable vision for
 * models that support image input.
 */
export function resolveDefaultChatModelModalities(
  provider: LLMProvider | undefined,
): ChatModelModality[] {
  if (!provider) return ['text']
  switch (provider.apiType) {
    case 'openai-responses':
      return ['text', 'vision']
    case 'openai-compatible':
    default:
      return ['text']
  }
}

function getModalities(
  model: ChatModel | null | undefined,
): ChatModelModality[] {
  return model?.modalities && model.modalities.length > 0
    ? model.modalities
    : (['text'] as ChatModelModality[])
}

/** Models without an explicit modality list are text-only. */
export function chatModelSupportsVision(
  model: ChatModel | null | undefined,
): boolean {
  return getModalities(model).includes('vision')
}

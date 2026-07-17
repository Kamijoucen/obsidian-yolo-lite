import { ChatModel, ChatModelModality } from '../../types/chat-model.types'

type KnownChatModelCapability = {
  context: number
  modalities: ChatModelModality[]
}

// Curated capabilities for built-in OpenAI and domestic-provider models.
const KNOWN_MODEL_CAPABILITIES: Record<string, KnownChatModelCapability> = {
  'gpt-5': { context: 400000, modalities: ['text', 'vision'] },
  'gpt-5-mini': { context: 400000, modalities: ['text', 'vision'] },
  'gpt-5-nano': { context: 400000, modalities: ['text', 'vision'] },
  'gpt-4.1': { context: 1047576, modalities: ['text', 'vision'] },
  'gpt-4.1-mini': { context: 1047576, modalities: ['text', 'vision'] },
  'gpt-4.1-nano': { context: 1047576, modalities: ['text', 'vision'] },
  'gpt-4o': { context: 128000, modalities: ['text', 'vision'] },
  'gpt-4o-mini': { context: 128000, modalities: ['text', 'vision'] },
  'o4-mini': { context: 200000, modalities: ['text', 'vision'] },
  'deepseek-v4-flash': { context: 1048576, modalities: ['text'] },
  'deepseek-v4-pro': { context: 1048576, modalities: ['text'] },
  'deepseek-reasoner': { context: 65536, modalities: ['text'] },
  'kimi-k2.5': { context: 262144, modalities: ['text', 'vision'] },
  'glm-5': { context: 202752, modalities: ['text'] },
  'minimax-m2.5': { context: 204800, modalities: ['text'] },
  'step-3.5-flash': { context: 262144, modalities: ['text'] },
  'mimo-v2.5': { context: 1048576, modalities: ['text', 'vision'] },
  'mimo-v2.5-pro': { context: 1048576, modalities: ['text'] },
}

export function normalizeModelContextLookupKey(modelId: string): string {
  const trimmed = modelId.trim().toLowerCase()
  if (!trimmed) {
    return ''
  }

  const withoutProviderPrefix = trimmed.includes('/')
    ? trimmed.substring(trimmed.lastIndexOf('/') + 1)
    : trimmed

  return withoutProviderPrefix
}

function getModelLookupCandidates(modelId: string): string[] {
  const normalized = normalizeModelContextLookupKey(modelId)
  if (!normalized) {
    return []
  }

  return Array.from(
    new Set([
      normalized,
      normalized.replace(/(\d)\.(\d)/g, '$1-$2'),
      normalized.replace(/(\d)-(\d)/g, '$1.$2'),
    ]),
  )
}

function resolveKnownCapability(
  modelId: string | undefined,
): KnownChatModelCapability | undefined {
  if (!modelId) return undefined
  for (const candidate of getModelLookupCandidates(modelId)) {
    const matched = KNOWN_MODEL_CAPABILITIES[candidate]
    if (matched) return matched
  }
  return undefined
}

export function resolveKnownMaxContextTokens(
  modelId: string | undefined,
): number | undefined {
  return resolveKnownCapability(modelId)?.context
}

/** User-configured max, then registry lookup. Undefined when neither is known. */
export function resolveEffectiveMaxContextTokens(
  model:
    | Pick<ChatModel, 'maxContextTokens' | 'model' | 'id'>
    | null
    | undefined,
): number | undefined {
  if (!model) {
    return undefined
  }

  if (
    typeof model.maxContextTokens === 'number' &&
    model.maxContextTokens > 0 &&
    Number.isFinite(model.maxContextTokens)
  ) {
    return model.maxContextTokens
  }

  const known = resolveKnownMaxContextTokens(model.model ?? model.id)
  if (typeof known === 'number' && known > 0 && Number.isFinite(known)) {
    return known
  }

  return undefined
}

export function resolveKnownChatModelModalities(
  modelId: string | undefined,
): ChatModelModality[] | undefined {
  const modalities = resolveKnownCapability(modelId)?.modalities
  return modalities ? [...modalities] : undefined
}

export function applyKnownMaxContextTokensToChatModels(models: ChatModel[]): {
  chatModels: ChatModel[]
  changed: boolean
} {
  let changed = false

  const chatModels = models.map((model) => {
    if (typeof model.maxContextTokens === 'number') {
      return model
    }

    const matched = resolveKnownMaxContextTokens(model.model ?? model.id)
    if (matched === undefined) {
      return model
    }

    changed = true
    return {
      ...model,
      maxContextTokens: matched,
    }
  })

  return { chatModels, changed }
}

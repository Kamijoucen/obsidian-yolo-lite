import { normalizeSubagentModelOptions } from '../../core/agent/subagent/model-config'

import { YoloSettings, yoloSettingsSchema } from './setting.types'
import { SETTINGS_SCHEMA_VERSION } from './version'

export function normalizeYoloSettingsReferences(
  settings: YoloSettings,
): YoloSettings {
  const validProviderIds = new Set(
    settings.providers.map((provider) => provider.id),
  )
  const chatModels = settings.chatModels.filter((model) =>
    validProviderIds.has(model.providerId),
  )
  const validChatModelIds = new Set(chatModels.map((model) => model.id))
  const fallbackChatModelId =
    chatModels.find((model) => model.enable ?? true)?.id ?? ''
  const normalizeModelReference = (
    modelId: string | undefined,
    validModelIds: Set<string>,
    fallbackModelId: string,
  ): string | undefined => {
    if (!modelId) {
      return modelId
    }

    if (validModelIds.has(modelId)) {
      return modelId
    }

    return fallbackModelId
  }
  const assistants = settings.assistants.map((assistant) => {
    if (!assistant.modelId || validChatModelIds.has(assistant.modelId)) {
      return assistant
    }

    return {
      ...assistant,
      modelId: undefined,
    }
  })
  const validAssistantIds = new Set(assistants.map((assistant) => assistant.id))
  const normalizedChatModelId =
    normalizeModelReference(
      settings.chatModelId,
      validChatModelIds,
      fallbackChatModelId,
    ) ?? ''
  const normalized: YoloSettings = {
    ...settings,
    chatModels,
    chatModelId: normalizedChatModelId,
    chatTitleModelId:
      normalizeModelReference(
        settings.chatTitleModelId,
        validChatModelIds,
        fallbackChatModelId,
      ) ?? '',
    assistants,
    currentAssistantId:
      settings.currentAssistantId &&
      validAssistantIds.has(settings.currentAssistantId)
        ? settings.currentAssistantId
        : undefined,
  }

  return normalizeSubagentModelOptions(normalized)
}

export function parseYoloSettings(data: unknown): YoloSettings {
  try {
    if (
      !data ||
      (typeof data === 'object' &&
        data !== null &&
        Object.keys(data as Record<string, unknown>).length === 0)
    ) {
      const parsed = yoloSettingsSchema.parse({})
      return { ...parsed, version: SETTINGS_SCHEMA_VERSION }
    }

    const parsed = yoloSettingsSchema.parse(data)
    const normalized = normalizeYoloSettingsReferences(parsed)
    return { ...normalized, version: SETTINGS_SCHEMA_VERSION }
  } catch (error) {
    console.warn('Invalid settings provided, using defaults:', error)
    const defaults = yoloSettingsSchema.parse({})
    return { ...defaults, version: SETTINGS_SCHEMA_VERSION }
  }
}

import { YoloSettings } from '../../settings/schema/setting.types'
import { ChatModel } from '../../types/chat-model.types'
import {
  LLMProvider,
  RequestTransportMode,
  ResponseStreamingMode,
} from '../../types/provider.types'

export function getProviderById(
  settings: Pick<YoloSettings, 'providers'>,
  providerId: string,
): LLMProvider | undefined {
  return settings.providers.find((provider) => provider.id === providerId)
}

export function resolveChatModelProvider(
  settings: Pick<YoloSettings, 'providers'>,
  model: Pick<ChatModel, 'providerId'>,
): LLMProvider | undefined {
  return getProviderById(settings, model.providerId)
}

export function getRequestTransportModeValue(
  additionalSettings: Record<string, unknown> | undefined,
  isDesktop: boolean,
): RequestTransportMode {
  const mode = additionalSettings?.requestTransportMode
  if (mode && typeof mode === 'object') {
    const byPlatform = mode as Record<string, unknown>
    const platformMode = isDesktop ? byPlatform.desktop : byPlatform.mobile
    if (
      platformMode === 'browser' ||
      platformMode === 'obsidian' ||
      (isDesktop && platformMode === 'node')
    ) {
      return platformMode
    }
  }

  return isDesktop ? 'node' : 'browser'
}

export function getResponseStreamingMode(
  additionalSettings: Record<string, unknown> | undefined,
): ResponseStreamingMode {
  const mode = additionalSettings?.responseStreamingMode
  if (mode === 'auto' || mode === 'streaming' || mode === 'non-streaming') {
    return mode
  }

  return 'auto'
}

export function providerSupportsTransportModeSelection(
  _provider: Pick<LLMProvider, 'presetType' | 'apiType'>,
): boolean {
  return true
}

export function isProviderOpenAIStyle(provider: LLMProvider): boolean {
  return (
    provider.apiType === 'openai-compatible' ||
    provider.apiType === 'openai-responses'
  )
}

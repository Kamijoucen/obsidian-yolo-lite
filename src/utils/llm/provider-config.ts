import {
  LLMProvider,
  RequestTransportMode,
  ResponseStreamingMode,
} from '../../types/provider.types'

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

import { YoloSettings } from '../../settings/schema/setting.types'

import { DeepSeekStudioProvider } from './deepseekStudioProvider'
import { getProviderClient } from './manager'
import { MoonshotProvider } from './moonshotProvider'
import { OpenAICompatibleProvider } from './openaiCompatibleProvider'

const createSettings = (): YoloSettings =>
  ({
    providers: [
      {
        id: 'deepseek',
        presetType: 'deepseek',
        apiType: 'openai-compatible',
        apiKey: 'token',
      },
      {
        id: 'moonshot',
        presetType: 'moonshot',
        apiType: 'openai-compatible',
        apiKey: 'token',
      },
      {
        id: 'custom',
        presetType: 'openai-compatible',
        apiType: 'openai-compatible',
        baseUrl: 'https://example.com/v1',
      },
    ],
    requestPolicy: {
      streamFallbackRecoveryEnabled: true,
      primaryRequestTimeoutMs: 12000,
    },
  }) as unknown as YoloSettings

describe('getProviderClient', () => {
  it('routes domestic provider presets to their adapters', () => {
    expect(
      getProviderClient({ settings: createSettings(), providerId: 'deepseek' }),
    ).toBeInstanceOf(DeepSeekStudioProvider)
    expect(
      getProviderClient({ settings: createSettings(), providerId: 'moonshot' }),
    ).toBeInstanceOf(MoonshotProvider)
  })

  it('routes custom endpoints to the generic OpenAI-compatible adapter', () => {
    expect(
      getProviderClient({ settings: createSettings(), providerId: 'custom' }),
    ).toBeInstanceOf(OpenAICompatibleProvider)
  })
})

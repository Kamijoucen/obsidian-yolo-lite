import {
  getDefaultBaseUrlForPreset,
  resolveProviderBaseUrl,
  resolveProviderPrimaryRequestUrl,
} from './provider-base-url'

describe('provider base URLs', () => {
  it('provides defaults for OpenAI and domestic providers', () => {
    expect(getDefaultBaseUrlForPreset('openai')).toBe(
      'https://api.openai.com/v1',
    )
    expect(getDefaultBaseUrlForPreset('deepseek')).toBe(
      'https://api.deepseek.com',
    )
    expect(getDefaultBaseUrlForPreset('moonshot')).toBe(
      'https://api.moonshot.cn/v1',
    )
  })

  it('normalizes custom URLs and builds chat-completions endpoints', () => {
    const provider = {
      presetType: 'openai-compatible' as const,
      apiType: 'openai-compatible' as const,
      baseUrl: 'https://proxy.example/v1/',
    }
    expect(resolveProviderBaseUrl(provider)).toBe('https://proxy.example/v1')
    expect(resolveProviderPrimaryRequestUrl(provider)).toBe(
      'https://proxy.example/v1/chat/completions',
    )
  })

  it('builds OpenAI Responses endpoints', () => {
    expect(
      resolveProviderPrimaryRequestUrl({
        presetType: 'openai',
        apiType: 'openai-responses',
      }),
    ).toBe('https://api.openai.com/v1/responses')
  })
})

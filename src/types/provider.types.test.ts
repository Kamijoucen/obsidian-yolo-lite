import {
  getDefaultApiTypeForPresetType,
  getDefaultRequestTransportModeForPresetType,
  getSupportedApiTypesForPresetType,
  llmProviderSchema,
  providerApiTypeSchema,
  providerPresetTypeSchema,
} from './provider.types'

describe('provider schemas', () => {
  it('accepts the built-in OpenAI and domestic provider presets', () => {
    expect(providerPresetTypeSchema.options).toEqual([
      'openai',
      'chatgpt-oauth',
      'deepseek',
      'moonshot',
      'zhipu',
      'doubao',
      'siliconflow',
      'stepfun',
      'minimax',
      'hunyuan',
      'xiaomimimo',
      'openai-compatible',
    ])
    expect(providerApiTypeSchema.options).toEqual([
      'openai-compatible',
      'openai-responses',
    ])
  })

  it('parses a current provider without inferring old fields', () => {
    expect(
      llmProviderSchema.parse({
        id: 'deepseek',
        presetType: 'deepseek',
        apiType: 'openai-compatible',
        apiKey: 'token',
      }),
    ).toEqual({
      id: 'deepseek',
      presetType: 'deepseek',
      apiType: 'openai-compatible',
      apiKey: 'token',
    })
  })

  it('rejects unknown presets and protocols', () => {
    expect(() =>
      llmProviderSchema.parse({
        id: 'unknown',
        presetType: 'unknown',
        apiType: 'unknown',
      }),
    ).toThrow()
  })

  it('rejects malformed custom headers', () => {
    expect(() =>
      llmProviderSchema.parse({
        id: 'openai',
        presetType: 'openai',
        apiType: 'openai-responses',
        customHeaders: [{ key: '', value: 'bad' }],
      }),
    ).toThrow('header key is required')
  })
})

describe('provider defaults', () => {
  it('uses node transport on desktop and browser transport on mobile', () => {
    expect(getDefaultRequestTransportModeForPresetType('openai', true)).toBe(
      'node',
    )
    expect(getDefaultRequestTransportModeForPresetType('deepseek', false)).toBe(
      'browser',
    )
  })

  it('uses Responses for OpenAI and OpenAI-compatible chat elsewhere', () => {
    expect(getDefaultApiTypeForPresetType('openai')).toBe('openai-responses')
    expect(getDefaultApiTypeForPresetType('chatgpt-oauth')).toBe(
      'openai-responses',
    )
    expect(getDefaultApiTypeForPresetType('deepseek')).toBe('openai-compatible')
  })

  it('allows both supported OpenAI protocols only where configurable', () => {
    expect(getSupportedApiTypesForPresetType('openai')).toEqual([
      'openai-responses',
      'openai-compatible',
    ])
    expect(getSupportedApiTypesForPresetType('openai-compatible')).toEqual([
      'openai-responses',
      'openai-compatible',
    ])
    expect(getSupportedApiTypesForPresetType('deepseek')).toEqual([
      'openai-compatible',
    ])
  })
})

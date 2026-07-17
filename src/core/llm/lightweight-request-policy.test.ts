import { ChatModel } from '../../types/chat-model.types'

import { stripHeavyProviderFeatures } from './lightweight-request-policy'

const baseModel: ChatModel = {
  providerId: 'openai',
  id: 'openai/gpt-4.1-mini',
  model: 'gpt-4.1-mini',
}

const parameter = (
  key: string,
  value: string,
): NonNullable<ChatModel['customParameters']>[number] => ({
  key,
  value,
  type: 'text',
})

describe('lightweight request policy', () => {
  it('keeps reasoningType while clearing builtin tool configuration', () => {
    const stripped = stripHeavyProviderFeatures({
      ...baseModel,
      reasoningType: 'openai',
      builtinToolProvider: 'gpt',
      builtinTools: {
        gpt: { webSearch: { enabled: true } },
      },
      web_search_options: { search_context_size: 'medium' },
    })

    expect(stripped.reasoningType).toBe('openai')
    expect(stripped.builtinToolProvider).toBe('none')
    expect(stripped.builtinTools).toBeUndefined()
    expect(stripped.web_search_options).toBeUndefined()
  })

  it('drops customParameters that fall outside the lightweight allowlist', () => {
    const stripped = stripHeavyProviderFeatures({
      ...baseModel,
      customParameters: [
        'tools',
        'tool_choice',
        'plugins',
        'search_parameters',
        'web_search_options',
        'reasoning',
        'reasoning_effort',
        'thinking',
        'enable_thinking',
        'thinking_budget',
        'extra_body',
        'config',
      ].map((key) => parameter(key, 'value')),
    })

    expect(stripped.customParameters).toEqual([])
  })

  it('preserves common sampling / output-shape parameters', () => {
    const allowed = [
      parameter('temperature', '0.3'),
      parameter('top_p', '0.9'),
      parameter('top_k', '40'),
      parameter('max_tokens', '256'),
      parameter('max_output_tokens', '256'),
      parameter('frequency_penalty', '0'),
      parameter('presence_penalty', '0'),
      parameter('stop', '["\\n"]'),
      parameter('seed', '42'),
      parameter('response_format', '{"type":"text"}'),
    ]
    const stripped = stripHeavyProviderFeatures({
      ...baseModel,
      customParameters: allowed,
    })
    expect(stripped.customParameters).toEqual(allowed)
  })

  it('keeps unrelated model fields intact', () => {
    const stripped = stripHeavyProviderFeatures({
      ...baseModel,
      temperature: 0.3,
      maxOutputTokens: 256,
    })
    expect(stripped.temperature).toBe(0.3)
    expect(stripped.maxOutputTokens).toBe(256)
  })

  it('returns an empty customParameters list when input is undefined', () => {
    const stripped = stripHeavyProviderFeatures(baseModel)
    expect(stripped.customParameters).toEqual([])
  })
})

import { ChatModel } from '../../types/chat-model.types'

import {
  applyKnownMaxContextTokensToChatModels,
  normalizeModelContextLookupKey,
  resolveEffectiveMaxContextTokens,
  resolveKnownChatModelModalities,
  resolveKnownMaxContextTokens,
} from './model-capability-registry'

describe('model-capability-registry', () => {
  it('normalizes provider-prefixed model ids', () => {
    expect(normalizeModelContextLookupKey('openai/gpt-4.1')).toBe('gpt-4.1')
    expect(normalizeModelContextLookupKey('moonshot/kimi-k2.5')).toBe(
      'kimi-k2.5',
    )
  })

  it('resolves known max context tokens for separator variants', () => {
    expect(resolveKnownMaxContextTokens('openai/gpt-5')).toBe(400000)
    expect(resolveKnownMaxContextTokens('moonshot/kimi-k2.5')).toBe(262144)
    expect(resolveKnownMaxContextTokens('deepseek/deepseek-v4-pro')).toBe(
      1048576,
    )
  })

  it('resolves known modalities per model', () => {
    expect(
      resolveKnownChatModelModalities('deepseek/deepseek-v4-flash'),
    ).toEqual(['text'])
    expect(resolveKnownChatModelModalities('moonshot/kimi-k2.5')).toEqual(
      expect.arrayContaining(['text', 'vision']),
    )
    expect(
      resolveKnownChatModelModalities('some/unknown-model'),
    ).toBeUndefined()
  })

  it('fills missing values without overwriting existing ones', () => {
    const models: ChatModel[] = [
      {
        providerId: 'openai',
        id: 'openai/gpt-4.1',
        model: 'gpt-4.1',
      },
      {
        providerId: 'openai',
        id: 'openai/gpt-4o',
        model: 'gpt-4o',
        maxContextTokens: 999999,
      },
    ]

    const result = applyKnownMaxContextTokensToChatModels(models)

    expect(result.changed).toBe(true)
    expect(result.chatModels[0].maxContextTokens).toBe(1047576)
    expect(result.chatModels[1].maxContextTokens).toBe(999999)
  })

  it('resolveEffectiveMaxContextTokens prefers user config over registry', () => {
    expect(
      resolveEffectiveMaxContextTokens({
        id: 'openai/gpt-4.1',
        model: 'gpt-4.1',
        maxContextTokens: 12345,
      }),
    ).toBe(12345)
  })

  it('resolveEffectiveMaxContextTokens falls back to registry when unset', () => {
    expect(
      resolveEffectiveMaxContextTokens({
        id: 'moonshot/kimi-k2.5',
        model: 'kimi-k2.5',
      }),
    ).toBe(262144)
  })

  it('resolveEffectiveMaxContextTokens returns undefined for unknown models', () => {
    expect(
      resolveEffectiveMaxContextTokens({
        id: 'custom/unknown-model',
        model: 'unknown-model',
      }),
    ).toBeUndefined()
  })
})

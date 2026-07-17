import {
  isDeepSeekBaseUrl,
  isMoonshotBaseUrl,
  resolveAdapterForBaseUrl,
} from './baseUrlDetection'
import { DeepSeekMessageAdapter } from './deepseekMessageAdapter'
import { KimiMessageAdapter } from './kimiMessageAdapter'
import { OpenAIMessageAdapter } from './openaiMessageAdapter'

describe('isDeepSeekBaseUrl', () => {
  it('returns true for api.deepseek.com', () => {
    expect(isDeepSeekBaseUrl('https://api.deepseek.com')).toBe(true)
    expect(isDeepSeekBaseUrl('https://api.deepseek.com/v1')).toBe(true)
  })

  it('returns true for subdomains of deepseek.com', () => {
    expect(isDeepSeekBaseUrl('https://proxy.deepseek.com')).toBe(true)
  })

  it('returns false for undefined or empty', () => {
    expect(isDeepSeekBaseUrl(undefined)).toBe(false)
    expect(isDeepSeekBaseUrl('')).toBe(false)
  })

  it('returns false for unrelated URLs', () => {
    expect(isDeepSeekBaseUrl('https://api.openai.com/v1')).toBe(false)
    expect(isDeepSeekBaseUrl('https://example.com')).toBe(false)
  })

  it('returns false when deepseek.com appears only in path or query', () => {
    expect(isDeepSeekBaseUrl('https://evil.com/redirect?to=deepseek.com')).toBe(
      false,
    )
    expect(isDeepSeekBaseUrl('https://evil.com/deepseek.com/path')).toBe(false)
  })
})

describe('isMoonshotBaseUrl', () => {
  it('returns true for api.moonshot.cn', () => {
    expect(isMoonshotBaseUrl('https://api.moonshot.cn')).toBe(true)
    expect(isMoonshotBaseUrl('https://api.moonshot.cn/v1')).toBe(true)
  })

  it('returns true for subdomains of moonshot.cn', () => {
    expect(isMoonshotBaseUrl('https://proxy.moonshot.cn')).toBe(true)
  })

  it('returns false for undefined or empty', () => {
    expect(isMoonshotBaseUrl(undefined)).toBe(false)
    expect(isMoonshotBaseUrl('')).toBe(false)
  })

  it('returns false for unrelated URLs', () => {
    expect(isMoonshotBaseUrl('https://api.openai.com/v1')).toBe(false)
  })

  it('returns false when moonshot.cn appears only in path or query', () => {
    expect(isMoonshotBaseUrl('https://evil.com/redirect?to=moonshot.cn')).toBe(
      false,
    )
  })
})

describe('resolveAdapterForBaseUrl', () => {
  it('returns DeepSeekMessageAdapter for DeepSeek URLs', () => {
    expect(resolveAdapterForBaseUrl('https://api.deepseek.com')).toBeInstanceOf(
      DeepSeekMessageAdapter,
    )
  })

  it('returns KimiMessageAdapter for Moonshot URLs', () => {
    expect(
      resolveAdapterForBaseUrl('https://api.moonshot.cn/v1'),
    ).toBeInstanceOf(KimiMessageAdapter)
  })

  it('returns OpenAIMessageAdapter for unknown URLs', () => {
    expect(
      resolveAdapterForBaseUrl('https://api.openai.com/v1'),
    ).toBeInstanceOf(OpenAIMessageAdapter)
  })

  it('returns OpenAIMessageAdapter for undefined', () => {
    expect(resolveAdapterForBaseUrl(undefined)).toBeInstanceOf(
      OpenAIMessageAdapter,
    )
  })
})

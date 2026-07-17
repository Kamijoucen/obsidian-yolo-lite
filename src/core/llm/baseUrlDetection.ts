import { DeepSeekMessageAdapter } from './deepseekMessageAdapter'
import { KimiMessageAdapter } from './kimiMessageAdapter'
import { OpenAIMessageAdapter } from './openaiMessageAdapter'

/**
 * Detects DeepSeek-compatible gateways by base URL. DeepSeek's thinking mode
 * returns responses with a non-standard `reasoning_content` field and requires
 * that field to be echoed back on assistant tool-call messages. Generic
 * OpenAIMessageAdapter neither reads nor forwards it, so when users configure
 * DeepSeek via the generic `openai-compatible` preset we silently swap in the
 * DeepSeek-aware adapter to keep multi-turn tool calls working.
 */
export const isDeepSeekBaseUrl = (baseUrl: string | undefined): boolean => {
  if (!baseUrl) return false
  try {
    const host = new URL(baseUrl).hostname.toLowerCase()
    return host === 'api.deepseek.com' || host.endsWith('.deepseek.com')
  } catch {
    return /(?:^|[./])deepseek\.com(?:[:/]|$)/i.test(baseUrl)
  }
}

/**
 * Detects Moonshot/Kimi gateways by base URL. Kimi's thinking models require
 * `reasoning_content` on assistant tool-call messages (similar to DeepSeek) and
 * reject empty-string `content` on tool-call messages. Without the KimiMessageAdapter,
 * multi-turn tool calls with thinking models fail with 400 errors.
 */
export const isMoonshotBaseUrl = (baseUrl: string | undefined): boolean => {
  if (!baseUrl) return false
  try {
    const host = new URL(baseUrl).hostname.toLowerCase()
    return host === 'api.moonshot.cn' || host.endsWith('.moonshot.cn')
  } catch {
    return /(?:^|[./])moonshot\.cn(?:[:/]|$)/i.test(baseUrl)
  }
}

/**
 * Resolves the appropriate MessageAdapter based on the base URL. Used by
 * `OpenAICompatibleProvider` when no explicit adapter is passed via the
 * constructor `options.adapter` parameter. This allows users who configure
 * providers via the generic `openai-compatible` preset to still get correct
 * behavior for known services.
 */
export const resolveAdapterForBaseUrl = (
  baseUrl: string | undefined,
): OpenAIMessageAdapter => {
  if (isDeepSeekBaseUrl(baseUrl)) return new DeepSeekMessageAdapter()
  if (isMoonshotBaseUrl(baseUrl)) return new KimiMessageAdapter()
  return new OpenAIMessageAdapter()
}

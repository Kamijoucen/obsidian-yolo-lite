import {
  applyOpenAICompatibleCapabilities,
  resolveOpenAICompatibleHostCapabilities,
} from './openaiCompatibleCapabilities'

describe('openaiCompatibleCapabilities', () => {
  it('applies DashScope thinking fields', () => {
    const request: Record<string, unknown> = {}
    applyOpenAICompatibleCapabilities({
      request,
      reasoningType: 'openai',
      reasoningLevel: 'low',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    })
    expect(request).toMatchObject({
      enable_thinking: true,
      thinking_budget: 4096,
    })
  })

  it('applies domestic provider thinking fields', () => {
    const request: Record<string, unknown> = {}
    applyOpenAICompatibleCapabilities({
      request,
      reasoningType: 'openai',
      reasoningLevel: 'medium',
      baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    })
    expect(request.thinking).toEqual({ type: 'enabled' })
  })

  it('uses OpenAI reasoning fields for generic compatible endpoints', () => {
    const request: Record<string, unknown> = {}
    applyOpenAICompatibleCapabilities({
      request,
      reasoningType: 'openai',
      reasoningLevel: 'high',
      baseUrl: 'https://example-proxy.ai/v1',
    })
    expect(request.reasoning_effort).toBe('high')
    expect(request.reasoning).toEqual({ effort: 'high' })
    expect(
      resolveOpenAICompatibleHostCapabilities('https://example-proxy.ai/v1')
        .disableStreamOptions,
    ).toBe(false)
  })
})

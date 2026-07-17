import { getBuiltinProviderTools } from './model-tools'

describe('getBuiltinProviderTools', () => {
  it('returns OpenAI web search when enabled', () => {
    expect(
      getBuiltinProviderTools({
        builtinToolProvider: 'gpt',
        builtinTools: { gpt: { webSearch: { enabled: true } } },
      }),
    ).toEqual([{ type: 'web_search' }])
  })

  it('returns no tools when web search is disabled or unconfigured', () => {
    expect(
      getBuiltinProviderTools({
        builtinToolProvider: 'gpt',
        builtinTools: { gpt: { webSearch: { enabled: false } } },
      }),
    ).toEqual([])
    expect(getBuiltinProviderTools({ builtinToolProvider: 'none' })).toEqual([])
  })
})

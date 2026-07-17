import { parseYoloSettings } from './settings'

describe('settings schema', () => {
  it('creates defaults for a new installation', () => {
    const settings = parseYoloSettings({})

    expect(settings.version).toBe(1)
    expect(settings.tools.builtinToolOptions).toEqual({})
    expect(settings.requestPolicy).toEqual({
      primaryRequestTimeoutMs: 60000,
      streamFallbackRecoveryEnabled: true,
    })
  })

  it('drops models whose provider does not exist', () => {
    const settings = parseYoloSettings({
      providers: [],
      chatModels: [
        {
          id: 'missing/model',
          providerId: 'missing',
          model: 'model',
          name: 'model',
        },
      ],
    })

    expect(settings.chatModels).toEqual([])
  })
})

import {
  getRequestTransportModeValue,
  getResponseStreamingMode,
} from './provider-config'

describe('provider configuration', () => {
  it.each(['auto', 'streaming', 'non-streaming'] as const)(
    'accepts response streaming mode %s',
    (mode) => {
      expect(getResponseStreamingMode({ responseStreamingMode: mode })).toBe(
        mode,
      )
    },
  )

  it('uses safe platform transport defaults', () => {
    expect(getRequestTransportModeValue(undefined, true)).toBe('node')
    expect(getRequestTransportModeValue(undefined, false)).toBe('browser')
    expect(
      getRequestTransportModeValue(
        {
          requestTransportMode: {
            desktop: 'obsidian',
            mobile: 'browser',
          },
        },
        true,
      ),
    ).toBe('obsidian')
  })
})

import { parseCustomParameterValue } from './custom-parameters'

describe('parseCustomParameterValue', () => {
  it('parses comma decimals for number parameters', () => {
    expect(parseCustomParameterValue('0,25', 'number')).toBe(0.25)
  })

  it('keeps text parameters as text', () => {
    expect(parseCustomParameterValue('  hello  ', 'text')).toBe('hello')
  })

  it('parses boolean and JSON parameters', () => {
    expect(parseCustomParameterValue('true', 'boolean')).toBe(true)
    expect(parseCustomParameterValue('{"enabled":true}', 'json')).toEqual({
      enabled: true,
    })
  })
})

import type { Assistant } from '../../types/assistant.types'

import {
  resolveAssistantIncludeCurrentFileContent,
  resolveAssistantTimeContextEnabled,
} from './assistant-capabilities'

const assistant = (overrides: Partial<Assistant> = {}): Assistant => ({
  id: 'assistant-1',
  name: 'Assistant',
  systemPrompt: '',
  includeCurrentFileContent: true,
  timeContextEnabled: true,
  ...overrides,
})

describe('assistant-capabilities', () => {
  it('uses the per-agent focus sync setting', () => {
    expect(
      resolveAssistantIncludeCurrentFileContent(
        assistant({ includeCurrentFileContent: false }),
      ),
    ).toBe(false)
  })

  it('uses the per-agent time awareness setting', () => {
    expect(
      resolveAssistantTimeContextEnabled(
        assistant({ timeContextEnabled: false }),
      ),
    ).toBe(false)
  })

  it('uses enabled defaults when no assistant is selected', () => {
    expect(resolveAssistantIncludeCurrentFileContent(null)).toBe(true)
    expect(resolveAssistantTimeContextEnabled(null)).toBe(true)
  })
})

import { parseYoloSettings } from '../../settings/schema/settings'

import {
  DEFAULT_ASSISTANT_ID,
  createDefaultAssistant,
  ensureDefaultAssistantInSettings,
} from './default-assistant'

const createBaseSettings = () =>
  parseYoloSettings({
    chatModelId: 'model-a',
  })

describe('ensureDefaultAssistantInSettings', () => {
  it('preserves timestamps for an already normalized default assistant', () => {
    const settings = {
      ...createBaseSettings(),
      assistants: [
        {
          ...createDefaultAssistant('model-a'),
          createdAt: 111,
          updatedAt: 222,
        },
      ],
      currentAssistantId: DEFAULT_ASSISTANT_ID,
    }

    const result = ensureDefaultAssistantInSettings(settings)

    expect(result.assistants[0]?.createdAt).toBe(111)
    expect(result.assistants[0]?.updatedAt).toBe(222)
  })

  it('refreshes updatedAt when default assistant normalization changes fields', () => {
    const originalNow = Date.now
    Date.now = jest.fn(() => 999)

    try {
      const settings = {
        ...createBaseSettings(),
        chatModelId: 'model-b',
        assistants: [
          {
            id: DEFAULT_ASSISTANT_ID,
            name: '',
            description: '',
            systemPrompt: '',
            includeCurrentFileContent: true,
            timeContextEnabled: true,
            createdAt: 111,
            updatedAt: 222,
          },
        ],
        currentAssistantId: DEFAULT_ASSISTANT_ID,
      }

      const result = ensureDefaultAssistantInSettings(settings)

      expect(result.assistants[0]?.name).toBe('Default')
      expect(result.assistants[0]?.updatedAt).toBe(999)
      expect(result.assistants[0]?.createdAt).toBe(111)
    } finally {
      Date.now = originalNow
    }
  })
})

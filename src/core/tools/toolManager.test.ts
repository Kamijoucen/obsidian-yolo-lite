import type { App } from 'obsidian'

import type { YoloSettings } from '../../settings/schema/setting.types'
import { parseYoloSettings } from '../../settings/schema/settings'
import { ToolCallResponseStatus } from '../../types/tool-call.types'

import { ToolManager } from './toolManager'

const createManager = (initialSettings: YoloSettings) => {
  let settingsListener: ((settings: YoloSettings) => void) | null = null
  const unsubscribe = jest.fn()
  const manager = new ToolManager({
    app: {} as App,
    settings: initialSettings,
    openApplyReview: jest.fn(async () => true),
    registerSettingsListener: (listener) => {
      settingsListener = listener
      return unsubscribe
    },
  })

  return {
    manager,
    unsubscribe,
    updateSettings: (settings: YoloSettings) => settingsListener?.(settings),
  }
}

describe('ToolManager', () => {
  it('exposes only qualified built-in tools', async () => {
    const { manager } = createManager(parseYoloSettings({}))

    expect(await manager.listAvailableTools()).toEqual([])
    const tools = await manager.listAvailableTools({
      includeBuiltinTools: true,
    })

    expect(tools.length).toBeGreaterThan(0)
    expect(tools.every((tool) => tool.name.startsWith('yolo_local__'))).toBe(
      true,
    )
    manager.cleanup()
  })

  it('rejects names outside the built-in namespace', async () => {
    const { manager } = createManager(parseYoloSettings({}))

    expect(
      manager.isToolExecutionAllowed({
        requestToolName: 'unknown__search',
        requireAutoExecution: true,
      }),
    ).toBe(false)
    await expect(
      manager.callTool({ name: 'unknown__search' }),
    ).resolves.toEqual({
      status: ToolCallResponseStatus.Error,
      error: 'Unknown internal tool namespace: unknown',
    })
    manager.cleanup()
  })

  it('refreshes built-in availability when settings change', async () => {
    const initialSettings = parseYoloSettings({
      tools: { builtinToolOptions: { fs_read: { disabled: true } } },
    })
    const { manager, unsubscribe, updateSettings } =
      createManager(initialSettings)

    expect(
      (await manager.listAvailableTools({ includeBuiltinTools: true })).some(
        (tool) => tool.name === 'yolo_local__fs_read',
      ),
    ).toBe(false)

    updateSettings(parseYoloSettings({}))

    expect(
      (await manager.listAvailableTools({ includeBuiltinTools: true })).some(
        (tool) => tool.name === 'yolo_local__fs_read',
      ),
    ).toBe(true)
    manager.cleanup()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})

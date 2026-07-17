import { getBuiltinToolNamespace } from '../../../core/tools/localFileTools'
import { getToolName } from '../../../core/tools/tool-name-utils'

import { normalizeToolPreferencesForPersistence } from './agentToolPersistence'

describe('agentToolPersistence', () => {
  const builtinToolName = getToolName(getBuiltinToolNamespace(), 'fs_read')
  const unknownBuiltinToolName = getToolName(
    getBuiltinToolNamespace(),
    'removed_tool',
  )

  it('keeps known built-in tool preferences', () => {
    expect(
      normalizeToolPreferencesForPersistence({
        [builtinToolName]: { enabled: true, approvalMode: 'full_access' },
      }),
    ).toEqual({
      [builtinToolName]: { enabled: true, approvalMode: 'full_access' },
    })
  })

  it('drops unknown built-in tool preferences during persistence', () => {
    expect(
      normalizeToolPreferencesForPersistence({
        [unknownBuiltinToolName]: {
          enabled: true,
          approvalMode: 'require_approval',
        },
      }),
    ).toEqual({})
  })
})

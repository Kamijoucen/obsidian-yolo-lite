import { getBuiltinToolNamespace } from '../../tools/localFileTools'
import { getToolName } from '../../tools/tool-name-utils'

import { SUBAGENT_BLOCKED_TOOL_SHORT_NAMES } from './constants'
import {
  filterAllowedToolsForSubagent,
  isSubagentBlockedToolName,
} from './tool-filter'

describe('subagent tool-filter', () => {
  const fsEdit = getToolName(getBuiltinToolNamespace(), 'fs_edit')
  const delegate = getToolName(getBuiltinToolNamespace(), 'delegate_subagent')
  const terminal = getToolName(getBuiltinToolNamespace(), 'terminal_command')
  const askUser = getToolName(getBuiltinToolNamespace(), 'ask_user_question')

  it('blocks recursive and interactive delegation tools by FQN', () => {
    for (const shortName of SUBAGENT_BLOCKED_TOOL_SHORT_NAMES) {
      const fqn = getToolName(getBuiltinToolNamespace(), shortName)
      expect(isSubagentBlockedToolName(fqn)).toBe(true)
    }
  })

  it('filters parent allowlist without blanket fs bans', () => {
    const parent = [fsEdit, delegate, terminal, askUser]

    const filtered = filterAllowedToolsForSubagent(parent)
    expect(filtered).toEqual([fsEdit, terminal])
  })

  it('drops names outside the built-in namespace', () => {
    expect(filterAllowedToolsForSubagent(['unknown__tool'])).toEqual([])
  })

  it('treats a missing parent allowlist as no inherited tools', () => {
    expect(filterAllowedToolsForSubagent(undefined)).toEqual([])
  })

  it('does not filter approval-gated tools — those route to the parent UI', () => {
    // Tools that merely require approval (js_eval with caps, fs_edit in
    // review mode, etc.) are intentionally NOT in the deny-list. Their
    // approval requests bubble up to the SubagentCard's inline approval
    // block. See `docs/plans/2026-06-18-subagent-tool-approval-routing.md`.
    const jsEval = getToolName(getBuiltinToolNamespace(), 'js_eval')
    expect(isSubagentBlockedToolName(jsEval)).toBe(false)
    expect(filterAllowedToolsForSubagent([fsEdit, jsEval])).toEqual([
      fsEdit,
      jsEval,
    ])
  })
})

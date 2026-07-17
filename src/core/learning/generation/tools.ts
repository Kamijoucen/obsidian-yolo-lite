import { getBuiltinToolNamespace } from '../../tools/localFileTools'
import { getToolName } from '../../tools/tool-name-utils'

export const LEARNING_READONLY_TOOL_NAMES = [
  getToolName(getBuiltinToolNamespace(), 'fs_read'),
  getToolName(getBuiltinToolNamespace(), 'fs_list'),
]

export const LEARNING_CARD_TOOL_NAMES = [
  getToolName(getBuiltinToolNamespace(), 'fs_read'),
  getToolName(getBuiltinToolNamespace(), 'fs_list'),
  getToolName(getBuiltinToolNamespace(), 'fs_edit'),
]

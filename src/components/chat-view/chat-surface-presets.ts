export type AssistantActionSurfacePreset = {
  showInlineInfo: boolean
  showRetryAction: boolean
  showInsertAction: boolean
  showCopyAction: boolean
  showBranchAction: boolean
  showEditAction: boolean
  showDeleteAction: boolean
  showQuoteAction: boolean
}

export type UserMessageSurfacePreset = {
  showReasoningSelect: boolean
  allowAgentModeOption: boolean
}

export type ChatSurfacePreset = {
  assistantActions: AssistantActionSurfacePreset
  userMessage: UserMessageSurfacePreset
}

export const CHAT_SURFACE_PRESET: ChatSurfacePreset = {
  assistantActions: {
    showInlineInfo: true,
    showRetryAction: true,
    showInsertAction: true,
    showCopyAction: true,
    showBranchAction: true,
    showEditAction: true,
    showDeleteAction: true,
    showQuoteAction: true,
  },
  userMessage: {
    showReasoningSelect: true,
    allowAgentModeOption: true,
  },
}

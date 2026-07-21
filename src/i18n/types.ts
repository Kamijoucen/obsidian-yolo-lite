export type Language = 'en' | 'zh'

export type TranslationKeys = {
  commands: {
    openChat: string
    newChat: string
  }
  common: {
    cancel: string
    close: string
    retry: string
    loading: string
    send: string
    stop: string
    error: string
    copy: string
  }
  chat: {
    newChat: string
    untitled: string
    history: string
    historyEmpty: string
    inputPlaceholder: string
    stopGenerating: string
    attachImage: string
    modePlan: string
    modeBuild: string
    reasoning: string
    todoTitle: string
    contextUsage: string
    permissionTitle: string
    allowOnce: string
    allowAlways: string
    reject: string
    toolRunning: string
    toolPending: string
    toolCompleted: string
    toolFailed: string
    emptyConversation: string
    authRequired: string
    authRequiredHint: string
    sessionLoading: string
  }
  setup: {
    title: string
    notFound: string
    notFoundHint: string
    starting: string
    retry: string
    openSettings: string
    exited: string
    connected: string
  }
  settings: {
    title: string
    connection: string
    agentInfo: string
    notConnected: string
    opencodePath: string
    opencodePathDesc: string
    opencodeArgs: string
    opencodeArgsDesc: string
    behavior: string
    defaultMode: string
    defaultModeDesc: string
    systemPrompt: string
    systemPromptDesc: string
    manageAgentsMd: string
    manageAgentsMdDesc: string
    resetPrompt: string
    autoApprove: string
    autoApproveDesc: string
    showReasoning: string
    showReasoningDesc: string
    debugLog: string
    debugLogDesc: string
  }
  statusBar: {
    running: string
  }
}

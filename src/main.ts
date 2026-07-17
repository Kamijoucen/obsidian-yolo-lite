import { EditorView } from '@codemirror/view'
import {
  Editor,
  MarkdownView,
  Notice,
  Platform,
  Plugin,
  TFile,
  TFolder,
  type WorkspaceLeaf,
  addIcon,
  getLanguage,
  normalizePath,
  setIcon,
} from 'obsidian'

import { ChatView } from './ChatView'
import {
  type ActionToastController,
  type ActionToastOptions,
  mountActionToast,
} from './components/ActionToast'
import { AcknowledgementModal } from './components/modals/AcknowledgementModal'
import { CHAT_VIEW_TYPE, LEARNING_VIEW_TYPE } from './constants'
import type { YoloAgentApi, YoloAgentApiService } from './core/agent/agent-api'
import type {
  AgentConversationRunSummary,
  AgentService,
} from './core/agent/service'
import {
  clearChatGPTOAuthService,
  getChatGPTOAuthService as getChatGPTOAuthServiceRuntime,
  initializeChatGPTOAuthRuntime,
} from './core/auth/chatgptOAuthRuntime'
import {
  BackgroundActivity,
  BackgroundActivityAction,
  BackgroundActivityRegistry,
} from './core/background/backgroundActivityRegistry'
import { buildBackgroundStatusModel } from './core/background/backgroundStatusModel'
import { noteWebviewLeafFocus } from './core/browser/activeWebviewProbe'
import type {
  LearningNavigationHandler,
  LearningNavigationTarget,
} from './core/learning/learningNavigation'
import {
  LearningStatsService,
  getTotalDueCards,
} from './core/learning/learningStatsService'
import type { LearningStatsSnapshot } from './core/learning/learningStatsService'
import type { ProjectEventBus } from './core/learning/projectEventBus'
import { LearningSrsStore } from './core/learning/srs/srsStore'
import { setLLMDebugCaptureEnabled } from './core/llm/debugCapture'
import type {
  LocalMcpServerRuntime,
  LocalMcpServerState,
} from './core/mcp/localMcpServerConfig'
import type { McpCoordinator } from './core/mcp/mcpCoordinator'
import type { McpManager } from './core/mcp/mcpManager'
import { AgentNotificationCoordinator } from './core/notifications/agentNotificationCoordinator'
import { NotificationService } from './core/notifications/notificationService'
import {
  type YoloDataMeta,
  extractYoloDataMeta,
  relocateYoloManagedData,
  stampYoloDataMeta,
} from './core/paths/yoloManagedData'
import { getYoloLearningDir } from './core/paths/yoloPaths'
import { ChatManager } from './database/json/chat/ChatManager'
import { pruneImageCache } from './database/json/chat/imageCacheStore'
import {
  ChatLeafPlacement,
  ChatLeafSessionManager,
} from './features/chat/chatLeafSessionManager'
import { ChatViewNavigator } from './features/chat/chatViewNavigator'
import { NewTabEmptyStateEnhancer } from './features/chat/newTabEmptyStateEnhancer'
import { DiffReviewController } from './features/editor/diff-review/diffReviewController'
import {
  buildFullReviewBlocks,
  countModifiedBlocks,
} from './features/editor/diff-review/review-model'
import { type Language, createTranslationFunction, loadLocale } from './i18n'
import { LearningView } from './LearningView'
import {
  YoloSettings,
  yoloSettingsSchema,
} from './settings/schema/setting.types'
import {
  normalizeYoloSettingsReferences,
  parseYoloSettings,
} from './settings/schema/settings'
import { YoloSettingTab } from './settings/SettingTab'
import type { ApplyViewState } from './types/apply-view.types'
import { isUntitledConversationTitle } from './utils/chat/conversationTitle'
import { stableStringify } from './utils/json/stableStringify'
import { applyKnownMaxContextTokensToChatModels } from './utils/llm/model-capability-registry'
import { ensureBufferByteLengthCompat } from './utils/runtime/ensureBufferByteLengthCompat'
import { YOLO_ICON_ID, YOLO_ICON_SVG } from './yoloIcon'

export type {
  YoloAgentApi,
  YoloAgentContext,
  YoloAgentEvent,
  YoloAgentRunRequest,
  YoloAgentRunResult,
} from './core/agent/agent-api'

type TranslateFn = (keyPath: string, fallback?: string) => string
type BackgroundStatusPanelAction =
  | BackgroundActivityAction
  | { type: 'open-learning-home' }

export default class YoloPlugin extends Plugin {
  settings: YoloSettings
  settingsChangeListeners: ((newSettings: YoloSettings) => void)[] = []
  private deviceId: string | null = null
  private currentSettingsMeta: YoloDataMeta | null = null
  private actionToastController: ActionToastController | null = null
  mcpManager: McpManager | null = null
  private timeoutIds: ReturnType<typeof setTimeout>[] = [] // Use ReturnType instead of number
  private learningGenerationAbortControllers: Set<AbortController> = new Set()
  private diffReviewController: DiffReviewController | null = null
  private chatViewNavigator: ChatViewNavigator | null = null
  private chatLeafSessionManager: ChatLeafSessionManager | null = null
  private newTabEmptyStateEnhancer: NewTabEmptyStateEnhancer | null = null
  private mcpCoordinator: McpCoordinator | null = null
  private localMcpServer: LocalMcpServerRuntime | null = null
  private localMcpSettingsUnsubscribe: (() => void) | null = null
  private learningEventBus: ProjectEventBus | null = null
  private learningSrsStore: LearningSrsStore | null = null
  private learningStatsService: LearningStatsService | null = null
  private learningNavigationHandler: LearningNavigationHandler | null = null
  private pendingLearningNavigation: LearningNavigationTarget | null = null
  // Model list cache for provider model fetching
  private modelListCache: Map<string, { models: string[]; timestamp: number }> =
    new Map()
  private agentService: AgentService | null = null
  private agentServiceReady: Promise<AgentService> | null = null
  private agentApiService: YoloAgentApiService | null = null
  private agentNotificationCoordinator: AgentNotificationCoordinator | null =
    null
  private backgroundActivityRegistry: BackgroundActivityRegistry | null = null
  private backgroundStatusBarItem: HTMLElement | null = null
  private backgroundStatusBarRing: HTMLElement | null = null
  private backgroundStatusBarLabel: HTMLElement | null = null
  private backgroundStatusPanel: HTMLElement | null = null
  private backgroundStatusPanelList: HTMLElement | null = null
  private backgroundStatusPanelEmpty: HTMLElement | null = null
  private latestBackgroundActivities = new Map<string, BackgroundActivity>()
  private latestLearningStats: LearningStatsSnapshot | null = null
  private backgroundStatusPanelRenderVersion = 0
  private isUnloaded = false
  private backgroundStatusPanelItems = new Map<
    string,
    {
      item: HTMLElement
      title: HTMLElement
      detail: HTMLElement
      indicator: HTMLElement
      action?: BackgroundStatusPanelAction
    }
  >()

  private getPromptSourceSettingsFingerprint(
    settings: YoloSettings | undefined,
  ): string {
    if (!settings) {
      return ''
    }
    return stableStringify({
      systemPrompt: settings.systemPrompt ?? '',
      baseDir: normalizePath(settings.yolo?.baseDir ?? ''),
      disabledSkillNames: [...(settings.skills?.disabledSkillNames ?? [])]
        .map((id) => id.trim())
        .sort(),
      assistants: (settings.assistants ?? [])
        .map((assistant) => ({
          id: assistant.id,
          name: assistant.name,
          systemPrompt: assistant.systemPrompt ?? '',
          skillPreferences: assistant.skillPreferences ?? null,
          enableProjectInstructions:
            assistant.enableProjectInstructions ?? false,
          workspaceScope: assistant.workspaceScope ?? null,
        }))
        .sort((left, right) => left.id.localeCompare(right.id)),
    })
  }

  private markPromptSourceSettingsChange(
    previousSettings: YoloSettings | undefined,
    nextSettings: YoloSettings,
  ): void {
    if (
      this.getPromptSourceSettingsFingerprint(previousSettings) ===
      this.getPromptSourceSettingsFingerprint(nextSettings)
    ) {
      return
    }
    this.agentService?.getPromptSourceWatcher().markExternalChange()
  }

  getChatLeafSessionManager(): ChatLeafSessionManager {
    if (!this.chatLeafSessionManager) {
      this.chatLeafSessionManager = new ChatLeafSessionManager(this.app)
    }
    return this.chatLeafSessionManager
  }

  /**
   * Registers (or clears) the active LearningView's ProjectEventBus. The
   * workspace component calls this on mount / unmount so plugin-level
   * commands (e.g. mock replay) can reach the bus that's currently driving
   * the on-screen graph.
   */
  setLearningEventBus(bus: ProjectEventBus | null): void {
    this.learningEventBus = bus
  }

  setLearningNavigationHandler(
    handler: LearningNavigationHandler | null,
  ): void {
    this.learningNavigationHandler = handler
    this.flushLearningNavigation()
  }

  showActionToast(toast: ActionToastOptions): void {
    this.actionToastController?.show(toast)
  }

  trackLearningGeneration(controller: AbortController): void {
    this.learningGenerationAbortControllers.add(controller)
  }

  releaseLearningGeneration(controller: AbortController): void {
    this.learningGenerationAbortControllers.delete(controller)
  }

  private flushLearningNavigation(): void {
    if (!this.learningNavigationHandler || !this.pendingLearningNavigation) {
      return
    }
    const target = this.pendingLearningNavigation
    this.pendingLearningNavigation = null
    this.learningNavigationHandler(target)
  }

  getLearningSrsStore(): LearningSrsStore {
    if (!this.learningSrsStore) {
      this.learningSrsStore = new LearningSrsStore(
        this.app,
        () => this.settings,
      )
    }
    return this.learningSrsStore
  }

  getLearningStatsService(): LearningStatsService {
    if (!this.learningStatsService) {
      this.learningStatsService = new LearningStatsService({
        app: this.app,
        getLearningBaseDir: () => getYoloLearningDir(this.settings),
        srsStore: this.getLearningSrsStore(),
      })
    }
    return this.learningStatsService
  }

  /**
   * Opens the LearningView in the main workspace (new tab). Activates an
   * existing leaf if one is already open.
   */
  async openLearningView(target?: LearningNavigationTarget): Promise<void> {
    const leaf = await this.revealLearningView(target)

    if (!this.settings.learningOptions.betaNoticeAcknowledged) {
      new AcknowledgementModal(this.app, {
        title: this.t(
          'learning.betaNotice.title',
          'Learning mode public beta notice',
        ),
        messages: [
          this.t(
            'learning.betaNotice.description',
            'Learning mode is currently in public beta. Some features are still being refined and may be unstable or contain bugs. Some learning mode features will become part of paid plans in the future. Free users will still be able to use learning mode, but limits may apply to the number of learning projects they can create. Existing projects beyond the free allowance may become read-only, but they will not be deleted automatically.',
          ),
        ],
        centered: true,
        confirmText: this.t(
          'learning.betaNotice.confirm',
          'I understand, enter learning mode',
        ),
        cancelText: this.t('learning.betaNotice.cancel', 'Not now'),
        onConfirm: () => {
          void this.acknowledgeLearningBetaNotice()
        },
        onDismiss: () => {
          if (leaf.view.getViewType() === LEARNING_VIEW_TYPE) leaf.detach()
        },
      }).open()
    }
  }

  private async acknowledgeLearningBetaNotice(): Promise<void> {
    try {
      await this.setSettings({
        ...this.settings,
        learningOptions: {
          ...this.settings.learningOptions,
          betaNoticeAcknowledged: true,
        },
      })
    } catch (error: unknown) {
      console.error(
        'Failed to persist learning beta notice confirmation',
        error,
      )
    }
  }

  private async revealLearningView(
    target?: LearningNavigationTarget,
  ): Promise<WorkspaceLeaf> {
    if (target) this.pendingLearningNavigation = target
    const existing = this.app.workspace.getLeavesOfType(LEARNING_VIEW_TYPE)[0]
    if (existing) {
      this.app.workspace.revealLeaf(existing)
      this.flushLearningNavigation()
      return existing
    }
    const leaf = this.app.workspace.getLeaf('tab')
    await leaf.setViewState({ type: LEARNING_VIEW_TYPE, active: true })
    this.app.workspace.revealLeaf(leaf)
    this.flushLearningNavigation()
    return leaf
  }

  // Get cached model list for a provider
  getCachedModelList(providerId: string): string[] | null {
    const cached = this.modelListCache.get(providerId)
    if (cached) {
      return cached.models
    }
    return null
  }

  // Set model list cache for a provider
  setCachedModelList(providerId: string, models: string[]): void {
    this.modelListCache.set(providerId, {
      models,
      timestamp: Date.now(),
    })
  }

  // Clear all model list cache (called when settings modal closes)
  clearModelListCache(): void {
    this.modelListCache.clear()
  }

  getChatGPTOAuthService(providerId = 'chatgpt-oauth') {
    return (
      getChatGPTOAuthServiceRuntime(providerId) ??
      initializeChatGPTOAuthRuntime(this.app, this.manifest.id, providerId)
    )
  }

  async getChatGPTOAuthStatus(providerId = 'chatgpt-oauth'): Promise<{
    connected: boolean
    accountId?: string
    expiresAt?: number
  }> {
    const credential =
      await this.getChatGPTOAuthService(providerId).getUsableCredential()
    if (!credential) {
      return { connected: false }
    }

    return {
      connected: true,
      ...(credential.accountId ? { accountId: credential.accountId } : {}),
      expiresAt: credential.expiresAt,
    }
  }

  async disconnectChatGPTOAuthAccount(
    providerId = 'chatgpt-oauth',
  ): Promise<void> {
    await this.getChatGPTOAuthService(providerId).clearCredential()
  }

  clearChatGPTOAuthRuntime(providerId: string): void {
    clearChatGPTOAuthService(providerId)
  }

  private syncOAuthRuntimesFromSettings(
    settings: Pick<YoloSettings, 'providers'> = this.settings,
  ): void {
    for (const provider of settings.providers) {
      if (provider.presetType === 'chatgpt-oauth') {
        this.getChatGPTOAuthService(provider.id)
      }
    }
  }

  private getChatViewNavigator(): ChatViewNavigator {
    if (!this.chatViewNavigator) {
      this.chatViewNavigator = new ChatViewNavigator({ plugin: this })
    }
    return this.chatViewNavigator
  }

  private getBackgroundActivityRegistry(): BackgroundActivityRegistry {
    if (!this.backgroundActivityRegistry) {
      this.backgroundActivityRegistry = new BackgroundActivityRegistry()
    }
    return this.backgroundActivityRegistry
  }

  private async getMcpCoordinator(): Promise<McpCoordinator> {
    if (!this.mcpCoordinator) {
      const agentService = await this.warmupAgentService()
      const { McpCoordinator } = await import('./core/mcp/mcpCoordinator')
      this.mcpCoordinator = new McpCoordinator({
        app: this.app,
        getSettings: () => this.settings,
        openApplyReview: (state) => this.openApplyReview(state),
        registerSettingsListener: (
          listener: (settings: YoloSettings) => void,
        ) => this.addSettingsChangeListener(listener),
        promptSourceWatcher: agentService.getPromptSourceWatcher(),
      })
    }
    return this.mcpCoordinator
  }

  private async initializeLocalMcpServer(): Promise<void> {
    if (!Platform.isDesktop || this.localMcpServer) return
    const { DesktopLocalMcpServer } = await import(
      './core/mcp/desktopLocalMcpServer'
    )
    const runtime = new DesktopLocalMcpServer({
      app: this.app,
      getSettings: () => this.settings,
      getAgentService: () => this.warmupAgentService(),
      getMcpManager: () => this.getMcpManager(),
      openConversation: (conversationId) =>
        this.openChatView({ initialConversationId: conversationId }),
    })
    this.localMcpServer = runtime
    this.localMcpSettingsUnsubscribe = this.addSettingsChangeListener(
      (settings) => {
        void runtime.updateSettings(settings)
      },
    )
    await runtime.initialize()
    await runtime.updateSettings(this.settings)
  }

  getLocalMcpServerState(): LocalMcpServerState {
    return (
      this.localMcpServer?.getState() ?? {
        status: 'stopped',
        url: '',
      }
    )
  }

  subscribeLocalMcpServerState(
    listener: (state: LocalMcpServerState) => void,
  ): () => void {
    if (!this.localMcpServer) {
      listener(this.getLocalMcpServerState())
      return () => undefined
    }
    return this.localMcpServer.subscribe(listener)
  }

  private resolveObsidianLanguage(): Language {
    const rawLanguage = String(getLanguage() ?? '')
      .trim()
      .toLowerCase()
    if (rawLanguage.startsWith('zh')) return 'zh'
    if (rawLanguage.startsWith('it')) return 'it'
    return 'en'
  }

  private _tCache?: { language: Language; fn: TranslateFn }

  get t(): TranslateFn {
    const language = this.resolveObsidianLanguage()
    if (this._tCache?.language !== language) {
      this._tCache = {
        language,
        fn: createTranslationFunction(language),
      }
    }
    return this._tCache.fn
  }

  private cancelAllAiTasks() {
    this.agentService?.abortAll()
  }

  async warmupAgentService(): Promise<AgentService> {
    if (!this.agentServiceReady) {
      this.agentServiceReady = (async () => {
        try {
          const { AgentService } = await import('./core/agent/service')
          const { YoloAgentApiService } = await import('./core/agent/agent-api')
          const { createAgentConversationPersistence } = await import(
            './core/agent/conversationPersistence'
          )
          if (this.isUnloaded) {
            throw new Error('[YOLO] Plugin unloaded during agent warmup')
          }
          const { persistConversationMessages } =
            createAgentConversationPersistence(this.app, () => this.settings)
          const service = new AgentService({
            getSettings: () => this.settings,
            persistConversationMessages,
          })
          const watcher = service.getPromptSourceWatcher()
          const h = watcher.buildVaultHandlers()
          this.registerEvent(this.app.vault.on('create', h.create))
          this.registerEvent(this.app.vault.on('modify', h.modify))
          this.registerEvent(this.app.vault.on('delete', h.delete))
          this.registerEvent(this.app.vault.on('rename', h.rename))
          service.startBackgroundTaskResultListener()
          this.agentService = service
          this.agentApiService = new YoloAgentApiService({
            app: this.app,
            getSettings: () => this.settings,
            getAgentService: () => this.getAgentService(),
            getMcpManager: () => this.getMcpManager(),
          })
          return service
        } catch (error) {
          this.agentServiceReady = null
          throw error
        }
      })()
    }
    return this.agentServiceReady
  }

  getAgentService(): AgentService {
    if (!this.agentService) {
      throw new Error(
        '[YOLO] Agent service is not ready yet; await plugin.warmupAgentService() first.',
      )
    }
    return this.agentService
  }

  getAgentApi(): YoloAgentApi {
    if (!this.agentApiService) {
      throw new Error(
        '[YOLO] Agent API is not ready yet; await plugin.warmupAgentService() first.',
      )
    }
    return this.agentApiService
  }

  get agent(): YoloAgentApi {
    return this.getAgentApi()
  }

  private getAgentNotificationCoordinator(): AgentNotificationCoordinator {
    if (!this.agentNotificationCoordinator) {
      const notificationService = new NotificationService({
        getOptions: () => this.settings.notificationOptions,
      })
      this.agentNotificationCoordinator = new AgentNotificationCoordinator({
        agentService: this.getAgentService(),
        notificationService,
        translate: (key, fallback) => this.t(key, fallback),
      })
    }
    return this.agentNotificationCoordinator
  }

  private setupBackgroundActivityStatusBar(): void {
    const statusBarItem = this.addStatusBarItem()
    statusBarItem.addClass('mod-clickable')
    statusBarItem.addClass('yolo-background-activity-status-bar')
    statusBarItem.hide()

    const ring = document.createElement('span')
    ring.className = 'yolo-background-activity-status-bar-ring'

    const label = document.createElement('span')
    label.className = 'yolo-background-activity-status-bar-label'

    const panel = document.createElement('div')
    panel.className = 'yolo-background-activity-status-panel'
    panel.setAttribute('aria-hidden', 'true')
    panel.hidden = true

    const panelHeader = document.createElement('div')
    panelHeader.className = 'yolo-background-activity-status-panel-header'
    panelHeader.setText(
      this.t('statusBar.backgroundStatusPanelTitle', '活动与提醒'),
    )

    const panelList = document.createElement('div')
    panelList.className = 'yolo-background-activity-status-panel-list'

    const panelEmpty = document.createElement('div')
    panelEmpty.className = 'yolo-background-activity-status-panel-empty'
    panelEmpty.setText(
      this.t('statusBar.backgroundStatusPanelEmpty', '当前没有活动或提醒'),
    )

    panel.append(panelHeader, panelList, panelEmpty)
    statusBarItem.append(label, ring, panel)

    this.backgroundStatusBarItem = statusBarItem
    this.backgroundStatusBarRing = ring
    this.backgroundStatusBarLabel = label
    this.backgroundStatusPanel = panel
    this.backgroundStatusPanelList = panelList
    this.backgroundStatusPanelEmpty = panelEmpty

    this.registerDomEvent(statusBarItem, 'click', (event) => {
      if (
        this.backgroundStatusPanel &&
        event.target instanceof Node &&
        this.backgroundStatusPanel.contains(event.target)
      ) {
        return
      }
      void this.toggleBackgroundStatusPanel()
    })

    this.registerDomEvent(document, 'click', (event) => {
      if (
        !this.isBackgroundStatusPanelOpen() ||
        !this.backgroundStatusBarItem ||
        !(event.target instanceof Node)
      ) {
        return
      }

      if (!this.backgroundStatusBarItem.contains(event.target)) {
        this.closeBackgroundStatusPanel()
      }
    })

    this.registerDomEvent(document, 'keydown', (event) => {
      if (event.key === 'Escape') {
        this.closeBackgroundStatusPanel()
      }
    })

    const unsubscribeActivities =
      this.getBackgroundActivityRegistry().subscribe((activities) => {
        this.latestBackgroundActivities = new Map(activities)
        this.updateBackgroundStatusBar()
      })
    const unsubscribeLearningStats = this.getLearningStatsService().subscribe(
      (snapshot) => {
        this.latestLearningStats = snapshot
        this.updateBackgroundStatusBar()
      },
    )
    let isActive = true
    let unsubscribeAgentSummaries: (() => void) | null = null
    void this.warmupAgentService()
      .then((agentService) => {
        if (!isActive) {
          return
        }
        unsubscribeAgentSummaries = agentService.subscribeToRunSummaries(
          (summaries) => {
            this.syncAgentBackgroundActivities(summaries)
          },
        )
      })
      .catch((error: unknown) => {
        console.error('[YOLO] Agent service warmup failed:', error)
      })
    this.register(() => {
      isActive = false
      unsubscribeActivities()
      unsubscribeLearningStats()
      unsubscribeAgentSummaries?.()
      this.backgroundStatusBarItem = null
      this.backgroundStatusBarRing = null
      this.backgroundStatusBarLabel = null
      this.backgroundStatusPanel = null
      this.backgroundStatusPanelList = null
      this.backgroundStatusPanelEmpty = null
      this.backgroundStatusPanelRenderVersion += 1
      this.backgroundStatusPanelItems.clear()
      this.latestBackgroundActivities.clear()
      this.latestLearningStats = null
      this.backgroundActivityRegistry?.clear()
      this.backgroundActivityRegistry = null
    })
  }

  private syncAgentBackgroundActivities(
    summaries: Map<string, AgentConversationRunSummary>,
  ): void {
    const registry = this.getBackgroundActivityRegistry()
    const nextActivityIds = new Set<string>()

    for (const summary of summaries.values()) {
      if (!summary.isRunning && !summary.isWaitingApproval) {
        continue
      }

      const id = `agent:${summary.conversationId}`
      nextActivityIds.add(id)
      registry.upsert({
        id,
        kind: summary.activity?.kind ?? 'agent',
        title:
          summary.activity?.title ??
          this.t(
            'statusBar.agentStatusFallbackConversationTitle',
            '运行中的对话',
          ),
        detail:
          summary.activity?.detail ??
          (summary.isWaitingApproval
            ? this.t('statusBar.agentStatusWaitingApproval', '待审批')
            : this.t('statusBar.agentStatusRunning', '运行中')),
        status: summary.isWaitingApproval ? 'waiting' : 'running',
        updatedAt: Date.now(),
        action:
          summary.activity?.action === 'open-learning-view'
            ? { type: 'open-learning-view' }
            : {
                type: 'open-agent-conversation',
                conversationId: summary.conversationId,
              },
      })
    }

    for (const activityId of this.latestBackgroundActivities.keys()) {
      if (!activityId.startsWith('agent:')) {
        continue
      }
      if (nextActivityIds.has(activityId)) {
        continue
      }
      registry.remove(activityId)
    }
  }

  private updateBackgroundStatusBar(): void {
    if (
      !this.backgroundStatusBarItem ||
      !this.backgroundStatusBarRing ||
      !this.backgroundStatusBarLabel
    ) {
      return
    }
    this.backgroundStatusPanelRenderVersion += 1

    const dueCards = this.latestLearningStats
      ? getTotalDueCards(this.latestLearningStats)
      : 0
    const model = buildBackgroundStatusModel(
      this.latestBackgroundActivities.values(),
      dueCards,
    )

    if (!model.visible) {
      this.clearBackgroundStatusPanelItems()
      this.closeBackgroundStatusPanel()
      this.backgroundStatusBarItem.hide()
      this.backgroundStatusBarLabel.setText('')
      this.backgroundStatusBarItem.removeAttribute('aria-label')
      this.backgroundStatusBarItem.removeAttribute('title')
      return
    }

    const label =
      model.activities.length > 0
        ? this.buildBackgroundStatusBarLabel(model.activities)
        : this.t(
            'statusBar.learningReviewLabel',
            'YOLO Learning：今日有 {count} 张待复习卡片',
          ).replace('{count}', String(dueCards))

    this.backgroundStatusBarLabel.setText(label)
    this.backgroundStatusBarItem.removeAttribute('title')
    this.backgroundStatusBarRing.empty()
    this.backgroundStatusBarRing.classList.remove(
      'is-running',
      'is-waiting',
      'is-failed',
      'is-review',
    )
    if (model.tone) {
      this.backgroundStatusBarRing.classList.add(`is-${model.tone}`)
    }
    if (model.tone === 'review') {
      setIcon(this.backgroundStatusBarRing, 'graduation-cap')
    }
    this.backgroundStatusBarItem.show()

    if (this.isBackgroundStatusPanelOpen()) {
      void this.renderBackgroundStatusPanel()
    }
  }

  private buildBackgroundStatusBarLabel(
    activities: BackgroundActivity[],
  ): string {
    const runningActivities = activities.filter(
      (activity) =>
        activity.status === 'running' || activity.status === 'waiting',
    )
    const agentActivities = runningActivities.filter(
      (activity) => activity.kind === 'agent',
    )
    const learningActivities = runningActivities.filter(
      (activity) => activity.kind === 'learning-agent',
    )
    const waitingApprovalCount = runningActivities.filter(
      (activity) => activity.status === 'waiting',
    ).length

    if (
      runningActivities.length > 0 &&
      learningActivities.length === runningActivities.length
    ) {
      if (learningActivities.length === 1) {
        return learningActivities[0].detail || learningActivities[0].title
      }
      return this.t(
        'statusBar.learningTasksRunning',
        '学习模式有 {count} 个任务正在运行',
      ).replace('{count}', String(learningActivities.length))
    }

    if (
      runningActivities.length > 0 &&
      agentActivities.length === runningActivities.length
    ) {
      return waitingApprovalCount > 0
        ? this.t(
            'statusBar.agentRunningWithApproval',
            '当前有 {count} 个 agent 正在运行（{approvalCount} 个待审批）',
          )
            .replace('{count}', String(agentActivities.length))
            .replace('{approvalCount}', String(waitingApprovalCount))
        : this.t(
            'statusBar.agentRunning',
            '当前有 {count} 个 agent 正在运行',
          ).replace('{count}', String(agentActivities.length))
    }

    if (runningActivities.length > 0) {
      return this.t(
        'statusBar.backgroundTasksRunning',
        '当前有 {count} 个后台任务正在运行',
      ).replace('{count}', String(runningActivities.length))
    }

    return this.t(
      'statusBar.backgroundTasksNeedAttention',
      '有后台任务需要关注',
    )
  }

  private isBackgroundStatusPanelOpen(): boolean {
    return this.backgroundStatusPanel?.hidden === false
  }

  private openBackgroundStatusPanel(): void {
    if (!this.backgroundStatusPanel || this.isBackgroundStatusPanelOpen()) {
      return
    }

    this.backgroundStatusPanel.hidden = false
    this.backgroundStatusPanel.setAttribute('aria-hidden', 'false')

    window.requestAnimationFrame(() => {
      this.backgroundStatusPanel?.addClass('is-open')
    })
  }

  private closeBackgroundStatusPanel(): void {
    if (!this.backgroundStatusPanel || !this.isBackgroundStatusPanelOpen()) {
      return
    }

    this.backgroundStatusPanel.removeClass('is-open')
    this.backgroundStatusPanel.setAttribute('aria-hidden', 'true')
    window.setTimeout(() => {
      if (this.backgroundStatusPanel?.hasClass('is-open')) {
        return
      }
      if (this.backgroundStatusPanel) {
        this.backgroundStatusPanel.hidden = true
      }
    }, 180)
  }

  private async toggleBackgroundStatusPanel(): Promise<void> {
    if (this.isBackgroundStatusPanelOpen()) {
      this.closeBackgroundStatusPanel()
      return
    }

    const hasEntries = await this.renderBackgroundStatusPanel()
    if (!hasEntries) {
      return
    }

    this.openBackgroundStatusPanel()
  }

  private async renderBackgroundStatusPanel(): Promise<boolean> {
    if (!this.backgroundStatusPanelList || !this.backgroundStatusPanelEmpty) {
      return false
    }

    const renderVersion = ++this.backgroundStatusPanelRenderVersion
    const dueCards = this.latestLearningStats
      ? getTotalDueCards(this.latestLearningStats)
      : 0
    const model = buildBackgroundStatusModel(
      this.latestBackgroundActivities.values(),
      dueCards,
    )
    const activities = model.activities

    if (!model.visible) {
      this.clearBackgroundStatusPanelItems()
      this.backgroundStatusPanelEmpty.hidden = false
      return false
    }

    let metadataList: { id: string; title?: string }[] = []
    if (
      activities.some(
        (activity) => activity.action?.type === 'open-agent-conversation',
      )
    ) {
      try {
        const chatManager = new ChatManager(this.app, this.settings)
        metadataList = await chatManager.listChats()
      } catch (error) {
        console.error(
          '[YOLO] Failed to load chat titles for status panel:',
          error,
        )
      }
    }
    if (
      renderVersion !== this.backgroundStatusPanelRenderVersion ||
      !this.backgroundStatusPanelList ||
      !this.backgroundStatusPanelEmpty
    ) {
      if (!this.backgroundStatusPanelList || !this.backgroundStatusPanelEmpty) {
        return false
      }
      return this.isBackgroundStatusPanelOpen()
        ? true
        : this.renderBackgroundStatusPanel()
    }

    const metadataById = new Map<string, { title?: string }>(
      metadataList.map((item) => [item.id, { title: item.title }]),
    )
    const nextActivityIds = new Set<string>()
    let insertBeforeNode = this.backgroundStatusPanelList.firstChild

    for (const activity of activities) {
      nextActivityIds.add(activity.id)
      const title = this.resolveBackgroundActivityTitle(activity, metadataById)
      const detail = this.resolveBackgroundActivityDetail(activity)
      const itemRecord =
        this.backgroundStatusPanelItems.get(activity.id) ??
        this.createBackgroundStatusPanelItem(activity.id, activity.action)
      itemRecord.action = activity.action

      if (itemRecord.title.getText() !== title) {
        itemRecord.title.setText(title)
      }
      if (itemRecord.title.getAttribute('title') !== title) {
        itemRecord.title.setAttribute('title', title)
      }
      if (itemRecord.detail.getText() !== detail) {
        itemRecord.detail.setText(detail)
      }
      itemRecord.detail.hidden = detail.length === 0
      itemRecord.indicator.classList.remove(
        'is-running',
        'is-waiting',
        'is-failed',
        'is-review',
      )
      itemRecord.indicator.empty()
      itemRecord.indicator.classList.add(`is-${activity.status}`)

      if (itemRecord.item !== insertBeforeNode) {
        this.backgroundStatusPanelList.insertBefore(
          itemRecord.item,
          insertBeforeNode,
        )
      }
      insertBeforeNode = itemRecord.item.nextSibling
    }

    if (model.showReviewReminder) {
      const reminderId = 'reminder:learning-review'
      nextActivityIds.add(reminderId)
      const title = this.t('statusBar.learningReviewTitle', 'YOLO Learning')
      const detail = this.t(
        'statusBar.learningReviewDetail',
        '{count} 张卡片待复习',
      ).replace('{count}', String(dueCards))
      const itemRecord =
        this.backgroundStatusPanelItems.get(reminderId) ??
        this.createBackgroundStatusPanelItem(reminderId, {
          type: 'open-learning-home',
        })
      itemRecord.action = { type: 'open-learning-home' }
      itemRecord.title.setText(title)
      itemRecord.title.setAttribute('title', title)
      itemRecord.detail.setText(detail)
      itemRecord.detail.hidden = false
      itemRecord.indicator.classList.remove(
        'is-running',
        'is-waiting',
        'is-failed',
      )
      itemRecord.indicator.classList.add('is-review')
      itemRecord.indicator.empty()
      setIcon(itemRecord.indicator, 'graduation-cap')
      if (itemRecord.item !== insertBeforeNode) {
        this.backgroundStatusPanelList.insertBefore(
          itemRecord.item,
          insertBeforeNode,
        )
      }
      insertBeforeNode = itemRecord.item.nextSibling
    }

    for (const [activityId, itemRecord] of this.backgroundStatusPanelItems) {
      if (nextActivityIds.has(activityId)) {
        continue
      }
      itemRecord.item.remove()
      this.backgroundStatusPanelItems.delete(activityId)
    }

    this.backgroundStatusPanelEmpty.hidden = true
    return true
  }

  private createBackgroundStatusPanelItem(
    activityId: string,
    action?: BackgroundStatusPanelAction,
  ): {
    item: HTMLElement
    title: HTMLElement
    detail: HTMLElement
    indicator: HTMLElement
    action?: BackgroundStatusPanelAction
  } {
    const item = createDiv({
      cls: 'yolo-background-activity-status-panel-item',
    })
    item.setAttribute('role', 'button')
    item.setAttribute('tabindex', '0')

    const row = item.createDiv({
      cls: 'yolo-background-activity-status-panel-item-row',
    })
    const copy = row.createDiv({
      cls: 'yolo-background-activity-status-panel-item-copy',
    })
    const title = copy.createDiv({
      cls: 'yolo-background-activity-status-panel-item-title',
    })
    const detail = copy.createDiv({
      cls: 'yolo-background-activity-status-panel-item-detail',
    })
    const indicator = row.createDiv({
      cls: 'yolo-background-activity-status-panel-item-indicator',
    })
    const record = {
      item,
      title,
      detail,
      indicator,
      action,
    }

    const openAction = () => {
      this.closeBackgroundStatusPanel()
      const currentAction = record.action
      if (!currentAction) {
        return
      }
      if (currentAction.type === 'open-agent-conversation') {
        void this.openChatView({
          placement: 'split',
          initialConversationId: currentAction.conversationId,
          forceNewLeaf: true,
        })
        return
      }
      if (currentAction.type === 'open-learning-view') {
        void this.openLearningView()
        return
      }
      if (currentAction.type === 'open-learning-home') {
        void this.openLearningView({ type: 'home' })
      }
    }

    this.registerDomEvent(item, 'click', (event) => {
      event.stopPropagation()
      openAction()
    })

    this.registerDomEvent(item, 'keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        event.stopPropagation()
        openAction()
      }
    })

    this.backgroundStatusPanelItems.set(activityId, record)
    return record
  }

  private clearBackgroundStatusPanelItems(): void {
    this.backgroundStatusPanelList?.empty()
    this.backgroundStatusPanelItems.clear()
  }

  private resolveBackgroundActivityTitle(
    activity: BackgroundActivity,
    metadataById: Map<string, { title?: string }>,
  ): string {
    if (
      activity.action?.type === 'open-agent-conversation' &&
      activity.action.conversationId
    ) {
      const metadata = metadataById.get(activity.action.conversationId)
      return this.resolveAgentConversationTitle(metadata?.title)
    }
    return activity.title
  }

  private resolveBackgroundActivityDetail(
    activity: BackgroundActivity,
  ): string {
    return activity.detail?.trim() ?? ''
  }

  private resolveAgentConversationTitle(title: string | undefined): string {
    if (!isUntitledConversationTitle(title)) {
      return title!.trim()
    }

    return this.t(
      'statusBar.agentStatusFallbackConversationTitle',
      '运行中的对话',
    )
  }

  private getEditorView(editor: Editor | null | undefined): EditorView | null {
    if (!editor) return null
    if (this.isEditorWithCodeMirror(editor)) {
      const { cm } = editor
      if (cm instanceof EditorView) {
        return cm
      }
    }
    return null
  }

  private isEditorWithCodeMirror(
    editor: Editor,
  ): editor is Editor & { cm?: EditorView } {
    if (typeof editor !== 'object' || editor === null || !('cm' in editor)) {
      return false
    }
    const maybeEditor = editor as Editor & { cm?: EditorView }
    return maybeEditor.cm instanceof EditorView
  }

  private getDiffReviewController(): DiffReviewController {
    if (!this.diffReviewController) {
      this.diffReviewController = new DiffReviewController({
        plugin: this,
        getActiveMarkdownView: () =>
          this.app.workspace.getActiveViewOfType(MarkdownView),
        getEditorView: (editor) => this.getEditorView(editor),
      })
    }
    return this.diffReviewController
  }

  async openApplyReview(state: ApplyViewState): Promise<boolean> {
    // If the diff that the overlay would display has zero modified blocks,
    // skip the overlay entirely — otherwise the UI renders "0/0" with every
    // button disabled and no auto-close path, stranding the user.
    const reviewBlocks = buildFullReviewBlocks(
      state.originalContent,
      state.newContent,
    )
    if (countModifiedBlocks(reviewBlocks) === 0) {
      if (state.originalContent !== state.newContent) {
        await this.app.vault.modify(state.file, state.newContent)
      }
      state.callbacks?.onComplete?.({ finalContent: state.newContent })
      return true
    }

    const opened = this.getDiffReviewController().openReview(state)
    if (opened) return true

    const markdownLeaves = this.app.workspace.getLeavesOfType('markdown')
    const targetLeaf = markdownLeaves.find((leaf) => {
      const view = leaf.view
      if (!(view instanceof MarkdownView)) return false
      return view.file?.path === state.file.path
    })

    if (targetLeaf?.view instanceof MarkdownView) {
      this.app.workspace.setActiveLeaf(targetLeaf, { focus: true })
      const openedInTarget = this.getDiffReviewController().openReviewInView(
        targetLeaf.view,
        state,
      )
      if (openedInTarget) return true
    }

    const leaf = this.app.workspace.getLeaf(false)
    await leaf?.openFile(state.file, { active: true })
    const openedAfterFocus = this.getDiffReviewController().openReview(state)
    if (openedAfterFocus) return true

    new Notice('请先打开目标文件后再应用修改。')
    return false
  }

  async onload() {
    this.isUnloaded = false
    ensureBufferByteLengthCompat()
    addIcon(YOLO_ICON_ID, YOLO_ICON_SVG)

    await this.loadSettings()
    await loadLocale(this.resolveObsidianLanguage())
    this._tCache = undefined
    this.syncOAuthRuntimesFromSettings()
    await this.initializeLocalMcpServer().catch((error) => {
      console.error('[YOLO] Failed to initialize local MCP server', error)
    })

    // Prune stale image cache entries (>30 days) on startup
    void pruneImageCache(this.app, 30, this.settings)
    this.app.workspace.onLayoutReady(() => {
      this.getLearningStatsService().start()
    })
    this.registerView(CHAT_VIEW_TYPE, (leaf) => new ChatView(leaf, this))
    this.registerView(
      LEARNING_VIEW_TYPE,
      (leaf) => new LearningView(leaf, this),
    )
    this.newTabEmptyStateEnhancer = new NewTabEmptyStateEnhancer(this)
    this.newTabEmptyStateEnhancer.enable()

    // This creates an icon in the left ribbon.
    this.addRibbonIcon(YOLO_ICON_ID, 'YOLO Chat', () => {
      void this.openChatView({ placement: this.resolveRibbonPlacement() })
    })
    this.addRibbonIcon(
      'graduation-cap',
      this.t('commands.learningModeLabel'),
      () => {
        void this.openLearningView()
      },
    )

    this.setupBackgroundActivityStatusBar()
    this.actionToastController = mountActionToast()
    let shouldStartAgentNotifications = true
    void this.warmupAgentService()
      .then(() => {
        if (shouldStartAgentNotifications) {
          this.getAgentNotificationCoordinator().start()
        }
      })
      .catch((error: unknown) => {
        console.error('[YOLO] Agent service warmup failed:', error)
      })
    this.register(() => {
      shouldStartAgentNotifications = false
      this.agentNotificationCoordinator?.stop()
      this.agentNotificationCoordinator = null
    })

    this.addCommand({
      id: 'open-new-chat',
      name: this.t('commands.openChatSidebar'),
      callback: () => {
        void this.openChatView({ placement: 'sidebar' })
      },
    })

    this.addCommand({
      id: 'new-chat-current-view',
      name: this.t('commands.newChatCurrentView'),
      callback: () => {
        void this.openCurrentOrSidebarNewChat()
      },
    })

    this.addCommand({
      id: 'open-chat-tab',
      name: this.t('commands.openNewChatTab'),
      callback: () => {
        void this.openChatView({
          placement: 'tab',
          openNewChat: true,
          forceNewLeaf: true,
        })
      },
    })

    this.addCommand({
      id: 'open-chat-split',
      name: this.t('commands.openNewChatSplit'),
      callback: () => {
        void this.openChatView({
          placement: 'split',
          openNewChat: true,
          forceNewLeaf: true,
        })
      },
    })

    this.addCommand({
      id: 'open-chat-window',
      name: this.t('commands.openNewChatWindow'),
      callback: () => {
        void this.openChatView({
          placement: 'window',
          openNewChat: true,
          forceNewLeaf: true,
        })
      },
    })

    this.addCommand({
      id: 'open-learning-mode',
      name: this.t('commands.openLearningMode'),
      callback: () => {
        void this.openLearningView()
      },
    })

    // Global ESC to cancel any ongoing AI continuation/rewrite
    this.registerDomEvent(document, 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Do not prevent default so other ESC behaviors (close modals, etc.) still work
        this.cancelAllAiTasks()
      }
    })

    // Register file context menu for adding file/folder to chat
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (file instanceof TFile) {
          menu.addItem((item) => {
            item
              .setTitle(this.t('commands.addFileToChat'))
              .setIcon('message-square-plus')
              .onClick(async () => {
                await this.addFileToChat(file)
              })
          })
        } else if (file instanceof TFolder) {
          menu.addItem((item) => {
            item
              .setTitle(this.t('commands.addFolderToChat'))
              .setIcon('message-square-plus')
              .onClick(async () => {
                await this.addFolderToChat(file)
              })
          })
        }
      }),
    )

    this.addCommand({
      id: 'export-settings',
      name: this.t('commands.exportSettings', '导出插件配置'),
      callback: async () => {
        try {
          const { ExportConfigModal } = await import(
            './features/config-transfer/components/ExportConfigModal'
          )
          new ExportConfigModal(this.app, this).open()
        } catch (error) {
          console.error('[YOLO] Failed to load ExportConfigModal:', error)
          new Notice('Failed to open export dialog')
        }
      },
    })

    this.addCommand({
      id: 'import-settings',
      name: this.t('commands.importSettings', '导入插件配置'),
      callback: async () => {
        try {
          const { ImportConfigModal } = await import(
            './features/config-transfer/components/ImportConfigModal'
          )
          new ImportConfigModal(this.app, this).open()
        } catch (error) {
          console.error('[YOLO] Failed to load ImportConfigModal:', error)
          new Notice('Failed to open import dialog')
        }
      },
    })

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new YoloSettingTab(this.app, this))

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        if (leaf?.view instanceof ChatView) {
          this.getChatLeafSessionManager().touchLeafActive(leaf)
        }
        noteWebviewLeafFocus(this.app, leaf)
      }),
    )
  }

  onunload() {
    this.isUnloaded = true
    for (const controller of this.learningGenerationAbortControllers) {
      controller.abort()
    }
    this.learningGenerationAbortControllers.clear()
    this.actionToastController?.destroy()
    this.actionToastController = null
    this.learningNavigationHandler = null
    this.pendingLearningNavigation = null
    this.learningStatsService?.dispose()
    this.learningStatsService = null
    this.chatViewNavigator = null
    this.newTabEmptyStateEnhancer = null
    this.diffReviewController?.destroy()
    this.diffReviewController = null

    // clear all timers
    this.timeoutIds.forEach((id) => {
      clearTimeout(id)
    })
    this.timeoutIds = []

    // McpManager cleanup
    this.localMcpSettingsUnsubscribe?.()
    this.localMcpSettingsUnsubscribe = null
    void this.localMcpServer?.close()
    this.localMcpServer = null
    this.mcpCoordinator?.cleanup()
    this.mcpCoordinator = null
    this.mcpManager = null
    this.agentService?.stopBackgroundTaskResultListener()
    this.agentService?.abortAll()
    this.agentService = null
    this.agentServiceReady = null
    this.agentApiService = null
    void import('./core/agent/bash/index').then(({ killAllBashSessions }) =>
      killAllBashSessions(),
    )
    void import('./core/agent/subagent/runner').then(
      ({ abortAllSubagentTasks }) => abortAllSubagentTasks(),
    )
    // Ensure all in-flight requests are aborted on unload
    this.cancelAllAiTasks()
  }

  async loadSettings() {
    // Read-only loader. The on-disk `data.json` in the plugin directory is
    // the single source of truth for settings; `this.settings` is just a
    // process-local view of it. Cross-device sync is delegated to whatever
    // tool the user is using (Obsidian Sync, remotely-save, syncthing, git,
    // …) — they all replicate the plugin-dir file directly. We never write
    // back during load, so a backup pasted into `data.json` while the
    // plugin was off can't be silently overwritten by startup
    // normalization, and a Sync push that lands during boot can't be
    // clobbered by a stale in-memory snapshot.
    const rawPluginData = (await this.loadData()) as unknown
    const pluginExtract = extractYoloDataMeta(rawPluginData)
    const sourceRaw = pluginExtract?.raw ?? null
    const sourceMeta = pluginExtract?.meta ?? null

    const parsedSettings = parseYoloSettings(sourceRaw)
    const { ensureDefaultAssistantInSettings } = await import(
      './core/agent/default-assistant'
    )
    const settingsWithDefaultAssistant =
      ensureDefaultAssistantInSettings(parsedSettings)
    const { chatModels, changed } = applyKnownMaxContextTokensToChatModels(
      settingsWithDefaultAssistant.chatModels,
    )
    const normalizedSettings = changed
      ? { ...settingsWithDefaultAssistant, chatModels }
      : settingsWithDefaultAssistant

    this.settings = normalizedSettings
    this.currentSettingsMeta = sourceMeta
    setLLMDebugCaptureEnabled(
      this.settings.debug?.captureRawRequestDebug ?? false,
    )
  }

  private getDeviceId(): string {
    if (this.deviceId) {
      return this.deviceId
    }
    const storageKey = 'yolo.deviceId'
    let id: string | null = null
    try {
      id = window.localStorage.getItem(storageKey)
    } catch {
      // localStorage may be unavailable in some contexts; fall through to gen.
    }
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      try {
        window.localStorage.setItem(storageKey, id)
      } catch {
        // Best-effort persistence; a regenerated id on next boot is acceptable.
      }
    }
    this.deviceId = id
    return id
  }

  /**
   * Total ordering on `YoloDataMeta`. Returns true iff `b` beats `a`.
   *   - Strictly newer `updatedAt` wins.
   *   - Equal `updatedAt` ties are broken by lexically larger `deviceId`,
   *     so all devices observing a millisecond-coincident race converge
   *     on the same winner deterministically.
   * `metaBeats(self, self)` is false.
   */
  private metaBeats(a: YoloDataMeta, b: YoloDataMeta): boolean {
    if (b.updatedAt > a.updatedAt) return true
    if (b.updatedAt < a.updatedAt) return false
    return b.deviceId > a.deviceId
  }

  /**
   * Builds a fresh `__meta` for our own writes. Monotonic against the
   * meta we last observed in memory: prevents a device whose clock lags
   * behind a freshly-synced peer from emitting a write whose `updatedAt`
   * is below `currentSettingsMeta`, which other devices would then
   * legitimately reject as stale.
   */
  private buildSettingsMeta(): YoloDataMeta {
    const baseTime = Date.now()
    const monotonic = this.currentSettingsMeta
      ? Math.max(baseTime, this.currentSettingsMeta.updatedAt + 1)
      : baseTime
    return {
      updatedAt: monotonic,
      deviceId: this.getDeviceId(),
    }
  }

  private async persistPluginDirSettings(
    settings: YoloSettings,
    meta: YoloDataMeta = this.buildSettingsMeta(),
  ): Promise<YoloDataMeta> {
    await this.saveData(stampYoloDataMeta(settings, meta))
    this.currentSettingsMeta = meta
    return meta
  }

  /**
   * Adopt an externally-written `data.json` payload into in-memory state.
   *
   * Called from two places:
   *   - `onExternalSettingsChange()` — Obsidian's official hook fires when
   *     it detects the plugin's `data.json` was modified by something
   *     other than `saveData` (Obsidian Sync push, remotely-save replay,
   *     manual paste, git pull, …).
   *   - `setSettings()` conflict path — when a write-attempt detects the
   *     on-disk file is newer than what we last committed in memory.
   *
   * Protocol invariant:
   *   Every legitimate write to `data.json` MUST stamp it with a
   *   `__meta.updatedAt` strictly greater than the last meta this client
   *   observed (or, on a millisecond-coincident race from another
   *   device, a different `deviceId` so the lex tie-break in
   *   `metaBeats` resolves the winner). `buildSettingsMeta` enforces
   *   monotonicity for our own writes; cross-device sync naturally
   *   satisfies it via `Date.now()` advancement. A user who hand-edits
   *   `data.json` without bumping `__meta.updatedAt` falls outside the
   *   protocol — we accept that such an edit may be missed until the
   *   next external-change event re-reads the file.
   */
  private async applyExternalSettingsUpdate(
    raw: Record<string, unknown>,
    incomingMeta: YoloDataMeta | null,
  ): Promise<void> {
    // Self-write echo: same device + same updatedAt means this event is
    // the reflection of our own most recent saveData. Suppress.
    if (
      incomingMeta &&
      this.currentSettingsMeta &&
      incomingMeta.deviceId === this.currentSettingsMeta.deviceId &&
      incomingMeta.updatedAt === this.currentSettingsMeta.updatedAt
    ) {
      return
    }
    // Meta-less incoming with a meta-stamped local copy: refuse, per
    // protocol — we can't compare freshness so preferring local avoids
    // stale replays clobbering newer settings.
    if (!incomingMeta && this.currentSettingsMeta) {
      return
    }
    // Reject anything our current in-memory state already beats under
    // the total `metaBeats` ordering (older OR equal-and-loser).
    if (
      this.currentSettingsMeta &&
      incomingMeta &&
      !this.metaBeats(this.currentSettingsMeta, incomingMeta)
    ) {
      return
    }

    const parsedSettings = parseYoloSettings(raw)
    const { ensureDefaultAssistantInSettings } = await import(
      './core/agent/default-assistant'
    )
    const settingsWithDefaultAssistant =
      ensureDefaultAssistantInSettings(parsedSettings)
    const { chatModels, changed } = applyKnownMaxContextTokensToChatModels(
      settingsWithDefaultAssistant.chatModels,
    )
    const normalizedSettings = changed
      ? { ...settingsWithDefaultAssistant, chatModels }
      : settingsWithDefaultAssistant

    const previousSettings = this.settings
    const baseDirChanged =
      previousSettings?.yolo?.baseDir !== normalizedSettings.yolo.baseDir

    if (baseDirChanged && this.learningSrsStore) {
      await this.learningSrsStore.runExclusive(async () => {
        this.settings = normalizedSettings
      })
    } else {
      this.settings = normalizedSettings
    }
    this.currentSettingsMeta = incomingMeta
    this.markPromptSourceSettingsChange(previousSettings, normalizedSettings)

    if (baseDirChanged) {
      // External payload references a different `baseDir`. Don't call
      // `relocateYoloManagedData` here — the on-disk YOLO/ folder either
      // already lives at the new path because Sync replicated it, or (in
      // the manual paste case) corresponds to the user's pre-restore
      // state and would be wrong to move. Tear down the active runtime
      // and let the next access re-init against the new paths.
      new Notice(
        'YOLO: detected a `baseDir` change in data.json. Reloaded settings against the new path.',
      )
      this.learningStatsService?.restart()
    }

    this.syncOAuthRuntimesFromSettings(normalizedSettings)
    this.settingsChangeListeners.forEach((listener) => {
      listener(normalizedSettings)
    })
  }

  /**
   * Obsidian's official hook for "data.json was modified outside of
   * saveData()". Fires for Obsidian Sync pushes, remotely-save replays,
   * manual user pastes, etc. — platform-agnostic and reliable, no
   * fs.watch needed. https://docs.obsidian.md/Reference/TypeScript+API/Plugin/onExternalSettingsChange
   */
  async onExternalSettingsChange(): Promise<void> {
    let raw: unknown
    try {
      raw = await this.loadData()
    } catch (error) {
      console.warn(
        '[YOLO] Failed to re-read data.json after external change.',
        error,
      )
      return
    }
    const extract = extractYoloDataMeta(raw)
    if (!extract) {
      return
    }
    await this.applyExternalSettingsUpdate(extract.raw, extract.meta)
  }

  /**
   * Returns the on-disk settings + meta when the plugin-dir file has
   * been mutated externally since we last wrote/loaded it; otherwise
   * null. Used by `setSettings` to refuse stale full-object writes.
   */
  private async detectExternalSettingsConflict(): Promise<{
    raw: Record<string, unknown>
    meta: YoloDataMeta
  } | null> {
    let raw: unknown
    try {
      raw = await this.loadData()
    } catch (error) {
      console.warn('[YOLO] Failed to read data.json before write.', error)
      return null
    }
    const extract = extractYoloDataMeta(raw)
    if (!extract?.meta) {
      return null
    }
    const diskMeta = extract.meta
    const currentMeta = this.currentSettingsMeta
    // Self-write: same device + same updatedAt is the write we just made.
    if (
      currentMeta &&
      diskMeta.deviceId === currentMeta.deviceId &&
      diskMeta.updatedAt === currentMeta.updatedAt
    ) {
      return null
    }
    // Conflict iff disk beats current memory (newer OR equal-but-foreign
    // by deviceId tie-break).
    if (currentMeta && !this.metaBeats(currentMeta, diskMeta)) {
      return null
    }
    return { raw: extract.raw, meta: diskMeta }
  }

  async setSettings(newSettings: YoloSettings) {
    const { ensureDefaultAssistantInSettings } = await import(
      './core/agent/default-assistant'
    )
    const normalizedSettings = ensureDefaultAssistantInSettings(
      normalizeYoloSettingsReferences(newSettings),
    )
    const validationResult = yoloSettingsSchema.safeParse(normalizedSettings)

    if (!validationResult.success) {
      new Notice(`Invalid settings:
${validationResult.error.issues.map((v) => v.message).join('\n')}`)
      return
    }

    // Read-before-write conflict check. If the file on disk has been
    // mutated externally (Sync push, third-party sync replay, manual
    // paste, …) since we last committed memory, the in-memory
    // `newSettings` was constructed against a stale base. Blindly
    // writing it back would silently revert whatever fields the external
    // writer changed. Adopt the disk version into memory and notify the
    // user to redo their edit. We intentionally don't auto-merge: most
    // call sites pass a full settings object via `{ ...this.settings,
    // foo: 'x' }` spreads, so we cannot tell which fields were the
    // user's actual intent and which are stale snapshot.
    const conflict = await this.detectExternalSettingsConflict()
    if (conflict) {
      await this.applyExternalSettingsUpdate(conflict.raw, conflict.meta)
      new Notice(
        'YOLO: settings were updated externally (sync, another device, or manual edit). Your last change was not saved — please redo it.',
      )
      return
    }

    const previousSettings = this.settings
    const yoloBaseDirChanged =
      previousSettings?.yolo?.baseDir !== normalizedSettings.yolo.baseDir

    if (yoloBaseDirChanged) {
      const relocate = () =>
        relocateYoloManagedData({
          app: this.app,
          fromSettings: previousSettings,
          toSettings: normalizedSettings,
        })
      const relocated = this.learningSrsStore
        ? await this.learningSrsStore.runExclusive(async () => {
            const succeeded = await relocate()
            if (succeeded) this.settings = normalizedSettings
            return succeeded
          })
        : await relocate()
      if (!relocated) {
        new Notice(
          'Failed to move YOLO managed data. Keeping previous YOLO root folder.',
        )
        return
      }
    }

    this.settings = normalizedSettings
    if (yoloBaseDirChanged) this.learningStatsService?.restart()
    await this.persistPluginDirSettings(normalizedSettings)
    this.markPromptSourceSettingsChange(previousSettings, normalizedSettings)
    setLLMDebugCaptureEnabled(
      this.settings.debug?.captureRawRequestDebug ?? false,
    )

    this.syncOAuthRuntimesFromSettings(normalizedSettings)
    this.settingsChangeListeners.forEach((listener) => {
      listener(normalizedSettings)
    })
  }

  addSettingsChangeListener(listener: (newSettings: YoloSettings) => void) {
    this.settingsChangeListeners.push(listener)
    return () => {
      this.settingsChangeListeners = this.settingsChangeListeners.filter(
        (l) => l !== listener,
      )
    }
  }

  async openChatView(options?: {
    placement?: ChatLeafPlacement
    openNewChat?: boolean
    initialConversationId?: string
    prefillText?: string
    forceNewLeaf?: boolean
  }) {
    await this.getChatViewNavigator().openChatView(options)
  }

  resolveRibbonPlacement(): ChatLeafPlacement {
    const action = this.settings.chatOptions.ribbonClickAction ?? 'sidebar'
    if (action === 'last') {
      const last = this.settings.chatOptions.lastChatPlacement
      return last ?? 'sidebar'
    }
    return action
  }

  async openCurrentOrSidebarNewChat() {
    await this.getChatViewNavigator().openCurrentOrSidebarNewChat()
  }

  async addFileToChat(file: TFile) {
    await this.getChatViewNavigator().addFileToChat(file)
  }

  async addFolderToChat(folder: TFolder) {
    await this.getChatViewNavigator().addFolderToChat(folder)
  }

  async getMcpManager(): Promise<McpManager> {
    const manager = await (await this.getMcpCoordinator()).getMcpManager()
    this.mcpManager = manager
    return manager
  }

  private registerTimeout(callback: () => void, timeout: number): void {
    const timeoutId = setTimeout(callback, timeout)
    this.timeoutIds.push(timeoutId)
  }
}

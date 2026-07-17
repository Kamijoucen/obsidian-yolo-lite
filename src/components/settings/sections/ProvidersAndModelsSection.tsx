import {
  Activity,
  ChevronDown,
  ChevronRight,
  Edit,
  Plus,
  Trash2,
} from 'lucide-react'
import { App, Notice } from 'obsidian'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useLanguage } from '../../../contexts/language-context'
import { useSettings } from '../../../contexts/settings-context'
import YoloPlugin from '../../../main'
import { ChatModel } from '../../../types/chat-model.types'
import { LLMProvider } from '../../../types/provider.types'
import { resolveProviderDisplayBaseUrl } from '../../../utils/llm/provider-base-url'
import { ObsidianToggle } from '../../common/ObsidianToggle'
import { AddChatModelModal } from '../modals/AddChatModelModal'
import { ConnectivityTestModal } from '../modals/ConnectivityTestModal'
import { EditChatModelModal } from '../modals/EditChatModelModal'
import { EditProviderModal } from '../modals/ProviderFormModal'
import { ProviderPickerModal } from '../modals/ProviderPickerModal'

type ProvidersAndModelsSectionProps = {
  app: App
  plugin: YoloPlugin
}

function ChatGPTOAuthPanel({
  plugin,
  provider,
}: {
  plugin: YoloPlugin
  provider: LLMProvider
}) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const status = await plugin.getChatGPTOAuthStatus(provider.id)
      setConnected(status.connected)
      setAccountId(status.accountId ?? null)
    } finally {
      setLoading(false)
    }
  }, [plugin, provider.id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const connect = () => {
    setConnecting(true)
    void plugin
      .getChatGPTOAuthService(provider.id)
      .beginBrowserAuthorization()
      .then(async (authorization) => {
        window.open(
          authorization.authorizationUrl,
          '_blank',
          'noopener,noreferrer',
        )
        await authorization.complete
        await refresh()
      })
      .catch((error: unknown) => {
        new Notice(error instanceof Error ? error.message : String(error))
      })
      .finally(() => setConnecting(false))
  }

  const disconnect = () => {
    void plugin
      .disconnectChatGPTOAuthAccount(provider.id)
      .then(refresh)
      .catch((error: unknown) => {
        new Notice(error instanceof Error ? error.message : String(error))
      })
  }

  return (
    <div className="yolo-models-oauth-panel">
      <span>
        {loading
          ? t('settings.providers.chatgptOAuthLoadingStatus', 'Loading...')
          : connected
            ? `${t('settings.providers.chatgptOAuthConnected', 'Connected')}${accountId ? ` · ${accountId}` : ''}`
            : t(
                'settings.providers.chatgptOAuthDisconnectedHelp',
                'Connect your ChatGPT account to use OAuth models.',
              )}
      </span>
      {connected ? (
        <button type="button" onClick={disconnect}>
          {t('settings.providers.chatgptOAuthDisconnect', 'Disconnect')}
        </button>
      ) : (
        <button type="button" disabled={connecting} onClick={connect}>
          {connecting
            ? t('settings.providers.chatgptOAuthConnecting', 'Connecting...')
            : t('settings.providers.chatgptOAuthConnect', 'Connect')}
        </button>
      )}
    </div>
  )
}

function ChatModelRow({
  app,
  plugin,
  model,
  onToggle,
  onDelete,
}: {
  app: App
  plugin: YoloPlugin
  model: ChatModel
  onToggle: (modelId: string, enabled: boolean) => void
  onDelete: (modelId: string) => void
}) {
  const { t } = useLanguage()
  return (
    <div className="yolo-model-row">
      <div className="yolo-model-row-main">
        <div className="yolo-model-row-name">{model.name || model.model}</div>
        <div className="yolo-model-row-id">{model.model}</div>
      </div>
      <ObsidianToggle
        value={model.enable ?? true}
        onChange={(value) => onToggle(model.id, value)}
      />
      <button
        type="button"
        className="clickable-icon"
        aria-label={t('common.edit', 'Edit')}
        onClick={() => new EditChatModelModal(app, plugin, model).open()}
      >
        <Edit size={15} />
      </button>
      <button
        type="button"
        className="clickable-icon"
        aria-label={t('common.delete', 'Delete')}
        onClick={() => onDelete(model.id)}
      >
        <Trash2 size={15} />
      </button>
    </div>
  )
}

function ProviderCard({
  app,
  plugin,
  provider,
  models,
  expanded,
  onToggleExpanded,
  onToggleModel,
  onDeleteModel,
  onDeleteProvider,
}: {
  app: App
  plugin: YoloPlugin
  provider: LLMProvider
  models: ChatModel[]
  expanded: boolean
  onToggleExpanded: () => void
  onToggleModel: (modelId: string, enabled: boolean) => void
  onDeleteModel: (modelId: string) => void
  onDeleteProvider: () => void
}) {
  const { t } = useLanguage()
  const baseUrl = resolveProviderDisplayBaseUrl(provider)

  return (
    <div className="yolo-provider-section-item">
      <div className="yolo-provider-section-header">
        <button
          type="button"
          className="yolo-provider-section-expand clickable-icon"
          onClick={onToggleExpanded}
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <div
          className="yolo-provider-section-heading"
          onClick={onToggleExpanded}
        >
          <div className="yolo-provider-section-name">{provider.id}</div>
          <div className="yolo-provider-section-url">
            {baseUrl || provider.presetType}
          </div>
        </div>
        <button
          type="button"
          className="clickable-icon"
          aria-label={t('settings.models.connectivityTest.title', 'Test')}
          onClick={() =>
            new ConnectivityTestModal(app, plugin, provider).open()
          }
        >
          <Activity size={15} />
        </button>
        <button
          type="button"
          className="clickable-icon"
          aria-label={t('common.edit', 'Edit')}
          onClick={() => new EditProviderModal(app, plugin, provider).open()}
        >
          <Edit size={15} />
        </button>
        <button
          type="button"
          className="clickable-icon"
          aria-label={t('common.delete', 'Delete')}
          onClick={onDeleteProvider}
        >
          <Trash2 size={15} />
        </button>
      </div>

      {expanded ? (
        <div className="yolo-provider-section-body">
          {provider.presetType === 'chatgpt-oauth' ? (
            <ChatGPTOAuthPanel plugin={plugin} provider={provider} />
          ) : null}
          <div className="yolo-models-subsection-header">
            <span>{t('settings.models.chatModels', 'Chat models')}</span>
            <button
              type="button"
              className="yolo-models-add-button"
              onClick={() =>
                new AddChatModelModal(app, plugin, provider).open()
              }
            >
              <Plus size={14} />
              {t('settings.models.addChatModel', 'Add model')}
            </button>
          </div>
          {models.length === 0 ? (
            <div className="yolo-models-empty">
              {t('settings.models.noChatModels', 'No chat models configured.')}
            </div>
          ) : (
            models.map((model) => (
              <ChatModelRow
                key={model.id}
                app={app}
                plugin={plugin}
                model={model}
                onToggle={onToggleModel}
                onDelete={onDeleteModel}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

export function ProvidersAndModelsSection({
  app,
  plugin,
}: ProvidersAndModelsSectionProps) {
  const { t } = useLanguage()
  const { settings, setSettings } = useSettings()
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(settings.providers.map((provider) => provider.id)),
  )

  const modelsByProvider = useMemo(() => {
    const map = new Map<string, ChatModel[]>()
    for (const model of settings.chatModels) {
      const models = map.get(model.providerId) ?? []
      models.push(model)
      map.set(model.providerId, models)
    }
    return map
  }, [settings.chatModels])

  const toggleModel = (modelId: string, enabled: boolean) => {
    void setSettings({
      ...settings,
      chatModels: settings.chatModels.map((model) =>
        model.id === modelId ? { ...model, enable: enabled } : model,
      ),
    })
  }

  const deleteModel = (modelId: string) => {
    if (
      modelId === settings.chatModelId ||
      modelId === settings.chatTitleModelId
    ) {
      new Notice('Cannot delete the active chat or title model.')
      return
    }
    void setSettings({
      ...settings,
      chatModels: settings.chatModels.filter((model) => model.id !== modelId),
    })
  }

  const deleteProvider = (provider: LLMProvider) => {
    const removedModelIds = new Set(
      settings.chatModels
        .filter((model) => model.providerId === provider.id)
        .map((model) => model.id),
    )
    const remainingModels = settings.chatModels.filter(
      (model) => model.providerId !== provider.id,
    )
    const fallbackModelId = remainingModels.find(
      (model) => model.enable ?? true,
    )?.id

    void (async () => {
      if (provider.presetType === 'chatgpt-oauth') {
        await plugin.disconnectChatGPTOAuthAccount(provider.id)
        plugin.clearChatGPTOAuthRuntime(provider.id)
      }
      await setSettings({
        ...settings,
        providers: settings.providers.filter((item) => item.id !== provider.id),
        chatModels: remainingModels,
        chatModelId: removedModelIds.has(settings.chatModelId)
          ? (fallbackModelId ?? '')
          : settings.chatModelId,
        chatTitleModelId: removedModelIds.has(settings.chatTitleModelId)
          ? (fallbackModelId ?? '')
          : settings.chatTitleModelId,
      })
    })().catch((error: unknown) => {
      new Notice(error instanceof Error ? error.message : String(error))
    })
  }

  return (
    <div className="yolo-settings-section">
      <div className="yolo-settings-header-row">
        <div className="yolo-settings-header">
          {t('settings.models.title', 'Providers and models')}
        </div>
        <button
          type="button"
          className="yolo-models-add-provider"
          onClick={() => new ProviderPickerModal(app, plugin).open()}
        >
          <Plus size={15} />
          {t('settings.providers.addProvider', 'Add provider')}
        </button>
      </div>
      <div className="yolo-provider-sections">
        {settings.providers.map((provider) => (
          <ProviderCard
            key={provider.id}
            app={app}
            plugin={plugin}
            provider={provider}
            models={modelsByProvider.get(provider.id) ?? []}
            expanded={expanded.has(provider.id)}
            onToggleExpanded={() => {
              setExpanded((current) => {
                const next = new Set(current)
                if (next.has(provider.id)) next.delete(provider.id)
                else next.add(provider.id)
                return next
              })
            }}
            onToggleModel={toggleModel}
            onDeleteModel={deleteModel}
            onDeleteProvider={() => deleteProvider(provider)}
          />
        ))}
      </div>
    </div>
  )
}

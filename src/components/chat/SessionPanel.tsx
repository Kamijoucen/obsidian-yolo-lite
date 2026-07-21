import type { ContentBlock } from '@agentclientprotocol/sdk'
import { memo, useCallback, useEffect, useState } from 'react'

import { useLanguage } from '../../contexts/language-context'
import { useSessionService } from '../../contexts/service-context'
import type { ChatSessionState } from '../../types/chat'

import ChatInput, { InputImage } from './ChatInput'
import PlanView from './PlanView'
import Timeline from './Timeline'

function buildPromptBlocks(text: string, images: InputImage[]): ContentBlock[] {
  const blocks: ContentBlock[] = []
  if (text) {
    blocks.push({ type: 'text', text })
  }
  for (const image of images) {
    blocks.push({
      type: 'image',
      data: image.data,
      mimeType: image.mimeType,
    })
  }
  return blocks
}

function ErrorBanner({ error }: { error: string }) {
  const { t } = useLanguage()
  if (error === 'opencode-auth-required') {
    return (
      <div className="yolo-acp-error-banner">
        <div className="yolo-acp-error-title">
          {t('chat.authRequired', 'opencode is not authenticated')}
        </div>
        <div className="yolo-acp-error-hint">
          {t(
            'chat.authRequiredHint',
            'Run `opencode auth login` in a terminal, then retry.',
          )}
        </div>
      </div>
    )
  }
  return (
    <div className="yolo-acp-error-banner">
      <div className="yolo-acp-error-title">{error}</div>
    </div>
  )
}

type SessionPanelProps = {
  tabId: string
  isActive: boolean
}

function SessionPanel({ tabId, isActive }: SessionPanelProps) {
  const service = useSessionService()
  const [state, setState] = useState<ChatSessionState | null>(() =>
    service.getState(tabId),
  )

  useEffect(() => {
    setState(service.getState(tabId))
    return service.subscribe(tabId, (next) => {
      setState({ ...next, entries: [...next.entries] })
    })
  }, [service, tabId])

  const handleSubmit = useCallback(
    (text: string, images: InputImage[]) => {
      const blocks = buildPromptBlocks(text, images)
      void service.submit(tabId, text, blocks)
    },
    [service, tabId],
  )

  const handleCancel = useCallback(() => {
    void service.cancel(tabId)
  }, [service, tabId])

  const handlePermissionRespond = useCallback(
    (toolCallId: string, optionId: string) => {
      service.respondPermission(tabId, toolCallId, optionId)
    },
    [service, tabId],
  )

  const handleModeChange = useCallback(
    (modeId: string) => {
      void service.setMode(tabId, modeId)
    },
    [service, tabId],
  )

  const handleConfigOptionChange = useCallback(
    (configId: string, value: string) => {
      void service.setConfigOption(tabId, configId, value)
    },
    [service, tabId],
  )

  if (!state) return null

  return (
    <div
      className={`yolo-acp-session${isActive ? ' is-active' : ''}`}
      style={{ display: isActive ? undefined : 'none' }}
    >
      <Timeline state={state} onPermissionRespond={handlePermissionRespond} />
      <div className="yolo-chat-footer">
        {state.plan.length > 0 ? <PlanView entries={state.plan} /> : null}
        {state.error ? <ErrorBanner error={state.error} /> : null}
        <ChatInput
          running={state.status === 'running'}
          disabled={state.status === 'loading'}
          commands={state.commands}
          mode={state.mode}
          configOptions={state.configOptions}
          onModeChange={handleModeChange}
          onConfigOptionChange={handleConfigOptionChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}

export default memo(SessionPanel)

import { useCallback, useEffect, useState } from 'react'

import { useSessionService } from '../../contexts/service-context'
import type { AvailabilityState } from '../../core/acp/service'
import type { HistorySessionInfo } from '../../types/chat'

import HeaderBar from './HeaderBar'
import SessionPanel from './SessionPanel'
import SetupBanner from './SetupBanner'

type ChatAppProps = {
  onOpenSettings: () => void
}

export default function ChatApp({ onOpenSettings }: ChatAppProps) {
  const service = useSessionService()
  const [tabId, setTabId] = useState<string | null>(null)
  const [availability, setAvailability] = useState<AvailabilityState>(() =>
    service.getAvailability(),
  )

  useEffect(() => {
    return service.onAvailabilityChange(setAvailability)
  }, [service])

  useEffect(() => {
    let cancelled = false
    const existing = service.listTabs()
    if (existing.length > 0) {
      setTabId((current) => current ?? existing[0].tabId)
      return
    }
    // Defer spawning opencode until after the current restore/paint cycle so
    // app startup isn't competing with the ACP subprocess boot.
    const timer = window.setTimeout(() => {
      void service
        .openMostRecentTab()
        .then((id) => {
          if (!cancelled) setTabId(id)
        })
        .catch(() => {
          if (!cancelled) setTabId(service.createTab())
        })
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [service])

  const handleNew = useCallback(() => {
    setTabId((current) => {
      if (current) {
        void service.closeTab(current)
      }
      return service.createTab()
    })
  }, [service])

  const handleOpenHistory = useCallback(
    (session: HistorySessionInfo) => {
      void service
        .openHistoryTab(session.sessionId, session.title)
        .then((id) => {
          setTabId((current) => {
            if (current && current !== id) {
              void service.closeTab(current)
            }
            return id
          })
        })
        .catch(() => undefined)
    },
    [service],
  )

  return (
    <div className="yolo-chat-container yolo-chat-container--sidebar">
      <HeaderBar
        tabId={tabId}
        onNew={handleNew}
        onOpenHistory={handleOpenHistory}
      />
      <SetupBanner
        availability={availability}
        onOpenSettings={onOpenSettings}
      />
      {tabId ? <SessionPanel tabId={tabId} isActive /> : null}
    </div>
  )
}

import { History, Plus } from 'lucide-react'
import { memo, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useLanguage } from '../../contexts/language-context'
import { useSessionService } from '../../contexts/service-context'
import type { HistorySessionInfo } from '../../types/chat'

function HistoryPopup({
  anchorRef,
  children,
}: {
  anchorRef: React.RefObject<HTMLDivElement | null>
  children: React.ReactNode
}) {
  const [style, setStyle] = useState<React.CSSProperties>({})
  useEffect(() => {
    if (!anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    setStyle({
      position: 'fixed',
      top: `${rect.bottom + 4}px`,
      right: `${window.innerWidth - rect.right}px`,
      maxHeight: 320,
      minWidth: 220,
      maxWidth: 300,
      overflowY: 'auto',
      zIndex: 40,
    })
  }, [anchorRef])
  return createPortal(
    <div
      className="yolo-popover-surface yolo-popover-surface--default yolo-acp-history-popup"
      style={style}
    >
      {children}
    </div>,
    document.body,
  )
}

function HistoryDropdown({
  onOpenHistory,
}: {
  onOpenHistory: (session: HistorySessionInfo) => void
}) {
  const service = useSessionService()
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [sessions, setSessions] = useState<HistorySessionInfo[] | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setSessions(null)
    service
      .listHistory()
      .then((list) => {
        if (!cancelled) setSessions(list)
      })
      .catch(() => {
        if (!cancelled) setSessions([])
      })
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !(
          target instanceof Element && target.closest('.yolo-acp-history-popup')
        )
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      cancelled = true
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, service])

  return (
    <div className="yolo-acp-history" ref={containerRef}>
      <button
        type="button"
        className="clickable-icon"
        title={t('chat.history', 'History')}
        onClick={() => setOpen(!open)}
      >
        <History size={16} />
      </button>
      {open ? (
        <HistoryPopup anchorRef={containerRef}>
          {sessions === null ? (
            <div className="yolo-acp-history-empty">
              {t('common.loading', 'Loading…')}
            </div>
          ) : sessions.length === 0 ? (
            <div className="yolo-acp-history-empty">
              {t('chat.historyEmpty', 'No previous sessions')}
            </div>
          ) : (
            <div className="yolo-model-select-list" role="menu">
              {sessions.map((session) => (
                <button
                  key={session.sessionId}
                  type="button"
                  className="yolo-popover-item"
                  onClick={() => {
                    setOpen(false)
                    onOpenHistory(session)
                  }}
                >
                  <span className="yolo-popover-item__label">
                    {session.title || t('chat.untitled', 'New chat')}
                  </span>
                  {session.updatedAt ? (
                    <span className="yolo-acp-history-date">
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </HistoryPopup>
      ) : null}
    </div>
  )
}

function HeaderTitle({ tabId }: { tabId: string | null }) {
  const service = useSessionService()
  const { t } = useLanguage()
  const [title, setTitle] = useState(() =>
    tabId ? service.getTitle(tabId) : '',
  )
  useEffect(() => {
    if (!tabId) return
    setTitle(service.getTitle(tabId))
    return service.subscribe(tabId, (state) => {
      setTitle(state.title)
    })
  }, [service, tabId])
  return (
    <span className="yolo-acp-header-title">
      {title || t('chat.untitled', 'New chat')}
    </span>
  )
}

type HeaderBarProps = {
  tabId: string | null
  onNew: () => void
  onOpenHistory: (session: HistorySessionInfo) => void
}

function HeaderBar({ tabId, onNew, onOpenHistory }: HeaderBarProps) {
  const { t } = useLanguage()
  return (
    <div className="yolo-acp-header">
      <HeaderTitle tabId={tabId} />
      <div className="yolo-acp-header-actions">
        <HistoryDropdown onOpenHistory={onOpenHistory} />
        <button
          type="button"
          className="clickable-icon"
          title={t('chat.newChat', 'New chat')}
          onClick={onNew}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}

export default memo(HeaderBar)

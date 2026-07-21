import type {
  PermissionOption,
  ToolCallContent,
} from '@agentclientprotocol/sdk'
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Loader2,
  X,
} from 'lucide-react'
import { memo, useState } from 'react'

import { useLanguage } from '../../contexts/language-context'
import type { ToolCallState } from '../../types/chat'

import DiffView from './DiffView'

const TEXT_PREVIEW_LIMIT = 4000

function StatusIcon({ status }: { status: ToolCallState['status'] }) {
  switch (status) {
    case 'in_progress':
      return <Loader2 size={13} className="yolo-spinner" />
    case 'completed':
      return (
        <span className="yolo-toolcall-status-success-ring">
          <Check size={9} className="yolo-toolcall-status-success-check" />
        </span>
      )
    case 'failed':
      return (
        <span className="yolo-acp-status-failed">
          <X size={11} />
        </span>
      )
    default:
      return <span className="yolo-toolcall-status-dot" />
  }
}

function permissionButtonClass(kind: PermissionOption['kind']) {
  if (kind === 'allow_once' || kind === 'allow_always') {
    return 'yolo-acp-permission-button is-allow'
  }
  return 'yolo-acp-permission-button is-reject'
}

function ToolContentItem({ content }: { content: ToolCallContent }) {
  if (content.type === 'diff') {
    return (
      <DiffView
        path={content.path}
        oldText={content.oldText ?? ''}
        newText={content.newText}
      />
    )
  }
  if (content.type === 'terminal') {
    return (
      <pre className="yolo-acp-tool-text">
        <code>{content.terminalId}</code>
      </pre>
    )
  }
  const inner = content.content
  if (inner.type === 'text') {
    const text =
      inner.text.length > TEXT_PREVIEW_LIMIT
        ? `${inner.text.slice(0, TEXT_PREVIEW_LIMIT)}\n…`
        : inner.text
    return (
      <pre className="yolo-acp-tool-text">
        <code>{text}</code>
      </pre>
    )
  }
  if (inner.type === 'image') {
    return (
      <img
        className="yolo-acp-tool-image"
        src={`data:${inner.mimeType};base64,${inner.data}`}
        alt=""
      />
    )
  }
  if (inner.type === 'resource_link') {
    return <div className="yolo-acp-tool-text">{inner.uri}</div>
  }
  return null
}

type ToolCallCardProps = {
  toolCall: ToolCallState
  onPermissionRespond: (toolCallId: string, optionId: string) => void
}

function ToolCallCard({ toolCall, onPermissionRespond }: ToolCallCardProps) {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  const hasBody = toolCall.content.length > 0 || toolCall.locations.length > 0
  const title = toolCall.title || toolCall.kind

  return (
    <div className="yolo-toolcall-container">
      <div className="yolo-toolcall">
        <button
          type="button"
          className="yolo-toolcall-header"
          onClick={() => hasBody && setExpanded(!expanded)}
        >
          <span className="yolo-toolcall-header-icon yolo-toolcall-header-icon--status-inline">
            <StatusIcon status={toolCall.status} />
          </span>
          <span className="yolo-toolcall-header-content">
            <div className="yolo-toolcall-header-tool-name">
              <span className="yolo-toolcall-header-title" title={title}>
                {title}
              </span>
            </div>
          </span>
          {hasBody ? (
            <span className="yolo-toolcall-header-icon yolo-toolcall-header-icon--expand">
              {expanded ? (
                <ChevronDown size={13} />
              ) : (
                <ChevronRight size={13} />
              )}
            </span>
          ) : null}
        </button>
        {toolCall.permission ? (
          <div className="yolo-acp-permission">
            <div className="yolo-acp-permission-title">
              <CircleAlert size={12} />
              {t('chat.permissionTitle', 'Permission required')}
            </div>
            <div className="yolo-acp-permission-actions">
              {toolCall.permission.options.map((option) => (
                <button
                  key={option.optionId}
                  type="button"
                  className={permissionButtonClass(option.kind)}
                  onClick={() =>
                    onPermissionRespond(toolCall.toolCallId, option.optionId)
                  }
                >
                  {option.name ||
                    (option.kind === 'allow_once'
                      ? t('chat.allowOnce', 'Allow once')
                      : option.kind === 'allow_always'
                        ? t('chat.allowAlways', 'Always allow')
                        : t('chat.reject', 'Reject'))}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {expanded && hasBody ? (
          <div className="yolo-toolcall-content">
            {toolCall.locations.length > 0 ? (
              <div className="yolo-acp-tool-locations">
                {toolCall.locations.map((location, index) => (
                  <span
                    key={`${location.path}-${index}`}
                    className="yolo-acp-tool-location"
                  >
                    {location.path}
                    {location.line != null ? `:${location.line}` : ''}
                  </span>
                ))}
              </div>
            ) : null}
            {toolCall.content.map((content, index) => (
              <ToolContentItem key={index} content={content} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default memo(ToolCallCard)

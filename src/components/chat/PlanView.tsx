import type { PlanEntry } from '@agentclientprotocol/sdk'
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  ListTodo,
  Loader2,
} from 'lucide-react'
import { memo, useState } from 'react'

import { useLanguage } from '../../contexts/language-context'

function statusIcon(status: PlanEntry['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 size={14} className="yolo-todo-panel__icon" />
    case 'in_progress':
      return (
        <Loader2
          size={14}
          className="yolo-todo-panel__icon yolo-todo-panel__icon-spin"
        />
      )
    default:
      return <CircleDashed size={14} className="yolo-todo-panel__icon" />
  }
}

function PlanView({ entries }: { entries: PlanEntry[] }) {
  const { t } = useLanguage()
  const [collapsed, setCollapsed] = useState(false)
  if (entries.length === 0) return null
  const done = entries.filter((entry) => entry.status === 'completed').length

  return (
    <div
      className={`yolo-todo-panel ${
        collapsed ? 'yolo-todo-panel--collapsed' : 'yolo-todo-panel--expanded'
      }`}
    >
      <div className="yolo-todo-panel__header">
        <button
          type="button"
          className="yolo-todo-panel__toggle"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ListTodo size={14} className="yolo-todo-panel__header-icon" />
          <span className="yolo-todo-panel__summary">
            {t('chat.todoTitle', 'Plan')} · {done}/{entries.length}
          </span>
          {collapsed ? (
            <ChevronRight size={12} className="yolo-todo-panel__caret" />
          ) : (
            <ChevronDown size={12} className="yolo-todo-panel__caret" />
          )}
        </button>
      </div>
      {!collapsed ? (
        <div className="yolo-todo-panel__body">
          <div className="yolo-todo-panel__body-inner">
            <ul className="yolo-todo-panel__list">
              {entries.map((entry, index) => (
                <li
                  key={index}
                  className={`yolo-todo-panel__item${
                    entry.status === 'completed'
                      ? ' yolo-todo-panel__item--completed'
                      : entry.status === 'in_progress'
                        ? ' yolo-todo-panel__item--in_progress'
                        : ''
                  }`}
                >
                  {statusIcon(entry.status)}
                  <span className="yolo-todo-panel__text">{entry.content}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default memo(PlanView)

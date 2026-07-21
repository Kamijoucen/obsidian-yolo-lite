import type { SessionConfigOption, SessionMode } from '@agentclientprotocol/sdk'
import {
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Hammer,
  ListChecks,
  Wrench,
} from 'lucide-react'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useLanguage } from '../../contexts/language-context'

type FlatOption = {
  value: string
  name: string
  description?: string
}

function flattenConfigOptions(option: SessionConfigOption): FlatOption[] {
  if (option.type !== 'select') return []
  const flat: FlatOption[] = []
  for (const item of option.options) {
    if ('options' in item) {
      for (const child of item.options) {
        flat.push({
          value: child.value,
          name: child.name,
          description: child.description ?? undefined,
        })
      }
    } else {
      flat.push({
        value: item.value,
        name: item.name,
        description: item.description ?? undefined,
      })
    }
  }
  return flat
}

const POPOVER_OPEN_EVENT = 'yolo-acp-popover-open'
let popoverSeq = 0

function usePopover() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const idRef = useRef<string>(`popover-${++popoverSeq}`)

  const setOpenWrapped = (next: boolean | ((prev: boolean) => boolean)) => {
    setOpen((prev) => {
      const value = typeof next === 'function' ? next(prev) : next
      if (value && !prev) {
        window.dispatchEvent(
          new CustomEvent(POPOVER_OPEN_EVENT, { detail: idRef.current }),
        )
      }
      return value
    })
  }

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !(
          target instanceof Element &&
          target.closest('.yolo-acp-select-popover')
        )
      ) {
        setOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const handleOtherOpen = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== idRef.current) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener(POPOVER_OPEN_EVENT, handleOtherOpen)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener(POPOVER_OPEN_EVENT, handleOtherOpen)
    }
  }, [open])
  return { open, setOpen: setOpenWrapped, containerRef }
}

function SelectPopover({
  open,
  anchorRef,
  align = 'left',
  children,
}: {
  open: boolean
  anchorRef: React.RefObject<HTMLDivElement | null>
  align?: 'left' | 'right'
  children: React.ReactNode
}) {
  const [style, setStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    if (!open || !anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const next: React.CSSProperties = {
      position: 'fixed',
      bottom: `${window.innerHeight - rect.top + 4}px`,
      maxHeight: Math.min(300, rect.top - 12),
    }
    if (align === 'right') {
      next.right = `${window.innerWidth - rect.right}px`
    } else {
      next.left = `${rect.left}px`
    }
    setStyle(next)
  }, [open, anchorRef, align])

  if (!open) return null
  return createPortal(
    <div
      className="yolo-popover-surface yolo-popover-surface--default yolo-model-select-popover yolo-acp-select-popover"
      style={style}
    >
      {children}
    </div>,
    document.body,
  )
}

export const ConfigOptionSelect = memo(function ConfigOptionSelect({
  option,
  icon,
  onChange,
}: {
  option: SessionConfigOption
  icon?: React.ReactNode
  onChange: (value: string) => void
}) {
  const { open, setOpen, containerRef } = usePopover()
  const flat = useMemo(() => flattenConfigOptions(option), [option])
  const currentValue = option.type === 'select' ? option.currentValue : ''
  const current = flat.find((item) => item.value === currentValue)

  return (
    <div className="yolo-acp-select" ref={containerRef}>
      <button
        type="button"
        className="yolo-chat-input-model-select"
        data-state={open ? 'open' : 'closed'}
        onClick={() => setOpen(!open)}
      >
        {icon}
        <div className="yolo-chat-input-model-select__label yolo-chat-input-model-select__model-name">
          {current?.name ?? option.name}
        </div>
        <div className="yolo-chat-input-model-select__icon">
          {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </div>
      </button>
      <SelectPopover open={open} anchorRef={containerRef} align="right">
        <div className="yolo-model-select-list" role="menu">
          {flat.map((item) => (
            <button
              key={item.value}
              type="button"
              role="menuitemradio"
              aria-checked={item.value === currentValue}
              data-state={item.value === currentValue ? 'checked' : 'unchecked'}
              className="yolo-popover-item"
              onClick={() => {
                setOpen(false)
                if (item.value !== currentValue) {
                  onChange(item.value)
                }
              }}
            >
              <span className="yolo-popover-item__label">{item.name}</span>
              <span className="yolo-popover-item__indicator">
                {item.value === currentValue ? <Check size={12} /> : null}
              </span>
            </button>
          ))}
        </div>
      </SelectPopover>
    </div>
  )
})

function modeIcon(modeId: string) {
  switch (modeId) {
    case 'plan':
      return <ListChecks size={16} />
    case 'build':
      return <Hammer size={16} />
    default:
      return <Wrench size={16} />
  }
}

export const ModeSelect = memo(function ModeSelect({
  current,
  available,
  onChange,
}: {
  current: string
  available: SessionMode[]
  onChange: (modeId: string) => void
}) {
  const { t } = useLanguage()
  const { open, setOpen, containerRef } = usePopover()
  const modes: SessionMode[] =
    available.length > 0
      ? available
      : [
          { id: 'build', name: 'build' },
          { id: 'plan', name: 'plan' },
        ]
  const active = modes.find((mode) => mode.id === current) ?? modes[0]

  const modeLabel = (mode: SessionMode) =>
    mode.id === 'plan'
      ? t('chat.modePlan', 'Plan')
      : mode.id === 'build'
        ? t('chat.modeBuild', 'Build')
        : mode.name

  return (
    <div className="yolo-acp-select" ref={containerRef}>
      <button
        type="button"
        className="yolo-chat-input-model-select yolo-chat-mode-select"
        data-state={open ? 'open' : 'closed'}
        onClick={() => setOpen(!open)}
      >
        <div className="yolo-chat-input-model-select__label">
          {modeLabel(active)}
        </div>
        <div className="yolo-chat-input-model-select__icon">
          {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </div>
      </button>
      <SelectPopover open={open} anchorRef={containerRef}>
        <div
          className="yolo-model-select-list yolo-chat-mode-select-list"
          role="menu"
        >
          {modes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              role="menuitemradio"
              aria-checked={mode.id === active.id}
              data-state={mode.id === active.id ? 'checked' : 'unchecked'}
              className="yolo-chat-mode-select-item"
              onClick={() => {
                setOpen(false)
                if (mode.id !== active.id) {
                  onChange(mode.id)
                }
              }}
            >
              <span className="yolo-chat-mode-select-item__icon">
                {modeIcon(mode.id)}
              </span>
              <span className="yolo-chat-mode-select-item__content">
                <span className="yolo-chat-mode-select-item__label">
                  {modeLabel(mode)}
                </span>
                {mode.description ? (
                  <span className="yolo-chat-mode-select-item__desc">
                    {mode.description}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      </SelectPopover>
    </div>
  )
})

export function findConfigOption(
  configOptions: SessionConfigOption[],
  category: string,
): SessionConfigOption | null {
  return configOptions.find((option) => option.category === category) ?? null
}

export const EFFORT_ICON = <Brain size={12} />

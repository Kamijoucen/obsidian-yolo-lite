import type {
  AvailableCommand,
  SessionConfigOption,
} from '@agentclientprotocol/sdk'
import { ArrowUp, ImagePlus, Square, X } from 'lucide-react'
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'

import { useLanguage } from '../../contexts/language-context'
import type { SessionModeState } from '../../types/chat'

import {
  ConfigOptionSelect,
  EFFORT_ICON,
  ModeSelect,
  findConfigOption,
} from './selects'

export type InputImage = {
  mimeType: string
  data: string
  previewUrl: string
}

type ChatInputProps = {
  running: boolean
  disabled: boolean
  commands: AvailableCommand[]
  mode: SessionModeState | null
  configOptions: SessionConfigOption[]
  onModeChange: (modeId: string) => void
  onConfigOptionChange: (configId: string, value: string) => void
  onSubmit: (text: string, images: InputImage[]) => void
  onCancel: () => void
}

function readImageFile(file: File): Promise<InputImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const match = result.match(/^data:([^;]+);base64,(.+)$/)
      if (!match) {
        reject(new Error('Failed to read image'))
        return
      }
      resolve({
        mimeType: match[1],
        data: match[2],
        previewUrl: result,
      })
    }
    reader.onerror = () => {
      reject(reader.error ?? new Error('Failed to read image'))
    }
    reader.readAsDataURL(file)
  })
}

function ChatInput({
  running,
  disabled,
  commands,
  mode,
  configOptions,
  onModeChange,
  onConfigOptionChange,
  onSubmit,
  onCancel,
}: ChatInputProps) {
  const { t } = useLanguage()
  const [text, setText] = useState('')
  const [images, setImages] = useState<InputImage[]>([])
  const [commandIndex, setCommandIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const commandQuery = useMemo(() => {
    if (!text.startsWith('/')) return null
    const firstLine = text.split('\n')[0]
    if (firstLine.includes(' ')) return null
    return firstLine.slice(1).toLowerCase()
  }, [text])

  const matchedCommands = useMemo(() => {
    if (commandQuery === null) return []
    return commands
      .filter((command) => command.name.toLowerCase().includes(commandQuery))
      .slice(0, 8)
  }, [commands, commandQuery])

  useEffect(() => {
    setCommandIndex(0)
  }, [commandQuery])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.setCssProps({ height: 'auto' })
    textarea.setCssProps({
      height: `${Math.min(textarea.scrollHeight, 160)}px`,
    })
  }, [text])

  const doSubmit = () => {
    const trimmed = text.trim()
    if ((!trimmed && images.length === 0) || disabled) return
    onSubmit(trimmed, images)
    setText('')
    setImages([])
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (matchedCommands.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setCommandIndex((index) =>
          Math.min(index + 1, matchedCommands.length - 1),
        )
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setCommandIndex((index) => Math.max(index - 1, 0))
        return
      }
      if (event.key === 'Tab' || (event.key === 'Enter' && !event.shiftKey)) {
        event.preventDefault()
        const command = matchedCommands[commandIndex]
        if (command) {
          setText(`/${command.name} `)
        }
        return
      }
    }
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      doSubmit()
    }
  }

  const handlePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        event.preventDefault()
        const file = item.getAsFile()
        if (file) {
          void readImageFile(file).then((image) => {
            setImages((prev) => [...prev, image])
          })
        }
        return
      }
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      void readImageFile(file).then((image) => {
        setImages((prev) => [...prev, image])
      })
    }
  }

  const modelOption = findConfigOption(configOptions, 'model')
  const effortOption =
    findConfigOption(configOptions, 'thought_level') ??
    configOptions.find((option) => option.id === 'effort') ??
    null

  return (
    <div className="yolo-chat-input-wrapper">
      {matchedCommands.length > 0 ? (
        <div className="yolo-popover-surface yolo-popover-surface--default yolo-acp-command-popup">
          <div className="yolo-model-select-list" role="menu">
            {matchedCommands.map((command, index) => (
              <button
                key={command.name}
                type="button"
                className={`yolo-popover-item${
                  index === commandIndex ? ' is-active' : ''
                }`}
                onMouseDown={(event) => {
                  event.preventDefault()
                  setText(`/${command.name} `)
                  textareaRef.current?.focus()
                }}
              >
                <span className="yolo-popover-item__label">
                  /{command.name}
                </span>
                <span className="yolo-acp-command-desc">
                  {command.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="yolo-chat-user-input-container">
        <div className="yolo-chat-user-input-wrapper">
          {images.length > 0 ? (
            <div className="yolo-chat-user-input-files">
              {images.map((image, index) => (
                <div key={index} className="yolo-acp-input-image">
                  <img src={image.previewUrl} alt="" />
                  <button
                    className="yolo-acp-input-image-remove"
                    onClick={() =>
                      setImages((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="yolo-chat-user-input-editor">
            <textarea
              ref={textareaRef}
              className="yolo-acp-textarea"
              placeholder={t('chat.inputPlaceholder', 'Ask anything…')}
              value={text}
              rows={1}
              disabled={disabled}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
            />
          </div>
          <div className="yolo-chat-user-input-send-row">
            <button
              type="button"
              className="yolo-chat-user-input-submit-button yolo-chat-user-input-upload-button"
              title={t('chat.attachImage', 'Attach image')}
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              <ImagePlus size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(event) => {
                handleFiles(event.target.files)
                event.target.value = ''
              }}
            />
            <div className="yolo-chat-user-input-send-row__right">
              {running ? (
                <button
                  type="button"
                  className="yolo-chat-user-input-submit-button-circle is-stop"
                  title={t('chat.stopGenerating', 'Stop')}
                  onClick={onCancel}
                >
                  <Square size={12} fill="currentColor" />
                </button>
              ) : (
                <button
                  type="button"
                  className="yolo-chat-user-input-submit-button-circle"
                  title={t('common.send', 'Send')}
                  onClick={doSubmit}
                  disabled={disabled || (!text.trim() && images.length === 0)}
                >
                  <ArrowUp size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="yolo-chat-user-input-toolbar">
        <div className="yolo-chat-user-input-toolbar__left">
          <ModeSelect
            current={mode?.current ?? 'build'}
            available={mode?.available ?? []}
            onChange={onModeChange}
          />
        </div>
        <div className="yolo-chat-user-input-toolbar__right">
          {effortOption ? (
            <ConfigOptionSelect
              option={effortOption}
              icon={EFFORT_ICON}
              onChange={(value) => onConfigOptionChange(effortOption.id, value)}
            />
          ) : null}
          {modelOption ? (
            <ConfigOptionSelect
              option={modelOption}
              onChange={(value) => onConfigOptionChange(modelOption.id, value)}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default ChatInput

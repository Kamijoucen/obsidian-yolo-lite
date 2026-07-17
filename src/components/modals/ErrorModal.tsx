import { App } from 'obsidian'

import { ReactModal } from '../common/ReactModal'

type ErrorModalOptions = {
  showReportBugButton?: boolean
  showSettingsButton?: boolean
}

type ErrorModalComponentProps = {
  app: App
  message: string
  log?: string
  options: ErrorModalOptions
}

export class ErrorModal extends ReactModal<ErrorModalComponentProps> {
  constructor(
    app: App,
    title: string,
    message: string,
    log?: string,
    options: ErrorModalOptions = {},
  ) {
    super({
      app: app,
      Component: ErrorModalComponent,
      props: {
        app,
        message,
        log,
        options,
      },
      options: {
        title,
      },
    })
  }
}

function ErrorModalComponent({
  app,
  message,
  log,
  onClose,
  options,
}: ErrorModalComponentProps & { onClose: () => void }) {
  return (
    <div className="yolo-error-modal-content">
      <div className="yolo-error-modal-message">{message}</div>
      {log && <pre className="yolo-error-modal-log">{log}</pre>}
      <div className="modal-button-container">
        {options.showReportBugButton && (
          <button
            className="mod-cta"
            onClick={() => {
              onClose()
              window.open(
                'https://github.com/Kamijoucen/obsidian-yolo-lite/issues',
                '_blank',
              )
            }}
          >
            Report Bug
          </button>
        )}
        {options.showSettingsButton && (
          <button
            className="mod-cta"
            onClick={() => {
              onClose()
              // @ts-expect-error: setting property exists in Obsidian's App but is not typed
              app.setting.open()
              // @ts-expect-error: setting property exists in Obsidian's App but is not typed
              app.setting.openTabById('yolo')
            }}
          >
            Open Settings
          </button>
        )}
        <button className="mod-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}

import { Loader2 } from 'lucide-react'
import { memo, useCallback } from 'react'

import { useLanguage } from '../../contexts/language-context'
import { useSessionService } from '../../contexts/service-context'
import type { AvailabilityState } from '../../core/acp/service'

type SetupBannerProps = {
  availability: AvailabilityState
  onOpenSettings: () => void
}

function SetupBanner({ availability, onOpenSettings }: SetupBannerProps) {
  const { t } = useLanguage()
  const service = useSessionService()
  const handleRetry = useCallback(() => {
    void service.ensureStarted().catch(() => undefined)
  }, [service])

  if (availability === 'ready' || availability === 'unknown') {
    return null
  }

  if (availability === 'starting') {
    return (
      <div className="yolo-setup-banner is-starting">
        <Loader2 size={18} className="yolo-setup-spinner" />
        <div>
          <div className="yolo-setup-title">
            {t('setup.starting', 'Starting…')}
          </div>
          <div className="yolo-setup-hint">
            {t('setup.startingHint', 'This may take a few seconds.')}
          </div>
        </div>
      </div>
    )
  }

  const error = service.getStartError()
  const isNotFound = error === 'opencode-not-found'

  return (
    <div className="yolo-setup-banner is-error">
      <div className="yolo-setup-title">
        {isNotFound
          ? t('setup.notFound', 'opencode binary not found')
          : error
            ? error
            : t('setup.exited', 'opencode process exited')}
      </div>
      {isNotFound ? (
        <div className="yolo-setup-hint">
          {t(
            'setup.notFoundHint',
            'Install opencode and make sure `opencode` is on PATH, or set the binary path in settings.',
          )}
        </div>
      ) : null}
      <div className="yolo-setup-actions">
        <button className="yolo-button" onClick={handleRetry}>
          {t('common.retry', 'Retry')}
        </button>
        <button className="yolo-button" onClick={onOpenSettings}>
          {t('setup.openSettings', 'Open settings')}
        </button>
      </div>
    </div>
  )
}

export default memo(SetupBanner)

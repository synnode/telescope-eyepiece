import { Menu, Pause, Play, RefreshCw, Trash2 } from 'lucide-react'
import { Logo } from './Logo'

type Props = {
  appName?: string
  isPolling: boolean
  onPauseToggle: () => void
  onClear: () => void
  onRefresh: () => void
  onMenuToggle: () => void
}

export function Header({
  appName,
  isPolling,
  onPauseToggle,
  onClear,
  onRefresh,
  onMenuToggle,
}: Props) {
  return (
    <header className="app-header">
      <div className="app-header__left">
        <button
          type="button"
          className="icon-btn app-header__menu"
          aria-label="Toggle navigation"
          onClick={onMenuToggle}
        >
          <Menu size={16} />
        </button>
        <Logo />
        <span className="brand">Laravel Telescope</span>
        {appName && (
          <>
            <span className="brand-sep">/</span>
            <span className="brand-app">{appName}</span>
          </>
        )}
      </div>

      <div className="app-header__right">
        <span className="live-pill" aria-live="polite">
          <span className={'live-dot' + (isPolling ? '' : ' is-paused')} />
          {isPolling ? 'Live' : 'Paused'}
        </span>
        <button
          type="button"
          className="icon-btn"
          aria-label={isPolling ? 'Pause polling' : 'Resume polling'}
          title={isPolling ? 'Pause polling' : 'Resume polling'}
          onClick={onPauseToggle}
        >
          {isPolling ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Clear entries"
          title="Clear entries"
          onClick={onClear}
        >
          <Trash2 size={15} />
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--primary"
          aria-label="Refresh"
          title="Refresh"
          onClick={onRefresh}
        >
          <RefreshCw size={15} />
        </button>
      </div>
    </header>
  )
}

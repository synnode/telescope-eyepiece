import { Menu, Moon, Pause, Play, RefreshCw, Sun, Trash2 } from 'lucide-react'
import { Logo } from './Logo'
import type { EntryStatus } from '../lib/api'
import type { Theme } from '../lib/theme'

type Props = {
  appName?: string
  recordingStatus: EntryStatus
  isPolling: boolean
  onRecordingToggle: () => void
  onPollingToggle: () => void
  onClear: () => void
  onMenuToggle: () => void
  theme: Theme
  onThemeToggle: () => void
}

export function Header({
  appName,
  recordingStatus,
  isPolling,
  onRecordingToggle,
  onPollingToggle,
  onClear,
  onMenuToggle,
  theme,
  onThemeToggle,
}: Props) {
  const isRecording = recordingStatus === 'enabled'
  const pillLabel = recordingStatus === 'paused'
    ? 'Paused'
    : recordingStatus === 'disabled' || recordingStatus === 'off'
      ? 'Off'
      : 'Live'

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
          <span className={'live-dot' + (isRecording ? '' : ' is-paused')} />
          {pillLabel}
        </span>
        <button
          type="button"
          className="icon-btn"
          aria-label={isRecording ? 'Pause recording' : 'Resume recording'}
          title={isRecording ? 'Pause Telescope recording' : 'Resume Telescope recording'}
          onClick={onRecordingToggle}
        >
          {isRecording ? <Pause size={15} /> : <Play size={15} />}
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
          className="icon-btn"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={onThemeToggle}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button
          type="button"
          className={'icon-btn' + (isPolling ? ' icon-btn--primary' : '')}
          aria-label={isPolling ? 'Disable auto-refresh' : 'Enable auto-refresh'}
          title={isPolling ? 'Auto-refresh on — click to pause' : 'Auto-refresh off — click to resume'}
          aria-pressed={isPolling}
          onClick={onPollingToggle}
        >
          <RefreshCw size={15} />
        </button>
      </div>
    </header>
  )
}

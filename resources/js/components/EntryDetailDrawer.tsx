import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

type Props = {
  isOpen: boolean
  onClose: () => void
  eyebrow: string
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
}

export function EntryDetailDrawer({
  isOpen,
  onClose,
  eyebrow,
  title,
  subtitle,
  children,
}: Props) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={eyebrow}>
        <div className="drawer__head">
          <div className="drawer__head-top">
            <span className="drawer__eyebrow">{eyebrow}</span>
            <button
              type="button"
              className="drawer__close"
              aria-label="Close detail"
              onClick={onClose}
            >
              <X size={14} />
            </button>
          </div>
          <div className="drawer__title">{title}</div>
          {subtitle && <div className="drawer__subtitle">{subtitle}</div>}
        </div>
        <div className="drawer__body">{children}</div>
      </aside>
    </>
  )
}

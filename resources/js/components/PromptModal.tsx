import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

type Props = {
  isOpen: boolean
  title: string
  label?: string
  placeholder?: string
  defaultValue?: string
  submitLabel?: string
  onSubmit: (value: string) => void
  onCancel: () => void
}

export function PromptModal({
  isOpen,
  title,
  label,
  placeholder,
  defaultValue = '',
  submitLabel = 'Save',
  onSubmit,
  onCancel,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    if (isOpen) setValue(defaultValue)
  }, [isOpen, defaultValue])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    inputRef.current?.focus()
    inputRef.current?.select()
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onCancel} aria-hidden="true" />
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <form onSubmit={handleSubmit}>
          <div className="modal__head">
            <span className="modal__title">{title}</span>
            <button
              type="button"
              className="modal__close"
              aria-label="Cancel"
              onClick={onCancel}
            >
              <X size={14} />
            </button>
          </div>
          <div className="modal__body">
            {label && <label className="modal__label">{label}</label>}
            <input
              ref={inputRef}
              type="text"
              className="modal__input"
              placeholder={placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="modal__foot">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-resolve"
              disabled={!value.trim()}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

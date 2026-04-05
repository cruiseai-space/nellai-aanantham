import type { ReactNode } from 'react'
import { X } from 'lucide-react'

type SimpleModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** Wider modal for complex forms (matches admin validation preview max width feel). */
  wide?: boolean
}

/**
 * Modal shell aligned with `designs/Web Version/data_validation_preview_modal/code.html`:
 * blurred backdrop, elevated surface, rounded-2xl, ambient shadow.
 */
export function SimpleModal({ open, title, onClose, children, footer, wide }: SimpleModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`
          bg-surface-elevated rounded-2xl admin-modal-ambient max-h-[90vh] overflow-hidden flex flex-col
          w-full ${wide ? 'max-w-2xl' : 'max-w-lg'}
        `}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container">
          <h2 id="modal-title" className="text-lg font-display font-bold text-on-surface">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-container text-on-surface-secondary transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-surface-container flex gap-2 justify-end flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

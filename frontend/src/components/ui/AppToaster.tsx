import { Toaster } from 'sonner'

/**
 * Toast host styled to match `designs/Web Version/toast_notification_system/code.html`:
 * rounded card, left accent bar, display font on title, body text for description.
 */
export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      closeButton
      duration={4800}
      visibleToasts={5}
      toastOptions={{
        classNames: {
          toast:
            'w-[min(100vw-2rem,22rem)] rounded-xl border border-surface-container bg-surface-elevated shadow-dropdown pl-3 pr-8',
          title: 'font-display font-bold text-sm text-on-surface',
          description: 'text-xs text-on-surface-secondary',
          error: '!border-l-4 !border-l-[hsl(0,72%,51%)]',
          success: '!border-l-4 !border-l-[hsl(145,63%,42%)]',
          info: '!border-l-4 !border-l-[#E91E8C]',
          warning: '!border-l-4 !border-l-amber-500',
        },
      }}
    />
  )
}

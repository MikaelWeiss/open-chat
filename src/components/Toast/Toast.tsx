import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { useToastStore } from '@/stores/settingsStore'
import clsx from 'clsx'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

const ToastIcon = ({ type }: { type: Toast['type'] }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'error':
      return <XCircle className="h-5 w-5 text-red-500" />
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    case 'info':
      return <Info className="h-5 w-5 text-blue-500" />
  }
}

const ToastItem = ({ toast }: { toast: Toast }) => {
  const { removeToast } = useToastStore()

  return (
    <div
      className={clsx(
        'pointer-events-auto w-full max-w-md min-w-[280px] overflow-hidden rounded-lg bg-background shadow-lg ring-1 ring-border border',
        'transform transition-all duration-300 ease-in-out translate-x-0 opacity-100'
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ToastIcon type={toast.type} />
          </div>
          <div className="ml-3 flex-1 pt-0.5 min-w-0">
            <p className="text-sm font-medium text-foreground break-words">{toast.title}</p>
            {toast.message && (
              <p className="mt-1 text-sm text-muted-foreground break-words">{toast.message}</p>
            )}
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              className="inline-flex rounded-md bg-background text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={() => removeToast(toast.id)}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts } = useToastStore()

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed bottom-0 right-0 flex flex-col items-end px-4 py-6 space-y-4 z-50"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
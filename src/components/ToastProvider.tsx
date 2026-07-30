import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ToastContext } from './ToastContext'

interface Toast {
  id: number
  mensaje: string
}

const DURACION_MS = 3000

function IconoCheck() {
  return (
    <svg aria-hidden="true" className="toast-icon" viewBox="0 0 24 24">
      <path
        d="M5 13l4 4L19 7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const siguienteId = useRef(0)

  const mostrarToast = useCallback((mensaje: string) => {
    const id = siguienteId.current
    siguienteId.current += 1
    setToasts((actuales) => [...actuales, { id, mensaje }])

    setTimeout(() => {
      setToasts((actuales) => actuales.filter((toast) => toast.id !== id))
    }, DURACION_MS)
  }, [])

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <div aria-atomic="true" aria-live="polite" className="toast-stack">
        {toasts.map((toast) => (
          <div className="toast-item" key={toast.id} role="status">
            <IconoCheck />
            {toast.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

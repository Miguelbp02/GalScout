import { createContext, useContext } from 'react'

export interface ToastContextValue {
  mostrarToast: (mensaje: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const contexto = useContext(ToastContext)

  if (!contexto) {
    throw new Error('useToast debe usarse dentro de un ToastProvider')
  }

  return contexto
}

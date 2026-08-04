import { createContext, useContext } from 'react'
import type { ModoJugadores } from '../types/modoJugadores'

export interface ModoJugadoresContextValue {
  modo: ModoJugadores
  alternarModo: () => void
}

export const ModoJugadoresContext = createContext<ModoJugadoresContextValue | null>(null)

export function useModoJugadores() {
  const contexto = useContext(ModoJugadoresContext)

  if (!contexto) {
    throw new Error('useModoJugadores debe usarse dentro de un ModoJugadoresProvider')
  }

  return contexto
}

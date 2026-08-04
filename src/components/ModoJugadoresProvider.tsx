import { useCallback, useState, type ReactNode } from 'react'
import { ModoJugadoresContext } from './ModoJugadoresContext'
import { useEsDesarrollador } from '../hooks/useEsDesarrollador'
import type { ModoJugadores } from '../types/modoJugadores'

const CLAVE_ALMACENAMIENTO = 'ojeo-modo-jugadores'

function cargarModoGuardado(): ModoJugadores {
  try {
    return window.localStorage.getItem(CLAVE_ALMACENAMIENTO) === 'ficticios'
      ? 'ficticios'
      : 'reales'
  } catch {
    return 'reales'
  }
}

export function ModoJugadoresProvider({ children }: { children: ReactNode }) {
  const esDesarrollador = useEsDesarrollador()
  const [modo, setModo] = useState<ModoJugadores>(cargarModoGuardado)

  const alternarModo = useCallback(() => {
    setModo((modoActual) => {
      const siguienteModo: ModoJugadores = modoActual === 'reales' ? 'ficticios' : 'reales'

      try {
        window.localStorage.setItem(CLAVE_ALMACENAMIENTO, siguienteModo)
      } catch {
        // Si el almacenamiento no está disponible, el modo sigue funcionando en memoria.
      }

      return siguienteModo
    })
  }, [])

  // Solo los perfiles de desarrollador pueden salir del modo "reales", aunque
  // quede un valor de una sesión anterior guardado en este navegador.
  const modoEfectivo: ModoJugadores = esDesarrollador ? modo : 'reales'

  return (
    <ModoJugadoresContext.Provider value={{ modo: modoEfectivo, alternarModo }}>
      {children}
    </ModoJugadoresContext.Provider>
  )
}

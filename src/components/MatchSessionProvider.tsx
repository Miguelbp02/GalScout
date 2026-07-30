import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  MatchSessionContext,
  type ConfiguracionInicialPartido,
  type MatchSessionContextValue,
} from './MatchSessionContext'
import type { AccionRegistrada, SesionPartido } from '../types/matchSession'

const CLAVE_ALMACENAMIENTO = 'ojeo-partido-sesion'

function generarId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function cargarSesionGuardada(): SesionPartido | null {
  try {
    const bruto = window.localStorage.getItem(CLAVE_ALMACENAMIENTO)
    if (!bruto) return null

    return JSON.parse(bruto) as SesionPartido
  } catch {
    return null
  }
}

function hayInformesAMedias(sesion: SesionPartido) {
  return sesion.jugadores.some(
    (jugador) =>
      !sesion.jugadoresGuardados.includes(jugador.id) &&
      Boolean(sesion.informesPorJugador[jugador.id]?.trim()),
  )
}

export function MatchSessionProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<SesionPartido | null>(cargarSesionGuardada)
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (sesion) {
      window.localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(sesion))
    } else {
      window.localStorage.removeItem(CLAVE_ALMACENAMIENTO)
    }
  }, [sesion])

  useEffect(() => {
    const corriendo = sesion?.corriendo === true

    if (!corriendo) {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current)
        intervaloRef.current = null
      }
      return
    }

    intervaloRef.current = setInterval(() => {
      setSesion((actual) =>
        actual ? { ...actual, segundos: actual.segundos + 1 } : actual,
      )
    }, 1000)

    return () => {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current)
        intervaloRef.current = null
      }
    }
  }, [sesion?.corriendo])

  const iniciarPartido = useCallback((configuracion: ConfiguracionInicialPartido) => {
    setSesion({
      jugadores: configuracion.jugadores,
      nombreEquipoA: configuracion.nombreEquipoA,
      nombreEquipoB: configuracion.nombreEquipoB,
      competicion: configuracion.competicion,
      jornada: configuracion.jornada,
      ladoEquipoA: configuracion.ladoEquipoA,
      estado: 'primera_parte',
      corriendo: false,
      segundos: 0,
      parte: 1,
      acciones: [],
      informesPorJugador: Object.fromEntries(
        configuracion.jugadores.map((jugador) => [jugador.id, '']),
      ),
      jugadoresGuardados: [],
      pestanaActiva: configuracion.jugadores[0]?.id ?? null,
      puntuacionesPorJugador: {},
    })
  }, [])

  const cambiarLadoEquipoA = useCallback(() => {
    setSesion((actual) =>
      actual
        ? {
            ...actual,
            ladoEquipoA: actual.ladoEquipoA === 'izquierda' ? 'derecha' : 'izquierda',
          }
        : actual,
    )
  }, [])

  const iniciarCronometro = useCallback(() => {
    setSesion((actual) => (actual ? { ...actual, corriendo: true } : actual))
  }, [])

  const pausarCronometro = useCallback(() => {
    setSesion((actual) => (actual ? { ...actual, corriendo: false } : actual))
  }, [])

  const irADescanso = useCallback(() => {
    setSesion((actual) =>
      actual ? { ...actual, estado: 'descanso', corriendo: false } : actual,
    )
  }, [])

  const iniciarSegundaParte = useCallback(() => {
    setSesion((actual) =>
      actual
        ? { ...actual, estado: 'segunda_parte', parte: 2, corriendo: false }
        : actual,
    )
  }, [])

  const finalizarPartido = useCallback(() => {
    setSesion((actual) =>
      actual ? { ...actual, estado: 'finalizado', corriendo: false } : actual,
    )
  }, [])

  const ajustarMinuto = useCallback((minuto: number) => {
    setSesion((actual) =>
      actual ? { ...actual, segundos: Math.max(0, minuto) * 60 } : actual,
    )
  }, [])

  const agregarAccion = useCallback(
    (accion: Omit<AccionRegistrada, 'id' | 'parte'>) => {
      setSesion((actual) => {
        if (!actual) return actual

        const nuevaAccion: AccionRegistrada = {
          ...accion,
          id: generarId(),
          parte: actual.parte,
        }

        return { ...actual, acciones: [...actual.acciones, nuevaAccion] }
      })
    },
    [],
  )

  const eliminarAccion = useCallback((accionId: string) => {
    setSesion((actual) =>
      actual
        ? {
            ...actual,
            acciones: actual.acciones.filter((accion) => accion.id !== accionId),
          }
        : actual,
    )
  }, [])

  const actualizarInforme = useCallback((jugadorId: string, texto: string) => {
    setSesion((actual) =>
      actual
        ? {
            ...actual,
            informesPorJugador: { ...actual.informesPorJugador, [jugadorId]: texto },
          }
        : actual,
    )
  }, [])

  const marcarInformeGuardado = useCallback((jugadorId: string) => {
    setSesion((actual) =>
      actual && !actual.jugadoresGuardados.includes(jugadorId)
        ? { ...actual, jugadoresGuardados: [...actual.jugadoresGuardados, jugadorId] }
        : actual,
    )
  }, [])

  const cambiarPestanaActiva = useCallback((jugadorId: string) => {
    setSesion((actual) => (actual ? { ...actual, pestanaActiva: jugadorId } : actual))
  }, [])

  const actualizarPuntuacionJugador = useCallback(
    (jugadorId: string, criterioId: number, valor: string) => {
      setSesion((actual) =>
        actual
          ? {
              ...actual,
              puntuacionesPorJugador: {
                ...actual.puntuacionesPorJugador,
                [jugadorId]: {
                  ...actual.puntuacionesPorJugador[jugadorId],
                  [criterioId]: valor,
                },
              },
            }
          : actual,
      )
    },
    [],
  )

  const cerrarSesion = useCallback((): boolean => {
    if (!sesion) return true

    if (hayInformesAMedias(sesion)) {
      const confirmado = window.confirm(
        'Todavía hay informes sin guardar en esta sesión. Si cierras ahora se perderán. ¿Seguro que quieres cerrar?',
      )
      if (!confirmado) return false
    }

    setSesion(null)
    return true
  }, [sesion])

  const valor: MatchSessionContextValue = {
    sesion,
    iniciarPartido,
    cambiarLadoEquipoA,
    iniciarCronometro,
    pausarCronometro,
    irADescanso,
    iniciarSegundaParte,
    finalizarPartido,
    ajustarMinuto,
    agregarAccion,
    eliminarAccion,
    actualizarInforme,
    marcarInformeGuardado,
    cambiarPestanaActiva,
    actualizarPuntuacionJugador,
    cerrarSesion,
  }

  return (
    <MatchSessionContext.Provider value={valor}>
      {children}
    </MatchSessionContext.Provider>
  )
}

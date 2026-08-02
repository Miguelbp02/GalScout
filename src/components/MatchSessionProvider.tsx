import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  MatchSessionContext,
  type ConfiguracionInicialPartido,
  type MatchSessionContextValue,
} from './MatchSessionContext'
import type { AccionRegistrada, LadoCampo, SesionPartido } from '../types/matchSession'

const CLAVE_ALMACENAMIENTO = 'ojeo-partido-sesion'

function generarId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function ladoOpuesto(lado: LadoCampo): LadoCampo {
  return lado === 'izquierda' ? 'derecha' : 'izquierda'
}

function calcularDireccionAtaque(sesion: SesionPartido, jugadorId: string): LadoCampo {
  const jugador = sesion.jugadores.find((item) => item.id === jugadorId)
  const ladoDelJugador =
    !jugador || jugador.equipo === 'A' ? sesion.ladoEquipoA : ladoOpuesto(sesion.ladoEquipoA)

  return ladoOpuesto(ladoDelJugador)
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

  const agregarJugador = useCallback((jugador: SesionPartido['jugadores'][number]) => {
    setSesion((actual) => {
      if (
        !actual ||
        actual.jugadores.length >= 4 ||
        actual.jugadores.some((item) => item.id === jugador.id)
      ) {
        return actual
      }

      return {
        ...actual,
        jugadores: [...actual.jugadores, jugador],
        informesPorJugador: { ...actual.informesPorJugador, [jugador.id]: '' },
        puntuacionesPorJugador: { ...actual.puntuacionesPorJugador, [jugador.id]: {} },
        pestanaActiva: jugador.id,
      }
    })
  }, [])

  const eliminarJugador = useCallback((jugadorId: string) => {
    setSesion((actual) => {
      if (!actual) return actual

      const jugadores = actual.jugadores.filter((jugador) => jugador.id !== jugadorId)
      const informesPorJugador = { ...actual.informesPorJugador }
      const puntuacionesPorJugador = { ...actual.puntuacionesPorJugador }
      delete informesPorJugador[jugadorId]
      delete puntuacionesPorJugador[jugadorId]

      return {
        ...actual,
        jugadores,
        acciones: actual.acciones.filter((accion) => accion.jugadorId !== jugadorId),
        informesPorJugador,
        puntuacionesPorJugador,
        jugadoresGuardados: actual.jugadoresGuardados.filter((id) => id !== jugadorId),
        pestanaActiva:
          actual.pestanaActiva === jugadorId
            ? (jugadores[0]?.id ?? null)
            : actual.pestanaActiva,
      }
    })
  }, [])

  const reordenarJugadores = useCallback(
    (jugadorId: string, jugadorDestinoId: string) => {
      if (jugadorId === jugadorDestinoId) return

      setSesion((actual) => {
        if (!actual) return actual

        const indiceOrigen = actual.jugadores.findIndex(
          (jugador) => jugador.id === jugadorId,
        )
        const indiceDestino = actual.jugadores.findIndex(
          (jugador) => jugador.id === jugadorDestinoId,
        )
        if (indiceOrigen < 0 || indiceDestino < 0) return actual

        const jugadores = [...actual.jugadores]
        const [jugadorMovido] = jugadores.splice(indiceOrigen, 1)
        jugadores.splice(indiceDestino, 0, jugadorMovido)
        return { ...actual, jugadores }
      })
    },
    [],
  )

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
        ? {
            ...actual,
            estado: 'segunda_parte',
            parte: 2,
            corriendo: true,
            ladoEquipoA: actual.ladoEquipoA === 'izquierda' ? 'derecha' : 'izquierda',
          }
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
    (accion: Omit<AccionRegistrada, 'id' | 'parte' | 'direccionAtaque'>) => {
      setSesion((actual) => {
        if (!actual) return actual

        const nuevaAccion: AccionRegistrada = {
          ...accion,
          id: generarId(),
          parte: actual.parte,
          direccionAtaque: calcularDireccionAtaque(actual, accion.jugadorId),
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
    agregarJugador,
    eliminarJugador,
    reordenarJugadores,
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

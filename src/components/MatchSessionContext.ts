import { createContext, useContext } from 'react'
import type {
  AccionRegistrada,
  JugadorSeguido,
  LadoCampo,
  SesionPartido,
} from '../types/matchSession'

export interface ConfiguracionInicialPartido {
  jugadores: JugadorSeguido[]
  nombreEquipoA: string
  nombreEquipoB: string
  competicion: string
  jornada: string
  ladoEquipoA: LadoCampo
}

export interface MatchSessionContextValue {
  sesion: SesionPartido | null
  iniciarPartido: (configuracion: ConfiguracionInicialPartido) => void
  agregarJugador: (jugador: JugadorSeguido) => void
  eliminarJugador: (jugadorId: string) => void
  reordenarJugadores: (jugadorId: string, jugadorDestinoId: string) => void
  cambiarLadoEquipoA: () => void
  iniciarCronometro: () => void
  pausarCronometro: () => void
  irADescanso: () => void
  iniciarSegundaParte: () => void
  finalizarPartido: () => void
  ajustarMinuto: (minuto: number) => void
  agregarAccion: (accion: Omit<AccionRegistrada, 'id' | 'parte' | 'direccionAtaque'>) => void
  eliminarAccion: (accionId: string) => void
  actualizarInforme: (jugadorId: string, texto: string) => void
  marcarInformeGuardado: (jugadorId: string) => void
  cambiarPestanaActiva: (jugadorId: string) => void
  actualizarPuntuacionJugador: (
    jugadorId: string,
    criterioId: number,
    valor: string,
  ) => void
  cerrarSesion: () => boolean
}

export const MatchSessionContext = createContext<MatchSessionContextValue | null>(null)

export function useMatchSession() {
  const contexto = useContext(MatchSessionContext)

  if (!contexto) {
    throw new Error('useMatchSession debe usarse dentro de un MatchSessionProvider')
  }

  return contexto
}

import type { PerfilScouting } from './criterio'

export type LadoCampo = 'izquierda' | 'derecha'
export type EquipoSesion = 'A' | 'B'
export type EstadoPartido =
  | 'configuracion'
  | 'primera_parte'
  | 'descanso'
  | 'segunda_parte'
  | 'finalizado'

export interface JugadorSeguido {
  id: string
  nombre: string
  perfilScouting: PerfilScouting
  equipo: EquipoSesion
  color: string
}

export interface AccionRegistrada {
  id: string
  jugadorId: string
  etiquetaId: number
  etiquetaNombre: string
  esSustitucion: boolean
  minuto: number
  parte: 1 | 2
  direccionAtaque: LadoCampo
  x: number
  y: number
  notaLibre: string
}

export interface SesionPartido {
  jugadores: JugadorSeguido[]
  nombreEquipoA: string
  nombreEquipoB: string
  competicion: string
  jornada: string
  ladoEquipoA: LadoCampo
  estado: EstadoPartido
  corriendo: boolean
  segundos: number
  parte: 1 | 2
  acciones: AccionRegistrada[]
  informesPorJugador: Record<string, string>
  jugadoresGuardados: string[]
  pestanaActiva: string | null
  puntuacionesPorJugador: Record<string, Record<number, string>>
}

export const COLORES_JUGADOR = ['#61a96b', '#4d83b5', '#c6a73c', '#cf4b54'] as const

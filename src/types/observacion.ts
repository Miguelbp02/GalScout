import type { NuevaValoracionObservacion } from './criterio'

export type TipoObservacion = 'partido' | 'entrenamiento' | 'otro'

export interface ValoracionObservacion {
  criterioNombre: string
  puntuacion: number
}

export interface ObservacionJugador {
  id: string
  tipo: TipoObservacion | null
  fechaObservacion: string
  notas: string
  createdAt: string
  autorNombre: string
  equipoJugador: string | null
  equipoRival: string | null
  competicion: string | null
  jornada: string | null
  valoraciones: ValoracionObservacion[]
}

export interface NuevaObservacion {
  tipo: TipoObservacion
  fechaObservacion: string
  notas: string
  equipoJugador: string
  equipoRival: string
  competicion: string
  jornada: string
  valoraciones: NuevaValoracionObservacion[]
}

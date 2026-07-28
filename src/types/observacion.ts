import type { NuevaValoracionObservacion } from './criterio'

export interface ValoracionObservacion {
  criterioNombre: string
  puntuacion: number
}

export interface ObservacionJugador {
  id: string
  fechaObservacion: string
  notas: string
  createdAt: string
  autorNombre: string
  valoraciones: ValoracionObservacion[]
}

export interface NuevaObservacion {
  fechaObservacion: string
  notas: string
  valoraciones: NuevaValoracionObservacion[]
}

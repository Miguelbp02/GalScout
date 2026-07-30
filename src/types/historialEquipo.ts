export interface HistorialEquipoJugador {
  id: string
  equipoNombre: string
  temporada: string | null
  goles: number | null
  partidos: number | null
  notas: string
  esActual: boolean
}

export interface NuevoHistorialEquipo {
  nombreEquipo: string
  temporada: string
  goles: number | null
  partidos: number | null
  notas: string
}

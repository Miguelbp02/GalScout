import type { CategoriaJugador } from './jugador'

export interface HistorialEquipoJugador {
  id: string
  equipoNombre: string
  temporada: string | null
  categoria: CategoriaJugador | null
  liga: string | null
  grupoProvincia: string | null
  dorsal: number | null
  goles: number | null
  partidos: number | null
  notas: string
  esActual: boolean
}

export interface NuevoHistorialEquipo {
  nombreEquipo: string
  temporada: string
  categoria: CategoriaJugador | ''
  liga: string
  grupoProvincia: string
  dorsal: number | null
  goles: number | null
  partidos: number | null
  notas: string
  marcarComoActual: boolean
}

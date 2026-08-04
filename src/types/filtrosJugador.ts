import type { EstadoJugador, PiernaDominante } from './jugador'

export type OrdenJugadores = '' | 'edad-asc' | 'edad-desc' | 'altura-asc' | 'altura-desc'

export interface FiltrosJugadores {
  nombre: string
  edadMinima: number
  edadMaxima: number
  alturaMinima: number
  alturaMaxima: number
  piernaDominante: '' | PiernaDominante
  estado: '' | EstadoJugador
  posicionNatural: string
  orden: OrdenJugadores
  soloFicticios: boolean
}

export const limitesFiltrosJugadores = {
  edadMinima: 10,
  edadMaxima: 30,
  alturaMinima: 130,
  alturaMaxima: 220,
}

export const filtrosJugadoresIniciales: FiltrosJugadores = {
  nombre: '',
  edadMinima: limitesFiltrosJugadores.edadMinima,
  edadMaxima: limitesFiltrosJugadores.edadMaxima,
  alturaMinima: limitesFiltrosJugadores.alturaMinima,
  alturaMaxima: limitesFiltrosJugadores.alturaMaxima,
  piernaDominante: '',
  estado: '',
  posicionNatural: '',
  orden: '',
  soloFicticios: false,
}

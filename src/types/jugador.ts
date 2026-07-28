export type EstadoJugador = 'En equipo' | 'Libre'

export type PiernaDominante = 'Derecha' | 'Izquierda' | 'Ambas'

export interface DatosJugador {
  nombre: string
  edad: number
  alturaCm: number
  // Resumen heredado mientras las tarjetas antiguas usan texto.
  posicion: string
  piernaDominante: PiernaDominante
  estado: EstadoJugador
}

export interface Jugador extends DatosJugador {
  id: string
  posicionesNaturalesIds: number[]
  posicionesAptasIds: number[]
  totalInformes: number
}

export interface NuevoJugador {
  nombre: string
  edad: number
  alturaCm: number
  posicionesNaturalesIds: number[]
  posicionesAptasIds: number[]
  piernaDominante: PiernaDominante
  estado: EstadoJugador
}

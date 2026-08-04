export type EstadoJugador = 'En equipo' | 'Libre'

export type PiernaDominante = 'Derecha' | 'Izquierda' | 'Ambas'

export type CategoriaJugador = 'Cadete' | 'Juvenil' | 'Senior'

export interface DatosJugador {
  nombre: string
  edad: number
  alturaCm: number
  // Resumen heredado mientras las tarjetas antiguas usan texto.
  posicion: string
  piernaDominante: PiernaDominante
  estado: EstadoJugador
  categoria: CategoriaJugador | null
  equipoActual: string | null
  esFicticio: boolean
}

export interface Jugador extends DatosJugador {
  id: string
  posicionesNaturalesIds: number[]
  posicionesAptasIds: number[]
  totalInformes: number
  dorsalActual: number | null
}

export interface NuevoJugador {
  nombre: string
  edad: number
  alturaCm: number
  posicionesNaturalesIds: number[]
  posicionesAptasIds: number[]
  piernaDominante: PiernaDominante
  estado: EstadoJugador
  categoria: CategoriaJugador | ''
  equipoActual: string
  esFicticio: boolean
}

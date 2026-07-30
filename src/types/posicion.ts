export type GrupoPosicion = 'Defensa' | 'Centrocampo' | 'Ataque' | 'Portería'

export interface Posicion {
  id: number
  codigo: string
  nombre: string
  grupo: GrupoPosicion
  orden: number
}

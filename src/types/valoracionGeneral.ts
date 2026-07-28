export interface ValoracionGeneral {
  id: string
  fechaValoracion: string
  puntuacion: number
  comentario: string
  createdAt: string
  autorNombre: string
}

export interface NuevaValoracionGeneral {
  fechaValoracion: string
  puntuacion: number
  comentario: string
}

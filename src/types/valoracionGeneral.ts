export interface ValoracionGeneral {
  id: string
  fechaValoracion: string
  comentario: string
  createdAt: string
  autorNombre: string
}

export interface NuevaValoracionGeneral {
  fechaValoracion: string
  comentario: string
}

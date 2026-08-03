export type TipoSugerencia = 'bug' | 'mejora'

export interface Sugerencia {
  id: string
  tipo: TipoSugerencia
  mensaje: string
  createdAt: string
  autorId: string
  autorNombre: string
}

export interface NuevaSugerencia {
  tipo: TipoSugerencia
  mensaje: string
}

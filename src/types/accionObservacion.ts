import type { PerfilScouting } from './criterio'

export type CategoriaEtiquetaAccion = 'positiva' | 'negativa' | 'neutra'

export interface EtiquetaAccion {
  id: number
  nombre: string
  categoria: CategoriaEtiquetaAccion
  perfil: PerfilScouting
  orden: number
  esSustitucion: boolean
}

export interface NuevaAccionObservacion {
  etiquetaId: number
  minuto: number
  parte: 1 | 2
  x: number
  y: number
  notaLibre: string
}

export interface AccionObservacion {
  id: string
  etiquetaId: number
  etiquetaNombre: string
  categoria: CategoriaEtiquetaAccion
  minuto: number
  parte: 1 | 2
  x: number
  y: number
  notaLibre: string
}

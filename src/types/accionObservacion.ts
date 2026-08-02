import type { PerfilScouting } from './criterio'
import type { LadoCampo } from './matchSession'

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
  direccionAtaque: LadoCampo
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
  direccionAtaque: LadoCampo
  x: number
  y: number
  notaLibre: string
}

export interface AccionObservacionDePartido extends AccionObservacion {
  observacionId: string
}

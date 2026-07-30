export type GrupoCriterio = 'Físico' | 'Técnico' | 'Táctico' | 'Mental'
export type PerfilScouting = 'campo' | 'portero'

export interface CriterioScouting {
  id: number
  nombre: string
  grupo: GrupoCriterio
  orden: number
  perfil: PerfilScouting
}

export interface NuevaValoracionObservacion {
  criterioId: number
  puntuacion: number
}

export interface ResumenValoracionCriterio extends CriterioScouting {
  media: number
  totalInformes: number
}

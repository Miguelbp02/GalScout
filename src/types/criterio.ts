export type GrupoCriterio = 'Físico' | 'Técnico' | 'Táctico' | 'Mental'

export interface CriterioScouting {
  id: number
  nombre: string
  grupo: GrupoCriterio
  orden: number
}

export interface NuevaValoracionObservacion {
  criterioId: number
  puntuacion: number
}

export interface ResumenValoracionCriterio extends CriterioScouting {
  media: number
  totalInformes: number
}

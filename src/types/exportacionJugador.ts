export interface ConfiguracionMapaInforme {
  id: string
  titulo: string
  modo: 'puntos' | 'zonas'
  etiquetas: string[]
}

export interface ConfiguracionInformeJugador {
  idsPartidos: string[]
  incluirRatios: boolean
  incluirRepertorio: boolean
  mapas: ConfiguracionMapaInforme[]
  idsObservaciones: string[]
  idsValoracionesGenerales: string[]
}

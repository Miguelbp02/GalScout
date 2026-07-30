import type { ResumenValoracionCriterio } from '../types/criterio'

export interface AreaRadar {
  etiqueta: string
  criterios: string[]
}

export const AREAS: AreaRadar[] = [
  {
    etiqueta: 'Físico',
    criterios: [
      'Aceleración',
      'Velocidad punta',
      'Agilidad',
      'Resistencia',
      'Fuerza en duelos',
      'Potencia de salto',
      'Equilibrio',
    ],
  },
  {
    etiqueta: 'Técnica',
    criterios: [
      'Control orientado',
      'Conducción',
      'Regate 1v1 ofensivo',
      'Uso de pierna no dominante',
    ],
  },
  {
    etiqueta: 'Pase',
    criterios: [
      'Pase corto',
      'Pase largo',
      'Centros',
      'Visión de juego',
      'Dirección de juego con balón',
    ],
  },
  {
    etiqueta: 'Ataque',
    criterios: [
      'Golpeo potente',
      'Golpeo preciso',
      'Definición',
      'Juego de cabeza',
      'Desmarque',
    ],
  },
  {
    etiqueta: 'Defensa',
    criterios: [
      'Posicionamiento defensivo',
      'Anticipación e interceptación',
      'Defensa 1v1',
      'Trabajo de presión',
      'Compromiso defensivo',
    ],
  },
  {
    etiqueta: 'Mental',
    criterios: [
      'Toma de decisiones',
      'Transiciones',
      'Comprensión del rol',
      'Concentración',
      'Competitividad',
      'Serenidad bajo presión',
      'Liderazgo y comunicación',
    ],
  },
]

export const AREAS_PORTERO: AreaRadar[] = [
  {
    etiqueta: 'Físico',
    criterios: [
      'Explosividad',
      'Agilidad',
      'Potencia de salto',
      'Alcance aéreo',
      'Velocidad de desplazamiento',
    ],
  },
  {
    etiqueta: 'Técnica',
    criterios: ['Blocaje', 'Desvíos y rechaces', 'Estiradas'],
  },
  {
    etiqueta: 'Juego',
    criterios: [
      'Juego de pies',
      'Pase corto',
      'Desplazamiento largo',
      'Saque de mano',
      'Golpeo con pierna no dominante',
    ],
  },
  {
    etiqueta: 'Salidas',
    criterios: ['1 contra 1', 'Salidas aéreas', 'Salidas al espacio'],
  },
  {
    etiqueta: 'Área',
    criterios: [
      'Colocación',
      'Dominio del área',
      'Lectura de centros',
      'Organización defensiva',
      'Gestión de la línea defensiva',
    ],
  },
  {
    etiqueta: 'Mental',
    criterios: [
      'Concentración',
      'Toma de decisiones',
      'Serenidad bajo presión',
      'Valentía',
      'Comunicación y liderazgo',
      'Capacidad de reacción tras error',
    ],
  },
]

export const CENTRO_RADAR = 100
export const RADIO_RADAR = 66

export function mediaArea(
  area: AreaRadar,
  valoracionesPorNombre: Map<string, ResumenValoracionCriterio>,
): number | null {
  const valoraciones = area.criterios
    .map((criterio) => valoracionesPorNombre.get(criterio)?.media)
    .filter((media): media is number => media !== undefined)

  if (valoraciones.length === 0) return null

  return valoraciones.reduce((suma, media) => suma + media, 0) / valoraciones.length
}

export function coordenadasRadar(angulo: number, radio: number) {
  return {
    x: CENTRO_RADAR + Math.cos(angulo) * radio,
    y: CENTRO_RADAR + Math.sin(angulo) * radio,
  }
}

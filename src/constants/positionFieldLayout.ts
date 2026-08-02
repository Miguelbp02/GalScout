export interface ZonaCampoPosicion {
  codigo: string
  abreviatura: string
  columna: 0 | 1 | 2
  fila: number
  filas?: number
}

export interface GeometriaZonaPosicion {
  izquierda: number
  arriba: number
  ancho: number
  alto: number
}

const MARGEN_X = 3
const MARGEN_Y = 4
const HUECO = 1.2
const ANCHO_CENTRO = 37.6
const ANCHO_BANDA = (100 - MARGEN_X * 2 - HUECO * 2 - ANCHO_CENTRO) / 2
const ANCHOS_COLUMNA = [ANCHO_BANDA, ANCHO_CENTRO, ANCHO_BANDA]
const IZQUIERDAS_COLUMNA = [
  MARGEN_X,
  MARGEN_X + ANCHO_BANDA + HUECO,
  MARGEN_X + ANCHO_BANDA + HUECO + ANCHO_CENTRO + HUECO,
]
const ALTO_FILA = (100 - MARGEN_Y * 2 - HUECO * 6) / 7

export const ZONAS_CAMPO_POSICION: ZonaCampoPosicion[] = [
  { codigo: 'extremo_izquierdo', abreviatura: 'EI', columna: 0, fila: 0, filas: 2 },
  { codigo: 'delantero_centro', abreviatura: 'DC', columna: 1, fila: 0 },
  { codigo: 'extremo_derecho', abreviatura: 'ED', columna: 2, fila: 0, filas: 2 },
  { codigo: 'segundo_delantero', abreviatura: 'SD', columna: 1, fila: 1 },
  { codigo: 'interior_izquierdo', abreviatura: 'II', columna: 0, fila: 2 },
  { codigo: 'mediapunta', abreviatura: 'MP', columna: 1, fila: 2 },
  { codigo: 'interior_derecho', abreviatura: 'ID', columna: 2, fila: 2 },
  { codigo: 'carrilero_izquierdo', abreviatura: 'CRI', columna: 0, fila: 3, filas: 2 },
  { codigo: 'mediocentro', abreviatura: 'MC', columna: 1, fila: 3 },
  { codigo: 'carrilero_derecho', abreviatura: 'CRD', columna: 2, fila: 3, filas: 2 },
  { codigo: 'mediocentro_defensivo', abreviatura: 'MCD', columna: 1, fila: 4 },
  { codigo: 'lateral_izquierdo', abreviatura: 'LI', columna: 0, fila: 5, filas: 2 },
  { codigo: 'defensa_central', abreviatura: 'DFC', columna: 1, fila: 5 },
  { codigo: 'lateral_derecho', abreviatura: 'LD', columna: 2, fila: 5, filas: 2 },
  { codigo: 'portero', abreviatura: 'PT', columna: 1, fila: 6 },
]

export function obtenerGeometriaZonaPosicion(
  zona: ZonaCampoPosicion,
): GeometriaZonaPosicion {
  const filas = zona.filas ?? 1

  return {
    izquierda: IZQUIERDAS_COLUMNA[zona.columna],
    arriba: MARGEN_Y + zona.fila * (ALTO_FILA + HUECO),
    ancho: ANCHOS_COLUMNA[zona.columna],
    alto: ALTO_FILA * filas + HUECO * (filas - 1),
  }
}

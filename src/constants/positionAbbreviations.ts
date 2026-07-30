const abreviaturasPosicion: Record<string, string> = {
  extremo_izquierdo: 'EI',
  delantero_centro: 'DC',
  extremo_derecho: 'ED',
  segundo_delantero: 'SD',
  interior_izquierdo: 'II',
  mediapunta: 'MP',
  interior_derecho: 'ID',
  carrilero_izquierdo: 'CRI',
  mediocentro: 'MC',
  carrilero_derecho: 'CRD',
  mediocentro_defensivo: 'MCD',
  lateral_izquierdo: 'LI',
  defensa_central: 'DFC',
  lateral_derecho: 'LD',
  portero: 'PT',
}

export function obtenerAbreviaturaPosicion(codigo: string) {
  return abreviaturasPosicion[codigo] ?? codigo
}

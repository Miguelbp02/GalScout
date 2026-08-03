import type { CategoriaJugador } from '../types/jugador'

// Divisiones de fútbol 11 de la Federación Gallega de Fútbol (Futgal), de
// mayor a menor nivel. Solo fútbol 11: se excluyen fútbol 7 y fútbol a pie.
export const LIGAS_POR_CATEGORIA: Record<CategoriaJugador, string[]> = {
  Senior: [
    'Primera División',
    'Segunda División',
    'Primera Federación',
    'Segunda Federación',
    'Tercera Federación',
    'Preferente Futgal',
    '1ª Futgal',
    '2ª Futgal',
    '3ª Futgal',
  ],
  Juvenil: [
    'División de Honor Juvenil',
    'Liga Nacional Juvenil',
    'Preferente Futgal Xuvenil',
    '1ª Futgal Xuvenil',
    '2ª Futgal Xuvenil',
    '3ª Futgal Xuvenil',
  ],
  Cadete: [
    'División de Honor Cadete',
    'Preferente Futgal Cadete',
    '1ª Futgal Cadete',
    '2ª Futgal Cadete',
    '3ª Futgal Cadete',
  ],
}

// Grupos provinciales en los que se dividen las ligas 1ª/2ª/3ª Futgal (y sus
// equivalentes juvenil y cadete): esos niveles se juegan por provincia,
// mientras que Preferente y los niveles superiores son grupo único.
export const GRUPOS_PROVINCIA = ['A Coruña', 'Lugo', 'Ourense', 'Pontevedra']

const LIGAS_CON_GRUPO_PROVINCIAL = new Set([
  '1ª Futgal',
  '2ª Futgal',
  '3ª Futgal',
  '1ª Futgal Xuvenil',
  '2ª Futgal Xuvenil',
  '3ª Futgal Xuvenil',
  '1ª Futgal Cadete',
  '2ª Futgal Cadete',
  '3ª Futgal Cadete',
])

export function ligaTieneGrupoProvincial(liga: string): boolean {
  return LIGAS_CON_GRUPO_PROVINCIAL.has(liga)
}

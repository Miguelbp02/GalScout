import { supabase } from '../lib/supabase'
import type { CriterioScouting, PerfilScouting } from '../types/criterio'

interface CriterioFila {
  id: number
  nombre: string
  grupo: CriterioScouting['grupo']
  orden: number
  perfil: PerfilScouting
}

const ordenGrupos = ['Físico', 'Técnico', 'Táctico', 'Mental'] as const

export async function obtenerCriteriosScouting(
  perfil: PerfilScouting = 'campo',
): Promise<CriterioScouting[]> {
  const { data, error } = await supabase
    .from('criterios_scouting')
    .select('id, nombre, grupo, orden, perfil')
    .eq('activo', true)
    .eq('perfil', perfil)

  if (error) {
    throw new Error(error.message)
  }

  return (data as CriterioFila[]).sort((criterioA, criterioB) => {
    const grupoA = ordenGrupos.indexOf(criterioA.grupo)
    const grupoB = ordenGrupos.indexOf(criterioB.grupo)

    return grupoA - grupoB || criterioA.orden - criterioB.orden
  })
}

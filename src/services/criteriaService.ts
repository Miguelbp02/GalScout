import { supabase } from '../lib/supabase'
import type { CriterioScouting } from '../types/criterio'

interface CriterioFila {
  id: number
  nombre: string
  grupo: CriterioScouting['grupo']
  orden: number
}

const ordenGrupos = ['Físico', 'Técnico', 'Táctico', 'Mental'] as const

export async function obtenerCriteriosScouting(): Promise<CriterioScouting[]> {
  const { data, error } = await supabase
    .from('criterios_scouting')
    .select('id, nombre, grupo, orden')
    .eq('activo', true)

  if (error) {
    throw new Error(error.message)
  }

  return (data as CriterioFila[]).sort((criterioA, criterioB) => {
    const grupoA = ordenGrupos.indexOf(criterioA.grupo)
    const grupoB = ordenGrupos.indexOf(criterioB.grupo)

    return grupoA - grupoB || criterioA.orden - criterioB.orden
  })
}

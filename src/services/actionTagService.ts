import { supabase } from '../lib/supabase'
import type { PerfilScouting } from '../types/criterio'
import type { EtiquetaAccion } from '../types/accionObservacion'

interface EtiquetaFila {
  id: number
  nombre: string
  categoria: EtiquetaAccion['categoria']
  perfil: PerfilScouting
  orden: number
  es_sustitucion: boolean
}

export async function obtenerEtiquetasAccion(
  perfil: PerfilScouting = 'campo',
): Promise<EtiquetaAccion[]> {
  const { data, error } = await supabase
    .from('etiquetas_accion')
    .select('id, nombre, categoria, perfil, orden, es_sustitucion')
    .eq('activo', true)
    .eq('perfil', perfil)
    .order('orden', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data as EtiquetaFila[]).map((fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    categoria: fila.categoria,
    perfil: fila.perfil,
    orden: fila.orden,
    esSustitucion: fila.es_sustitucion,
  }))
}

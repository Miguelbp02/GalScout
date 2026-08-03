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

function claveCache(perfil: PerfilScouting) {
  return `ojeo-etiquetas-accion-cache:${perfil}`
}

function guardarEtiquetasEnCache(perfil: PerfilScouting, etiquetas: EtiquetaAccion[]) {
  try {
    window.localStorage.setItem(claveCache(perfil), JSON.stringify(etiquetas))
  } catch {
    // Si el almacenamiento local falla (modo privado, cuota llena) no es crítico.
  }
}

function leerEtiquetasDeCache(perfil: PerfilScouting): EtiquetaAccion[] {
  try {
    const bruto = window.localStorage.getItem(claveCache(perfil))
    if (!bruto) return []
    return JSON.parse(bruto) as EtiquetaAccion[]
  } catch {
    return []
  }
}

export async function obtenerEtiquetasAccion(
  perfil: PerfilScouting = 'campo',
): Promise<EtiquetaAccion[]> {
  try {
    const { data, error } = await supabase
      .from('etiquetas_accion')
      .select('id, nombre, categoria, perfil, orden, es_sustitucion')
      .eq('activo', true)
      .eq('perfil', perfil)
      .order('orden', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    const etiquetas = (data as EtiquetaFila[]).map((fila) => ({
      id: fila.id,
      nombre: fila.nombre,
      categoria: fila.categoria,
      perfil: fila.perfil,
      orden: fila.orden,
      esSustitucion: fila.es_sustitucion,
    }))

    guardarEtiquetasEnCache(perfil, etiquetas)
    return etiquetas
  } catch (error) {
    const etiquetasEnCache = leerEtiquetasDeCache(perfil)
    if (etiquetasEnCache.length > 0) {
      return etiquetasEnCache
    }

    throw error
  }
}

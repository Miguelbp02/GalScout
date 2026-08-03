import { supabase } from '../lib/supabase'
import type { NuevaSugerencia, Sugerencia } from '../types/sugerencia'

interface SugerenciaFila {
  id: string
  autor_id: string
  tipo: Sugerencia['tipo']
  mensaje: string
  created_at: string
}

interface PerfilFila {
  id: string
  nombre: string
}

export async function obtenerSugerencias(): Promise<Sugerencia[]> {
  const { data, error } = await supabase
    .from('sugerencias')
    .select('id, autor_id, tipo, mensaje, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const filas = data as SugerenciaFila[]
  const autores = [...new Set(filas.map((sugerencia) => sugerencia.autor_id))]

  if (autores.length === 0) {
    return []
  }

  const { data: perfiles, error: errorPerfiles } = await supabase
    .from('perfiles')
    .select('id, nombre')
    .in('id', autores)

  if (errorPerfiles) {
    throw new Error(errorPerfiles.message)
  }

  const nombresPorAutor = new Map(
    (perfiles as PerfilFila[]).map((perfil) => [perfil.id, perfil.nombre]),
  )

  return filas.map((sugerencia) => ({
    id: sugerencia.id,
    tipo: sugerencia.tipo,
    mensaje: sugerencia.mensaje,
    createdAt: sugerencia.created_at,
    autorId: sugerencia.autor_id,
    autorNombre: nombresPorAutor.get(sugerencia.autor_id) ?? 'Ojeador sin perfil',
  }))
}

export async function crearSugerencia(sugerencia: NuevaSugerencia): Promise<void> {
  const { error } = await supabase.from('sugerencias').insert({
    tipo: sugerencia.tipo,
    mensaje: sugerencia.mensaje.trim(),
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function eliminarSugerencia(id: string): Promise<void> {
  const { error } = await supabase.from('sugerencias').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

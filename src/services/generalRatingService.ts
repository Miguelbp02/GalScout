import { supabase } from '../lib/supabase'
import type {
  NuevaValoracionGeneral,
  ValoracionGeneral,
} from '../types/valoracionGeneral'

interface ValoracionGeneralFila {
  id: string
  autor_id: string
  fecha_valoracion: string
  comentario: string
  created_at: string
}

interface PerfilFila {
  id: string
  nombre: string
}

export async function obtenerValoracionesGeneralesJugador(
  jugadorId: string,
): Promise<ValoracionGeneral[]> {
  const { data, error } = await supabase
    .from('valoraciones_generales')
    .select('id, autor_id, fecha_valoracion, comentario, created_at')
    .eq('jugador_id', jugadorId)
    .order('fecha_valoracion', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const filas = data as ValoracionGeneralFila[]
  const autores = [...new Set(filas.map((valoracion) => valoracion.autor_id))]

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

  return filas.map((valoracion) => ({
    id: valoracion.id,
    fechaValoracion: valoracion.fecha_valoracion,
    comentario: valoracion.comentario,
    createdAt: valoracion.created_at,
    autorNombre: nombresPorAutor.get(valoracion.autor_id) ?? 'Ojeador sin perfil',
  }))
}

export async function crearValoracionGeneral(
  jugadorId: string,
  valoracion: NuevaValoracionGeneral,
): Promise<void> {
  const { error } = await supabase.from('valoraciones_generales').insert({
    jugador_id: jugadorId,
    fecha_valoracion: valoracion.fechaValoracion,
    comentario: valoracion.comentario.trim(),
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function eliminarValoracionesGenerales(ids: string[]): Promise<void> {
  if (ids.length === 0) return

  const { error } = await supabase
    .from('valoraciones_generales')
    .delete()
    .in('id', ids)

  if (error) {
    throw new Error(error.message)
  }
}

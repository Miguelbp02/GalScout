import { supabase } from '../lib/supabase'

export interface Equipo {
  id: string
  nombre: string
}

export async function obtenerEquipos(): Promise<Equipo[]> {
  const { data, error } = await supabase
    .from('equipos')
    .select('id, nombre')
    .order('nombre')

  if (error) throw new Error(error.message)

  return (data ?? []) as Equipo[]
}

export async function obtenerOCrearEquipo(nombre: string): Promise<Equipo> {
  const nombreLimpio = nombre.trim().toLocaleUpperCase('es-ES')

  if (!nombreLimpio) {
    throw new Error('El nombre del equipo no puede estar vacio.')
  }

  const { data: equipoExistente, error: errorBusqueda } = await supabase
    .from('equipos')
    .select('id, nombre')
    .ilike('nombre', nombreLimpio)
    .maybeSingle()

  if (errorBusqueda) throw new Error(errorBusqueda.message)
  if (equipoExistente) return equipoExistente as Equipo

  const { data: equipoCreado, error: errorCreacion } = await supabase
    .from('equipos')
    .insert({ nombre: nombreLimpio })
    .select('id, nombre')
    .single()

  if (!errorCreacion && equipoCreado) return equipoCreado as Equipo

  // Dos ojeadores pueden crear el mismo equipo a la vez. Si otro usuario
  // llega primero, recuperamos su registro en lugar de duplicarlo.
  if (errorCreacion?.code === '23505') {
    const { data: equipoCreadoPorOtroUsuario, error: errorReintento } =
      await supabase
        .from('equipos')
        .select('id, nombre')
        .ilike('nombre', nombreLimpio)
        .maybeSingle()

    if (!errorReintento && equipoCreadoPorOtroUsuario) {
      return equipoCreadoPorOtroUsuario as Equipo
    }
  }

  throw new Error(errorCreacion?.message ?? 'No se ha podido guardar el equipo.')
}

export interface EquipoActualJugador {
  nombre: string
  dorsal: number | null
}

export async function obtenerEquipoActualJugador(
  jugadorId: string,
): Promise<EquipoActualJugador | null> {
  const { data, error } = await supabase
    .from('jugadores_equipos')
    .select('dorsal, equipos(nombre)')
    .eq('jugador_id', jugadorId)
    .eq('es_actual', true)
    .maybeSingle()

  if (error) throw new Error(error.message)

  const fila = data as { dorsal: number | null; equipos: { nombre: string } | null } | null
  if (!fila?.equipos) return null

  return { nombre: fila.equipos.nombre, dorsal: fila.dorsal }
}

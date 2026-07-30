import { supabase } from '../lib/supabase'

export interface Equipo {
  id: string
  nombre: string
}

interface EquipoActualFila {
  id: string
  equipo_id: string
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

export async function guardarEquipoActualJugador(
  jugadorId: string,
  nombreEquipo: string,
  estadoJugador: 'En equipo' | 'Libre',
): Promise<void> {
  const nombreLimpio = nombreEquipo.trim().toLocaleUpperCase('es-ES')
  const { data: equipoActual, error: errorEquipoActual } = await supabase
    .from('jugadores_equipos')
    .select('id, equipo_id')
    .eq('jugador_id', jugadorId)
    .eq('es_actual', true)
    .maybeSingle()

  if (errorEquipoActual) throw new Error(errorEquipoActual.message)

  if (estadoJugador === 'Libre' || !nombreLimpio) {
    if (!equipoActual) return

    const { error } = await supabase
      .from('jugadores_equipos')
      .update({ es_actual: false })
      .eq('id', (equipoActual as EquipoActualFila).id)

    if (error) throw new Error(error.message)
    return
  }

  const equipo = await obtenerOCrearEquipo(nombreLimpio)

  if ((equipoActual as EquipoActualFila | null)?.equipo_id === equipo.id) return

  if (equipoActual) {
    const { error } = await supabase
      .from('jugadores_equipos')
      .update({ es_actual: false })
      .eq('id', (equipoActual as EquipoActualFila).id)

    if (error) throw new Error(error.message)
  }

  const { error: errorAsignacion } = await supabase
    .from('jugadores_equipos')
    .insert({ jugador_id: jugadorId, equipo_id: equipo.id, es_actual: true })

  if (errorAsignacion) throw new Error(errorAsignacion.message)
}

export async function obtenerEquipoActualJugador(
  jugadorId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('jugadores_equipos')
    .select('equipos(nombre)')
    .eq('jugador_id', jugadorId)
    .eq('es_actual', true)
    .maybeSingle()

  if (error) throw new Error(error.message)

  const equipo = (data as { equipos: { nombre: string } | null } | null)?.equipos
  return equipo?.nombre ?? null
}

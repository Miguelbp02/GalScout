import { supabase } from '../lib/supabase'
import { obtenerOCrearEquipo } from './teamService'
import type { CategoriaJugador } from '../types/jugador'
import type {
  HistorialEquipoJugador,
  NuevoHistorialEquipo,
} from '../types/historialEquipo'

interface EquipoRelacionado {
  nombre: string
}

interface HistorialFila {
  id: string
  temporada: string | null
  categoria: CategoriaJugador | null
  liga: string | null
  grupo_provincia: string | null
  dorsal: number | null
  goles: number | null
  partidos: number | null
  notas: string
  es_actual: boolean
  equipos: EquipoRelacionado | EquipoRelacionado[] | null
}

function extraerNombreEquipo(equipos: HistorialFila['equipos']): string {
  const equipo = Array.isArray(equipos) ? equipos[0] : equipos
  return equipo?.nombre ?? 'Equipo desconocido'
}

function mapearHistorial(fila: HistorialFila): HistorialEquipoJugador {
  return {
    id: fila.id,
    equipoNombre: extraerNombreEquipo(fila.equipos),
    temporada: fila.temporada,
    categoria: fila.categoria,
    liga: fila.liga,
    grupoProvincia: fila.grupo_provincia,
    dorsal: fila.dorsal,
    goles: fila.goles,
    partidos: fila.partidos,
    notas: fila.notas,
    esActual: fila.es_actual,
  }
}

export async function obtenerHistorialEquiposJugador(
  jugadorId: string,
): Promise<HistorialEquipoJugador[]> {
  const { data, error } = await supabase
    .from('jugadores_equipos')
    .select(
      'id, temporada, categoria, liga, grupo_provincia, dorsal, goles, partidos, notas, es_actual, equipos(nombre)',
    )
    .eq('jugador_id', jugadorId)
    .order('es_actual', { ascending: false })
    .order('temporada', { ascending: false, nullsFirst: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as HistorialFila[]).map(mapearHistorial)
}

async function desmarcarEtapaActual(jugadorId: string): Promise<void> {
  const { error } = await supabase
    .from('jugadores_equipos')
    .update({ es_actual: false })
    .eq('jugador_id', jugadorId)
    .eq('es_actual', true)

  if (error) {
    throw new Error(error.message)
  }
}

export async function desmarcarEquipoActualJugador(jugadorId: string): Promise<void> {
  await desmarcarEtapaActual(jugadorId)
}

export async function crearHistorialEquipo(
  jugadorId: string,
  historial: NuevoHistorialEquipo,
): Promise<void> {
  const equipo = await obtenerOCrearEquipo(historial.nombreEquipo)

  if (historial.marcarComoActual) {
    await desmarcarEtapaActual(jugadorId)
  }

  const { error } = await supabase.from('jugadores_equipos').insert({
    jugador_id: jugadorId,
    equipo_id: equipo.id,
    temporada: historial.temporada.trim() || null,
    categoria: historial.categoria || null,
    liga: historial.liga.trim() || null,
    grupo_provincia: historial.grupoProvincia.trim() || null,
    dorsal: historial.dorsal,
    goles: historial.goles,
    partidos: historial.partidos,
    notas: historial.notas.trim(),
    es_actual: historial.marcarComoActual,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function actualizarHistorialEquipo(
  id: string,
  jugadorId: string,
  historial: NuevoHistorialEquipo,
): Promise<void> {
  const equipo = await obtenerOCrearEquipo(historial.nombreEquipo)

  if (historial.marcarComoActual) {
    const { error } = await supabase
      .from('jugadores_equipos')
      .update({ es_actual: false })
      .eq('jugador_id', jugadorId)
      .eq('es_actual', true)
      .neq('id', id)

    if (error) {
      throw new Error(error.message)
    }
  }

  const { error } = await supabase
    .from('jugadores_equipos')
    .update({
      equipo_id: equipo.id,
      temporada: historial.temporada.trim() || null,
      categoria: historial.categoria || null,
      liga: historial.liga.trim() || null,
      grupo_provincia: historial.grupoProvincia.trim() || null,
      dorsal: historial.dorsal,
      goles: historial.goles,
      partidos: historial.partidos,
      notas: historial.notas.trim(),
      es_actual: historial.marcarComoActual,
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function eliminarHistorialEquipos(ids: string[]): Promise<void> {
  if (ids.length === 0) return

  const { error } = await supabase
    .from('jugadores_equipos')
    .delete()
    .in('id', ids)

  if (error) {
    throw new Error(error.message)
  }
}

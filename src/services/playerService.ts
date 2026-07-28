import { supabase } from '../lib/supabase'
import type { Jugador, NuevoJugador } from '../types/jugador'

interface JugadorFila {
  id: string
  nombre: string
  edad: number
  altura_cm: number
  posicion: string
  pierna_dominante: Jugador['piernaDominante']
  estado: Jugador['estado']
}

function mapearJugador(jugador: JugadorFila): Jugador {
  return {
    id: jugador.id,
    nombre: jugador.nombre,
    edad: jugador.edad,
    alturaCm: jugador.altura_cm,
    posicion: jugador.posicion,
    piernaDominante: jugador.pierna_dominante,
    estado: jugador.estado,
  }
}

const columnasJugador =
  'id, nombre, edad, altura_cm, posicion, pierna_dominante, estado'

export async function obtenerJugadores(): Promise<Jugador[]> {
  const { data, error } = await supabase
    .from('jugadores')
    .select(columnasJugador)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as JugadorFila[]).map(mapearJugador)
}

export async function obtenerJugadorPorId(id: string): Promise<Jugador | null> {
  const { data, error } = await supabase
    .from('jugadores')
    .select(columnasJugador)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data ? mapearJugador(data as JugadorFila) : null
}

export async function crearJugador(jugador: NuevoJugador): Promise<Jugador> {
  if (jugador.posicionesNaturalesIds.length === 0) {
    throw new Error('Selecciona al menos una posición natural.')
  }

  const { data: posicionesNaturales, error: errorPosicionesNaturales } = await supabase
    .from('posiciones')
    .select('id, nombre')
    .in('id', jugador.posicionesNaturalesIds)

  if (errorPosicionesNaturales || !posicionesNaturales) {
    throw new Error(
      errorPosicionesNaturales?.message ??
        'No se han encontrado las posiciones naturales.',
    )
  }

  const nombresNaturalesPorId = new Map(
    posicionesNaturales.map((posicion) => [posicion.id, posicion.nombre]),
  )
  const resumenPosicionesNaturales = jugador.posicionesNaturalesIds
    .map((posicionId) => nombresNaturalesPorId.get(posicionId))
    .filter((nombre): nombre is string => Boolean(nombre))
    .join(' · ')

  if (!resumenPosicionesNaturales) {
    throw new Error('No se han encontrado las posiciones naturales seleccionadas.')
  }

  const { data, error } = await supabase
    .from('jugadores')
    .insert({
      nombre: jugador.nombre,
      edad: jugador.edad,
      altura_cm: jugador.alturaCm,
      // Campo heredado mientras las tarjetas antiguas siguen mostrando texto.
      // La fuente de datos real es jugadores_posiciones.
      posicion: resumenPosicionesNaturales,
      pierna_dominante: jugador.piernaDominante,
      estado: jugador.estado,
    })
    .select(columnasJugador)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const posicionesNaturalesIds = new Set(jugador.posicionesNaturalesIds)
  const posiciones = [
    ...[...posicionesNaturalesIds].map((posicionId) => ({
      jugador_id: data.id,
      posicion_id: posicionId,
      tipo: 'natural',
    })),
    ...jugador.posicionesAptasIds
      .filter((posicionId) => !posicionesNaturalesIds.has(posicionId))
      .map((posicionId) => ({
        jugador_id: data.id,
        posicion_id: posicionId,
        tipo: 'apta',
      })),
  ]

  const { error: errorPosiciones } = await supabase
    .from('jugadores_posiciones')
    .insert(posiciones)

  if (errorPosiciones) {
    throw new Error(errorPosiciones.message)
  }

  return mapearJugador(data as JugadorFila)
}

export async function actualizarJugador(
  jugadorId: string,
  jugador: NuevoJugador,
): Promise<Jugador> {
  if (jugador.posicionesNaturalesIds.length === 0) {
    throw new Error('Selecciona al menos una posición natural.')
  }

  const { data: posicionesNaturales, error: errorPosicionesNaturales } = await supabase
    .from('posiciones')
    .select('id, nombre')
    .in('id', jugador.posicionesNaturalesIds)

  if (errorPosicionesNaturales || !posicionesNaturales) {
    throw new Error(
      errorPosicionesNaturales?.message ??
        'No se han encontrado las posiciones naturales.',
    )
  }

  const nombresNaturalesPorId = new Map(
    posicionesNaturales.map((posicion) => [posicion.id, posicion.nombre]),
  )
  const resumenPosicionesNaturales = jugador.posicionesNaturalesIds
    .map((posicionId) => nombresNaturalesPorId.get(posicionId))
    .filter((nombre): nombre is string => Boolean(nombre))
    .join(' · ')

  if (!resumenPosicionesNaturales) {
    throw new Error('No se han encontrado las posiciones naturales seleccionadas.')
  }

  const { data, error } = await supabase
    .from('jugadores')
    .update({
      nombre: jugador.nombre,
      edad: jugador.edad,
      altura_cm: jugador.alturaCm,
      posicion: resumenPosicionesNaturales,
      pierna_dominante: jugador.piernaDominante,
      estado: jugador.estado,
    })
    .eq('id', jugadorId)
    .select(columnasJugador)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const { error: errorBorradoPosiciones } = await supabase
    .from('jugadores_posiciones')
    .delete()
    .eq('jugador_id', jugadorId)

  if (errorBorradoPosiciones) {
    throw new Error(errorBorradoPosiciones.message)
  }

  const posicionesNaturalesIds = new Set(jugador.posicionesNaturalesIds)
  const posiciones = [
    ...[...posicionesNaturalesIds].map((posicionId) => ({
      jugador_id: jugadorId,
      posicion_id: posicionId,
      tipo: 'natural',
    })),
    ...jugador.posicionesAptasIds
      .filter((posicionId) => !posicionesNaturalesIds.has(posicionId))
      .map((posicionId) => ({
        jugador_id: jugadorId,
        posicion_id: posicionId,
        tipo: 'apta',
      })),
  ]

  const { error: errorPosiciones } = await supabase
    .from('jugadores_posiciones')
    .insert(posiciones)

  if (errorPosiciones) {
    throw new Error(errorPosiciones.message)
  }

  return mapearJugador(data as JugadorFila)
}

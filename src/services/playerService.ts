import { supabase } from '../lib/supabase'
import {
  guardarEquipoActualJugador,
  obtenerEquipoActualJugador,
} from './teamService'
import { limitesFiltrosJugadores } from '../types/filtrosJugador'
import type { Jugador, NuevoJugador } from '../types/jugador'

interface JugadorFila {
  id: string
  nombre: string
  edad: number
  altura_cm: number
  posicion: string
  pierna_dominante: Jugador['piernaDominante']
  estado: Jugador['estado']
  categoria: Jugador['categoria']
}

interface PosicionJugadorFila {
  jugador_id: string
  posicion_id: number
  tipo: 'natural' | 'apta'
}

interface ObservacionJugadorFila {
  jugador_id: string
}

interface EquipoActualJugadorFila {
  jugador_id: string
  equipos: { nombre: string } | { nombre: string }[] | null
}

function mapearJugador(
  jugador: JugadorFila,
  posicionesNaturalesIds: number[] = [],
  posicionesAptasIds: number[] = [],
  totalInformes = 0,
  equipoActual: string | null = null,
): Jugador {
  return {
    id: jugador.id,
    nombre: jugador.nombre,
    edad: jugador.edad,
    alturaCm: jugador.altura_cm,
    posicion: jugador.posicion,
    piernaDominante: jugador.pierna_dominante,
    estado: jugador.estado,
    categoria: jugador.categoria,
    equipoActual,
    posicionesNaturalesIds,
    posicionesAptasIds,
    totalInformes,
  }
}

const columnasJugador =
  'id, nombre, edad, altura_cm, posicion, pierna_dominante, estado, categoria'

function validarMedidasJugador(jugador: NuevoJugador) {
  const edadValida =
    Number.isInteger(jugador.edad) &&
    jugador.edad >= limitesFiltrosJugadores.edadMinima &&
    jugador.edad <= limitesFiltrosJugadores.edadMaxima
  const alturaValida =
    Number.isInteger(jugador.alturaCm) &&
    jugador.alturaCm >= limitesFiltrosJugadores.alturaMinima &&
    jugador.alturaCm <= limitesFiltrosJugadores.alturaMaxima

  if (!edadValida || !alturaValida) {
    throw new Error('Edad o altura fuera del rango permitido.')
  }
}

export async function obtenerJugadores(): Promise<Jugador[]> {
  const [
    respuestaJugadores,
    respuestaPosiciones,
    respuestaObservaciones,
    respuestaEquiposActuales,
  ] =
    await Promise.all([
      supabase
        .from('jugadores')
        .select(columnasJugador)
        .order('created_at', { ascending: false }),
      supabase
        .from('jugadores_posiciones')
        .select('jugador_id, posicion_id, tipo'),
      supabase.from('observaciones_jugador').select('jugador_id'),
      supabase
        .from('jugadores_equipos')
        .select('jugador_id, equipos(nombre)')
        .eq('es_actual', true),
    ])

  if (respuestaJugadores.error) {
    throw new Error(respuestaJugadores.error.message)
  }

  if (respuestaPosiciones.error) {
    throw new Error(respuestaPosiciones.error.message)
  }

  if (respuestaObservaciones.error) {
    throw new Error(respuestaObservaciones.error.message)
  }

  if (respuestaEquiposActuales.error) {
    throw new Error(respuestaEquiposActuales.error.message)
  }

  const posicionesPorJugador = new Map<
    string,
    { naturales: number[]; aptas: number[] }
  >()

  for (const posicion of respuestaPosiciones.data as PosicionJugadorFila[]) {
    const perfil = posicionesPorJugador.get(posicion.jugador_id) ?? {
      naturales: [],
      aptas: [],
    }

    if (posicion.tipo === 'natural') {
      perfil.naturales.push(posicion.posicion_id)
    } else {
      perfil.aptas.push(posicion.posicion_id)
    }

    posicionesPorJugador.set(posicion.jugador_id, perfil)
  }

  const informesPorJugador = new Map<string, number>()

  for (const observacion of respuestaObservaciones.data as ObservacionJugadorFila[]) {
    informesPorJugador.set(
      observacion.jugador_id,
      (informesPorJugador.get(observacion.jugador_id) ?? 0) + 1,
    )
  }

  const equiposActualesPorJugador = new Map<string, string>()

  for (const equipoActual of respuestaEquiposActuales.data as EquipoActualJugadorFila[]) {
    const equipo = Array.isArray(equipoActual.equipos)
      ? equipoActual.equipos[0]
      : equipoActual.equipos

    if (equipo?.nombre) {
      equiposActualesPorJugador.set(
        equipoActual.jugador_id,
        equipo.nombre.toLocaleUpperCase('es-ES'),
      )
    }
  }

  return (respuestaJugadores.data as JugadorFila[]).map((jugador) => {
    const perfil = posicionesPorJugador.get(jugador.id)

    return mapearJugador(
      jugador,
      perfil?.naturales,
      perfil?.aptas,
      informesPorJugador.get(jugador.id) ?? 0,
      equiposActualesPorJugador.get(jugador.id) ?? null,
    )
  })
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

  if (!data) return null

  return mapearJugador(
    data as JugadorFila,
    [],
    [],
    0,
    await obtenerEquipoActualJugador(id),
  )
}

export async function crearJugador(jugador: NuevoJugador): Promise<Jugador> {
  validarMedidasJugador(jugador)

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
      categoria: jugador.categoria || null,
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

  await guardarEquipoActualJugador(data.id, jugador.equipoActual, jugador.estado)

  return mapearJugador(
    data as JugadorFila,
    [],
    [],
    0,
    jugador.estado === 'En equipo'
      ? jugador.equipoActual.trim().toLocaleUpperCase('es-ES') || null
      : null,
  )
}

export async function actualizarJugador(
  jugadorId: string,
  jugador: NuevoJugador,
): Promise<Jugador> {
  validarMedidasJugador(jugador)

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
      categoria: jugador.categoria || null,
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

  await guardarEquipoActualJugador(jugadorId, jugador.equipoActual, jugador.estado)

  return mapearJugador(
    data as JugadorFila,
    [],
    [],
    0,
    jugador.estado === 'En equipo'
      ? jugador.equipoActual.trim().toLocaleUpperCase('es-ES') || null
      : null,
  )
}

export async function eliminarJugador(jugadorId: string): Promise<void> {
  const { data, error } = await supabase
    .from('jugadores')
    .delete()
    .eq('id', jugadorId)
    .select('id')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('No se ha encontrado el jugador que se quería eliminar.')
  }
}

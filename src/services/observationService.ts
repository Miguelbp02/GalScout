import { supabase } from '../lib/supabase'
import { obtenerOCrearEquipo } from './teamService'
import type {
  NuevaObservacion,
  ObservacionJugador,
  TipoObservacion,
} from '../types/observacion'
import type { ValoracionObservacion } from '../types/observacion'
import type {
  AccionObservacion,
  CategoriaEtiquetaAccion,
  NuevaAccionObservacion,
} from '../types/accionObservacion'

const columnasObservacion =
  'id, autor_id, fecha_observacion, notas, created_at, tipo, competicion, jornada, equipo_jugador_id, equipo_rival_id'

interface ObservacionFila {
  id: string
  autor_id: string
  fecha_observacion: string
  notas: string
  created_at: string
  tipo: TipoObservacion | null
  competicion: string | null
  jornada: string | null
  equipo_jugador_id: string | null
  equipo_rival_id: string | null
}

interface PerfilFila {
  id: string
  nombre: string
}

interface EquipoFila {
  id: string
  nombre: string
}

interface CriterioRelacionado {
  nombre: string
  orden: number
}

interface ValoracionFila {
  observacion_id: string
  puntuacion: number
  criterio: CriterioRelacionado | CriterioRelacionado[] | null
}

export async function obtenerObservacionesJugador(
  jugadorId: string,
): Promise<ObservacionJugador[]> {
  const { data: observaciones, error: errorObservaciones } = await supabase
    .from('observaciones_jugador')
    .select(columnasObservacion)
    .eq('jugador_id', jugadorId)
    .order('fecha_observacion', { ascending: false })
    .order('created_at', { ascending: false })

  if (errorObservaciones) {
    throw new Error(errorObservaciones.message)
  }

  const filas = observaciones as ObservacionFila[]
  const autores = [...new Set(filas.map((observacion) => observacion.autor_id))]
  const idsEquipos = [
    ...new Set(
      filas.flatMap((observacion) =>
        [observacion.equipo_jugador_id, observacion.equipo_rival_id].filter(
          (id): id is string => id !== null,
        ),
      ),
    ),
  ]

  const [respuestaPerfiles, respuestaEquipos] = await Promise.all([
    autores.length > 0
      ? supabase.from('perfiles').select('id, nombre').in('id', autores)
      : Promise.resolve({ data: [] as PerfilFila[], error: null }),
    idsEquipos.length > 0
      ? supabase.from('equipos').select('id, nombre').in('id', idsEquipos)
      : Promise.resolve({ data: [] as EquipoFila[], error: null }),
  ])

  if (respuestaPerfiles.error) {
    throw new Error(respuestaPerfiles.error.message)
  }

  if (respuestaEquipos.error) {
    throw new Error(respuestaEquipos.error.message)
  }

  const nombresPorAutor = new Map(
    (respuestaPerfiles.data as PerfilFila[]).map((perfil) => [perfil.id, perfil.nombre]),
  )
  const nombresPorEquipo = new Map(
    (respuestaEquipos.data as EquipoFila[]).map((equipo) => [equipo.id, equipo.nombre]),
  )

  const idsObservaciones = filas.map((observacion) => observacion.id)
  const valoracionesPorObservacion = new Map<string, ValoracionObservacion[]>()

  if (idsObservaciones.length > 0) {
    const { data: valoraciones, error: errorValoraciones } = await supabase
      .from('valoraciones_observacion')
      .select('observacion_id, puntuacion, criterio:criterios_scouting(nombre, orden)')
      .in('observacion_id', idsObservaciones)

    if (errorValoraciones) {
      throw new Error(errorValoraciones.message)
    }

    for (const valoracion of valoraciones as unknown as ValoracionFila[]) {
      const criterio = Array.isArray(valoracion.criterio)
        ? valoracion.criterio[0]
        : valoracion.criterio
      if (!criterio) continue

      const valoracionesDeLaObservacion = valoracionesPorObservacion.get(
        valoracion.observacion_id,
      ) ?? []

      valoracionesDeLaObservacion.push({
        criterioNombre: criterio.nombre,
        puntuacion: valoracion.puntuacion,
      })
      valoracionesPorObservacion.set(
        valoracion.observacion_id,
        valoracionesDeLaObservacion,
      )
    }
  }

  return filas.map((observacion) => ({
    id: observacion.id,
    tipo: observacion.tipo,
    fechaObservacion: observacion.fecha_observacion,
    notas: observacion.notas,
    createdAt: observacion.created_at,
    autorNombre:
      nombresPorAutor.get(observacion.autor_id) ?? 'Ojeador sin perfil',
    equipoJugador: observacion.equipo_jugador_id
      ? (nombresPorEquipo.get(observacion.equipo_jugador_id) ?? null)
      : null,
    equipoRival: observacion.equipo_rival_id
      ? (nombresPorEquipo.get(observacion.equipo_rival_id) ?? null)
      : null,
    competicion: observacion.competicion,
    jornada: observacion.jornada,
    valoraciones: valoracionesPorObservacion.get(observacion.id) ?? [],
  }))
}

export async function crearObservacionJugador(
  jugadorId: string,
  observacion: NuevaObservacion,
): Promise<string> {
  const [equipoJugador, equipoRival] = await Promise.all([
    observacion.equipoJugador.trim()
      ? obtenerOCrearEquipo(observacion.equipoJugador)
      : Promise.resolve(null),
    observacion.equipoRival.trim()
      ? obtenerOCrearEquipo(observacion.equipoRival)
      : Promise.resolve(null),
  ])

  const { data: observacionCreada, error: errorObservacion } = await supabase
    .from('observaciones_jugador')
    .insert({
      jugador_id: jugadorId,
      fecha_observacion: observacion.fechaObservacion,
      notas: observacion.notas.trim(),
      tipo: observacion.tipo,
      equipo_jugador_id: equipoJugador?.id ?? null,
      equipo_rival_id: equipoRival?.id ?? null,
      competicion: observacion.competicion.trim() || null,
      jornada: observacion.jornada.trim() || null,
    })
    .select('id')
    .single()

  if (errorObservacion) {
    throw new Error(errorObservacion.message)
  }

  if (observacion.valoraciones.length > 0) {
    const { error: errorValoraciones } = await supabase
      .from('valoraciones_observacion')
      .insert(
        observacion.valoraciones.map((valoracion) => ({
          observacion_id: observacionCreada.id,
          criterio_id: valoracion.criterioId,
          puntuacion: valoracion.puntuacion,
        })),
      )

    if (errorValoraciones) {
      throw new Error(errorValoraciones.message)
    }
  }

  return observacionCreada.id as string
}

export async function actualizarObservacionJugador(
  observacionId: string,
  observacion: NuevaObservacion,
): Promise<void> {
  const [equipoJugador, equipoRival] = await Promise.all([
    observacion.equipoJugador.trim()
      ? obtenerOCrearEquipo(observacion.equipoJugador)
      : Promise.resolve(null),
    observacion.equipoRival.trim()
      ? obtenerOCrearEquipo(observacion.equipoRival)
      : Promise.resolve(null),
  ])

  const { error: errorObservacion } = await supabase
    .from('observaciones_jugador')
    .update({
      fecha_observacion: observacion.fechaObservacion,
      notas: observacion.notas.trim(),
      tipo: observacion.tipo,
      equipo_jugador_id: equipoJugador?.id ?? null,
      equipo_rival_id: equipoRival?.id ?? null,
      competicion: observacion.competicion.trim() || null,
      jornada: observacion.jornada.trim() || null,
    })
    .eq('id', observacionId)

  if (errorObservacion) {
    throw new Error(errorObservacion.message)
  }

  const { error: errorBorrarValoraciones } = await supabase
    .from('valoraciones_observacion')
    .delete()
    .eq('observacion_id', observacionId)

  if (errorBorrarValoraciones) {
    throw new Error(errorBorrarValoraciones.message)
  }

  if (observacion.valoraciones.length > 0) {
    const { error: errorValoraciones } = await supabase
      .from('valoraciones_observacion')
      .insert(
        observacion.valoraciones.map((valoracion) => ({
          observacion_id: observacionId,
          criterio_id: valoracion.criterioId,
          puntuacion: valoracion.puntuacion,
        })),
      )

    if (errorValoraciones) {
      throw new Error(errorValoraciones.message)
    }
  }
}

export async function eliminarObservaciones(ids: string[]): Promise<void> {
  if (ids.length === 0) return

  const { error } = await supabase
    .from('observaciones_jugador')
    .delete()
    .in('id', ids)

  if (error) {
    throw new Error(error.message)
  }
}

interface AccionFila {
  id: string
  minuto: number
  parte: 1 | 2
  x: number
  y: number
  nota_libre: string
  etiqueta:
    | { id: number; nombre: string; categoria: CategoriaEtiquetaAccion }
    | { id: number; nombre: string; categoria: CategoriaEtiquetaAccion }[]
    | null
}

export async function crearAccionesObservacion(
  observacionId: string,
  acciones: NuevaAccionObservacion[],
): Promise<void> {
  if (acciones.length === 0) return

  const { error } = await supabase.from('acciones_observacion').insert(
    acciones.map((accion) => ({
      observacion_id: observacionId,
      etiqueta_id: accion.etiquetaId,
      minuto: accion.minuto,
      parte: accion.parte,
      x: accion.x,
      y: accion.y,
      nota_libre: accion.notaLibre.trim(),
    })),
  )

  if (error) {
    throw new Error(error.message)
  }
}

export async function obtenerAccionesObservacion(
  observacionId: string,
): Promise<AccionObservacion[]> {
  const { data, error } = await supabase
    .from('acciones_observacion')
    .select('id, minuto, parte, x, y, nota_libre, etiqueta:etiquetas_accion(id, nombre, categoria)')
    .eq('observacion_id', observacionId)
    .order('minuto', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data as unknown as AccionFila[]).flatMap((fila) => {
    const etiqueta = Array.isArray(fila.etiqueta) ? fila.etiqueta[0] : fila.etiqueta
    if (!etiqueta) return []

    return [
      {
        id: fila.id,
        etiquetaId: etiqueta.id,
        etiquetaNombre: etiqueta.nombre,
        categoria: etiqueta.categoria,
        minuto: fila.minuto,
        parte: fila.parte,
        x: Number(fila.x),
        y: Number(fila.y),
        notaLibre: fila.nota_libre,
      },
    ]
  })
}

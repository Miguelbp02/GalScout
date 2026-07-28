import { supabase } from '../lib/supabase'
import type {
  NuevaObservacion,
  ObservacionJugador,
} from '../types/observacion'
import type { ValoracionObservacion } from '../types/observacion'

interface ObservacionFila {
  id: string
  autor_id: string
  fecha_observacion: string
  notas: string
  created_at: string
}

interface PerfilFila {
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
    .select('id, autor_id, fecha_observacion, notas, created_at')
    .eq('jugador_id', jugadorId)
    .order('fecha_observacion', { ascending: false })
    .order('created_at', { ascending: false })

  if (errorObservaciones) {
    throw new Error(errorObservaciones.message)
  }

  const filas = observaciones as ObservacionFila[]
  const autores = [...new Set(filas.map((observacion) => observacion.autor_id))]

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

  const idsObservaciones = filas.map((observacion) => observacion.id)
  const { data: valoraciones, error: errorValoraciones } = await supabase
    .from('valoraciones_observacion')
    .select('observacion_id, puntuacion, criterio:criterios_scouting(nombre, orden)')
    .in('observacion_id', idsObservaciones)

  if (errorValoraciones) {
    throw new Error(errorValoraciones.message)
  }

  const valoracionesPorObservacion = new Map<string, ValoracionObservacion[]>()

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

  return filas.map((observacion) => ({
    id: observacion.id,
    fechaObservacion: observacion.fecha_observacion,
    notas: observacion.notas,
    createdAt: observacion.created_at,
    autorNombre:
      nombresPorAutor.get(observacion.autor_id) ?? 'Ojeador sin perfil',
    valoraciones: valoracionesPorObservacion.get(observacion.id) ?? [],
  }))
}

export async function crearObservacionJugador(
  jugadorId: string,
  observacion: NuevaObservacion,
): Promise<void> {
  const { data: observacionCreada, error: errorObservacion } = await supabase
    .from('observaciones_jugador')
    .insert({
      jugador_id: jugadorId,
      fecha_observacion: observacion.fechaObservacion,
      notas: observacion.notas.trim(),
    })
    .select('id')
    .single()

  if (errorObservacion) {
    throw new Error(errorObservacion.message)
  }

  if (observacion.valoraciones.length === 0) {
    return
  }

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

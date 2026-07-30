import { supabase } from '../lib/supabase'
import { obtenerCriteriosScouting } from './criteriaService'
import type {
  PerfilScouting,
  ResumenValoracionCriterio,
} from '../types/criterio'

interface ObservacionIdFila {
  id: string
}

interface ValoracionFila {
  criterio_id: number
  puntuacion: number
}

export async function obtenerValoracionesMediasJugador(
  jugadorId: string,
  perfil: PerfilScouting = 'campo',
): Promise<ResumenValoracionCriterio[]> {
  const [resultadoObservaciones, criterios] = await Promise.all([
    supabase
      .from('observaciones_jugador')
      .select('id')
      .eq('jugador_id', jugadorId),
    obtenerCriteriosScouting(perfil),
  ])

  if (resultadoObservaciones.error) {
    throw new Error(resultadoObservaciones.error.message)
  }

  const idsObservaciones = (resultadoObservaciones.data as ObservacionIdFila[]).map(
    (observacion) => observacion.id,
  )

  if (idsObservaciones.length === 0) {
    return []
  }

  const { data: valoraciones, error } = await supabase
    .from('valoraciones_observacion')
    .select('criterio_id, puntuacion')
    .in('observacion_id', idsObservaciones)

  if (error) {
    throw new Error(error.message)
  }

  const acumuladosPorCriterio = new Map<number, { suma: number; total: number }>()

  for (const valoracion of valoraciones as ValoracionFila[]) {
    const acumulado = acumuladosPorCriterio.get(valoracion.criterio_id) ?? {
      suma: 0,
      total: 0,
    }

    acumulado.suma += valoracion.puntuacion
    acumulado.total += 1
    acumuladosPorCriterio.set(valoracion.criterio_id, acumulado)
  }

  return criterios.flatMap((criterio) => {
    const acumulado = acumuladosPorCriterio.get(criterio.id)

    if (!acumulado) return []

    return [
      {
        ...criterio,
        media: acumulado.suma / acumulado.total,
        totalInformes: acumulado.total,
      },
    ]
  })
}

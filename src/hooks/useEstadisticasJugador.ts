import { useEffect, useMemo, useState } from 'react'
import { obtenerAccionesDeObservaciones } from '../services/observationService'
import type { AccionObservacionDePartido } from '../types/accionObservacion'
import type { ObservacionJugador } from '../types/observacion'

export function useEstadisticasJugador(observaciones: ObservacionJugador[]) {
  const partidos = useMemo(
    () =>
      observaciones
        .filter((observacion) => observacion.tipo === 'partido')
        .sort((a, b) => b.fechaObservacion.localeCompare(a.fechaObservacion)),
    [observaciones],
  )
  const [accionesTodas, setAccionesTodas] = useState<AccionObservacionDePartido[]>([])
  const [cargandoAcciones, setCargandoAcciones] = useState(false)
  const [errorAcciones, setErrorAcciones] = useState<string | null>(null)
  const clavePartidos = partidos.map((partido) => partido.id).join('|')

  useEffect(() => {
    let cancelado = false

    async function cargarAcciones() {
      if (clavePartidos === '') {
        if (!cancelado) {
          setAccionesTodas([])
          setErrorAcciones(null)
        }
        return
      }

      setCargandoAcciones(true)
      setErrorAcciones(null)

      try {
        const acciones = await obtenerAccionesDeObservaciones(clavePartidos.split('|'))
        if (!cancelado) setAccionesTodas(acciones)
      } catch {
        if (!cancelado) {
          setAccionesTodas([])
          setErrorAcciones('No se han podido cargar las acciones de los partidos.')
        }
      } finally {
        if (!cancelado) setCargandoAcciones(false)
      }
    }

    void cargarAcciones()

    return () => {
      cancelado = true
    }
  }, [clavePartidos])

  return { accionesTodas, cargandoAcciones, errorAcciones, partidos }
}
